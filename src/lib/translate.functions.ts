import { createServerFn } from "@tanstack/react-start";

export const translateStrings = createServerFn({ method: "POST" })
  .inputValidator((input: { texts: string[]; target: "it" | "en" }) => input)
  .handler(async ({ data }) => {
    const { texts, target } = data;
    if (!texts.length) return { translations: [] as string[] };

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const targetName = target === "it" ? "Italian" : "English";
    const sys = `You are a professional medical/pharmaceutical translator. Translate each input string to ${targetName}. Preserve drug names, gene names, NCT IDs, numbers, dates, percentages, and acronyms exactly as written. Maintain a professional clinical tone. Return ONLY a JSON object: {"translations": [..]} with the same number of strings, in the same order. Do not add any extra fields or commentary.`;

    const user = JSON.stringify({ texts });

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
