export const INITIAL_ETH_PRICE = 2_000n * 10n ** 8n;
export const MAX_ORACLE_STALENESS = 24n * 60n * 60n;

async function deploy(ethers, name, arguments_ = [], signer) {
  const contract = await ethers.deployContract(name, arguments_, signer);
  await contract.waitForDeployment();
  return contract;
}

export async function deployProtocol(ethers) {
  const [owner, borrower, liquidator, outsider] = await ethers.getSigners();
  const ownerAddress = await owner.getAddress();

  const priceOracle = await deploy(ethers, "PriceOracle", [
    ownerAddress,
    INITIAL_ETH_PRICE,
    MAX_ORACLE_STALENESS,
  ]);
  const interestEngine = await deploy(ethers, "InterestEngine");
  const collateralVault = await deploy(ethers, "CollateralVault", [
    ownerAddress,
  ]);
  const stablecoin = await deploy(ethers, "Stablecoin", [ownerAddress]);
  const lendingPool = await deploy(ethers, "LendingPool", [
    await collateralVault.getAddress(),
    await stablecoin.getAddress(),
    await priceOracle.getAddress(),
    await interestEngine.getAddress(),
  ]);

  const lendingPoolAddress = await lendingPool.getAddress();
  await (await collateralVault.setLendingPool(lendingPoolAddress)).wait();
  await (await stablecoin.setLendingPool(lendingPoolAddress)).wait();

  return {
    owner,
    borrower,
    liquidator,
    outsider,
    priceOracle,
    interestEngine,
    collateralVault,
    stablecoin,
    lendingPool,
  };
}
