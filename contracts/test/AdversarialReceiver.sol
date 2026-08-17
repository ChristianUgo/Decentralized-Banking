// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ILendingPool} from "../interfaces/ILendingPool.sol";

/// @notice Test-only receiver used to exercise rejected transfers and reentrancy.
contract AdversarialReceiver {
    enum ReceiveMode {
        Accept,
        Reenter,
        Reject
    }

    ILendingPool public immutable lendingPool;
    ReceiveMode public receiveMode;
    bool public reentrySucceeded;

    error TransferRejected();

    constructor(address lendingPool_) {
        lendingPool = ILendingPool(lendingPool_);
    }

    function setReceiveMode(ReceiveMode mode) external {
        receiveMode = mode;
        reentrySucceeded = false;
    }

    function deposit() external payable {
        lendingPool.deposit{value: msg.value}();
    }

    function withdraw(uint256 amount) external {
        lendingPool.withdraw(amount);
    }

    // solhint-disable-next-line no-complex-fallback
    receive() external payable {
        if (receiveMode == ReceiveMode.Reject) revert TransferRejected();
        if (receiveMode != ReceiveMode.Reenter) return;

        // solhint-disable-next-line avoid-low-level-calls
        (reentrySucceeded, ) = address(lendingPool).call(
            abi.encodeCall(ILendingPool.withdraw, (1))
        );
    }
}
