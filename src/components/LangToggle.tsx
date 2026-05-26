import { useI18n } from "@/lib/i18n";

export function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div className="inline-flex items-center rounded-full border border-border bg-card p-1 shadow-sm no-print">
      <button
        type="button"
        onClick={() => setLang("it")}
        className={`px-3 py-1 rounded-full text-sm font-medium transition ${
          lang === "it" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
        aria-label="Italiano"
      >
        🇮🇹 IT
      </button>
      <button
        type="button"
        onClick={() => setLang("en")}
        className={`px-3 py-1 rounded-full text-sm font-medium transition ${
          lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
        aria-label="English"
      >
        🇬🇧 EN
      </button>
    </div>
  );
}
