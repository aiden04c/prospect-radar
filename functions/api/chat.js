// Cloudflare Pages Function — endpoint POST /api/chat
// Powers the Assistant panel and the Meeting Brief generator.
// Same keys as /api/research (Cloudflare Secrets / .dev.vars); never in the browser.
//
// Request:  { provider: "gemini"|"anthropic"|"deepseek", model, system,
//             messages: [{role:"user"|"assistant", content}], max_tokens, search }
// Success:  { text }
// Failure:  { error }

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
    const system = String(body.system || "");
    let messages = Array.isArray(body.messages) ? body.messages : [];
    messages = messages
      .map((m) => ({
        role: m && m.role === "assistant" ? "assistant" : "user",
        content: String((m && m.content) || ""),
      }))
      .filter((m) => m.content.trim())
      .slice(-20);
    let maxTokens = Number(body.max_tokens) || 2000;
    maxTokens = Math.max(200, Math.min(8000, maxTokens));
    const search = !!body.search;

    if (provider !== "gemini" && provider !== "anthropic" && provider !== "deepseek") {
      return json({ error: "Unknown provider: " + String(provider) }, 400);
    }
    if (!model || !messages.length) {
      return json({ error: "Missing model or messages" }, 400);
    }

    /* ---------------- Gemini ---------------- */
    if (provider === "gemini") {
      const key = context.env.GEMINI_API_KEY;
      if (!key) {
        return json({ error: "GEMINI_API_KEY is not set. Add it in Cloudflare → Settings → Variables and Secrets, then redeploy." }, 500);
      }
      const payload = {
        contents: messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
      };
      if (system) payload.systemInstruction = { parts: [{ text: system }] };
      if (search) payload.tools = [{ google_search: {} }];
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: "POST",
          headers: { "content-type": "application/json", "x-goog-api-key": key },
          body: JSON.stringify(payload),
        }
      );
      const data = await resp.json().catch(() => null);
      if (!resp.ok) {
        return json({ error: `Gemini API error (${resp.status}): ${shortErr(data)}` }, resp.status);
      }
      const parts =
        (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
      const text = parts.map((p) => p.text || "").join("");
      if (!text.trim()) return json({ error: "Gemini returned no text — try again." }, 502);
      return json({ text }, 200);
    }

    /* ---------------- DeepSeek (no web search) ---------------- */
    if (provider === "deepseek") {
      const key = context.env.DEEPSEEK_API_KEY;
      if (!key) {
        return json({ error: "DEEPSEEK_API_KEY is not set. Add it in Cloudflare → Settings → Variables and Secrets, then redeploy." }, 500);
      }
      const dsMessages = [];
      if (system) {
        dsMessages.push({
          role: "system",
          content:
            system +
            "\n\nIMPORTANT: you have NO web access in this call. Never invent facts, URLs, emails or phone numbers; say when something is unknown.",
        });
      }
      dsMessages.push(...messages);
      const resp = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
        body: JSON.stringify({ model, messages: dsMessages, max_tokens: maxTokens }),
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok) {
        return json({ error: `DeepSeek API error (${resp.status}): ${shortErr(data)}` }, resp.status);
      }
      const text =
        (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "";
      if (!text.trim()) return json({ error: "DeepSeek returned no text — try again." }, 502);
      return json({ text }, 200);
    }

    /* ---------------- Anthropic ---------------- */
    const key = context.env.ANTHROPIC_API_KEY;
    if (!key) {
      return json({ error: "ANTHROPIC_API_KEY is not set — use Gemini/DeepSeek, or add a Claude key in Cloudflare → Settings → Variables and Secrets." }, 500);
    }
    const payload = { model, max_tokens: maxTokens, messages };
    if (system) payload.system = system;
    if (search) payload.tools = [{ type: "web_search_20250305", name: "web_search" }];
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(payload),
    });
    const data = await resp.json().catch(() => null);
    if (!resp.ok) {
      return json({ error: `Anthropic API error (${resp.status}): ${shortErr(data)}` }, resp.status);
    }
    const text = ((data && data.content) || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    if (!text.trim()) return json({ error: "Claude returned no text — try again." }, 502);
    return json({ text }, 200);
  } catch (e) {
    return json({ error: "Server error: " + ((e && e.message) || "unknown") }, 500);
  }
}
