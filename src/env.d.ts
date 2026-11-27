// Secrets are set with `wrangler secret put` (see scripts/setup.mjs), so wrangler types does not know them.
interface Env {
  ADMIN_TOKEN: string;
  ZERNIO_API_KEY?: string;
}
