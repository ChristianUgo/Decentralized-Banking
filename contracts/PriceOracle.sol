// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IPriceOracle} from "./interfaces/IPriceOracle.sol";

/// @title PriceOracle
/// @notice Owner-updated ETH/USD oracle for local development and tests only.
/// @dev Production deployment requires an audited oracle adapter.
contract PriceOracle is IPriceOracle, Ownable2Step {
    uint8 private constant DECIMALS = 8;

    uint256 private price;
    uint256 private lastUpdated;
    uint256 private immutable maxStaleness;

    event PriceUpdated(uint256 previousPrice, uint256 newPrice, uint256 updatedAt);

    error InvalidAddress();
    error InvalidPrice();
    error InvalidStaleness();
    error StalePrice(uint256 updatedAt, uint256 currentTimestamp);

    constructor(
        address initialOwner,
        uint256 initialPrice,
        uint256 maxStaleness_
    ) Ownable(initialOwner) {
        if (initialOwner == address(0)) revert InvalidAddress();
        if (initialPrice == 0) revert InvalidPrice();
        if (maxStaleness_ == 0) revert InvalidStaleness();

        price = initialPrice;
        lastUpdated = block.timestamp;
        maxStaleness = maxStaleness_;

        emit PriceUpdated(0, initialPrice, block.timestamp);
    }

    function setPrice(uint256 newPrice) external onlyOwner {
        if (newPrice == 0) revert InvalidPrice();

        uint256 previousPrice = price;
        price = newPrice;
        lastUpdated = block.timestamp;

        emit PriceUpdated(previousPrice, newPrice, block.timestamp);
    }

    function getEthUsdPrice() external view override returns (uint256) {
        if (block.timestamp - lastUpdated > maxStaleness) {
            revert StalePrice(lastUpdated, block.timestamp);
        }
        return price;
    }

    function getDecimals() external pure override returns (uint8) {
        return DECIMALS;
    }

    function getLastUpdated() external view override returns (uint256) {
        return lastUpdated;
    }

    function getMaxStaleness() external view override returns (uint256) {
        return maxStaleness;
    }
}
