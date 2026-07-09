import { useEffect, useMemo, useState } from "react";
import { FileText, Image as ImageIcon, X, Check, ChevronLeft, Download } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { svgToPng, downloadBlob } from "@/lib/chart-export";

type View    = "menu" | "charts";
type Quality = "standard" | "high";

interface ChartItem {
  id:    number;
  title: string;
  svg:   SVGSVGElement;
  thumb: string;
  width: number;
  height:number;
}

/* ── Force exported charts to always render in the LIGHT palette ──
   Chart bars/axes/text use var(--token) so they follow the app's
   live theme on screen — but a cloned SVG serialized to a data URI
   (thumbnail) or drawn to an off-screen canvas (PNG export) has no
   access to the page's CSS custom properties, so var() would resolve
   to nothing there. This walks the clone and bakes in fixed LIGHT
   hex values, which both fixes that and keeps exported images
   light-themed even when the app itself is in dark mode. */
const LIGHT_THEME_MAP: Record<string, string> = {
  "--accent-primary":  "#d97757",
  "--chart-neutral-2": "#474747",
  "--chart-neutral-3": "#797979",
  "--neutral-dark":    "#141413",
  "--neutral-mid":     "#b0aea5",
  "--border-color":    "#e2e0db",
  "--surface":         "#ffffff",
  "--bg":              "#faf9f5",
};
const VAR_PATTERN = /var\((--[a-z0-9-]+)(?:\s*,\s*[^)]+)?\)/gi;

function forceLightTheme(svg: SVGSVGElement): void {
  const resolve = (value: string) =>
    value.replace(VAR_PATTERN, (_m, token: string) => LIGHT_THEME_MAP[token] ?? "#000000");

  const walk = (el: Element) => {
    for (const attr of ["fill", "stroke", "color"]) {
      const v = el.getAttribute(attr);
      if (v && v.includes("var(")) el.setAttribute(attr, resolve(v));
    }
    const styleAttr = el.getAttribute("style");
    if (styleAttr && styleAttr.includes("var(")) el.setAttribute("style", resolve(styleAttr));
    for (const child of Array.from(el.children)) walk(child);
  };
  walk(svg);
}

export function ExportModal({
  open, onClose, chartsRoot, onDownloadPdf, pdfBusy,
}: {
  open: boolean;
  onClose: () => void;
  chartsRoot: HTMLElement | null;
  onDownloadPdf: () => Promise<void>;
  pdfBusy: boolean;
}) {
  const { lang } = useI18n();
  const T = (en: string, it: string) => (lang === "it" ? it : en);

  const [view,      setView]      = useState<View>("menu");
  const [charts,    setCharts]    = useState<ChartItem[]>([]);
  const [selected,  setSelected]  = useState<Set<number>>(new Set());
  const [quality,   setQuality]   = useState<Quality>("high");
  const [exporting, setExporting] = useState(false);

  useEffect(() => { if (!open) setView("menu"); }, [open]);

  /* Collect SVGs when entering chart view */
  useEffect(() => {
    if (view !== "charts" || !chartsRoot) return;
    const svgs = Array.from(chartsRoot.querySelectorAll("svg.recharts-surface")) as SVGSVGElement[];
    const items: ChartItem[] = svgs.map((svg, i) => {
      const card    = svg.closest(".rounded-md");
      const heading = card?.querySelector("h3")?.textContent ?? `Chart ${i + 1}`;
      const w = svg.clientWidth  || 600;
      const h = svg.clientHeight || 400;
      const clone = svg.cloneNode(true) as SVGSVGElement;
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      if (!clone.getAttribute("viewBox")) clone.setAttribute("viewBox", `0 0 ${w} ${h}`);
      forceLightTheme(clone);
      const xml   = new XMLSerializer().serializeToString(clone);
      const thumb = `data:image/svg+xml;utf8,${encodeURIComponent(xml)}`;
      return { id: i, title: heading, svg, thumb, width: w, height: h };
    });
    setCharts(items);
    setSelected(new Set(items.map((c) => c.id)));
  }, [view, chartsRoot]);

  const allSelected = useMemo(
    () => charts.length > 0 && selected.size === charts.length,
    [charts, selected]
  );

  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(charts.map((c) => c.id)));
  const toggleOne = (id: number) =>
    setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const handleExportCharts = async () => {
    setExporting(true);
    try {
      const baseW = quality === "high" ? 1920 : 960;
      for (const c of charts) {
        if (!selected.has(c.id)) continue;
        const ratio = c.height / Math.max(c.width, 1);
        const blob  = await svgToPng(c.svg, baseW, Math.round(baseW * ratio));
        if (blob) downloadBlob(blob, `pharmaci-${c.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${quality}.png`);
      }
    } finally { setExporting(false); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 no-print flex items-center justify-center">
      {/* Backdrop */}
      <button
        type="button"
        aria-label={T("Close", "Chiudi")}
        onClick={onClose}
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
      />

      <div
        className="relative rounded-md shadow-xl w-[min(600px,92vw)] max-h-[88vh] flex flex-col"
        style={{ background: "var(--surface)", border: "1px solid var(--border-color)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center gap-2 px-5 py-4"
          style={{ borderBottom: "1px solid var(--border-color)" }}
        >
          {view === "charts" && (
            <button
              type="button"
              onClick={() => setView("menu")}
              className="p-1.5 rounded transition-colors"
              style={{ color: "var(--neutral-mid)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--neutral-dark)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--neutral-mid)"; }}
            >
              <ChevronLeft size={16} />
            </button>
          )}
          <h2 className="text-[15px] font-bold flex-1 m-0" style={{ color: "var(--neutral-dark)" }}>
            {view === "menu" ? T("Export", "Esporta") : T("Download charts", "Scarica grafici")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded transition-colors"
            style={{ color: "var(--neutral-mid)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--neutral-dark)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--neutral-mid)"; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Menu view */}
        {view === "menu" && (
          <div className="p-5 grid sm:grid-cols-2 gap-3">
            <ExportCard
              Icon={FileText}
              title={T("Download full report", "Scarica report completo")}
              desc={T("A formatted PDF with all sections, tables and charts.", "PDF formattato con tutte le sezioni, tabelle e grafici.")}
              busy={pdfBusy}
              onClick={onDownloadPdf}
            />
            <ExportCard
              Icon={ImageIcon}
              title={T("Download charts", "Scarica grafici")}
              desc={T("Export charts as PNG at standard or high resolution.", "Esporta i grafici in PNG a risoluzione standard o alta.")}
              onClick={() => setView("charts")}
            />
          </div>
        )}

        {/* Charts view */}
        {view === "charts" && (
          <>
            <div
              className="px-5 py-3 flex flex-wrap items-center gap-2"
              style={{ borderBottom: "1px solid var(--border-color)" }}
            >
              <button
                type="button"
                onClick={toggleAll}
                className="text-[11px] font-semibold px-3 py-1.5 rounded"
                style={{
                  background: "var(--muted)",
                  color: "var(--neutral-dark)",
                  border: "1px solid var(--border-color)",
                }}
              >
                {allSelected ? T("Deselect all", "Deseleziona tutto") : T("Select all", "Seleziona tutto")}
              </button>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-[11px]" style={{ color: "var(--neutral-mid)" }}>
                  {T("Quality", "Qualità")}:
                </span>
                <div
                  className="inline-flex rounded p-0.5 gap-0.5"
                  style={{ background: "var(--muted)" }}
                >
                  {(["standard", "high"] as Quality[]).map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuality(q)}
                      className="text-[10px] font-semibold px-2.5 py-1 rounded transition-colors"
                      style={{
                        background: quality === q ? "var(--accent-primary)" : "transparent",
                        color:      quality === q ? "var(--primary-foreground)" : "var(--neutral-mid)",
                      }}
                    >
                      {q === "standard" ? "150 ppi" : "300 ppi"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div
              className="p-4 overflow-y-auto grid sm:grid-cols-2 gap-3"
              style={{ maxHeight: "55vh" }}
            >
              {charts.length === 0 && (
                <p className="text-sm col-span-full text-center py-8" style={{ color: "var(--neutral-mid)" }}>
                  {T("No charts available.", "Nessun grafico disponibile.")}
                </p>
              )}
              {charts.map((c) => {
                const isSel = selected.has(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleOne(c.id)}
                    className="relative rounded-md p-3 text-left transition-all"
                    style={{
                      background: "var(--bg)",
                      border: `2px solid ${isSel ? "var(--accent-primary)" : "var(--border-color)"}`,
                    }}
                  >
                    {/* Check indicator */}
                    <div
                      className="absolute top-2 right-2 h-5 w-5 rounded-full flex items-center justify-center"
                      style={{
                        background: isSel ? "var(--accent-primary)" : "var(--surface)",
                        border: `1.5px solid ${isSel ? "var(--accent-primary)" : "var(--border-color)"}`,
                      }}
                    >
                      {isSel && <Check size={11} color="var(--primary-foreground)" strokeWidth={3} />}
                    </div>
                    <div
                      className="text-[11px] font-semibold mb-2 pr-7 truncate"
                      style={{ color: "var(--neutral-dark)" }}
                    >
                      {c.title}
                    </div>
                    {/* Thumbnail: intentionally fixed to light (not var(--surface)) — the
                        chart content itself is forced to the light palette on export
                        (see forceLightTheme), so the preview should visually match. */}
                    <div
                      className="rounded overflow-hidden flex items-center justify-center"
                      style={{ aspectRatio: "16/10", border: "1px solid var(--border-color)", background: "#ffffff" }}
                    >
                      <img src={c.thumb} alt={c.title} className="max-w-full max-h-full" />
                    </div>
                  </button>
                );
              })}
            </div>

            <div
              className="px-5 py-4 flex items-center justify-end gap-2"
              style={{ borderTop: "1px solid var(--border-color)" }}
            >
              <span className="text-[11px] mr-auto" style={{ color: "var(--neutral-mid)" }}>
                {selected.size} / {charts.length} {T("selected", "selezionati")}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="text-[12px] font-semibold px-4 py-2 rounded"
                style={{ color: "var(--neutral-mid)" }}
              >
                {T("Cancel", "Annulla")}
              </button>
              <button
                type="button"
                onClick={handleExportCharts}
                disabled={exporting || selected.size === 0}
                className="text-[12px] font-semibold px-4 py-2 rounded inline-flex items-center gap-2 disabled:opacity-50"
                style={{ background: "var(--accent-primary)", color: "var(--primary-foreground)" }}
              >
                <Download size={13} />
                {exporting ? T("Exporting...", "Esportazione...") : T("Export", "Esporta")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ExportCard({
  Icon, title, desc, onClick, busy,
}: {
  Icon: React.ComponentType<{ size?: number }>;
  title: string;
  desc: string;
  onClick: () => void | Promise<void>;
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="text-left rounded-md p-4 transition-shadow hover:shadow-sm disabled:opacity-60"
      style={{ background: "var(--bg)", border: "1px solid var(--border-color)" }}
    >
      <div
        className="h-9 w-9 rounded flex items-center justify-center mb-3"
        style={{ background: "var(--accent-primary)", color: "var(--primary-foreground)" }}
      >
        <Icon size={18} />
      </div>
      <div className="font-semibold text-[13px] mb-1" style={{ color: "var(--neutral-dark)" }}>
        {busy ? "Working..." : title}
      </div>
      <div className="text-[11px] leading-relaxed" style={{ color: "var(--neutral-mid)" }}>
        {desc}
      </div>
    </button>
  );
}
