import { FeaturePlaceholder } from "@/components/FeaturePlaceholder";

export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <FeaturePlaceholder
      description="Collateral, stablecoin debt, available credit, health factor and protocol metrics will resolve directly from the connected account."
      eyebrow="Account overview"
      items={["Account health hero", "Position and protocol metrics", "Quick banking actions"]}
      title="Your complete position, at a glance."
    />
  );
}

