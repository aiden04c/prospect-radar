// Cloudflare Worker entry point.
//
// The app was built for Cloudflare Pages (file-based `functions/`), but the
// current Cloudflare dashboard deploys everything as a Worker. This entry
// bridges the two: it routes /api/* to the existing Pages Functions (which
// take a { request, env } context) and serves the built static site (dist)
// for everything else via the ASSETS binding. The functions/ files are reused
// as-is, never modified.
import { onRequestPost as researchPost } from "../functions/api/research.js";
import { onRequestPost as chatPost } from "../functions/api/chat.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/research" && request.method === "POST") {
      return researchPost({ request, env });
    }
    if (url.pathname === "/api/chat" && request.method === "POST") {
      return chatPost({ request, env });
    }

    // Everything else: serve the static site (index.html, JS, CSS…).
    return env.ASSETS.fetch(request);
  },
};
