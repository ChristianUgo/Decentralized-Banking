import { readFile } from "node:fs/promises";
import path from "node:path";

import { validateProductionRelease } from "./lib/release-validation.js";

async function readJson(filePath) {
  return JSON.parse(await readFile(path.resolve(filePath), "utf8"));
}

async function main() {
  const deployment = await readJson("deployments/11155111.json");
  const exportedDeployment = await readJson("frontend/src/contracts/addresses.json");
  const result = validateProductionRelease({
    deployment,
    environment: process.env,
    exportedDeployment,
  });
  console.log(
    `Release inputs verified for chain ${result.chainId}: ${result.contractCount} contracts and ${result.siteOrigin}.`,
  );
}

main().catch((error) => {
  console.error(`Production release validation failed: ${error.message}`);
  process.exitCode = 1;
});
