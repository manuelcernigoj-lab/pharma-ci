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
      url: "https://generativelanguage.googleapis.com/v1beta/chat/completions",
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
  const content = json?.choices?.[0]?.message?.content ?? "{}";

  const cleaned = content
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  let parsed: { translations?: string[] };
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Translator returned invalid JSON: ${cleaned.slice(0, 100)}`);
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

    const shortPromise = shortIdx.length
      ? callTranslateApi(provider, shortIdx.map((i) => texts[i]), target)
      : Promise.resolve<string[]>([]);

    // Each long text gets its own call AND its own fallback: if it fails,
    // that single field stays in the source language instead of taking
    // down the rest of the translation.
    const longPromises = longIdx.map((i) =>
      callTranslateApi(provider, [texts[i]], target)
        .then((r) => r[0] ?? texts[i])
        .catch((e) => {
          console.error(`Translation failed for a long text (index ${i}):`, (e as Error).message);
          return texts[i];
        })
    );

    const [shortResults, ...longResults] = await Promise.all([shortPromise, ...longPromises]);

    shortIdx.forEach((origI, k) => { translations[origI] = shortResults[k]; });
    longIdx.forEach((origI, k) => { translations[origI] = longResults[k]; });

    return { translations };
  });
