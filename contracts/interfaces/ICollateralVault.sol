// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ICollateralVault {
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(
        address indexed account,
        address indexed recipient,
        uint256 amount
    );
    event LendingPoolConfigured(address indexed lendingPool);

    function setLendingPool(address lendingPool_) external;
    function deposit(address user) external payable;
    function withdraw(
        address account,
        address payable recipient,
        uint256 amount
    ) external;
    function getBalance(address user) external view returns (uint256);
    function getTotalDeposits() external view returns (uint256);
    function lendingPool() external view returns (address);
}
