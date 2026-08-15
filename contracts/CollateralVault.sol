// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ICollateralVault} from "./interfaces/ICollateralVault.sol";

/// @title CollateralVault
/// @notice Holds native ETH collateral and serves only the configured LendingPool.
contract CollateralVault is ICollateralVault, Ownable2Step, ReentrancyGuard {
    address public override lendingPool;

    mapping(address user => uint256 amount) private balances;
    uint256 private totalDeposited;

    error InsufficientBalance(uint256 available, uint256 requested);
    error InvalidAddress();
    error LendingPoolAlreadyConfigured();
    error OnlyLendingPool();
    error TransferFailed();
    error ZeroAmount();

    modifier onlyLendingPool() {
        if (msg.sender != lendingPool) revert OnlyLendingPool();
        _;
    }

    constructor(address initialOwner) Ownable(initialOwner) {
        if (initialOwner == address(0)) revert InvalidAddress();
    }

    /// @notice Permanently assigns the protocol controller after deployment.
    function setLendingPool(address lendingPool_) external override onlyOwner {
        if (lendingPool != address(0)) revert LendingPoolAlreadyConfigured();
        if (lendingPool_ == address(0) || lendingPool_.code.length == 0) {
            revert InvalidAddress();
        }

        lendingPool = lendingPool_;
        emit LendingPoolConfigured(lendingPool_);
    }

    function deposit(address user) external payable override onlyLendingPool {
        if (user == address(0)) revert InvalidAddress();
        if (msg.value == 0) revert ZeroAmount();

        balances[user] += msg.value;
        totalDeposited += msg.value;

        emit Deposited(user, msg.value);
    }

    function withdraw(
        address account,
        address payable recipient,
        uint256 amount
    ) external override onlyLendingPool nonReentrant {
        if (account == address(0) || recipient == address(0)) {
            revert InvalidAddress();
        }
        if (amount == 0) revert ZeroAmount();

        uint256 available = balances[account];
        if (amount > available) revert InsufficientBalance(available, amount);

        balances[account] = available - amount;
        totalDeposited -= amount;

        (bool success, ) = recipient.call{value: amount}("");
        if (!success) revert TransferFailed();

        emit Withdrawn(account, recipient, amount);
    }

    function getBalance(address user) external view override returns (uint256) {
        return balances[user];
    }

    function getTotalDeposits() external view override returns (uint256) {
        return totalDeposited;
    }
}
