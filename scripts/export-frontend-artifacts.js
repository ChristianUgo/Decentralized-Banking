import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");

const artifactPaths = {
  CollateralVault: "contracts/CollateralVault.sol/CollateralVault.json",
  InterestEngine: "contracts/InterestEngine.sol/InterestEngine.json",
  LendingPool: "contracts/LendingPool.sol/LendingPool.json",
  PriceOracle: "contracts/PriceOracle.sol/PriceOracle.json",
  Stablecoin: "contracts/Stablecoin.sol/Stablecoin.json",
};

export async function exportFrontendArtifacts(addressManifest) {
  const targetDirectory = path.join(
    repositoryRoot,
    "frontend",
    "src",
    "contracts",
  );
  const abis = {};

  for (const [name, relativeArtifactPath] of Object.entries(artifactPaths)) {
    const artifactPath = path.join(
      repositoryRoot,
      "artifacts",
      relativeArtifactPath,
    );
    const artifact = JSON.parse(await readFile(artifactPath, "utf8"));
    abis[name] = artifact.abi;
  }

  await mkdir(targetDirectory, { recursive: true });
  await Promise.all([
    writeFile(
      path.join(targetDirectory, "abis.json"),
      `${JSON.stringify(abis, null, 2)}\n`,
    ),
    writeFile(
      path.join(targetDirectory, "addresses.json"),
      `${JSON.stringify(addressManifest, null, 2)}\n`,
    ),
  ]);
}

async function runFromCommandLine() {
  const manifestArgument = process.argv[2];
  if (!manifestArgument) {
    throw new Error(
      "Provide a deployment manifest, for example: pnpm export:artifacts deployments/31337.json",
    );
  }

  const manifestPath = path.resolve(repositoryRoot, manifestArgument);
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  await exportFrontendArtifacts(manifest);
  console.log(`Exported frontend artifacts for chain ${manifest.chainId}.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runFromCommandLine().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
