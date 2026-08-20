import { BrowserProvider, Contract } from "ethers";

import abis from "../contracts/abis.json";
import deployment from "../contracts/addresses.json";
import { targetChain } from "./chain";

export const ACTION_LABELS = Object.freeze({
  borrow: "Borrow DBUSD",
  deposit: "Deposit ETH",
  liquidate: "Liquidate position",
  repay: "Repay DBUSD",
  withdraw: "Withdraw ETH",
});

function createInvocation(contract, action, { amount, borrower }) {
  if (action === "deposit") {
    const overrides = { value: amount };
    return {
      estimate: () => contract.deposit.estimateGas(overrides),
      execute: () => contract.deposit(overrides),
      simulate: () => contract.deposit.staticCall(overrides),
    };
  }
  if (action === "liquidate") {
    return {
      estimate: () => contract.liquidate.estimateGas(borrower),
      execute: () => contract.liquidate(borrower),
      simulate: () => contract.liquidate.staticCall(borrower),
    };
  }
  const method = contract[action];
  if (!method || amount === null || amount === undefined) throw new Error("Unsupported transaction action.");
  return {
    estimate: () => method.estimateGas(amount),
    execute: () => method(amount),
    simulate: () => method.staticCall(amount),
  };
}

export async function prepareProtocolTransaction({
  action,
  amount = null,
  borrower = null,
  createContract = (signer) =>
    new Contract(deployment.contracts.LendingPool, abis.LendingPool, signer),
  createProvider = (injected) => new BrowserProvider(injected, "any"),
  expectedAccount,
  getProvider = () => globalThis.window?.ethereum ?? null,
}) {
  const injected = getProvider();
  if (!injected) throw new Error("No injected wallet was detected.");

  const provider = createProvider(injected);
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== targetChain.id) {
    throw new Error(`Switch your wallet to ${targetChain.name} before continuing.`);
  }

  const signer = await provider.getSigner();
  const signerAddress = await signer.getAddress();
  if (!expectedAccount || signerAddress.toLowerCase() !== expectedAccount.toLowerCase()) {
    throw new Error("The active wallet account changed. Review the transaction again.");
  }

  const lendingPoolAddress = deployment.contracts.LendingPool;
  if (await provider.getCode(lendingPoolAddress) === "0x") {
    throw new Error(`The LendingPool is not deployed on ${targetChain.name}.`);
  }
  const contract = createContract(signer);
  const invocation = createInvocation(contract, action, { amount, borrower });
  await invocation.simulate();
  const [gasEstimate, feeData] = await Promise.all([invocation.estimate(), provider.getFeeData()]);
  const feePerGas = feeData.maxFeePerGas ?? feeData.gasPrice;

  return {
    estimatedFee: feePerGas ? gasEstimate * feePerGas : null,
    execute: invocation.execute,
    gasEstimate,
  };
}

export function getTransactionErrorMessage(error) {
  const code = error?.code ?? error?.info?.error?.code;
  if (Number(code) === 4001 || String(code) === "ACTION_REJECTED") {
    return "The wallet request was rejected. Your values are preserved so you can retry.";
  }

  const message = [error?.revert?.name, error?.reason, error?.shortMessage, error?.message]
    .filter(Boolean)
    .join(" ");
  const knownErrors = [
    [/BorrowLimitExceeded/i, "The requested debt exceeds this position's borrowing limit."],
    [/DebtBelowMinimum/i, "The transaction would leave debt below the 0.01 DBUSD minimum."],
    [/HealthyPosition/i, "This position is healthy and cannot be liquidated."],
    [/InsufficientCollateral/i, "The account does not have enough deposited collateral."],
    [/NoDebt/i, "There is no debt available for this action."],
    [/NothingToLiquidate/i, "The protocol found no repayable unhealthy debt."],
    [/UnsafeWithdrawal/i, "This withdrawal would make the position unsafe."],
    [/ERC20InsufficientBalance/i, "The connected wallet does not hold enough DBUSD."],
    [/could not coalesce|failed to fetch|network/i, "The wallet or RPC connection failed. Check the network and try again."],
  ];
  return knownErrors.find(([pattern]) => pattern.test(message))?.[1] || message || "The transaction failed.";
}
