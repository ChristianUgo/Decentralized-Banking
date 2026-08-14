import { FeaturePlaceholder } from "@/components/FeaturePlaceholder";

export const metadata = { title: "Liquidation" };

export default function LiquidityPage() {
  return (
    <FeaturePlaceholder
      description="Search a borrower, inspect eligibility, review the repayable amount and understand the liquidation bonus before acting."
      eyebrow="Protocol liquidation"
      items={["Borrower address lookup", "Eligibility and debt details", "Bonus and confirmation summary"]}
      title="Resolve unhealthy debt transparently."
    />
  );
}

