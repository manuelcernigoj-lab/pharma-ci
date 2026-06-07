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
import { collectTranslatable, applyTranslations, deepClone } from "@/lib/translate-fields";
import { ExportModal } from "@/components/report/ExportModal";
import { ForceOpenContext } from "@/components/report/force-open";

export const Route = createFileRoute("/report")({ component: ReportPage });

/* ── PDF palette (resolved hex — no oklch) ───────────────────── */
const PDF_STYLES = `
  :root {
    --accent-primary: #d97757;
    --neutral-dark: #141413;
    --neutral-mid: #b0aea5;
    --neutral-muted: #d6d4cf;
    --bg: #faf9f5;
    --surface: #ffffff;
    --border-color: #e2e0db;
    --background: #faf9f5;
    --foreground: #141413;
    --primary: #d97757;
    --primary-foreground: #ffffff;
    --muted-foreground: #b0aea5;
    --border: #e2e0db;
    --card: #ffffff;
    --success: #5a9e6f;
    --warning: #c8922a;
  }

  /* ── Layout: single column, no sidebar gap ──────────────────── */
  body {
    font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif !important;
    font-size: 11px !important;
    line-height: 1.5 !important;
    color: #141413 !important;
    background: #ffffff !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* hide everything outside the report */
  .no-print { display: none !important; }

  /* remove sidebar margin — the cloned node is the main element itself */
  [data-report-root] {
    max-width: 100% !important;
    margin: 0 !important;
    padding: 16px !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }

  /* ── Cards & sections ───────────────────────────────────────── */
  section, [class*="rounded"] {
    border-radius: 4px !important;
    page-break-inside: avoid !important;
  }

  /* ── Typography scale-down ──────────────────────────────────── */
  h1, h2 { font-size: 14px !important; }
  h3, h4 { font-size: 12px !important; }
  p, td, th, li, span { font-size: 11px !important; }

  /* exec summary big number */
  .exec-metric-value { font-size: 20px !important; }

  /* ── Tables: no page split mid-row ──────────────────────────── */
  table { border-collapse: collapse !important; width: 100% !important; }
  tr    { page-break-inside: avoid !important; }
  th, td {
    padding: 4px 6px !important;
    font-size: 10px !important;
    border-bottom: 1px solid #e2e0db !important;
    word-break: break-word !important;
    max-width: 180px !important;
  }

  /* ── Collapsibles: force open in PDF ───────────────────────── */
  .collapsible-content {
    display: block !important;
    max-height: none !important;
    overflow: visible !important;
    opacity: 1 !important;
    grid-template-rows: 1fr !important;
  }

  /* ── Charts: contain height ─────────────────────────────────── */
  .recharts-responsive-container { height: 220px !important; }

  /* ── Grid: single column on narrow PDF ─────────────────────── */
  .grid { display: block !important; }
  .grid > * { margin-bottom: 8px !important; width: 100% !important; }
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
    (async () => {
      setTranslating(true);
      setTranslateErr(null);
      try {
        const clone = deepClone(original);
        const { texts } = collectTranslatable(clone);
        if (!texts.length) { if (!cancelled) setTranslatedIt(clone); return; }
        const { translations } = await translateFn({ data: { texts, target: "it" } });
        applyTranslations(clone, translations);
        if (!cancelled) setTranslatedIt(clone);
      } catch (e) {
        if (!cancelled) setTranslateErr(String((e as Error).message ?? e));
      } finally {
        if (!cancelled) setTranslating(false);
      }
    })();
    return () => { cancelled = true; };
  }, [lang, original, translatedIt, translateFn]);

  if (!original) return null;

  const data: ReportData = lang === "it" ? (translatedIt ?? original) : original;

  /* ── PDF Export ────────────────────────────────────────────── */
  const handleDownloadPdf = async () => {
    if (!mainRef.current) return;
    setPdfBusy(true);
    setForceOpen(true);

    // Give React time to expand all collapsibles
    await new Promise((r) => setTimeout(r, 700));

    try {
      const [{ default: html2canvas }, { default: JsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const el = mainRef.current;

      /* 1. Inject PDF-specific stylesheet into the document */
      const styleTag = document.createElement("style");
      styleTag.id    = "__pharmaci-pdf-style__";
      styleTag.textContent = PDF_STYLES;
      document.head.appendChild(styleTag);

      /* 2. Snapshot with html2canvas
           – scale: 1.5 → good balance of sharpness vs file size
           – windowWidth: A4 in px at 96dpi (794px) for proper text wrapping
           – ignoreElements: skip sidebar, header, modals                      */
      let canvas: HTMLCanvasElement;
      try {
        canvas = await html2canvas(el, {
          scale: 1.5,
          backgroundColor: "#ffffff",
          useCORS: true,
          windowWidth: 794,           // A4 width at 96dpi
          windowHeight: el.scrollHeight,
          ignoreElements: (node) => {
            const cls = (node as HTMLElement).className ?? "";
            const tag = (node as HTMLElement).tagName ?? "";
            return (
              cls.includes("no-print") ||
              tag === "ASIDE" ||
              tag === "HEADER" ||
              cls.includes("ExportModal") ||
              (node as HTMLElement).getAttribute?.("role") === "dialog"
            );
          },
        });
      } finally {
        /* 3. Always remove the injected style */
        styleTag.remove();
      }

      /* 4. Build paginated PDF
           – A4 portrait: 210 × 297 mm
           – 10mm margins on all sides
           – content width: 190mm                                              */
      const pdf      = new JsPDF({ orientation: "p", unit: "mm", format: "a4" });
      const pageW    = 210;
      const pageH    = 297;
      const margin   = 10;
      const contentW = pageW - margin * 2;   // 190mm

      // Canvas → content dimensions in mm
      const mmPerPx  = contentW / canvas.width;
      const contentH = canvas.height * mmPerPx;  // total height in mm

      // Slice height in px that fits one page
      const pageHpx  = Math.floor((pageH - margin * 2) / mmPerPx);

      let renderedPx = 0;
      let firstPage  = true;

      while (renderedPx < canvas.height) {
        const sliceH = Math.min(pageHpx, canvas.height - renderedPx);

        // Create a slice canvas
        const slice = document.createElement("canvas");
        slice.width  = canvas.width;
        slice.height = sliceH;
        const ctx    = slice.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, slice.width, slice.height);
        ctx.drawImage(canvas, 0, renderedPx, canvas.width, sliceH, 0, 0, canvas.width, sliceH);

        const imgData  = slice.toDataURL("image/jpeg", 0.92);
        const sliceHmm = sliceH * mmPerPx;

        if (!firstPage) pdf.addPage();
        firstPage = false;

        pdf.addImage(imgData, "JPEG", margin, margin, contentW, sliceHmm);
        renderedPx += sliceH;
      }

      /* 5. Download */
      const blob = pdf.output("blob");
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = "pharmaci-report.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);

    } catch (e) {
      console.error("PDF export failed", e);
      alert("PDF export failed: " + ((e as Error)?.message ?? String(e)));
    } finally {
      setForceOpen(false);
      setPdfBusy(false);
      setExportOpen(false);
    }
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
    <div className="min-h-screen" style={{ background: "#faf9f5" }}>
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
      >
        {/* Slim top bar */}
        <header
          className="sticky top-0 z-20 bg-white no-print"
          style={{ height: 48, borderBottom: "1px solid var(--border-color)" }}
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
          <div className="fixed inset-0 z-30 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center no-print">
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
              style={{ background: "#fde8e2", color: "#a83219", border: "1px solid #f5c6bb" }}
            >
              {lang === "it" ? "Traduzione non riuscita: " : "Translation failed: "}
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
              className="rounded-md bg-white p-6"
              style={{ border: "1px solid var(--border-color)", scrollMarginTop: 64 }}
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
