import { useI18n } from "@/lib/i18n";

export function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div
      className="inline-flex items-center rounded p-0.5 gap-0.5 no-print"
      style={{ background: "#f0ede8", border: "1px solid var(--border-color)" }}
    >
      {(["en", "it"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className="px-3 py-1 rounded text-[11px] font-semibold transition-colors"
          style={{
            background: lang === l ? "var(--accent-primary)" : "transparent",
            color:      lang === l ? "#ffffff" : "var(--neutral-mid)",
          }}
          aria-label={l === "en" ? "English" : "Italiano"}
        >
          {l === "en" ? "🇬🇧 EN" : "🇮🇹 IT"}
        </button>
      ))}
    </div>
  );
}
