import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useI18n, type DictKey } from "@/lib/i18n";
import { InfoTip } from "@/components/InfoTip";
import { Sidebar } from "@/components/Sidebar";
import { reportStore } from "@/lib/report-store";
import { normalizeReport } from "@/lib/normalize";
import { Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/")({ component: IndexPage });

const WEBHOOK = "https://agent-8.duckdns.org/webhook/ci-agent-core";

function clamp(v: string | number, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" ? v : parseInt(String(v), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function fmtTime(s: number) {
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function IndexPage() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();

  const [query,      setQuery]      = useState("");
  const [refDrug,    setRefDrug]    = useState("");
  const [maxTrials,  setMaxTrials]  = useState<string>("25");
  const [monthsBack, setMonthsBack] = useState<string>("12");
  const [submitted,  setSubmitted]  = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [err,        setErr]        = useState<string | null>(null);

  const [loadingIdx, setLoadingIdx] = useState(0);
  const [elapsed,    setElapsed]    = useState(0);

  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => setLoadingIdx((i) => (i + 1) % 4), 3000);
    return () => clearInterval(id);
  }, [loading]);

  useEffect(() => {
    if (!loading) { setElapsed(0); return; }
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [loading]);

  const loadingKeys: DictKey[] = ["loading_1", "loading_2", "loading_3", "loading_4"];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setErr(null);
    if (!query.trim()) return;
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        query:      query.trim(),
        max_trials: clamp(maxTrials,  5, 50, 25),
        months_back:clamp(monthsBack, 3, 36, 12),
      };
      if (refDrug.trim()) body.reference_drug = refDrug.trim();

      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 300_000);
      const res = await fetch(WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data       = await res.json();
      const normalized = normalizeReport(data);
      if (!normalized) throw new Error("Empty report");
      reportStore.set(normalized);
      navigate({ to: "/report" });
    } catch (e) {
      console.error(e);
      setErr(t("err_submit"));
      setLoading(false);
    }
  }

  /* ── Loading screen ─────────────────────────────────────────── */
  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ background: "#faf9f5" }}
      >
        <Loader2
          className="h-10 w-10 animate-spin"
          style={{ color: "var(--accent-primary)" }}
          strokeWidth={2.5}
        />
        <p className="mt-5 text-[15px] font-semibold" style={{ color: "var(--neutral-dark)" }}>
          {t(loadingKeys[loadingIdx])}
        </p>
        <p className="mt-2 text-[12px]" style={{ color: "var(--neutral-mid)" }}>
          {fmtTime(elapsed)}
        </p>
        <p className="mt-1 text-[11px]" style={{ color: "var(--neutral-muted)" }}>
          {lang === "it"
            ? "Le query complesse possono richiedere fino a 60 secondi."
            : "Complex queries may take up to 60 seconds."}
        </p>
      </div>
    );
  }

  /* ── Main page ──────────────────────────────────────────────── */
  return (
    <div className="min-h-screen" style={{ background: "#faf9f5" }}>
      <Sidebar page="home" />

      <div className="md:ml-[var(--sidebar-w,224px)] transition-[margin] duration-300 ease-out">

        {/* Top bar */}
        <header
          className="sticky top-0 z-20 bg-white"
          style={{ height: 48, borderBottom: "1px solid var(--border-color)" }}
        >
          <div className="h-full max-w-4xl mx-auto px-4 flex items-center gap-2 pl-14 md:pl-4">
            <img src={logo} alt="" className="h-5 w-5 rounded" />
            <span className="font-bold text-[15px]" style={{ color: "var(--neutral-dark)" }}>PharmaCI</span>
          </div>
        </header>

        {/* Hero */}
        <div id="home">
          <section className="max-w-2xl mx-auto px-6 pt-14 pb-10 text-center">
            <Chip>
              {lang === "it"
                ? "AI · Clinical Intelligence · Strategia Pharma"
                : "AI-powered · Clinical Intelligence · Pharma Strategy"}
            </Chip>

            <h2
              className="mt-6 font-bold leading-[1.15] tracking-tight"
              style={{ color: "var(--neutral-dark)", fontSize: "clamp(26px,4.5vw,42px)" }}
            >
              {lang === "it"
                ? "Dalla query al report strategico."
                : "From query to strategic report."}
              <br />
              <span style={{ color: "var(--accent-primary)", fontWeight: 400 }}>
                {lang === "it" ? "In meno di 60 secondi." : "In under 60 seconds."}
              </span>
            </h2>

            <p
              className="mt-4 text-[15px] max-w-md mx-auto"
              style={{ color: "var(--neutral-mid)", lineHeight: 1.7 }}
            >
              {lang === "it"
                ? "Inserisci un target. PharmaCI interroga ClinicalTrials.gov, OpenFDA e PubMed, poi genera un report completo di competitive intelligence."
                : "Type a target. PharmaCI queries ClinicalTrials.gov, OpenFDA and PubMed, then generates a full competitive intelligence report."}
            </p>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Chip small>ClinicalTrials.gov</Chip>
              <Chip small>OpenFDA</Chip>
              <Chip small>PubMed</Chip>
              <Chip small>{lang === "it" ? "Claude AI" : "Claude AI"}</Chip>
            </div>
          </section>
        </div>

        {/* How it works */}
        <section id="how" className="max-w-4xl mx-auto px-4 pb-16" style={{ scrollMarginTop: 64 }}>
          <SectionTitle
            title={lang === "it" ? "Come funziona" : "How it works"}
            sub={lang === "it" ? "Cosa accade dopo aver premuto Genera Report" : "What happens after you click Generate Report"}
          />
          <div className="grid md:grid-cols-2 gap-4 mt-6">
            {[
              {
                n: "01",
                t: lang === "it" ? "Inserisci il target"   : "Enter your target",
                d: lang === "it"
                  ? "Target biologico o area terapeutica — es. KRAS G12C NSCLC. Aggiungi un farmaco di riferimento per il benchmarking competitivo."
                  : "Biological target or therapeutic area — e.g. KRAS G12C NSCLC. Add a reference drug for competitive benchmarking.",
              },
              {
                n: "02",
                t: lang === "it" ? "Imposta i parametri"   : "Set your parameters",
                d: lang === "it"
                  ? "max_trials controlla quanti trial recuperare. months_back imposta la finestra PubMed. Valori più bassi = risposta più rapida."
                  : "max_trials controls how many trials to retrieve. months_back sets the PubMed window. Lower values = faster report.",
              },
              {
                n: "03",
                t: lang === "it" ? "L'AI genera il report" : "AI generates the report",
                d: lang === "it"
                  ? "Claude AI sintetizza un report strategico con threat score, forecast regolatori e valutazione AIFA."
                  : "Claude AI synthesizes a report with threat scores, regulatory forecasts and AIFA assessment.",
              },
              {
                n: "04",
                t: lang === "it" ? "Esplora ed esporta"   : "Explore and export",
                d: lang === "it"
                  ? "Naviga il report dalla sidebar. Esegui il Critic Agent per la validazione, o esporta PDF e grafici PNG."
                  : "Navigate via the sidebar. Run Critic Agent validation, or export PDF and PNG charts.",
              },
            ].map((s) => (
              <div
                key={s.n}
                className="bg-white rounded-md p-6 transition-shadow hover:shadow-sm"
                style={{ border: "1px solid var(--border-color)" }}
              >
                <div
                  className="text-[36px] font-black leading-none mb-3"
                  style={{ color: "var(--border-color)" }}
                >
                  {s.n}
                </div>
                <h4 className="text-[14px] font-bold mb-1.5" style={{ color: "var(--neutral-dark)" }}>
                  {s.t}
                </h4>
                <p className="text-[13px] leading-relaxed" style={{ color: "var(--neutral-mid)" }}>
                  {s.d}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Query form ─────────────────────────────────────────── */}
        <section id="form" className="max-w-4xl mx-auto px-4 pb-20" style={{ scrollMarginTop: 64 }}>
          <form
            onSubmit={onSubmit}
            noValidate
            className="bg-white rounded-md p-8"
            style={{
              border:     "1px solid var(--border-color)",
              boxShadow:  "0 2px 16px rgba(0,0,0,0.04)",
            }}
          >
            <div className="space-y-5">
              {/* Query */}
              <Field
                label={t("query_label")}
                tip={t("query_tip")}
                required
                error={submitted && !query.trim() ? t("err_required") : null}
              >
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("query_ph")}
                  className="form-input"
                />
              </Field>

              {/* Reference drug */}
              <Field
                label={t("ref_label")}
                tip={t("ref_tip")}
                optional={lang === "it" ? "OPZIONALE" : "OPTIONAL"}
              >
                <input
                  type="text"
                  value={refDrug}
                  onChange={(e) => setRefDrug(e.target.value)}
                  placeholder={t("ref_ph")}
                  className="form-input"
                />
              </Field>

              {/* Numeric params */}
              <div className="grid sm:grid-cols-2 gap-4">
                <Field
                  label={t("trials_label")}
                  tip={t("trials_tip")}
                  required
                  valueBadge={maxTrials}
                >
                  <input
                    type="number"
                    inputMode="numeric"
                    min={5} max={50} step={1}
                    value={maxTrials}
                    onChange={(e) => setMaxTrials(e.target.value)}
                    onBlur={(e) => setMaxTrials(String(clamp(e.target.value, 5, 50, 25)))}
                    className="form-input"
                  />
                </Field>
                <Field
                  label={t("months_label")}
                  tip={t("months_tip")}
                  required
                  valueBadge={monthsBack}
                >
                  <input
                    type="number"
                    inputMode="numeric"
                    min={3} max={36} step={1}
                    value={monthsBack}
                    onChange={(e) => setMonthsBack(e.target.value)}
                    onBlur={(e) => setMonthsBack(String(clamp(e.target.value, 3, 36, 12)))}
                    className="form-input"
                  />
                </Field>
              </div>

              {/* Submit */}
              <button type="submit" className="submit-btn w-full">
                {t("generate")} →
              </button>

              {err && (
                <p className="text-[12px] text-center" style={{ color: "#a83219" }} role="alert">
                  {err}
                </p>
              )}
            </div>
          </form>
        </section>

        <footer
          className="text-center text-[11px] py-4"
          style={{ color: "var(--neutral-mid)" }}
        >
          PharmaCI · {lang === "it" ? "Strumento di intelligence farmaceutica" : "Pharma intelligence tool"}
        </footer>
      </div>

      {/* ── Inline styles (no oklch, pure hex) ──────────────────── */}
      <style>{`
        .form-input {
          width: 100%;
          border-radius: 4px;
          border: 1px solid #e2e0db;
          background: #faf9f5;
          padding: 10px 14px;
          font-size: 14px;
          color: #141413;
          transition: border-color 0.15s, box-shadow 0.15s;
          outline: none;
        }
        .form-input:focus {
          border-color: #d97757;
          box-shadow: 0 0 0 3px rgba(217,119,87,0.12);
        }
        .form-input::-webkit-outer-spin-button,
        .form-input::-webkit-inner-spin-button { -webkit-appearance: none; }
        .form-input[type="number"] { -moz-appearance: textfield; appearance: textfield; }

        .submit-btn {
          height: 48px;
          border-radius: 4px;
          background: #d97757;
          color: #ffffff;
          font-size: 14px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: background 0.15s, box-shadow 0.15s;
          letter-spacing: 0.01em;
        }
        .submit-btn:hover {
          background: #c46843;
          box-shadow: 0 4px 16px rgba(217,119,87,0.28);
        }
        .submit-btn:active { background: #b05a38; }
      `}</style>
    </div>
  );
}

/* ── Small helper components ─────────────────────────────────── */
function Chip({ children, small }: { children: React.ReactNode; small?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold uppercase tracking-[0.07em]
        ${small ? "text-[10px] px-3 py-1" : "text-[10px] px-4 py-1.5"}`}
      style={{
        background: "#f5ece6",
        color:      "#d97757",
        border:     "1px solid #e8c4b0",
      }}
    >
      {children}
    </span>
  );
}

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="text-center">
      <h3 className="text-[20px] font-bold" style={{ color: "var(--neutral-dark)" }}>{title}</h3>
      {sub && <p className="text-[13px] mt-1" style={{ color: "var(--neutral-mid)" }}>{sub}</p>}
    </div>
  );
}

function Field({
  label, tip, required, optional, error, valueBadge, children,
}: {
  label: string;
  tip?: string;
  required?: boolean;
  optional?: string;
  error?: string | null;
  valueBadge?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <label
          className="text-[11px] font-bold uppercase tracking-[0.08em]"
          style={{ color: "var(--neutral-dark)" }}
        >
          {label}
          {required && <span style={{ color: "#a83219" }} className="ml-0.5">*</span>}
        </label>
        {optional && (
          <span
            className="text-[9px] font-bold rounded-full px-2 py-0.5"
            style={{ background: "#f0ede8", color: "var(--neutral-mid)" }}
          >
            {optional}
          </span>
        )}
        {tip && <InfoTip text={tip} />}
        {valueBadge && (
          <span
            className="ml-auto text-[10px] font-semibold rounded-full px-2 py-0.5"
            style={{ background: "#f5ece6", color: "#d97757" }}
          >
            {valueBadge}
          </span>
        )}
      </div>
      {children}
      {error && (
        <p className="text-[11px] mt-1" style={{ color: "#a83219" }}>{error}</p>
      )}
    </div>
  );
}
