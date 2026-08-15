// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ICollateralVault} from "./interfaces/ICollateralVault.sol";
import {IInterestEngine} from "./interfaces/IInterestEngine.sol";
import {ILendingPool} from "./interfaces/ILendingPool.sol";
import {IPriceOracle} from "./interfaces/IPriceOracle.sol";
import {IStablecoin} from "./interfaces/IStablecoin.sol";

/// @title LendingPool
/// @notice Coordinates ETH collateral, DBUSD debt, interest, repayment, and liquidation.
contract LendingPool is ILendingPool, ReentrancyGuard {
    uint256 public constant WAD = 1e18;
    uint256 public constant COLLATERAL_RATIO = 15e17; // 150%
    uint256 public constant LIQUIDATION_THRESHOLD = 85e16; // 85%
    uint256 public constant LIQUIDATION_BONUS = 7e16; // 7%
    uint256 public constant CLOSE_FACTOR = 1e18; // 100%, matching source one-click liquidation
    uint256 public constant MINIMUM_DEBT = 1e16; // 0.01 DBUSD
    uint256 public constant MINIMUM_HEALTH_FACTOR = 1e18;

    ICollateralVault public immutable collateralVault;
    IStablecoin public immutable stablecoin;
    IPriceOracle public immutable priceOracle;
    IInterestEngine public immutable interestEngine;

    mapping(address user => Account account) private accounts;
    uint256 public totalBorrowed;

    error BorrowLimitExceeded(uint256 requestedDebt, uint256 maximumDebt);
    error DebtBelowMinimum(uint256 resultingDebt);
    error HealthyPosition(uint256 healthFactor);
    error InsufficientCollateral(uint256 available, uint256 requested);
    error InvalidAddress();
    error InvalidModule(address module);
    error InvalidOracleDecimals(uint8 decimals);
    error NoDebt();
    error NothingToLiquidate();
    error UnsafeWithdrawal(uint256 resultingDebt, uint256 maximumDebt);
    error ZeroAmount();

    constructor(
        address collateralVault_,
        address stablecoin_,
        address priceOracle_,
        address interestEngine_
    ) {
        _requireContract(collateralVault_);
        _requireContract(stablecoin_);
        _requireContract(priceOracle_);
        _requireContract(interestEngine_);

        collateralVault = ICollateralVault(collateralVault_);
        stablecoin = IStablecoin(stablecoin_);
        priceOracle = IPriceOracle(priceOracle_);
        interestEngine = IInterestEngine(interestEngine_);

        uint8 oracleDecimals = IPriceOracle(priceOracle_).getDecimals();
        if (oracleDecimals > 18) revert InvalidOracleDecimals(oracleDecimals);
    }

    function deposit() external payable override nonReentrant {
        if (msg.value == 0) revert ZeroAmount();

        accounts[msg.sender].collateralAmount += msg.value;
        collateralVault.deposit{value: msg.value}(msg.sender);

        emit CollateralDeposited(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external override nonReentrant {
        if (amount == 0) revert ZeroAmount();

        _accrueInterest(msg.sender);
        Account storage account = accounts[msg.sender];
        if (amount > account.collateralAmount) {
            revert InsufficientCollateral(account.collateralAmount, amount);
        }

        uint256 remainingCollateral = account.collateralAmount - amount;
        if (account.borrowedAmount > 0) {
            uint256 maximumDebt = _maximumDebt(remainingCollateral);
            if (account.borrowedAmount > maximumDebt) {
                revert UnsafeWithdrawal(account.borrowedAmount, maximumDebt);
            }
        }

        account.collateralAmount = remainingCollateral;
        collateralVault.withdraw(msg.sender, payable(msg.sender), amount);

        emit CollateralWithdrawn(msg.sender, amount);
    }

    function borrow(uint256 amount) external override nonReentrant {
        if (amount == 0) revert ZeroAmount();

        _accrueInterest(msg.sender);
        Account storage account = accounts[msg.sender];
        uint256 resultingDebt = account.borrowedAmount + amount;
        if (resultingDebt < MINIMUM_DEBT) {
            revert DebtBelowMinimum(resultingDebt);
        }

        uint256 maximumDebt = _maximumDebt(account.collateralAmount);
        if (resultingDebt > maximumDebt) {
            revert BorrowLimitExceeded(resultingDebt, maximumDebt);
        }

        account.borrowedAmount = resultingDebt;
        account.lastInterestUpdate = block.timestamp;
        totalBorrowed += amount;
        stablecoin.mint(msg.sender, amount);

        emit Borrowed(msg.sender, amount);
    }

    function repay(uint256 amount) external override nonReentrant {
        if (amount == 0) revert ZeroAmount();

        _accrueInterest(msg.sender);
        Account storage account = accounts[msg.sender];
        uint256 debt = account.borrowedAmount;
        if (debt == 0) revert NoDebt();

        uint256 repaidAmount = Math.min(amount, debt);
        uint256 remainingDebt = debt - repaidAmount;
        if (remainingDebt > 0 && remainingDebt < MINIMUM_DEBT) {
            revert DebtBelowMinimum(remainingDebt);
        }

        account.borrowedAmount = remainingDebt;
        account.lastInterestUpdate = remainingDebt == 0 ? 0 : block.timestamp;
        totalBorrowed -= repaidAmount;
        stablecoin.burn(msg.sender, repaidAmount);

        emit Repaid(msg.sender, repaidAmount);
    }

    function liquidate(address user) external override nonReentrant {
        if (user == address(0)) revert InvalidAddress();

        _accrueInterest(user);
        Account storage account = accounts[user];
        uint256 debt = account.borrowedAmount;
        if (debt == 0) revert NoDebt();

        uint256 healthFactor = _healthFactor(
            account.collateralAmount,
            account.borrowedAmount
        );
        if (healthFactor >= MINIMUM_HEALTH_FACTOR) {
            revert HealthyPosition(healthFactor);
        }

        uint256 debtToRepay = _maxLiquidatableDebt(
            account.collateralAmount,
            debt
        );
        if (debtToRepay == 0) revert NothingToLiquidate();

        uint256 baseCollateral = _usdToEth(
            debtToRepay,
            Math.Rounding.Ceil
        );
        uint256 bonusCollateral = Math.mulDiv(
            baseCollateral,
            LIQUIDATION_BONUS,
            WAD
        );
        uint256 collateralToSeize = Math.min(
            baseCollateral + bonusCollateral,
            account.collateralAmount
        );

        account.borrowedAmount = debt - debtToRepay;
        account.collateralAmount -= collateralToSeize;
        account.lastInterestUpdate = account.borrowedAmount == 0
            ? 0
            : block.timestamp;
        totalBorrowed -= debtToRepay;

        stablecoin.burn(msg.sender, debtToRepay);
        collateralVault.withdraw(
            user,
            payable(msg.sender),
            collateralToSeize
        );

        emit Liquidated(msg.sender, user, debtToRepay, collateralToSeize);
    }

    function getAccount(
        address user
    ) external view override returns (Account memory account) {
        account = accounts[user];
        account.borrowedAmount = previewDebt(user);
    }

    function getProtocolStats()
        external
        view
        override
        returns (ProtocolStats memory stats)
    {
        stats.totalCollateral = collateralVault.getTotalDeposits();
        stats.totalCollateralValue = _ethToUsd(stats.totalCollateral);
        stats.totalBorrowed = totalBorrowed;
        stats.utilizationRate = interestEngine.getUtilizationRate(
            totalBorrowed,
            stats.totalCollateralValue
        );
        stats.borrowRate = interestEngine.getBorrowRate(
            totalBorrowed,
            stats.totalCollateralValue
        );
    }

    function previewInterest(
        address user
    ) public view override returns (uint256) {
        Account storage account = accounts[user];
        if (
            account.borrowedAmount == 0 ||
            account.lastInterestUpdate == 0 ||
            block.timestamp == account.lastInterestUpdate
        ) return 0;

        return
            interestEngine.calculateInterest(
                account.borrowedAmount,
                block.timestamp - account.lastInterestUpdate,
                totalBorrowed,
                _ethToUsd(collateralVault.getTotalDeposits())
            );
    }

    function previewDebt(address user) public view override returns (uint256) {
        return accounts[user].borrowedAmount + previewInterest(user);
    }

    function getCollateralValue(
        address user
    ) external view override returns (uint256) {
        return _ethToUsd(accounts[user].collateralAmount);
    }

    function getHealthFactor(
        address user
    ) public view override returns (uint256) {
        return _healthFactor(accounts[user].collateralAmount, previewDebt(user));
    }

    function getBorrowingPower(
        address user
    ) external view override returns (uint256) {
        uint256 maximumDebt = _maximumDebt(accounts[user].collateralAmount);
        uint256 debt = previewDebt(user);
        return maximumDebt > debt ? maximumDebt - debt : 0;
    }

    function getMaxLiquidatableDebt(
        address user
    ) external view override returns (uint256) {
        return
            _maxLiquidatableDebt(
                accounts[user].collateralAmount,
                previewDebt(user)
            );
    }

    function isLiquidatable(address user) external view override returns (bool) {
        uint256 debt = previewDebt(user);
        return
            debt > 0 &&
            _healthFactor(accounts[user].collateralAmount, debt) <
            MINIMUM_HEALTH_FACTOR;
    }

    function _accrueInterest(address user) private {
        Account storage account = accounts[user];
        if (account.borrowedAmount == 0) {
            account.lastInterestUpdate = block.timestamp;
            return;
        }

        uint256 interest = previewInterest(user);
        account.lastInterestUpdate = block.timestamp;
        if (interest == 0) return;

        account.borrowedAmount += interest;
        totalBorrowed += interest;
        emit InterestAccrued(user, interest);
    }

    function _healthFactor(
        uint256 collateralAmount,
        uint256 debt
    ) private view returns (uint256) {
        if (debt == 0) return type(uint256).max;
        return
            Math.mulDiv(
                _ethToUsd(collateralAmount),
                LIQUIDATION_THRESHOLD,
                debt
            );
    }

    function _maximumDebt(
        uint256 collateralAmount
    ) private view returns (uint256) {
        return Math.mulDiv(_ethToUsd(collateralAmount), WAD, COLLATERAL_RATIO);
    }

    function _maxLiquidatableDebt(
        uint256 collateralAmount,
        uint256 debt
    ) private view returns (uint256) {
        uint256 closeLimitedDebt = Math.mulDiv(debt, CLOSE_FACTOR, WAD);
        uint256 collateralValue = _ethToUsd(collateralAmount);
        uint256 collateralLimitedDebt = Math.mulDiv(
            collateralValue,
            WAD,
            WAD + LIQUIDATION_BONUS
        );
        return Math.min(closeLimitedDebt, collateralLimitedDebt);
    }

    function _ethToUsd(uint256 ethAmount) private view returns (uint256) {
        uint256 price = priceOracle.getEthUsdPrice();
        uint8 decimals = priceOracle.getDecimals();
        uint256 valueAtOracleDecimals = Math.mulDiv(ethAmount, price, WAD);
        return valueAtOracleDecimals * (10 ** (18 - decimals));
    }

    function _usdToEth(
        uint256 usdAmount,
        Math.Rounding rounding
    ) private view returns (uint256) {
        uint256 price = priceOracle.getEthUsdPrice();
        uint8 decimals = priceOracle.getDecimals();
        uint256 normalizedPrice = price * (10 ** (18 - decimals));
        return Math.mulDiv(usdAmount, WAD, normalizedPrice, rounding);
    }

    function _requireContract(address module) private view {
        if (module == address(0)) revert InvalidAddress();
        if (module.code.length == 0) revert InvalidModule(module);
    }
}
