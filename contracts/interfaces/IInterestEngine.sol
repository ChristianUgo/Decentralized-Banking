// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IInterestEngine {
    function calculateInterest(
        uint256 borrowedAmount,
        uint256 timeElapsed,
        uint256 totalBorrowed,
        uint256 totalCollateralValue
    ) external pure returns (uint256);

    function getUtilizationRate(
        uint256 totalBorrowed,
        uint256 totalCollateralValue
    ) external pure returns (uint256);

    function getBorrowRate(
        uint256 totalBorrowed,
        uint256 totalCollateralValue
    ) external pure returns (uint256);
}
