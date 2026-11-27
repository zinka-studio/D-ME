import { handleAdminRequest } from "./admin";
import { handleZernioAdmin, zernioEnabled } from "./zernio";
import { handleAdminUi } from "./admin-ui";
import { processWebhookPayload } from "./processor";
import { secureStringEqual, verifyMetaSignature } from "./security";

const WEBHOOK_PATH = "/webhook/instagram";
const MAX_WEBHOOK_BYTES = 1_000_000;

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

async function verifyWebhook(request: Request, env: Env, url: URL): Promise<Response> {
  const mode = url.searchParams.get("hub.mode") || "";
  const suppliedToken = url.searchParams.get("hub.verify_token") || "";
  const challenge = url.searchParams.get("hub.challenge") || "";
  const valid = mode === "subscribe" && await secureStringEqual(suppliedToken, env.IG_VERIFY_TOKEN);
  return new Response(valid ? challenge : "Invalid verify token", {
    status: valid ? 200 : 403,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

async function receiveWebhook(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > MAX_WEBHOOK_BYTES) return json({ error: "Payload too large" }, 413);
  const rawBody = await request.arrayBuffer();
  if (rawBody.byteLength > MAX_WEBHOOK_BYTES) return json({ error: "Payload too large" }, 413);
  const valid = await verifyMetaSignature(
    rawBody,
    request.headers.get("x-hub-signature-256"),
    env.IG_APP_SECRET,
  );
  if (!valid) return json({ error: "Invalid signature" }, 401);

  let payload: unknown;
  try {
    payload = JSON.parse(new TextDecoder().decode(rawBody));
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  ctx.waitUntil(processWebhookPayload(payload, env));
  return json({ received: true });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    try {
      if (request.method === "GET" && (url.pathname.startsWith("/fonts/") || url.pathname.startsWith("/icons/"))) {
        return (env as Env & { ASSETS: Fetcher }).ASSETS.fetch(request);
      }
      const adminUiResponse = request.method === "GET" ? handleAdminUi(url) : null;
      if (adminUiResponse) return adminUiResponse;
      if (request.method === "GET" && url.pathname === "/health") {
        return json({ ok: true, service: "d-me", environment: env.ENVIRONMENT });
      }
      if (request.method === "GET" && url.pathname === WEBHOOK_PATH) {
        return verifyWebhook(request, env, url);
      }
      if (request.method === "POST" && url.pathname === WEBHOOK_PATH) {
        return receiveWebhook(request, env, ctx);
      }
      if (url.pathname.startsWith("/api/automations") || url.pathname === "/api/instagram/media") {
        return zernioEnabled(env) ? handleZernioAdmin(request, env, url) : handleAdminRequest(request, env, url);
      }
      return json({ error: "Not found" }, 404);
    } catch (error) {
      console.error(JSON.stringify({
        message: "Unhandled Worker error",
        path: url.pathname,
        error: error instanceof Error ? error.message : String(error),
      }));
      return json({ error: "Internal server error" }, 500);
    }
  },
} satisfies ExportedHandler<Env>;
