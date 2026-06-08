import { createServerFn } from "@tanstack/react-start";

export const translateStrings = createServerFn({ method: "POST" })
  .inputValidator((input: { texts: string[]; target: "it" | "en" }) => input)
  .handler(async ({ data }) => {
    const { texts, target } = data;
    if (!texts.length) return { translations: [] as string[] };

    const geminiApiKey  = process.env.GEMINI_API_KEY;
    const openaiApiKey  = process.env.OPENAI_API_KEY;
    const lovableApiKey = process.env.LOVABLE_API_KEY;

    let url    = "";
    let apiKey = "";
    let model  = "";
    let useResponseFormat = false; // only OpenAI supports response_format

    if (geminiApiKey) {
      // Gemini native REST endpoint (OpenAI-compatible)
      url    = "https://generativelanguage.googleapis.com/v1beta/chat/completions";
      apiKey = geminiApiKey;
      model  = "gemini-2.5-flash";
      useResponseFormat = false; // Gemini does NOT support response_format
    } else if (openaiApiKey) {
      url    = "https://api.openai.com/v1/chat/completions";
      apiKey = openaiApiKey;
      model  = "gpt-4o-mini";
      useResponseFormat = true;
    } else if (lovableApiKey) {
      url    = "https://ai.gateway.lovable.dev/v1/chat/completions";
      apiKey = lovableApiKey;
      model  = "google/gemini-2.5-flash";
      useResponseFormat = false;
    } else {
      throw new Error(
        "No translation API key configured. Set GEMINI_API_KEY or OPENAI_API_KEY."
      );
    }

    const targetName = target === "it" ? "Italian" : "English";
    const sys = `You are a professional medical/pharmaceutical translator. \
Translate each input string to ${targetName}. \
Preserve drug names, gene names, NCT IDs, numbers, dates, percentages, and acronyms exactly as written. \
Maintain a professional clinical tone. \
Return ONLY a valid JSON object with this exact shape: {"translations": ["...", "..."]} \
with the same number of strings as the input, in the same order. \
Do not add markdown, backticks, or any text outside the JSON object.`;

    const user = JSON.stringify({ texts });

    const requestBody: Record<string, unknown> = {
      model,   // <-- use the variable, not a hardcoded string
      messages: [
        { role: "system", content: sys },
        { role: "user",   content: user },
      ],
    };

    // Only add response_format for providers that support it (OpenAI)
    if (useResponseFormat) {
      requestBody.response_format = { type: "json_object" };
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Translation API ${res.status}: ${txt.slice(0, 200)}`);
    }

    const json    = await res.json();
    const content = json?.choices?.[0]?.message?.content ?? "{}";

    // Strip markdown fences if the model wrapped the JSON anyway
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

    // Pad/truncate to match input length — never crash on mismatch
    const fixed = texts.map((original, i) => out[i] ?? original);
    return { translations: fixed };
  });
