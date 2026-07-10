import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useI18n } from "@/lib/i18n";
import { Sidebar } from "@/components/Sidebar";
import { reportStore } from "@/lib/report-store";
import type { ReportData } from "@/lib/types";
import { ExecSummary } from "@/components/report/ExecSummary";
import { Charts } from "@/components/report/Charts";
import {
  PipelineSection, ApprovedSection, ThreatSection, TtmSection,
  InnovSection, EndpointSection, PublicationsSection, ValidationSection,
} from "@/components/report/Sections";
import { Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";
import { translateStrings } from "@/lib/translate.functions";
import { collectTranslatable, deepClone } from "@/lib/translate-fields";
import { ExportModal } from "@/components/report/ExportModal";
import { ForceOpenContext } from "@/components/report/force-open";

export const Route = createFileRoute("/report")({ component: ReportPage });

/* ── Print styles (injected before window.print(), removed after) ── */
/* Uses hex-only values — no oklch — to avoid browser print rendering bugs. */
const PRINT_STYLES = `
  /* ── Page setup ──────────────────────────────────────────────── */
  @page { size: A4 portrait; margin: 12mm 14mm; }

  /* ── Hex-only CSS vars (override any oklch in styles.css) ───── */
  :root {
    --accent-primary:    #d97757;
    --neutral-dark:      #141413;
    --neutral-mid:       #b0aea5;
    --neutral-muted:     #d6d4cf;
    --bg:                #ffffff;
    --surface:           #ffffff;
    --border-color:      #e2e0db;
    --background:        #ffffff;
    --foreground:        #141413;
    --primary:           #d97757;
    --primary-foreground:#ffffff;
    --muted-foreground:  #b0aea5;
    --border:            #e2e0db;
    --card:              #ffffff;
    --card-foreground:   #141413;
    --success:           #5a9e6f;
    --warning:           #c8922a;
    --ring:              #d97757;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ── Hide non-report chrome ──────────────────────────────────── */
  .no-print,
  aside,
  header,
  [role="dialog"],
  footer { display: none !important; }

  /* ── Body ────────────────────────────────────────────────────── */
  body {
    font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
    font-size: 11px;
    line-height: 1.5;
    color: #141413;
    background: #ffffff;
  }

  /* ── Remove sidebar offset from content wrapper ─────────────── */
  [data-content-wrapper] { margin-left: 0 !important; }

  /* ── Report root ─────────────────────────────────────────────── */
  [data-report-root] {
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  /* ── Sections: keep whole, break BETWEEN sections not inside ── */
  /* If a section is taller than one page the browser will break  */
  /* it at a row/paragraph boundary rather than mid-element.      */
  section,
  [data-report-root] > div { 
    break-inside: avoid;
    page-break-inside: avoid;
    margin-bottom: 10px;
  }

  /* ── Force all collapsibles open ────────────────────────────── */
  .collapsible-content {
    display:         block   !important;
    grid-template-rows: 1fr !important;
    max-height:      none    !important;
    overflow:        visible !important;
    opacity:         1       !important;
  }

  /* ── Typography scale ────────────────────────────────────────── */
  h2 { font-size: 13px !important; font-weight: 700 !important; }
  h3 { font-size: 11px !important; font-weight: 600 !important; }
  p, td, th, li, span, div { font-size: 10px !important; }

  /* ── Tables: allow row-level breaks, not mid-row ────────────── */
  table   { width: 100% !important; border-collapse: collapse !important; break-inside: auto; }
  thead   { display: table-header-group; }        /* repeat headers on each page */
  tr      { break-inside: avoid; page-break-inside: avoid; }
  th, td  { 
    padding: 3px 5px !important; 
    font-size: 10px !important;
    border-bottom: 1px solid #e2e0db !important;
    word-break: break-word !important;
  }

  /* ── Charts: fixed height so they don't overflow a page ─────── */
  .recharts-responsive-container { height: 190px !important; }

  /* ── Grids: single column in print ──────────────────────────── */
  .grid           { display: block !important; }
  .grid > *       { width: 100% !important; margin-bottom: 8px !important; }
  .md\\:grid-cols-2,
  .sm\\:grid-cols-2 { grid-template-columns: 1fr !important; }
`;

function ReportPage() {
  const { lang } = useI18n();
  const navigate  = useNavigate();

  const [original,      setOriginal]      = useState<ReportData | null>(null);
  const [translatedIt,  setTranslatedIt]  = useState<ReportData | null>(null);
  const [translating,   setTranslating]   = useState(false);
  const [translateErr,  setTranslateErr]  = useState<string | null>(null);
  const [validating,    setValidating]    = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [exportOpen,    setExportOpen]    = useState(false);
  const [pdfBusy,       setPdfBusy]       = useState(false);
  const [forceOpen,     setForceOpen]     = useState(false);

  const chartsRef = useRef<HTMLDivElement>(null);
  const mainRef   = useRef<HTMLElement>(null);
  const translateFn = useServerFn(translateStrings);

  /* ── Load report from store ────────────────────────────────── */
  useEffect(() => {
    const d = reportStore.get();
    if (!d) navigate({ to: "/" });
    else setOriginal(d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── IT translation ────────────────────────────────────────── */
  useEffect(() => {
    if (!original || lang !== "it" || translatedIt) return;
    let cancelled = false;
    let errorTimer: ReturnType<typeof setTimeout> | undefined;

    (async () => {
      setTranslating(true);
      setTranslateErr(null);
      try {
        const clone = deepClone(original);

        // Collect texts AND setters in a single pass so indices are
        // guaranteed to be aligned. Re-calling collectTranslatable
        // inside applyTranslations was the root cause of executive_summary
        // not being translated (second call could yield a different order).
        const { texts, setters } = collectTranslatable(clone);

        if (!texts.length) {
          if (!cancelled) setTranslatedIt({ ...clone });
          return;
        }

        const { translations } = await translateFn({ data: { texts, target: "it" } });

        // Apply using the SAME setters from the same collectTranslatable
        // call — index 0 in setters === index 0 in texts === index 0 in translations.
        setters.forEach((setter, i) => {
          if (typeof translations[i] === "string") setter(translations[i]);
        });

        if (!cancelled) {
          // Spread to a new object reference so React always detects the update.
          setTranslatedIt({ ...clone });
        }
      } catch (e) {
        console.error("Translation failed:", (e as Error).message);
        // Small delay before showing the banner: a genuine failure stays
        // visible, but this avoids a jarring flash if the effect re-runs
        // (e.g. React strict-mode double-invoke) and succeeds right after.
        errorTimer = setTimeout(() => {
          if (!cancelled) {
            setTranslateErr(
              lang === "it"
                ? "Traduzione non riuscita: alcuni testi potrebbero apparire in inglese."
                : "Translation failed: some text may appear in English."
            );
          }
        }, 400);
      } finally {
        if (!cancelled) setTranslating(false);
      }
    })();

    return () => {
      cancelled = true;
      if (errorTimer) clearTimeout(errorTimer);
    };
  }, [lang, original, translatedIt, translateFn]);

  if (!original) return null;

  const data: ReportData = lang === "it" ? (translatedIt ?? original) : original;

  /* ── PDF Export — uses browser window.print() ─────────────── */
  /* Avoids jsPDF canvas/blob restrictions in Cloudflare Workers. */
  /* The browser renders directly from the live DOM: text stays   */
  /* selectable, fonts are correct, no oklch conversion needed.   */
  /* Sections with break-inside:avoid stay intact; oversized ones */
  /* break at a row/paragraph boundary, never mid-element.        */
  const handleDownloadPdf = async () => {
    setPdfBusy(true);
    setForceOpen(true);                     // expand all collapsibles

    // Wait for React to re-render expanded collapsibles
    await new Promise((r) => setTimeout(r, 600));

    // Inject print-specific styles (hex-only, A4 page, layout fixes)
    const styleTag = document.createElement("style");
    styleTag.id    = "__pharmaci-print__";
    styleTag.textContent = PRINT_STYLES;
    document.head.appendChild(styleTag);

    // Cleanup: fires when user closes the print dialog (print or cancel)
    const cleanup = () => {
      styleTag.remove();
      setForceOpen(false);
      setPdfBusy(false);
      setExportOpen(false);
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);

    // Fallback cleanup in case afterprint doesn't fire (some browsers)
    setTimeout(cleanup, 30_000);

    window.print();
  };

  /* ── Validation ────────────────────────────────────────────── */
  const handleRunValidation = async () => {
    if (!original) return;
    setValidating(true);
    setValidationError(null);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60_000);
    try {
      const res = await fetch("https://agent-8.duckdns.org/webhook/ci-agent-critic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report: original }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const validation = json?.validation ?? json?.report?.validation ?? json;
      setOriginal((prev) => prev ? { ...prev, validation } : prev);
      setTranslatedIt((prev) => prev ? { ...prev, validation } : prev);
    } catch (e) {
      console.error(e);
      setValidationError(lang === "it" ? "Validazione non riuscita. Riprova." : "Validation failed. Try again.");
    } finally {
      clearTimeout(timer);
      setValidating(false);
    }
  };

  const validationPassed = !!data.validation?.validation_passed;

  /* ── Render ────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Sidebar
        page="report"
        validation={data.validation ?? null}
        validationPassed={validationPassed}
        validating={validating}
        onRunValidation={handleRunValidation}
        onOpenExport={() => setExportOpen(true)}
      />

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        chartsRoot={chartsRef.current}
        onDownloadPdf={handleDownloadPdf}
        pdfBusy={pdfBusy}
      />

      {/* Content area — respects sidebar width via CSS var */}
      <div
        className="md:ml-[var(--sidebar-w,224px)] transition-[margin] duration-300 ease-out"
        data-content-wrapper
      >
        {/* Slim top bar */}
        <header
          className="sticky top-0 z-20 no-print"
          style={{ height: 48, background: "var(--surface)", borderBottom: "1px solid var(--border-color)" }}
        >
          <div className="h-full max-w-5xl mx-auto px-4 flex items-center gap-2 pl-14 md:pl-4">
            <img src={logo} alt="" className="h-5 w-5 rounded" />
            <span className="font-bold text-[15px]" style={{ color: "var(--neutral-dark)" }}>
              PharmaCI
            </span>
          </div>
        </header>

        {/* Translation overlay */}
        {translating && (
          <div
            className="fixed inset-0 z-30 backdrop-blur-sm flex flex-col items-center justify-center no-print"
            style={{ background: "color-mix(in srgb, var(--surface) 85%, transparent)" }}
          >
            <Loader2 className="h-10 w-10 animate-spin" style={{ color: "var(--accent-primary)" }} />
            <p className="mt-4 font-medium text-sm" style={{ color: "var(--neutral-dark)" }}>
              {lang === "it" ? "Traduzione in corso..." : "Translating..."}
            </p>
          </div>
        )}

        {translateErr && (
          <div className="max-w-5xl mx-auto px-4 pt-3 no-print">
            <div
              className="rounded-md text-sm px-4 py-2"
              style={{
                background: "color-mix(in srgb, var(--destructive) 12%, var(--surface))",
                color: "var(--destructive)",
                border: "1px solid color-mix(in srgb, var(--destructive) 35%, var(--surface))",
              }}
            >
              {translateErr}
            </div>
          </div>
        )}

        {/* ── Report content ────────────────────────────────────── */}
        <ForceOpenContext.Provider value={forceOpen}>
          <main
            ref={mainRef}
            data-report-root
            className="max-w-5xl mx-auto px-4 py-6 space-y-4"
          >
            <div id="exec-summary" style={{ scrollMarginTop: 64 }}>
              <ExecSummary data={data} />
            </div>

            <section
              id="visual-analysis"
              className="rounded-md p-6"
              style={{ background: "var(--surface)", border: "1px solid var(--border-color)", scrollMarginTop: 64 }}
            >
              <div
                className="text-[10px] font-bold uppercase tracking-[0.12em] mb-4"
                style={{ color: "var(--neutral-mid)" }}
              >
                {lang === "it" ? "Analisi Visiva" : "Visual Analysis"}
              </div>
              <div ref={chartsRef}>
                <Charts data={data} />
              </div>
            </section>

            <div id="pipeline"  style={{ scrollMarginTop: 64 }}><PipelineSection  data={data} /></div>
            <div id="approved"  style={{ scrollMarginTop: 64 }}><ApprovedSection  data={data} /></div>
            <div id="threat"    style={{ scrollMarginTop: 64 }}><ThreatSection    data={data} /></div>
            <div id="ttm"       style={{ scrollMarginTop: 64 }}><TtmSection       data={data} /></div>
            <div id="innov"     style={{ scrollMarginTop: 64 }}><InnovSection     data={data} /></div>
            <div id="endpoint"  style={{ scrollMarginTop: 64 }}><EndpointSection  data={data} /></div>
            <div id="literature"style={{ scrollMarginTop: 64 }}><PublicationsSection data={data} /></div>
            <div id="validation"style={{ scrollMarginTop: 64 }}>
              <ValidationSection data={data} validationError={validationError} />
            </div>
          </main>
        </ForceOpenContext.Provider>

        <footer
          className="text-center text-[11px] py-5 no-print"
          style={{ color: "var(--neutral-mid)" }}
        >
          PharmaCI
        </footer>
      </div>
    </div>
  );
}
