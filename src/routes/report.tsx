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

function ReportPage() {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const [original, setOriginal] = useState<ReportData | null>(null);
  const [translatedIt, setTranslatedIt] = useState<ReportData | null>(null);
  const [translating, setTranslating] = useState(false);
  const [translateErr, setTranslateErr] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [forceOpen, setForceOpen] = useState(false);
  const chartsRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const translateFn = useServerFn(translateStrings);

  useEffect(() => {
    const d = reportStore.get();
    if (!d) navigate({ to: "/" });
    else setOriginal(d);
    // intentionally run once on mount — navigate identity changes must not retrigger
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!original) return;
    if (lang !== "it") return;
    if (translatedIt) return;
    let cancelled = false;
    (async () => {
      setTranslating(true);
      setTranslateErr(null);
      try {
        const clone = deepClone(original);
        const { texts } = collectTranslatable(clone);
        if (texts.length === 0) {
          if (!cancelled) setTranslatedIt(clone);
          return;
        }
        const { translations } = await translateFn({ data: { texts, target: "it" } });
        applyTranslations(clone, translations);
        if (!cancelled) setTranslatedIt(clone);
      } catch (e) {
        console.error(e);
        if (!cancelled) setTranslateErr(String((e as Error).message ?? e));
      } finally {
        if (!cancelled) setTranslating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lang, original, translatedIt, translateFn]);

  if (!original) return null;

  const data: ReportData =
    lang === "it" ? (translatedIt ?? original) : original;

  const handleDownloadPdf = async () => {
    if (!mainRef.current) return;
    setPdfBusy(true);
    setForceOpen(true);
    
    interface StyleBackup {
      element: HTMLStyleElement | HTMLLinkElement;
      type: "style" | "link";
      originalText?: string;
      tempStyle?: HTMLStyleElement;
    }
    const backups: StyleBackup[] = [];

    try {
      // wait for re-render + expand animations
      await new Promise((r) => setTimeout(r, 600));
      const [{ default: html2canvas }, { default: JsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const el = mainRef.current;

      const probe = document.createElement("canvas").getContext("2d")!;
      const toRgb = (v: string): string => {
        if (!v) return v;
        if (!/oklch|oklab|color\(|lch\(|lab\(/i.test(v)) return v;
        try {
          probe.fillStyle = "#ffffff";
          probe.fillStyle = v;
          const res1 = probe.fillStyle;

          probe.fillStyle = "#000000";
          probe.fillStyle = v;
          const res2 = probe.fillStyle;

          if (res1 === res2) {
            return res1;
          }
          return v;
        } catch {
          return v;
        }
      };

      const replaceOklch = (text: string): string => {
        return text.replace(/oklch\([^)]+\)/gi, (match) => {
          const resolved = toRgb(match);
          return resolved;
        });
      };

      const colorProps = [
        "color", "background-color",
        "border-top-color", "border-right-color",
        "border-bottom-color", "border-left-color",
        "outline-color", "fill", "stroke",
        "text-decoration-color", "caret-color",
      ];

      // 1. Sanitize inline styles in the LIVE DOM before html2canvas reads computed styles.
      const liveAll: HTMLElement[] = [el, ...Array.from(el.querySelectorAll<HTMLElement>("*"))];
      const restoreInline: Array<() => void> = [];
      liveAll.forEach((node) => {
        const cs = window.getComputedStyle(node);
        const prevInline = node.getAttribute("style");
        let changed = false;
        colorProps.forEach((p) => {
          const cur = cs.getPropertyValue(p);
          const fixed = toRgb(cur);
          if (fixed && fixed !== cur) {
            node.style.setProperty(p, fixed, "important");
            changed = true;
          }
        });
        const bgImg = cs.getPropertyValue("background-image");
        if (bgImg && /oklch|oklab|lch\(|lab\(|color\(/i.test(bgImg)) {
          const replaced = bgImg.replace(
            /(oklch|oklab|lch|lab|color)\([^)]*\)/gi,
            (m) => toRgb(m)
          );
          node.style.setProperty("background-image", replaced, "important");
          changed = true;
        }
        if (changed) {
          restoreInline.push(() => {
            if (prevInline === null) node.removeAttribute("style");
            else node.setAttribute("style", prevInline);
          });
        }
      });

      // 2. Temporarily sanitize all global <style> tags
      const styles = Array.from(document.querySelectorAll("style"));
      styles.forEach((style) => {
        const originalText = style.textContent ?? "";
        if (/oklch/i.test(originalText)) {
          const cleanedText = replaceOklch(originalText);
          style.textContent = cleanedText;
          backups.push({
            element: style,
            type: "style",
            originalText,
          });
        }
      });

      // 3. Temporarily sanitize same-origin <link rel="stylesheet"> tags
      const links = Array.from(document.querySelectorAll<HTMLLinkElement>("link[rel='stylesheet']"));
      for (const link of links) {
        try {
          if (link.href && link.href.startsWith(window.location.origin)) {
            const res = await fetch(link.href);
            if (res.ok) {
              const originalText = await res.text();
              if (/oklch/i.test(originalText)) {
                const cleanedText = replaceOklch(originalText);
                
                const tempStyle = document.createElement("style");
                tempStyle.textContent = cleanedText;
                document.head.appendChild(tempStyle);
                
                link.disabled = true;
                
                backups.push({
                  element: link,
                  type: "link",
                  tempStyle,
                });
              }
            }
          }
        } catch (e) {
          console.warn("Could not sanitize link stylesheet:", link.href, e);
        }
      }

      let canvas: HTMLCanvasElement;
      try {
        canvas = await html2canvas(el, {
          scale: 2,
          backgroundColor: "#f4fffb",
          useCORS: true,
          windowWidth: el.scrollWidth,
        });
      } // restore style changes immediately in finally
      finally {
        restoreInline.forEach((fn) => fn());
        backups.forEach((b) => {
          if (b.type === "style" && b.originalText !== undefined) {
            b.element.textContent = b.originalText;
          } else if (b.type === "link" && b.tempStyle) {
            b.tempStyle.remove();
            (b.element as HTMLLinkElement).disabled = false;
          }
        });
      }

      const pdf = new JsPDF({ orientation: "p", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW;

      const pxPerMm = canvas.width / pageW;
      const pageHpx = Math.floor(pageH * pxPerMm);
      let renderedPx = 0;
      let first = true;
      while (renderedPx < canvas.height) {
        const sliceH = Math.min(pageHpx, canvas.height - renderedPx);
        const slice = document.createElement("canvas");
        slice.width = canvas.width;
        slice.height = sliceH;
        const ctx = slice.getContext("2d")!;
        ctx.fillStyle = "#f4fffb";
        ctx.fillRect(0, 0, slice.width, slice.height);
        ctx.drawImage(canvas, 0, renderedPx, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
        const data = slice.toDataURL("image/jpeg", 0.92);
        if (!first) pdf.addPage();
        first = false;
        const sliceHmm = (sliceH / canvas.width) * imgW;
        pdf.addImage(data, "JPEG", 0, 0, imgW, sliceHmm);
        renderedPx += sliceH;
      }

      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pharmaci-report.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) {
      console.error("PDF export failed", e);
      alert("PDF export failed: " + ((e as Error)?.message ?? String(e)));
    } finally {
      backups.forEach((b) => {
        if (b.type === "style" && b.originalText !== undefined) {
          b.element.textContent = b.originalText;
        } else if (b.type === "link" && b.tempStyle) {
          b.tempStyle.remove();
          (b.element as HTMLLinkElement).disabled = false;
        }
      });
      setForceOpen(false);
      setPdfBusy(false);
      setExportOpen(false);
    }
  };

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
      setOriginal((prev) => (prev ? { ...prev, validation } : prev));
      setTranslatedIt((prev) => (prev ? { ...prev, validation } : prev));
    } catch (e) {
      console.error(e);
      setValidationError(
        lang === "it" ? "Validazione non riuscita. Riprova." : "Validation failed. Try again."
      );
    } finally {
      clearTimeout(timer);
      setValidating(false);
    }
  };

  const validationPassed = !!data.validation?.validation_passed;

  return (
    <div className="min-h-screen" style={{ background: "#f4fffb" }}>
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

      <div className="md:ml-[var(--sidebar-w,240px)] transition-[margin] duration-300 ease-out">
        <header
          className="sticky top-0 z-20 bg-white border-b no-print"
          style={{ height: 52, borderColor: "rgba(78,194,167,0.15)" }}
        >
          <div className="h-full max-w-6xl mx-auto px-4 flex items-center gap-2 pl-14 md:pl-4">
            <img src={logo} alt="" className="h-6 w-6 rounded" />
            <span className="font-bold text-[17px]" style={{ color: "#1f7f6e" }}>PharmaCI</span>
          </div>
        </header>

        {translating && (
          <div className="fixed inset-0 z-30 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center no-print">
            <Loader2 className="h-12 w-12 animate-spin" style={{ color: "#4ec2a7" }} />
            <p className="mt-4 font-medium" style={{ color: "#1f7f6e" }}>
              {lang === "it" ? "Traduzione in corso..." : "Translating..."}
            </p>
          </div>
        )}

        {translateErr && (
          <div className="max-w-6xl mx-auto px-4 pt-3 no-print">
            <div className="rounded-lg border border-red-300 bg-red-50 text-red-700 text-sm px-4 py-2">
              {lang === "it" ? "Traduzione non riuscita: " : "Translation failed: "}
              {translateErr}
            </div>
          </div>
        )}

        <ForceOpenContext.Provider value={forceOpen}>
        <main ref={mainRef} data-report-root className="max-w-6xl mx-auto px-4 py-6 space-y-4">
          <div id="exec-summary" style={{ scrollMarginTop: 72 }}>
            <ExecSummary data={data} />
          </div>
          <section
            id="visual-analysis"
            className="rounded-[16px] bg-white p-8"
            style={{ border: "1px solid rgba(78,194,167,0.2)", scrollMarginTop: 72 }}
          >
            <div
              className="text-[11px] font-bold uppercase mb-2"
              style={{ color: "#4ec2a7", letterSpacing: "0.1em" }}
            >
              {lang === "it" ? "Analisi Visiva" : "Visual Analysis"}
            </div>
            <div ref={chartsRef}>
              <Charts data={data} />
            </div>
          </section>
          <div id="pipeline" style={{ scrollMarginTop: 72 }}><PipelineSection data={data} /></div>
          <div id="approved" style={{ scrollMarginTop: 72 }}><ApprovedSection data={data} /></div>
          <div id="threat" style={{ scrollMarginTop: 72 }}><ThreatSection data={data} /></div>
          <div id="ttm" style={{ scrollMarginTop: 72 }}><TtmSection data={data} /></div>
          <div id="innov" style={{ scrollMarginTop: 72 }}><InnovSection data={data} /></div>
          <div id="endpoint" style={{ scrollMarginTop: 72 }}><EndpointSection data={data} /></div>
          <div id="literature" style={{ scrollMarginTop: 72 }}><PublicationsSection data={data} /></div>
          <div id="validation" style={{ scrollMarginTop: 72 }}>
            <ValidationSection data={data} validationError={validationError} />
          </div>
        </main>
        </ForceOpenContext.Provider>
        <footer className="text-center text-xs py-6 no-print" style={{ color: "rgba(31,127,110,0.5)" }}>
          PharmaCI
        </footer>
      </div>
    </div>
  );
}
