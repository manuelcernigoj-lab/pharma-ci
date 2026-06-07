import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import type { ReportData } from "@/lib/types";

/* ── Palette tokens (matching CSS vars) ─────────────────────── */
const C_ACCENT   = "#d97757";   // terracotta — primary / high threat
const C_CONTRAST = "#6a9bcc";   // steel blue — secondary / medium
const C_DARK     = "#141413";   // near-black — neutral / low
const C_MID      = "#b0aea5";   // warm grey  — grid, axis
const C_BG       = "#faf9f5";   // canvas

/* ── TTM assumption constants ───────────────────────────────── */
const TTM_ASSUMPTIONS = {
  en: [
    "Phase success probabilities based on BIO 2021 industry benchmarks (Phase 3 → approval: ~58%).",
    "FDA review timeline assumes standard 12-month PDUFA clock; Fast Track / Breakthrough designation reduces by 3–6 months.",
    "EMA approval typically lags FDA by 6–12 months based on rolling review practices.",
    "Italian AIFA reimbursement negotiation adds 12–18 months after EMA CHMP opinion.",
    "Timelines assume no major clinical hold, trial failure, or regulatory request for additional studies.",
  ],
  it: [
    "Probabilità di successo di fase basate sui benchmark di settore BIO 2021 (Fase 3 → approvazione: ~58%).",
    "I tempi di revisione FDA assumono il ciclo PDUFA standard di 12 mesi; la designazione Fast Track/Breakthrough riduce di 3–6 mesi.",
    "L'approvazione EMA segue tipicamente l'FDA con un ritardo di 6–12 mesi.",
    "La negoziazione del rimborso AIFA aggiunge 12–18 mesi dopo il parere CHMP dell'EMA.",
    "Le stime assumono assenza di clinical hold, fallimento del trial o richiesta di studi aggiuntivi.",
  ],
};

/* ── Helpers ─────────────────────────────────────────────────── */
type PubRow = { month: string; publications: number };

function fillMonths(rows: PubRow[]): PubRow[] {
  const valid = rows.filter((r) => /^\d{4}-\d{2}$/.test(r.month));
  if (!valid.length) return rows;
  const toIdx = (m: string) => { const [y, mo] = m.split("-").map(Number); return y * 12 + (mo - 1); };
  const fromIdx = (i: number) => { const y = Math.floor(i / 12); const mo = (i % 12) + 1; return `${y}-${String(mo).padStart(2, "0")}`; };
  const map = new Map(valid.map((r) => [r.month, r.publications ?? 0]));
  const idxs = valid.map((r) => toIdx(r.month));
  const [start, end] = [Math.min(...idxs), Math.max(...idxs)];
  const out: PubRow[] = [];
  for (let i = start; i <= end; i++) { const m = fromIdx(i); out.push({ month: m, publications: map.get(m) ?? 0 }); }
  return out;
}

function colorFor(c?: string): string {
  if (!c) return C_ACCENT;
  if (c === "red")    return C_ACCENT;
  if (c === "yellow") return C_CONTRAST;
  if (c === "green")  return C_DARK;
  return c;
}

/* ── Sub-components ─────────────────────────────────────────── */
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-md bg-white p-4"
      style={{ border: "1px solid var(--border-color)" }}
    >
      <h3
        className="text-[11px] font-bold uppercase tracking-[0.1em] mb-3"
        style={{ color: "var(--neutral-mid)" }}
      >
        {title}
      </h3>
      <div className="w-full h-72">{children}</div>
    </div>
  );
}

function AxisTick({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  return (
    <text x={x} y={y} dy={12} textAnchor="middle" fontSize={11} fill={C_MID}>
      {payload?.value}
    </text>
  );
}

function TTMAssumptionsBox({ lang }: { lang: "it" | "en" }) {
  const list = TTM_ASSUMPTIONS[lang];
  return (
    <div
      className="rounded-md p-4 mt-4 text-[12px] leading-relaxed"
      style={{
        background: "#faf9f5",
        border: "1px solid var(--border-color)",
      }}
    >
      <div
        className="text-[10px] font-bold uppercase tracking-[0.1em] mb-2"
        style={{ color: "var(--neutral-mid)" }}
      >
        {lang === "it" ? "Assunzioni metodologiche" : "Methodology assumptions"}
      </div>
      <ul className="space-y-1" style={{ color: "var(--neutral-dark)" }}>
        {list.map((line, i) => (
          <li key={i} className="flex gap-2">
            <span style={{ color: "var(--neutral-mid)", flexShrink: 0 }}>–</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Main Charts component ──────────────────────────────────── */
export function Charts({ data }: { data: ReportData }) {
  const { t, lang } = useI18n();
  const cd = data.chart_data ?? {};
  const phaseData   = cd.pipeline_by_phase_chart ?? [];
  const pubsData    = fillMonths(cd.publications_by_month_chart ?? []);
  const threatData  = cd.threat_scores_chart ?? (cd.threat_scores ?? []).map((t) => ({ ...t, color: "red" }));
  const timelineRaw = cd.timeline_chart ?? [];

  const [region, setRegion] = useState<"fda" | "ema" | "italy">("fda");

  /* global year range across all regions — stable X axis */
  const allYears: number[] = [];
  for (const row of timelineRaw) {
    for (const r of ["fda", "ema", "italy"] as const) {
      const s = row[`${r}_start`] as number | undefined;
      const e = row[`${r}_end`]   as number | undefined;
      if (s) allYears.push(s);
      if (e) allYears.push(e);
    }
  }
  const baseYear = allYears.length ? Math.min(...allYears) : 2026;
  const maxYear  = allYears.length ? Math.max(...allYears) : baseYear + 9;
  const span     = Math.max(maxYear - baseYear, 1);
  const yearTicks = Array.from({ length: span + 1 }, (_, i) => i);

  const timelineData = timelineRaw.map((row) => {
    const start = row[`${region}_start`] as number | undefined;
    const end   = row[`${region}_end`]   as number | undefined;
    const s = start ?? 0;
    const e = end   ?? s;
    return {
      drug:     row.drug,
      offset:   s ? s - baseYear : 0,
      duration: s && e ? Math.max(e - s, 0.4) : 0,
      label:    s && e ? (s === e ? `${s}` : `${s}–${e}`) : "—",
      hasData:  !!(s && e),
    };
  });

  const pubsTicks = pubsData.map((d) => d.month);

  return (
    <div className="space-y-4">
      {/* Row 1: Phase + Publications */}
      <div className="grid md:grid-cols-2 gap-4">
        <ChartCard title={t("trials_by_phase")}>
          <ResponsiveContainer>
            <BarChart data={phaseData} margin={{ top: 16, right: 8, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C_MID} strokeOpacity={0.25} vertical={false} />
              <XAxis dataKey="phase" tick={<AxisTick />} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C_MID, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "rgba(217,119,87,0.08)" }}
                contentStyle={{ border: "1px solid var(--border-color)", borderRadius: 4, fontSize: 12 }}
              />
              <Bar dataKey="trials" fill={C_ACCENT} radius={[3, 3, 0, 0]} maxBarSize={56} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t("pubs_over_time")}>
          <ResponsiveContainer>
            <BarChart data={pubsData} margin={{ top: 16, right: 8, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C_MID} strokeOpacity={0.25} vertical={false} />
              <XAxis
                dataKey="month"
                ticks={pubsTicks}
                interval={0}
                tick={{ fill: C_MID, fontSize: 9 }}
                angle={-55}
                textAnchor="end"
                height={68}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fill: C_MID, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "rgba(217,119,87,0.08)" }}
                contentStyle={{ border: "1px solid var(--border-color)", borderRadius: 4, fontSize: 12 }}
              />
              <Bar dataKey="publications" fill={C_CONTRAST} radius={[3, 3, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Threat score chart */}
      <div
        className="rounded-md bg-white p-4"
        style={{ border: "1px solid var(--border-color)" }}
      >
        <h3
          className="text-[11px] font-bold uppercase tracking-[0.1em] mb-3"
          style={{ color: "var(--neutral-mid)" }}
        >
          {t("threat_score")}
        </h3>
        <div className="flex flex-col md:flex-row gap-4">
          <div
            className="flex-1 min-w-0"
            style={{ height: Math.max(220, threatData.length * 44 + 60) }}
          >
            <ResponsiveContainer>
              <BarChart
                data={threatData}
                layout="vertical"
                margin={{ top: 8, right: 24, bottom: 5, left: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={C_MID} strokeOpacity={0.25} horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 10]}
                  tick={{ fill: C_MID, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="drug"
                  tick={{ fill: "#141413", fontSize: 12, fontWeight: 500 }}
                  width={140}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(217,119,87,0.08)" }}
                  contentStyle={{ border: "1px solid var(--border-color)", borderRadius: 4, fontSize: 12 }}
                />
                <Bar dataKey="score" radius={[0, 3, 3, 0]} maxBarSize={28}>
                  {threatData.map((d, i) => (
                    <Cell key={i} fill={colorFor(d.color)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div
            className="md:w-44 shrink-0 rounded-md p-3 text-[11px] self-start"
            style={{
              background: "#faf9f5",
              border: "1px solid var(--border-color)",
              color: "var(--neutral-dark)",
            }}
          >
            <div
              className="text-[10px] font-bold uppercase tracking-[0.1em] mb-2"
              style={{ color: "var(--neutral-mid)" }}
            >
              {t("legend")}
            </div>
            <ul className="space-y-2">
              {[
                { color: C_ACCENT,   label: t("threat_high"), desc: t("threat_high_desc") },
                { color: C_CONTRAST, label: t("threat_med"),  desc: t("threat_med_desc")  },
                { color: C_DARK,     label: t("threat_low"),  desc: t("threat_low_desc")  },
              ].map((item) => (
                <li key={item.label} className="flex items-start gap-2">
                  <span
                    className="mt-0.5 h-2.5 w-2.5 rounded-sm shrink-0"
                    style={{ background: item.color }}
                  />
                  <span>
                    <span className="font-semibold">{item.label}</span> — {item.desc}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Time-to-Market Gantt */}
      <div
        className="rounded-md bg-white p-4"
        style={{ border: "1px solid var(--border-color)" }}
      >
        <h3
          className="text-[11px] font-bold uppercase tracking-[0.1em] mb-3"
          style={{ color: "var(--neutral-mid)" }}
        >
          {t("ttm")}
        </h3>
        <div className="flex flex-col md:flex-row gap-4">
          <div
            className="flex-1 min-w-0"
            style={{ height: Math.max(220, timelineData.length * 44 + 60) }}
          >
            <ResponsiveContainer>
              <BarChart
                data={timelineData}
                layout="vertical"
                margin={{ top: 8, right: 24, bottom: 5, left: 8 }}
                barCategoryGap={8}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={C_MID} strokeOpacity={0.25} horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, span]}
                  ticks={yearTicks}
                  tickFormatter={(v) => `${baseYear + v}`}
                  tick={{ fill: C_MID, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="drug"
                  tick={{ fill: "#141413", fontSize: 12, fontWeight: 500 }}
                  width={140}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(_v: unknown, _n: unknown, p: { payload?: { label?: string } }) => [p?.payload?.label ?? "—", "Range"]}
                  contentStyle={{ border: "1px solid var(--border-color)", borderRadius: 4, fontSize: 12 }}
                />
                <Bar dataKey="offset"   stackId="a" fill="transparent" />
                <Bar dataKey="duration" stackId="a" fill={C_ACCENT} radius={[3, 3, 3, 3]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Region toggle */}
          <div className="md:w-44 shrink-0 self-start">
            <div
              className="inline-flex rounded-md p-1 gap-1"
              style={{ background: "#f0ede8" }}
            >
              {(["fda", "ema", "italy"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRegion(r)}
                  className="px-3 py-1 text-[11px] font-semibold rounded transition"
                  style={{
                    background: region === r ? "var(--accent-primary)" : "transparent",
                    color:      region === r ? "#ffffff" : "var(--neutral-mid)",
                  }}
                >
                  {r === "italy" ? "Italia" : r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Assumptions box */}
        <TTMAssumptionsBox lang={lang} />
      </div>
    </div>
  );
}
