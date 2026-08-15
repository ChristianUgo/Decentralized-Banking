// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IStablecoin is IERC20 {
    event LendingPoolConfigured(address indexed lendingPool);

    function setLendingPool(address lendingPool_) external;
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
    function lendingPool() external view returns (address);
}
