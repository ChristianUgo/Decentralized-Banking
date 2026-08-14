import { FeaturePlaceholder } from "@/components/FeaturePlaceholder";

export const metadata = { title: "Borrow" };

export default function BorrowPage() {
  return (
    <FeaturePlaceholder
      description="Available capacity, current rate, projected debt and post-borrow health will update before the wallet confirmation."
      eyebrow="Stablecoin credit"
      items={["Borrowing capacity", "Projected health", "Interest and debt summary"]}
      title="Borrow against collateral without guessing your risk."
    />
  );
}

