import { useEffect, useMemo, useState } from "react";
import { FileText, Image as ImageIcon, X, Check, ChevronLeft, Download } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { svgToPng, downloadBlob } from "@/lib/chart-export";

type View = "menu" | "charts";
type Quality = "standard" | "high";

interface ChartItem {
  id: number;
  title: string;
  svg: SVGSVGElement;
  thumb: string; // serialized svg data url
  width: number;
  height: number;
}

export function ExportModal({
  open,
  onClose,
  chartsRoot,
  onDownloadPdf,
  pdfBusy,
}: {
  open: boolean;
  onClose: () => void;
  chartsRoot: HTMLElement | null;
  onDownloadPdf: () => Promise<void>;
  pdfBusy: boolean;
}) {
  const { lang } = useI18n();
  const T = (en: string, it: string) => (lang === "it" ? it : en);
  const [view, setView] = useState<View>("menu");
  const [charts, setCharts] = useState<ChartItem[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [quality, setQuality] = useState<Quality>("high");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!open) {
      setView("menu");
    }
  }, [open]);

  // Collect chart SVGs lazily when entering charts view
  useEffect(() => {
    if (view !== "charts" || !chartsRoot) return;
    const svgs = Array.from(
      chartsRoot.querySelectorAll("svg.recharts-surface")
    ) as SVGSVGElement[];
    const items: ChartItem[] = svgs.map((svg, i) => {
      // Title: nearest preceding chart card heading
      const card = svg.closest(".rounded-xl");
      const heading = card?.querySelector("h3")?.textContent ?? `Chart ${i + 1}`;
      const w = svg.clientWidth || 600;
      const h = svg.clientHeight || 400;
      const clone = svg.cloneNode(true) as SVGSVGElement;
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      if (!clone.getAttribute("viewBox")) {
        clone.setAttribute("viewBox", `0 0 ${w} ${h}`);
      }
      const xml = new XMLSerializer().serializeToString(clone);
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

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(charts.map((c) => c.id)));
  };
  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExportCharts = async () => {
    setExporting(true);
    try {
      // 150 ppi vs 300 ppi at a base 6.4" wide chart -> 960 vs 1920
      const baseW = quality === "high" ? 1920 : 960;
      for (const c of charts) {
        if (!selected.has(c.id)) continue;
        const ratio = c.height / Math.max(c.width, 1);
        const targetH = Math.round(baseW * ratio);
        const blob = await svgToPng(c.svg, baseW, targetH);
        if (blob) {
          const safe = c.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
          downloadBlob(blob, `pharmaci-${safe}-${quality}.png`);
        }
      }
    } finally {
      setExporting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 no-print flex items-center justify-center">
      {/* Backdrop with blur */}
      <button
        type="button"
        aria-label={T("Close", "Chiudi")}
        onClick={onClose}
        className="absolute inset-0 bg-black/30 backdrop-blur-md"
      />

      <div
        className="relative bg-white rounded-2xl shadow-2xl w-[min(640px,92vw)] max-h-[88vh] flex flex-col"
        style={{ border: "1px solid rgba(78,194,167,0.25)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-5 py-4 border-b" style={{ borderColor: "rgba(78,194,167,0.15)" }}>
          {view === "charts" && (
            <button
              type="button"
              onClick={() => setView("menu")}
              className="p-1.5 rounded-md hover:bg-[rgba(78,194,167,0.1)]"
              aria-label={T("Back", "Indietro")}
              style={{ color: "#1f7f6e" }}
            >
              <ChevronLeft size={18} />
            </button>
          )}
          <h2 className="text-[17px] font-bold flex-1 m-0" style={{ color: "#1f7f6e" }}>
            {view === "menu"
              ? T("Export", "Esporta")
              : T("Download charts", "Scarica grafici")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-[rgba(78,194,167,0.1)]"
            aria-label={T("Close", "Chiudi")}
            style={{ color: "#1f7f6e" }}
          >
            <X size={18} />
          </button>
        </div>

        {view === "menu" && (
          <div className="p-5 grid sm:grid-cols-2 gap-3">
            <ExportCard
              Icon={FileText}
              title={T("Download full report", "Scarica report completo")}
              desc={T("A formatted PDF including all sections, tables and charts.", "PDF formattato con tutte le sezioni, tabelle e grafici.")}
              busy={pdfBusy}
              onClick={async () => {
                await onDownloadPdf();
              }}
            />
            <ExportCard
              Icon={ImageIcon}
              title={T("Download charts", "Scarica grafici")}
              desc={T("Choose which charts to export as PNG and pick quality.", "Scegli quali grafici esportare in PNG e seleziona la qualità.")}
              onClick={() => setView("charts")}
            />
          </div>
        )}

        {view === "charts" && (
          <>
            <div className="px-5 py-3 flex flex-wrap items-center gap-2 border-b" style={{ borderColor: "rgba(78,194,167,0.15)" }}>
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs font-semibold px-3 py-1.5 rounded-md"
                style={{
                  background: "rgba(78,194,167,0.12)",
                  color: "#1f7f6e",
                  border: "1px solid rgba(78,194,167,0.3)",
                }}
              >
                {allSelected ? T("Deselect all", "Deseleziona tutto") : T("Select all", "Seleziona tutto")}
              </button>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs font-medium" style={{ color: "rgba(31,127,110,0.7)" }}>
                  {T("Export quality", "Qualità export")}:
                </span>
                <div className="inline-flex rounded-md p-0.5" style={{ background: "rgba(78,194,167,0.12)" }}>
                  {(["standard", "high"] as Quality[]).map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuality(q)}
                      className="text-xs font-semibold px-3 py-1 rounded"
                      style={{
                        background: quality === q ? "#1f7f6e" : "transparent",
                        color: quality === q ? "white" : "#1f7f6e",
                      }}
                    >
                      {q === "standard"
                        ? T("Standard (150 ppi)", "Standard (150 ppi)")
                        : T("High resolution (300 ppi)", "Alta risoluzione (300 ppi)")}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 overflow-y-auto grid sm:grid-cols-2 gap-3" style={{ maxHeight: "55vh" }}>
              {charts.length === 0 && (
                <p className="text-sm col-span-full text-center py-8" style={{ color: "rgba(31,127,110,0.6)" }}>
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
                    className="relative rounded-xl p-3 text-left transition"
                    style={{
                      background: "#f4fffb",
                      border: `2px solid ${isSel ? "#4ec2a7" : "rgba(78,194,167,0.2)"}`,
                    }}
                  >
                    <div
                      className="absolute top-2 right-2 h-6 w-6 rounded-full flex items-center justify-center"
                      style={{
                        background: isSel ? "#1f7f6e" : "white",
                        border: `1.5px solid ${isSel ? "#1f7f6e" : "rgba(78,194,167,0.5)"}`,
                      }}
                    >
                      {isSel && <Check size={14} color="white" strokeWidth={3} />}
                    </div>
                    <div className="text-xs font-semibold mb-2 pr-8 truncate" style={{ color: "#1f7f6e" }}>
                      {c.title}
                    </div>
                    <div
                      className="rounded-md bg-white flex items-center justify-center overflow-hidden"
                      style={{ aspectRatio: "16/10", border: "1px solid rgba(78,194,167,0.15)" }}
                    >
                      <img src={c.thumb} alt={c.title} className="max-w-full max-h-full" />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="px-5 py-4 border-t flex items-center justify-end gap-2" style={{ borderColor: "rgba(78,194,167,0.15)" }}>
              <span className="text-xs mr-auto" style={{ color: "rgba(31,127,110,0.7)" }}>
                {selected.size} / {charts.length} {T("selected", "selezionati")}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="text-sm font-semibold px-4 py-2 rounded-md"
                style={{ color: "#1f7f6e" }}
              >
                {T("Cancel", "Annulla")}
              </button>
              <button
                type="button"
                onClick={handleExportCharts}
                disabled={exporting || selected.size === 0}
                className="text-sm font-semibold px-4 py-2 rounded-md inline-flex items-center gap-2 disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #4ec2a7 0%, #1f7f6e 100%)",
                  color: "white",
                }}
              >
                <Download size={14} />
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
  Icon: React.ComponentType<{ size?: number; className?: string }>;
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
      className="text-left rounded-xl p-4 transition hover:shadow-md disabled:opacity-60"
      style={{
        background: "#f4fffb",
        border: "1px solid rgba(78,194,167,0.25)",
      }}
    >
      <div
        className="h-10 w-10 rounded-lg flex items-center justify-center mb-3"
        style={{ background: "linear-gradient(135deg, #4ec2a7 0%, #1f7f6e 100%)" }}
      >
        <Icon size={20} className="text-white" />
      </div>
      <div className="font-semibold text-[15px] mb-1" style={{ color: "#1f7f6e" }}>
        {busy ? "Working..." : title}
      </div>
      <div className="text-xs leading-relaxed" style={{ color: "rgba(31,127,110,0.65)" }}>
        {desc}
      </div>
    </button>
  );
}
