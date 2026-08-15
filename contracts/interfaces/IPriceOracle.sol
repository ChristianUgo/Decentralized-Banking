// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IPriceOracle {
    function getEthUsdPrice() external view returns (uint256);
    function getDecimals() external pure returns (uint8);
    function getLastUpdated() external view returns (uint256);
    function getMaxStaleness() external view returns (uint256);
}
