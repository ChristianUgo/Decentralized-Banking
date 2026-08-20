export const initialTransactionState = Object.freeze({
  action: null,
  error: null,
  estimatedFee: null,
  gasEstimate: null,
  hash: null,
  receipt: null,
  status: "idle",
  summary: null,
});

export function transactionReducer(state, event) {
  switch (event.type) {
    case "PREPARING":
      return { ...initialTransactionState, action: event.action, status: "preparing" };
    case "REVIEW":
      return {
        ...state,
        estimatedFee: event.estimatedFee,
        gasEstimate: event.gasEstimate,
        status: "reviewing",
        summary: event.summary,
      };
    case "SIGNING":
      return { ...state, error: null, status: "signing" };
    case "SUBMITTED":
      return { ...state, hash: event.hash, status: "submitted" };
    case "CONFIRMED":
      return { ...state, receipt: event.receipt, status: "confirmed" };
    case "FAILED":
      return { ...state, error: event.error, status: "error" };
    case "RESET":
      return initialTransactionState;
    default:
      return state;
  }
}

export function isTransactionBusy(status) {
  return status === "preparing" || status === "signing" || status === "submitted";
}
