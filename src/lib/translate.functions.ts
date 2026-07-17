import { createServerFn } from "@tanstack/react-start";

/* Texts longer than this are translated in their OWN isolated call
   instead of the shared batch. The executive summary is reliably the
   longest string in the payload (a full paragraph vs. one-sentence
   notes elsewhere) — bundled with everything else, it was the most
   likely item to get silently skipped or to blow past an implicit
   output-length limit and truncate the whole batch's JSON response. */
const LONG_TEXT_THRESHOLD = 400;

/* ── Provider resolution (unchanged) ─────────────────────────── */
function resolveProvider() {
  const geminiApiKey  = process.env.GEMINI_API_KEY;
  const openaiApiKey  = process.env.OPENAI_API_KEY;
  const lovableApiKey = process.env.LOVABLE_API_KEY;

  if (geminiApiKey) {
    return {
      url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      apiKey: geminiApiKey,
      model: "gemini-2.5-flash",
      useResponseFormat: false, // Gemini does NOT support response_format
    };
  }
  if (openaiApiKey) {
    return {
      url: "https://api.openai.com/v1/chat/completions",
      apiKey: openaiApiKey,
      model: "gpt-4o-mini",
      useResponseFormat: true,
    };
  }
  if (lovableApiKey) {
    return {
      url: "https://ai.gateway.lovable.dev/v1/chat/completions",
      apiKey: lovableApiKey,
      model: "google/gemini-2.5-flash",
      useResponseFormat: false,
    };
  }
  throw new Error("No translation API key configured. Set GEMINI_API_KEY or OPENAI_API_KEY.");
}

/* ── Robust JSON extraction ───────────────────────────────────
   Models occasionally wrap the JSON in prose ("Here is the
   translation:" ... or a trailing note) even when explicitly told
   not to — this happens more often on isolated single-item calls
   (e.g. the long executive_summary) than on short technical batches,
   which was silently corrupting exactly that field. Instead of only
   stripping ```code fences```, find the first {...} block and parse
   that, ignoring anything before/after it. */
function extractTranslationsJson(content: string): { translations?: string[] } | null {
  const stripped = content
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  // Fast path: the whole (stripped) string is valid JSON.
  try {
    return JSON.parse(stripped);
  } catch {
    // fall through to brace-matching below
  }

  // Slow path: locate the first balanced {...} block anywhere in the
  // string and parse just that, tolerating any surrounding prose.
  const start = stripped.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < stripped.length; i++) {
    if (stripped[i] === "{") depth++;
    else if (stripped[i] === "}") {
      depth--;
      if (depth === 0) {
        const candidate = stripped.slice(start, i + 1);
        try {
          return JSON.parse(candidate);
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

/* ── Plain-text call for a SINGLE long text ──────────────────────
   Used only for isolated long-text items (e.g. executive_summary).
   Deliberately skips the JSON envelope entirely: asking a model to
   translate one long clinical paragraph AND simultaneously keep it
   valid inside a JSON string (escaping quotes/newlines correctly,
   matching an exact array shape) is unnecessary complexity that adds
   failure modes with no benefit for a single string. Plain text has
   nothing to parse, so a stray preamble or formatting quirk can't
   corrupt the result the way it can corrupt JSON. */
async function callTranslatePlainText(
  provider: ReturnType<typeof resolveProvider>,
  text: string,
  target: "it" | "en",
): Promise<string> {
  const targetName = target === "it" ? "Italian" : "English";
  const sys = `You are a professional medical/pharmaceutical translator. \
Translate the user's text to ${targetName} in full — do not summarize or shorten it. \
Preserve drug names, gene names, NCT IDs, numbers, dates, percentages, and acronyms exactly as written. \
Maintain a professional clinical tone. \
Reply with ONLY the translated text: no quotes around it, no preamble like "Here is the translation", \
no labels, no markdown, no commentary of any kind — just the translated paragraph itself.`;

  const requestBody: Record<string, unknown> = {
    model: provider.model,
    messages: [
      { role: "system", content: sys },
      { role: "user", content: text },
    ],
    max_tokens: 4096,
  };

  const res = await fetch(provider.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Translation API ${res.status} (plain-text): ${txt.slice(0, 200)}`);
  }

  const json         = await res.json();
  const choice        = json?.choices?.[0];
  const rawContent     = choice?.message?.content;
  const finishReason   = choice?.finish_reason;

  if (typeof rawContent !== "string" || !rawContent.trim()) {
    // Rich diagnostic: this is the exact failure mode that was
    // previously invisible — log finish_reason (e.g. "content_filter"
    // / "length" / "safety") and the raw response shape so the actual
    // cause is visible in Cloudflare logs on the next occurrence
    // instead of being silently swallowed.
    throw new Error(
      `Translation API returned empty content (plain-text). finish_reason=${finishReason ?? "unknown"}; ` +
      `raw response keys=${JSON.stringify(Object.keys(json ?? {}))}`
    );
  }

  // Strip a single layer of wrapping quotes if the model added them
  // despite instructions not to (common, harmless artifact).
  let out = rawContent.trim();
  if (
    (out.startsWith('"') && out.endsWith('"')) ||
    (out.startsWith("'") && out.endsWith("'"))
  ) {
    out = out.slice(1, -1).trim();
  }

  // Sanity check: a translation drastically shorter than the source
  // (e.g. the model refused and replied with a one-line apology)
  // is suspicious enough to treat as a failure rather than silently
  // accepting a truncated/garbage result.
  if (out.length < text.length * 0.3) {
    throw new Error(
      `Translation API returned suspiciously short content (plain-text): ` +
      `${out.length} chars vs. ${text.length} source chars. finish_reason=${finishReason ?? "unknown"}. ` +
      `Content preview: ${out.slice(0, 120)}`
    );
  }

  return out;
}

/* ── Single batch call: translates an array of texts, in order ──
   Throws on any failure (network, non-2xx, invalid JSON) — the
   caller decides whether that should fail the whole request or be
   handled per-item. */
async function callTranslateApi(
  provider: ReturnType<typeof resolveProvider>,
  texts: string[],
  target: "it" | "en",
): Promise<string[]> {
  const targetName = target === "it" ? "Italian" : "English";
  const sys = `You are a professional medical/pharmaceutical translator. \
Translate each input string to ${targetName}. \
Preserve drug names, gene names, NCT IDs, numbers, dates, percentages, and acronyms exactly as written. \
Maintain a professional clinical tone. \
Translate the FULL text of every string, however long — do not summarize, shorten, or leave any string \
unchanged in the source language. \
Return ONLY a valid JSON object with this exact shape: {"translations": ["...", "..."]} \
with the same number of strings as the input, in the same order. \
Do not add markdown, backticks, or any text outside the JSON object.`;

  const requestBody: Record<string, unknown> = {
    model: provider.model,
    messages: [
      { role: "system", content: sys },
      { role: "user", content: JSON.stringify({ texts }) },
    ],
    // Generous headroom so a long paragraph (executive_summary) can't
    // get the response truncated mid-JSON — that previously corrupted
    // JSON.parse for the ENTIRE batch, not just the long item.
    max_tokens: 4096,
  };
  if (provider.useResponseFormat) {
    requestBody.response_format = { type: "json_object" };
  }

  const res = await fetch(provider.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Translation API ${res.status}: ${txt.slice(0, 200)}`);
  }

  const json    = await res.json();
  const choice  = json?.choices?.[0];
  const content = choice?.message?.content ?? "{}";

  const parsed = extractTranslationsJson(content);
  if (!parsed) {
    throw new Error(
      `Translator returned invalid JSON (batch). finish_reason=${choice?.finish_reason ?? "unknown"}; ` +
      `content preview: ${String(content).slice(0, 150)}`
    );
  }

  const out = Array.isArray(parsed.translations) ? parsed.translations : [];
  // Pad/truncate to match input length — never crash on a count mismatch.
  return texts.map((original, i) => out[i] ?? original);
}

export const translateStrings = createServerFn({ method: "POST" })
  .inputValidator((input: { texts: string[]; target: "it" | "en" }) => input)
  .handler(async ({ data }) => {
    const { texts, target } = data;
    if (!texts.length) return { translations: [] as string[] };

    const provider = resolveProvider();

    // Split into short (batched together) vs. long (translated one at a
    // time, in isolation) so one oversized string can't corrupt or get
    // silently dropped from the shared batch response.
    const shortIdx: number[] = [];
    const longIdx:  number[] = [];
    texts.forEach((t, i) => (t.length > LONG_TEXT_THRESHOLD ? longIdx : shortIdx).push(i));

    const translations = new Array<string>(texts.length);
    let anyFailed = false;

    // Guarded with its own fallback: a short-batch failure must not
    // reject the shared Promise.all and discard already-succeeded long
    // (e.g. executive_summary) results — each item independently falls
    // back to its original text on failure.
    const shortPromise = shortIdx.length
      ? callTranslateApi(provider, shortIdx.map((i) => texts[i]), target).catch((e) => {
          console.error("Translation failed for the short-text batch:", (e as Error).message);
          anyFailed = true;
          return shortIdx.map((i) => texts[i]); // fall back to originals, same length/order
        })
      : Promise.resolve<string[]>([]);

    // Each long text gets its own PLAIN-TEXT call (no JSON envelope —
    // see callTranslatePlainText), one retry, AND a final fallback: if
    // both attempts fail, that single field stays in the source
    // language instead of taking down the rest of the translation.
    const longPromises = longIdx.map((i) =>
      callTranslatePlainText(provider, texts[i], target)
        .catch(() => callTranslatePlainText(provider, texts[i], target))
        .catch((e) => {
          console.error(`Translation failed for a long text (index ${i}) after retry:`, (e as Error).message);
          anyFailed = true;
          return texts[i];
        })
    );

    const [shortResults, ...longResults] = await Promise.all([shortPromise, ...longPromises]);

    shortIdx.forEach((origI, k) => { translations[origI] = shortResults[k]; });
    longIdx.forEach((origI, k) => { translations[origI] = longResults[k]; });

    return { translations, partial: anyFailed };
  });
