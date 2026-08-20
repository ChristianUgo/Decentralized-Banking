import { ActionWorkspace } from "@/components/actions/ActionWorkspace";

export const metadata = { title: "Deposit" };

export default function DepositPage() {
  return <ActionWorkspace kind="collateral" />;
}
