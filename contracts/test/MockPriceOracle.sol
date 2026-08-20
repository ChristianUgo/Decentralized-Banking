// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IPriceOracle} from "../interfaces/IPriceOracle.sol";

/// @notice Test-only oracle with configurable decimals and timestamps.
contract MockPriceOracle is IPriceOracle {
    uint256 private immutable price;
    uint256 private immutable lastUpdated;
    uint256 private immutable maxStaleness;
    uint8 private immutable decimals;

    constructor(
        uint256 price_,
        uint8 decimals_,
        uint256 lastUpdated_,
        uint256 maxStaleness_
    ) {
        price = price_;
        decimals = decimals_;
        lastUpdated = lastUpdated_;
        maxStaleness = maxStaleness_;
    }

    function getEthUsdPrice() external view returns (uint256) {
        return price;
    }

    function getLastUpdated() external view returns (uint256) {
        return lastUpdated;
    }

    function getMaxStaleness() external view returns (uint256) {
        return maxStaleness;
    }

    function getDecimals() external view returns (uint8) {
        return decimals;
    }
}
