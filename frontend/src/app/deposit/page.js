import { FeaturePlaceholder } from "@/components/FeaturePlaceholder";

export const metadata = { title: "Deposit" };

export default function DepositPage() {
  return (
    <FeaturePlaceholder
      description="The completed flow will preview wallet balance, borrowing power and post-withdraw health before requesting a signature."
      eyebrow="Collateral"
      items={["Deposit and withdraw modes", "Live impact preview", "Transaction lifecycle"]}
      title="Deposit or withdraw with the impact made clear."
    />
  );
}

