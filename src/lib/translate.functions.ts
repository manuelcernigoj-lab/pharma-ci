import { createServerFn } from "@tanstack/react-start";

export const translateStrings = createServerFn({ method: "POST" })
  .inputValidator((input: { texts: string[]; target: "it" | "en" }) => input)
  .handler(async ({ data }) => {
    const { texts, target } = data;
    if (!texts.length) return { translations: [] as string[] };

    const geminiApiKey = process.env.GEMINI_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const lovableApiKey = process.env.LOVABLE_API_KEY;

    let url = "";
    let apiKey = "";
    let model = "";

    if (geminiApiKey) {
      url = "https://generativelanguage.googleapis.com/v1beta/chat/completions";
      apiKey = geminiApiKey;
      model = "gemini-2.5-flash";
    } else if (openaiApiKey) {
      url = "https://api.openai.com/v1/chat/completions";
      apiKey = openaiApiKey;
      model = "gpt-4o-mini";
    } else if (lovableApiKey) {
      url = "https://ai.gateway.lovable.dev/v1/chat/completions";
      apiKey = lovableApiKey;
      model = "google/gemini-2.5-flash";
    } else {
      throw new Error("No translation API key configured. Please set GEMINI_API_KEY or OPENAI_API_KEY in your environment variables.");
    }

    const targetName = target === "it" ? "Italian" : "English";
    const sys = `You are a professional medical/pharmaceutical translator. Translate each input string to ${targetName}. Preserve drug names, gene names, NCT IDs, numbers, dates, percentages, and acronyms exactly as written. Maintain a professional clinical tone. Return ONLY a JSON object: {"translations": [..]} with the same number of strings, in the same order. Do not add any extra fields or commentary.`;

    const user = JSON.stringify({ texts });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`AI gateway ${res.status}: ${txt.slice(0, 200)}`);
    }
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { translations?: string[] };
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("Invalid JSON from translator");
    }
    const out = Array.isArray(parsed.translations) ? parsed.translations : [];
    if (out.length !== texts.length) {
      // Pad/truncate to be safe
      const fixed = texts.map((_, i) => out[i] ?? texts[i]);
      return { translations: fixed };
    }
    return { translations: out };
  });
