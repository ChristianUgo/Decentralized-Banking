import { FeaturePlaceholder } from "@/components/FeaturePlaceholder";

export const metadata = { title: "Repay" };

export default function RepayPage() {
  return (
    <FeaturePlaceholder
      description="The final experience will distinguish principal, accrued interest, token approval and repayment confirmation."
      eyebrow="Debt management"
      items={["Partial and full repayment", "Approval awareness", "Improved health preview"]}
      title="Repay partially or close the position."
    />
  );
}

