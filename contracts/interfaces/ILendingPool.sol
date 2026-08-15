// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ILendingPool {
    struct Account {
        uint256 collateralAmount;
        uint256 borrowedAmount;
        uint256 lastInterestUpdate;
    }

    struct ProtocolStats {
        uint256 totalCollateral;
        uint256 totalCollateralValue;
        uint256 totalBorrowed;
        uint256 utilizationRate;
        uint256 borrowRate;
    }

    event CollateralDeposited(address indexed user, uint256 amount);
    event CollateralWithdrawn(address indexed user, uint256 amount);
    event Borrowed(address indexed user, uint256 amount);
    event Repaid(address indexed user, uint256 amount);
    event InterestAccrued(address indexed user, uint256 amount);
    event Liquidated(
        address indexed liquidator,
        address indexed user,
        uint256 debtRepaid,
        uint256 collateralSeized
    );

    function deposit() external payable;
    function withdraw(uint256 amount) external;
    function borrow(uint256 amount) external;
    function repay(uint256 amount) external;
    function liquidate(address user) external;

    function getAccount(address user) external view returns (Account memory);
    function getProtocolStats() external view returns (ProtocolStats memory);
    function previewInterest(address user) external view returns (uint256);
    function previewDebt(address user) external view returns (uint256);
    function getCollateralValue(address user) external view returns (uint256);
    function getHealthFactor(address user) external view returns (uint256);
    function getBorrowingPower(address user) external view returns (uint256);
    function getMaxLiquidatableDebt(address user) external view returns (uint256);
    function isLiquidatable(address user) external view returns (bool);
}
