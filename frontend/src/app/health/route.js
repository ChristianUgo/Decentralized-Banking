import deployment from "@/contracts/addresses.json";

export const dynamic = "force-static";

export function GET() {
  return Response.json({
    chainId: deployment.chainId,
    network: deployment.network,
    release: process.env.VERCEL_GIT_COMMIT_SHA || "development",
    status: "ok",
  });
}
