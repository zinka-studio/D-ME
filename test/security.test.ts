import { describe, expect, it } from "vitest";
import { secureStringEqual, verifyMetaSignature } from "../src/security";

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (value) => value.toString(16).padStart(2, "0")).join("");
}

describe("security", () => {
  it("compares secrets without a direct string comparison", async () => {
    await expect(secureStringEqual("same", "same")).resolves.toBe(true);
    await expect(secureStringEqual("same", "different")).resolves.toBe(false);
  });

  it("accepts a valid Meta HMAC and rejects an invalid one", async () => {
    const secret = "test-secret";
    const body = new TextEncoder().encode(JSON.stringify({ object: "instagram" }));
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signature = toHex(await crypto.subtle.sign("HMAC", key, body));
    await expect(verifyMetaSignature(body.buffer, `sha256=${signature}`, secret)).resolves.toBe(true);
    await expect(verifyMetaSignature(body.buffer, `sha256=${"00".repeat(32)}`, secret)).resolves.toBe(false);
  });
});
