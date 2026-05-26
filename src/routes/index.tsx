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
  const [query, setQuery] = useState("");
  const [refDrug, setRefDrug] = useState("");
  const [maxTrials, setMaxTrials] = useState<string>("25");
  const [monthsBack, setMonthsBack] = useState<string>("12");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [loadingIdx, setLoadingIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
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
        query: query.trim(),
        max_trials: clamp(maxTrials, 5, 50, 25),
        months_back: clamp(monthsBack, 3, 36, 12),
      };
      if (refDrug.trim()) body.reference_drug = refDrug.trim();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000);
      const res = await fetch(WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#f4fffb" }}>
        <Loader2 className="h-12 w-12 animate-spin" style={{ color: "#4ec2a7" }} strokeWidth={3} />
        <p className="mt-6 text-[16px] font-medium" style={{ color: "#1f7f6e" }}>
          {t(loadingKeys[loadingIdx])}
        </p>
        <p className="mt-3 text-[13px]" style={{ color: "rgba(31,127,110,0.45)" }}>{fmtTime(elapsed)}</p>
        <p className="mt-2 text-[12px]" style={{ color: "rgba(31,127,110,0.35)" }}>
          {lang === "it" ? "Le query complesse possono richiedere fino a 60 secondi." : "Complex queries may take up to 60 seconds."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" style={{ background: "#f4fffb" }}>
      <Sidebar page="home" />

      <div className="md:ml-[var(--sidebar-w,240px)] transition-[margin] duration-300 ease-out">
        {/* Slim navbar */}
        <header
          className="sticky top-0 z-20 bg-white border-b"
          style={{ height: 52, borderColor: "rgba(78,194,167,0.15)" }}
        >
          <div className="h-full max-w-6xl mx-auto px-4 flex items-center gap-2 pl-14 md:pl-4">
            <img src={logo} alt="" className="h-6 w-6 rounded" />
            <span className="font-bold text-[17px]" style={{ color: "#1f7f6e" }}>PharmaCI</span>
          </div>
        </header>

        {/* Hero */}
        <div id="home" className="relative">
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-[400px] pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(78,194,167,0.18) 0%, transparent 70%)",
            }}
          />
          <section className="relative max-w-[680px] mx-auto px-6 pt-16 pb-10 text-center">
            <PillBadge>
              <span
                className="inline-block w-1 h-1 rounded-full mr-2"
                style={{ background: "#4ec2a7", animation: "pharma-pulse 2s infinite" }}
              />
              {lang === "it"
                ? "AI · Clinical Intelligence · Strategia Pharma"
                : "AI-powered · Clinical Intelligence · Pharma Strategy"}
            </PillBadge>

            <h2
              className="mt-6 font-extrabold leading-[1.1]"
              style={{ color: "#1f7f6e", fontSize: "clamp(30px, 5vw, 50px)" }}
            >
              {lang === "it" ? "Dalla query al report strategico." : "From query to strategic report."}
              <br />
              <span style={{ color: "#4ec2a7", fontWeight: 400 }}>
                {lang === "it" ? "In meno di 60 secondi." : "In under 60 seconds."}
              </span>
            </h2>

            <p
              className="mt-5 mx-auto text-[17px] max-w-[500px]"
              style={{ color: "rgba(31,127,110,0.7)" }}
            >
              {lang === "it"
                ? "Inserisci un target. PharmaCI interroga ClinicalTrials.gov, OpenFDA e PubMed — poi genera un report completo di competitive intelligence."
                : "Type a target. PharmaCI queries ClinicalTrials.gov, OpenFDA and PubMed — then generates a full competitive intelligence report."}
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <PillBadge small>{lang === "it" ? "17 fonti di trial" : "17 trial sources"}</PillBadge>
              <PillBadge small>{lang === "it" ? "Farmaci approvati FDA" : "FDA approved drugs"}</PillBadge>
              <PillBadge small>{lang === "it" ? "Insight generati con AI" : "AI-generated insights"}</PillBadge>
            </div>
          </section>

        </div>



        {/* How it works */}
        <section id="how" className="max-w-5xl mx-auto px-4 pb-20" style={{ scrollMarginTop: 72 }}>
          <h3 className="text-[24px] font-bold text-center" style={{ color: "#1f7f6e" }}>
            {lang === "it" ? "Come funziona" : "How it works"}
          </h3>
          <p className="text-[15px] text-center mt-2 mb-8" style={{ color: "rgba(31,127,110,0.6)" }}>
            {lang === "it"
              ? "Cosa accade dopo aver premuto Genera Report"
              : "What happens after you click Generate Report"}
          </p>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                n: "1",
                t: lang === "it" ? "Inserisci il target" : "Enter your target",
                d: lang === "it"
                  ? "Inserisci un target biologico o area terapeutica — es. KRAS G12C NSCLC. Aggiungi un farmaco di riferimento per il benchmarking competitivo."
                  : "Type a biological target or therapeutic area — e.g. KRAS G12C NSCLC. Add a reference drug for head-to-head competitive benchmarking.",
              },
              {
                n: "2",
                t: lang === "it" ? "Imposta i parametri" : "Set your parameters",
                d: lang === "it"
                  ? "max_trials controlla quanti trial recuperare. months_back imposta la finestra PubMed. Valori più bassi = report più rapido."
                  : "max_trials controls how many clinical trials to retrieve. months_back sets how far back to search PubMed. Lower values = faster report.",
              },
              {
                n: "3",
                t: lang === "it" ? "L'AI genera il report" : "AI generates the report",
                d: lang === "it"
                  ? "PharmaCI interroga ClinicalTrials.gov, OpenFDA e PubMed in parallelo. Claude AI sintetizza un report strategico con threat score, forecast regolatori e valutazione AIFA."
                  : "PharmaCI queries ClinicalTrials.gov, OpenFDA and PubMed in parallel. Claude AI synthesizes a structured strategic report with threat scoring, regulatory forecasts and AIFA assessment.",
              },
              {
                n: "4",
                t: lang === "it" ? "Esplora ed esporta" : "Explore and export",
                d: lang === "it"
                  ? "Naviga il report dalla sidebar di sinistra. Usa le azioni per avviare il Critic Agent o esportare il report come PDF e i grafici come PNG."
                  : "Navigate the interactive report via the left sidebar. Use sidebar actions to run the Critic Agent validation or export the full report as PDF and charts as PNG.",
              },
            ].map((s) => (
              <div
                key={s.n}
                className="pharma-step bg-white p-7 rounded-[16px]"
                style={{ border: "1px solid rgba(78,194,167,0.2)", transition: "all 0.25s ease" }}
              >
                <div className="text-[42px] font-extrabold leading-none" style={{ color: "rgba(78,194,167,0.25)" }}>
                  {s.n}
                </div>
                <h4 className="text-[16px] font-bold mt-2 mb-1.5" style={{ color: "#1f7f6e" }}>{s.t}</h4>
                <p className="text-[14px] leading-relaxed" style={{ color: "rgba(31,127,110,0.65)" }}>{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Form card */}
        <section id="form" className="relative max-w-5xl mx-auto px-4 pb-16" style={{ scrollMarginTop: 72 }}>
          <form
            onSubmit={onSubmit}
            noValidate
            className="bg-white p-10 rounded-[20px]"
            style={{
              border: "1px solid rgba(78,194,167,0.25)",
              boxShadow: "0 4px 40px rgba(31,127,110,0.08)",
            }}
          >
            <div className="space-y-5">
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
                  className="pharma-input"
                />
              </Field>

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
                  className="pharma-input"
                />
              </Field>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label={t("trials_label")} tip={t("trials_tip")} required valueBadge={maxTrials}>
                  <input
                    type="number" inputMode="numeric" min={5} max={50} step={1}
                    value={maxTrials}
                    onChange={(e) => setMaxTrials(e.target.value)}
                    onBlur={(e) => setMaxTrials(String(clamp(e.target.value, 5, 50, 25)))}
                    className="pharma-input"
                  />
                </Field>
                <Field label={t("months_label")} tip={t("months_tip")} required valueBadge={monthsBack}>
                  <input
                    type="number" inputMode="numeric" min={3} max={36} step={1}
                    value={monthsBack}
                    onChange={(e) => setMonthsBack(e.target.value)}
                    onBlur={(e) => setMonthsBack(String(clamp(e.target.value, 3, 36, 12)))}
                    className="pharma-input"
                  />
                </Field>
              </div>

              <button
                type="submit"
                className="pharma-cta w-full rounded-[12px] text-white text-[16px] font-bold"
                style={{
                  height: 52,
                  background: "linear-gradient(135deg, #4ec2a7 0%, #1f7f6e 100%)",
                  boxShadow: "0 4px 20px rgba(78,194,167,0.35)",
                  transition: "all 0.25s ease",
                }}
              >
                {t("generate")} →
              </button>
              {err && <p className="text-sm text-red-600 text-center" role="alert">{err}</p>}
            </div>
          </form>
        </section>


        <footer className="text-center text-xs py-4" style={{ color: "rgba(31,127,110,0.5)" }}>
          PharmaCI · {lang === "it" ? "Strumento di intelligence farmaceutica" : "Pharma intelligence tool"}
        </footer>
      </div>

      <style>{`
        .pharma-input {
          width: 100%;
          border-radius: 10px;
          border: 1.5px solid #d3f7ec;
          background: #f4fffb;
          padding: 12px 16px;
          font-size: 15px;
          color: #1f7f6e;
          transition: all 0.2s ease;
        }
        .pharma-input:focus {
          outline: none;
          border-color: #4ec2a7;
          box-shadow: 0 0 0 3px rgba(78,194,167,0.15);
        }
        .pharma-input::-webkit-outer-spin-button,
        .pharma-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .pharma-input[type="number"] { -moz-appearance: textfield; appearance: textfield; }
        .pharma-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(78,194,167,0.45); }
        .pharma-cta:active { transform: translateY(0); }
        .pharma-step:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(31,127,110,0.1); }
        @keyframes pharma-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

function PillBadge({ children, small }: { children: React.ReactNode; small?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full ${small ? "text-[11px] px-3 py-1" : "text-[11px] px-4 py-1.5"} uppercase`}
      style={{
        background: "#d3f7ec",
        color: "#1f7f6e",
        border: "1px solid #9fe5d0",
        letterSpacing: "0.06em",
        fontWeight: 600,
      }}
    >
      {children}
    </span>
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
      <div className="flex items-center gap-1.5 mb-2">
        <label
          className="text-[12px] font-bold uppercase"
          style={{ color: "#1f7f6e", letterSpacing: "0.07em" }}
        >
          {label}{required && <span className="text-red-600 ml-0.5">*</span>}
        </label>
        {optional && (
          <span
            className="text-[10px] font-semibold rounded-full px-2 py-0.5"
            style={{ background: "#d3f7ec", color: "#1f7f6e" }}
          >
            {optional}
          </span>
        )}
        {tip && <InfoTip text={tip} />}
        {valueBadge && (
          <span
            className="ml-auto text-[11px] font-semibold rounded-full px-2 py-0.5"
            style={{ background: "#d3f7ec", color: "#1f7f6e" }}
          >
            {valueBadge}
          </span>
        )}
      </div>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
