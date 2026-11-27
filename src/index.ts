import { handleAdminUi } from "./admin-ui";
import { handleZernioAdmin } from "./zernio";

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
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
      if (url.pathname.startsWith("/api/automations") || url.pathname === "/api/instagram/media") {
        return handleZernioAdmin(request, env, url);
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
