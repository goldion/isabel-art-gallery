export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "https://goldion.github.io",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    const url = new URL(request.url);
    const json = (body, status = 200) =>
      new Response(JSON.stringify(body), {
        status,
        headers: { ...cors, "Content-Type": "application/json" },
      });

    const artId = (url.searchParams.get("id") || "").trim().slice(0, 128);
    if (!artId || !/^[a-zA-Z0-9._:-]+$/.test(artId)) {
      return json({ error: "bad_id" }, 400);
    }

    const countKey = "count:" + artId;
    const ip =
      request.headers.get("CF-Connecting-IP") ||
      request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
      "unknown";
    const enc = new TextEncoder();
    const digest = await crypto.subtle.digest("SHA-256", enc.encode(ip + "|" + artId));
    const hash = [...new Uint8Array(digest)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 32);
    const likeKey = "liked:" + artId + ":" + hash;

    const readCount = async () => {
      const raw = await env.LIKES.get(countKey);
      return Math.max(0, parseInt(raw || "0", 10) || 0);
    };

    if (request.method === "GET") {
      const count = await readCount();
      const liked = !!(await env.LIKES.get(likeKey));
      return json({ id: artId, count, liked });
    }

    if (request.method === "POST") {
      const already = await env.LIKES.get(likeKey);
      if (already) {
        const count = await readCount();
        return json({ id: artId, count, liked: true, duplicate: true });
      }
      await env.LIKES.put(likeKey, "1");
      const count = (await readCount()) + 1;
      await env.LIKES.put(countKey, String(count));
      return json({ id: artId, count, liked: true });
    }

    if (request.method === "DELETE") {
      const already = await env.LIKES.get(likeKey);
      if (!already) {
        const count = await readCount();
        return json({ id: artId, count, liked: false, duplicate: true });
      }
      await env.LIKES.delete(likeKey);
      const count = Math.max(0, (await readCount()) - 1);
      await env.LIKES.put(countKey, String(count));
      return json({ id: artId, count, liked: false });
    }

    return json({ error: "method" }, 405);
  },
};
