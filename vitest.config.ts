import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc" },
      miniflare: {
        bindings: {
          ADMIN_TOKEN: "test-admin-token",
          IG_ACCESS_TOKEN: "test-access-token",
          IG_APP_SECRET: "test-app-secret",
          IG_VERIFY_TOKEN: "test-verify-token",
        },
      },
    }),
  ],
  test: {
    include: ["test/**/*.test.ts"],
  },
});
