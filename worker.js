import * as chat from "./functions/api/chat.js";
import * as wedding from "./functions/api/wedding.js";

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/chat") {
      if (request.method === "POST") return chat.onRequestPost({ request, env });
      return new Response("Method not allowed", { status: 405 });
    }

    if (pathname === "/api/wedding") {
      if (request.method === "GET") return wedding.onRequestGet({ request, env });
      if (request.method === "PUT") return wedding.onRequestPut({ request, env });
      return new Response("Method not allowed", { status: 405 });
    }

    return env.ASSETS.fetch(request);
  },
};
