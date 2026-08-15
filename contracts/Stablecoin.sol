// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IStablecoin} from "./interfaces/IStablecoin.sol";

/// @title Decentralized Bank USD
/// @notice ERC-20 debt token minted and burned exclusively by the LendingPool.
contract Stablecoin is IStablecoin, ERC20, Ownable2Step {
    address public override lendingPool;

    error InvalidAddress();
    error LendingPoolAlreadyConfigured();
    error OnlyLendingPool();
    error ZeroAmount();

    modifier onlyLendingPool() {
        if (msg.sender != lendingPool) revert OnlyLendingPool();
        _;
    }

    constructor(
        address initialOwner
    ) ERC20("Decentralized Bank USD", "DBUSD") Ownable(initialOwner) {
        if (initialOwner == address(0)) revert InvalidAddress();
    }

    /// @notice Permanently assigns mint and burn authority after deployment.
    function setLendingPool(address lendingPool_) external override onlyOwner {
        if (lendingPool != address(0)) revert LendingPoolAlreadyConfigured();
        if (lendingPool_ == address(0) || lendingPool_.code.length == 0) {
            revert InvalidAddress();
        }

        lendingPool = lendingPool_;
        emit LendingPoolConfigured(lendingPool_);
    }

    function mint(address to, uint256 amount) external override onlyLendingPool {
        if (to == address(0)) revert InvalidAddress();
        if (amount == 0) revert ZeroAmount();
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external override onlyLendingPool {
        if (from == address(0)) revert InvalidAddress();
        if (amount == 0) revert ZeroAmount();
        _burn(from, amount);
    }
}
