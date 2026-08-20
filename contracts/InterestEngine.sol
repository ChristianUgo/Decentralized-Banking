// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {IInterestEngine} from "./interfaces/IInterestEngine.sol";

/// @title InterestEngine
/// @notice Pure kinked-rate model matching the source protocol's 2%-18% APR curve.
contract InterestEngine is IInterestEngine {
    uint256 public constant WAD = 1e18;
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    uint256 public constant BASE_RATE = 2e16; // 2%
    uint256 public constant OPTIMAL_UTILIZATION = 8e17; // 80%
    uint256 public constant LOW_SLOPE = 1e17; // +10% across 0%-100% utilization
    uint256 public constant RATE_AT_KINK = 1e17; // 10%
    uint256 public constant HIGH_SLOPE = 4e17; // +40% across excess utilization

    function calculateInterest(
        uint256 borrowedAmount,
        uint256 timeElapsed,
        uint256 totalBorrowed,
        uint256 totalCollateralValue
    ) external pure override returns (uint256) {
        if (borrowedAmount == 0 || timeElapsed == 0) return 0;

        uint256 annualRate = getBorrowRate(totalBorrowed, totalCollateralValue);
        uint256 annualInterest = Math.mulDiv(borrowedAmount, annualRate, WAD);
        return Math.mulDiv(annualInterest, timeElapsed, SECONDS_PER_YEAR);
    }

    function getUtilizationRate(
        uint256 totalBorrowed,
        uint256 totalCollateralValue
    ) public pure override returns (uint256) {
        if (totalCollateralValue == 0) return totalBorrowed == 0 ? 0 : WAD;

        uint256 utilization = Math.mulDiv(
            totalBorrowed,
            WAD,
            totalCollateralValue
        );
        return Math.min(utilization, WAD);
    }

    function getBorrowRate(
        uint256 totalBorrowed,
        uint256 totalCollateralValue
    ) public pure override returns (uint256) {
        uint256 utilization = getUtilizationRate(
            totalBorrowed,
            totalCollateralValue
        );

        if (utilization <= OPTIMAL_UTILIZATION) {
            return BASE_RATE + Math.mulDiv(utilization, LOW_SLOPE, WAD);
        }

        return
            RATE_AT_KINK +
            Math.mulDiv(
                utilization - OPTIMAL_UTILIZATION,
                HIGH_SLOPE,
                WAD
            );
    }
}
