import { expect } from "chai";
import fc from "fast-check";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.create();
const WAD = 10n ** 18n;
const YEAR = 365n * 24n * 60n * 60n;

async function fixture() {
  const interestEngine = await ethers.deployContract("InterestEngine");
  await interestEngine.waitForDeployment();
  return interestEngine;
}

describe("InterestEngine properties", function () {
  it("keeps utilization and rates bounded and monotonic", async function () {
    const engine = await networkHelpers.loadFixture(fixture);
    const utilizationPair = fc
      .tuple(fc.bigInt({ min: 0n, max: WAD }), fc.bigInt({ min: 0n, max: WAD }))
      .map(([first, second]) =>
        first <= second ? [first, second] : [second, first],
      );

    await fc.assert(
      fc.asyncProperty(utilizationPair, async ([lower, upper]) => {
        const lowerRate = await engine.getBorrowRate(lower, WAD);
        const upperRate = await engine.getBorrowRate(upper, WAD);

        expect(await engine.getUtilizationRate(upper, WAD)).to.equal(upper);
        expect(lowerRate).to.be.gte(ethers.parseEther("0.02"));
        expect(upperRate).to.be.lte(ethers.parseEther("0.18"));
        expect(upperRate).to.be.gte(lowerRate);
      }),
      { numRuns: 100, seed: 20260817 },
    );
  });

  it("matches the documented simple-interest rounding", async function () {
    const engine = await networkHelpers.loadFixture(fixture);
    const inputs = fc.record({
      principal: fc.bigInt({ min: 1n, max: 10n ** 30n }),
      elapsed: fc.bigInt({ min: 0n, max: 3n * YEAR }),
      utilization: fc.bigInt({ min: 0n, max: WAD }),
    });

    await fc.assert(
      fc.asyncProperty(inputs, async ({ principal, elapsed, utilization }) => {
        const rate = await engine.getBorrowRate(utilization, WAD);
        const expected = ((principal * rate) / WAD) * elapsed / YEAR;
        const actual = await engine.calculateInterest(
          principal,
          elapsed,
          utilization,
          WAD,
        );

        expect(actual).to.equal(expected);
      }),
      { numRuns: 100, seed: 20260817 },
    );
  });
});
