/**
 * Soft PASS gate — live stage + per-bot seat status for Hammer Studio war-room.
 * GET / → { stage, stages, bots, botStatuses, usage?, updatedAt, source }
 * PUT|POST / → { stage?, bots?, usage? } (optional SET_TOKEN bearer).
 */
const STAGES = ["pick", "soft-pass", "waiting-go", "tip", "smoke", "done"];
const BOT_IDS = ["art", "developer", "tester"];
const BOT_STATUSES = ["idle", "cooking", "waiting-go", "smoking"];
const DEFAULT_STAGE = "pick";

/** Default seat map when KV has no explicit bots (or after stage-only writes). */
function defaultBotsForStage(stage) {
  const allIdle = () =>
    Object.fromEntries(BOT_IDS.map((id) => [id, "idle"]));
  switch (stage) {
    case "soft-pass":
      return { art: "cooking", developer: "idle", tester: "idle" };
    case "waiting-go":
      return { art: "waiting-go", developer: "waiting-go", tester: "idle" };
    case "tip":
      return { art: "idle", developer: "cooking", tester: "idle" };
    case "smoke":
      return { art: "idle", developer: "idle", tester: "smoking" };
    case "done":
    case "pick":
    default:
      return allIdle();
  }
}

function normalizeBots(raw, stage) {
  const base = defaultBotsForStage(stage);
  if (!raw || typeof raw !== "object") return base;
  for (const id of BOT_IDS) {
    const s = String(raw[id] ?? "").trim();
    if (BOT_STATUSES.includes(s)) base[id] = s;
  }
  return base;
}

/** CFO frozen schema v1 — store as given; normalize common aliases only. */
function normalizeUsagePayload(raw) {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== "object" || Array.isArray(raw)) {
    return { error: "bad_usage" };
  }
  const out = { ...raw };
  if (out.weeklyUsedPct == null && out.weeklyLimitUsedPct != null) {
    const n = Number(out.weeklyLimitUsedPct);
    if (Number.isFinite(n)) out.weeklyUsedPct = n;
  }
  if (out.resetsAt == null && out.resetsAtLocal != null) {
    out.resetsAt = String(out.resetsAtLocal);
  }
  if (out.schema != null) {
    const s = Number(out.schema);
    if (!Number.isFinite(s)) return { error: "bad_usage_schema" };
    out.schema = s;
  }
  if (out.weeklyUsedPct != null) {
    const n = Number(out.weeklyUsedPct);
    if (!Number.isFinite(n)) return { error: "bad_weeklyUsedPct" };
    out.weeklyUsedPct = n;
  }
  if (out.bots != null) {
    if (!Array.isArray(out.bots)) return { error: "bad_usage_bots" };
    for (const row of out.bots) {
      if (!row || typeof row !== "object") return { error: "bad_usage_bots" };
      if (row.sharePct != null && !Number.isFinite(Number(row.sharePct))) {
        return { error: "bad_usage_bots" };
      }
    }
  }
  return { value: out };
}

function gatePayload(stage, bots, updatedAt, extra = {}) {
  return {
    stage,
    stages: STAGES,
    bots,
    botStatuses: BOT_STATUSES,
    updatedAt,
    source: "kv",
    ...extra,
  };
}

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

    const readBots = async (stage) => {
      const raw = await env.GATE.get("bots");
      if (!raw) return defaultBotsForStage(stage);
      try {
        return normalizeBots(JSON.parse(raw), stage);
      } catch {
        return defaultBotsForStage(stage);
      }
    };

    const readUsage = async () => {
      const raw = await env.GATE.get("usage");
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    };

    if (request.method === "GET") {
      const stage = await readStage();
      const updatedAt = (await env.GATE.get("updatedAt")) || null;
      const bots = await readBots(stage);
      const usage = await readUsage();
      const extra = usage ? { usage } : {};
      return json(gatePayload(stage, bots, updatedAt, extra));
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

      const hasUsage = body?.usage !== undefined && body?.usage !== null;
      const hasStage =
        body?.stage !== undefined && body.stage !== null && body.stage !== "";
      const hasBots = body?.bots !== undefined && body.bots !== null;

      if (!hasUsage && !hasStage && !hasBots) {
        return json({ error: "need_stage_or_bots" }, 400);
      }

      const priorStage = await readStage();
      const priorBots = await readBots(priorStage);

      let usageDoc = null;
      if (hasUsage) {
        const normalized = normalizeUsagePayload(body.usage);
        if (normalized.error) {
          return json({ error: normalized.error }, 400);
        }
        usageDoc = normalized.value;
        await env.GATE.put("usage", JSON.stringify(usageDoc));
      }

      let stage = priorStage;
      let bots = priorBots;
      let stageBotsTouched = false;

      if (hasStage) {
        const next = String(body.stage).trim();
        if (!STAGES.includes(next)) {
          return json({ error: "bad_stage", stages: STAGES }, 400);
        }
        stage = next;
        stageBotsTouched = true;
      }

      if (hasBots) {
        if (typeof body.bots !== "object" || Array.isArray(body.bots)) {
          return json({ error: "bad_bots", botStatuses: BOT_STATUSES, bots: BOT_IDS }, 400);
        }
        bots = normalizeBots({ ...priorBots, ...body.bots }, stage);
        for (const id of BOT_IDS) {
          const s = String(body.bots[id] ?? "").trim();
          if (body.bots[id] !== undefined && s && !BOT_STATUSES.includes(s)) {
            return json({ error: "bad_bot_status", id, botStatuses: BOT_STATUSES }, 400);
          }
        }
        stageBotsTouched = true;
      } else if (hasStage && !hasBots) {
        bots = defaultBotsForStage(stage);
        stageBotsTouched = true;
      }

      const updatedAt = new Date().toISOString();

      if (stageBotsTouched) {
        await env.GATE.put("stage", stage);
        await env.GATE.put("bots", JSON.stringify(bots));
        await env.GATE.put("updatedAt", updatedAt);
      } else if (hasUsage) {
        await env.GATE.put("updatedAt", updatedAt);
      }

      const usageOut = usageDoc ?? (await readUsage());
      const extra = usageOut ? { usage: usageOut } : {};
      return json({ ...gatePayload(stage, bots, updatedAt, extra), ok: true });
    }

    return json({ error: "method" }, 405);
  },
};
