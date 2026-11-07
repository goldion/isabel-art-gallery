/**
 * Soft PASS gate — live stage for Hammer Studio war-room board.
 * GET / → { stage, stages, updatedAt }
 * PUT|POST / with JSON { stage } → set stage (optional SET_TOKEN bearer).
 */
const STAGES = ["pick", "soft-pass", "waiting-go", "tip", "smoke", "done"];
const DEFAULT_STAGE = "pick";

export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "https://goldion.github.io",
      "Access-Control-Allow-Methods": "GET, PUT, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    const json = (body, status = 200) =>
      new Response(JSON.stringify(body), {
        status,
        headers: { ...cors, "Content-Type": "application/json" },
      });

    const readStage = async () => {
      const raw = (await env.GATE.get("stage")) || DEFAULT_STAGE;
      return STAGES.includes(raw) ? raw : DEFAULT_STAGE;
    };

    if (request.method === "GET") {
      const stage = await readStage();
      const updatedAt = (await env.GATE.get("updatedAt")) || null;
      return json({ stage, stages: STAGES, updatedAt, source: "kv" });
    }

    if (request.method === "PUT" || request.method === "POST") {
      const token = env.SET_TOKEN;
      if (token) {
        const auth = request.headers.get("Authorization") || "";
        const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
        if (bearer !== token) {
          return json({ error: "unauthorized" }, 401);
        }
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "bad_json" }, 400);
      }

      const stage = String(body?.stage || "").trim();
      if (!STAGES.includes(stage)) {
        return json({ error: "bad_stage", stages: STAGES }, 400);
      }

      const updatedAt = new Date().toISOString();
      await env.GATE.put("stage", stage);
      await env.GATE.put("updatedAt", updatedAt);
      return json({ stage, stages: STAGES, updatedAt, ok: true });
    }

    return json({ error: "method" }, 405);
  },
};
