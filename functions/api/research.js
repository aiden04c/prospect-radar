// Cloudflare Pages Function — becomes the endpoint POST /api/research
// Holds API keys server-side. Keys are set as encrypted Secrets in the
// Cloudflare dashboard (Settings → Variables and Secrets), or in .dev.vars
// for local testing. A key is NEVER sent to, or visible in, the browser.
//
// Request body:  { provider: "gemini" | "anthropic", model, prompt, max_tokens }
// Success reply: { text: "<the model's raw text output>" }
// Failure reply: { error: "<short readable message>" }

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function shortErr(data) {
  const m =
    (data && data.error && (data.error.message || data.error.status)) || "";
  return String(m).slice(0, 200) || "no details from provider";
}

export async function onRequestPost(context) {
  try {
    let body;
    try {
      body = await context.request.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const provider = body.provider;
    const model = String(body.model || "");
    const prompt = String(body.prompt || "");
    let maxTokens = Number(body.max_tokens) || 2500;
    maxTokens = Math.max(200, Math.min(8000, maxTokens));

    if (provider !== "gemini" && provider !== "anthropic" && provider !== "deepseek") {
      return json({ error: "Unknown provider: " + String(provider) }, 400);
    }
    if (!model || !prompt.trim()) {
      return json({ error: "Missing model or prompt" }, 400);
    }

    /* ---------------- Gemini (Google) ---------------- */
    if (provider === "gemini") {
      const key = context.env.GEMINI_API_KEY;
      if (!key) {
        return json(
          { error: "GEMINI_API_KEY is not set. Add it in Cloudflare → your project → Settings → Variables and Secrets, then redeploy." },
          500
        );
      }
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: "POST",
          headers: { "content-type": "application/json", "x-goog-api-key": key },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            // Google Search grounding = real web search behind the research
            tools: [{ google_search: {} }],
            // NOTE: maxOutputTokens is deliberately omitted — Gemini's thinking
            // tokens count against it and can truncate the JSON mid-way. The
            // prompt itself already keeps the output small.
          }),
        }
      );
      const data = await resp.json().catch(() => null);
      if (!resp.ok) {
        return json({ error: `Gemini API error (${resp.status}): ${shortErr(data)}` }, resp.status);
      }
      const parts =
        (data &&
          data.candidates &&
          data.candidates[0] &&
          data.candidates[0].content &&
          data.candidates[0].content.parts) ||
        [];
      const text = parts.map((p) => p.text || "").join("");
      if (!text.trim()) {
        return json({ error: "Gemini returned no text (possibly blocked or an empty candidate). Try again or switch model." }, 502);
      }
      return json({ text }, 200);
    }

    /* ---------------- DeepSeek (OpenAI-compatible, NO web search) ---------------- */
    if (provider === "deepseek") {
      const key = context.env.DEEPSEEK_API_KEY;
      if (!key) {
        return json(
          { error: "DEEPSEEK_API_KEY is not set. Add it in Cloudflare → your project → Settings → Variables and Secrets, then redeploy." },
          500
        );
      }
      const resp = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          messages: [
            { role: "system", content: "You are a precise B2B research assistant. You have no web access; answer only from what you reliably know, and set fields to unknown/none when unsure. Output only minified JSON." },
            { role: "user", content: prompt },
          ],
        }),
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok) {
        return json({ error: `DeepSeek API error (${resp.status}): ${shortErr(data)}` }, resp.status);
      }
      const text =
        (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "";
      if (!text.trim()) {
        return json({ error: "DeepSeek returned no text. Try again." }, 502);
      }
      return json({ text }, 200);
    }

    /* ---------------- Anthropic (Claude) ---------------- */
    const key = context.env.ANTHROPIC_API_KEY;
    if (!key) {
      return json(
        { error: "ANTHROPIC_API_KEY is not set. This provider is optional — use Gemini, or add a Claude key in Cloudflare → Settings → Variables and Secrets." },
        500
      );
    }
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
        tools: [{ type: "web_search_20250305", name: "web_search" }],
      }),
    });
    const data = await resp.json().catch(() => null);
    if (!resp.ok) {
      return json({ error: `Anthropic API error (${resp.status}): ${shortErr(data)}` }, resp.status);
    }
    const text = ((data && data.content) || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    if (!text.trim()) {
      return json({ error: "Claude returned no text. Try again." }, 502);
    }
    return json({ text }, 200);
  } catch (e) {
    return json({ error: "Server error: " + ((e && e.message) || "unknown") }, 500);
  }
}
