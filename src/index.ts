import { handleAdminUi } from "./admin-ui";
import { handleZernioAdmin } from "./zernio";
import rubikHebrew from "../public/fonts/Rubik-hebrew.woff2";
import rubikLatin from "../public/fonts/Rubik-latin.woff2";
import iconEdit from "../public/icons/action-edit.svg";
import iconDelete from "../public/icons/action-delete.svg";

/** Fonts and icons are bundled into the Worker, so a deploy is a single upload. */
const STATIC_FILES: Record<string, { body: ArrayBuffer | string; type: string }> = {
  "/fonts/Rubik-hebrew.woff2": { body: rubikHebrew, type: "font/woff2" },
  "/fonts/Rubik-latin.woff2": { body: rubikLatin, type: "font/woff2" },
  "/icons/action-edit.svg": { body: iconEdit, type: "image/svg+xml" },
  "/icons/action-delete.svg": { body: iconDelete, type: "image/svg+xml" },
};

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    try {
      const file = request.method === "GET" ? STATIC_FILES[url.pathname] : undefined;
      if (file) return new Response(file.body, { headers: { "Content-Type": file.type, "Cache-Control": "public, max-age=31536000, immutable" } });
      const adminUiResponse = request.method === "GET" ? handleAdminUi(url) : null;
      if (adminUiResponse) return adminUiResponse;
      if (request.method === "GET" && url.pathname === "/health") {
        return json({ ok: true, service: "d-me", environment: env.ENVIRONMENT });
      }
      if (url.pathname.startsWith("/api/automations") || url.pathname.startsWith("/api/posts") || url.pathname === "/api/media/upload" || url.pathname === "/api/instagram/media" || url.pathname === "/api/status" || url.pathname === "/api/instagram/profile") {
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
