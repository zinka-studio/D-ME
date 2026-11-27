import { describe, expect, it } from "vitest";
import { secureStringEqual } from "../src/security";

describe("security", () => {
  it("compares secrets without a direct string comparison", async () => {
    await expect(secureStringEqual("same", "same")).resolves.toBe(true);
    await expect(secureStringEqual("same", "different")).resolves.toBe(false);
  });
});
