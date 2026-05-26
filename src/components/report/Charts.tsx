import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell,
} from "recharts";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import type { ReportData } from "@/lib/types";

const ACCENT = "#4ec2a7";
const DARK = "#1f7f6e";
const LIGHT = "#9fe5d0";

type PubRow = { month: string; publications: number };

function fillMonths(rows: PubRow[]): PubRow[] {
  const valid = rows.filter((r) => /^\d{4}-\d{2}$/.test(r.month));
  if (valid.length === 0) return rows;
  const toIdx = (m: string) => {
    const [y, mo] = m.split("-").map(Number);
    return y * 12 + (mo - 1);
  };
  const fromIdx = (i: number) => {
    const y = Math.floor(i / 12);
    const mo = (i % 12) + 1;
    return `${y}-${String(mo).padStart(2, "0")}`;
  };
  const map = new Map(valid.map((r) => [r.month, r.publications ?? 0]));
  const idxs = valid.map((r) => toIdx(r.month));
  const start = Math.min(...idxs);
  const end = Math.max(...idxs);
  const out: PubRow[] = [];
  for (let i = start; i <= end; i++) {
    const m = fromIdx(i);
    out.push({ month: m, publications: map.get(m) ?? 0 });
  }
  return out;
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-background border border-border p-4">
      <h3 className="text-sm font-semibold text-accent-dark mb-3">{title}</h3>
      <div className="w-full h-72">{children}</div>
    </div>
  );
}

export function Charts({ data }: { data: ReportData }) {
  const { t } = useI18n();
  const cd = data.chart_data ?? {};
  const phaseData = cd.pipeline_by_phase_chart ?? [];
  const pubsRaw = cd.publications_by_month_chart ?? [];
  const pubsData = fillMonths(pubsRaw);
  const threatData = cd.threat_scores_chart ?? (cd.threat_scores ?? []).map((t) => ({ ...t, color: "#4ec2a7" }));
  const timelineRaw = cd.timeline_chart ?? [];

  const [region, setRegion] = useState<"fda" | "ema" | "italy">("fda");

  // Compute global year range across ALL regions so the X axis is stable
  // when the user switches between FDA / EMA / Italia.
  const allYears: number[] = [];
  for (const row of timelineRaw) {
    for (const r of ["fda", "ema", "italy"] as const) {
      const s = row[`${r}_start`] as number | undefined;
      const e = row[`${r}_end`] as number | undefined;
      if (s) allYears.push(s);
      if (e) allYears.push(e);
    }
  }
  const baseYear = allYears.length ? Math.min(...allYears) : 2026;
  const maxYear = allYears.length ? Math.max(...allYears) : baseYear + 9;
  const span = Math.max(maxYear - baseYear, 1);
  const yearTicks = Array.from({ length: span + 1 }, (_, i) => i);

  // Build timeline: each row -> [start, end-start]
  const timelineData = timelineRaw.map((row) => {
    const start = row[`${region}_start`] as number | undefined;
    const end = row[`${region}_end`] as number | undefined;
    const s = start ?? 0;
    const e = end ?? s;
    return {
      drug: row.drug,
      offset: s ? s - baseYear : 0,
      duration: s && e ? Math.max(e - s, 0.4) : 0,
      label: s && e ? (s === e ? `${s}` : `${s}–${e}`) : "—",
      hasData: !!(s && e),
    };
  });

  const colorFor = (c?: string) => {
    if (!c) return ACCENT;
    if (c === "red") return "#e05252";
    if (c === "yellow") return "#e0b452";
    if (c === "green") return ACCENT;
    return c;
  };

  // Show every month label in the range
  const pubsTicks = pubsData.map((d) => d.month);

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <ChartCard title={t("trials_by_phase")}>
          <ResponsiveContainer>
            <BarChart data={phaseData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d3f7ec" />
              <XAxis dataKey="phase" tick={{ fill: DARK, fontSize: 12 }} />
              <YAxis tick={{ fill: DARK, fontSize: 12 }} allowDecimals={false} />
              <Tooltip cursor={{ fill: "#d3f7ec80" }} />
              <Bar dataKey="trials" fill={ACCENT} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title={t("pubs_over_time")}>
          <ResponsiveContainer>
            <BarChart data={pubsData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d3f7ec" />
              <XAxis
                dataKey="month"
                ticks={pubsTicks}
                interval={0}
                tick={{ fill: DARK, fontSize: 10 }}
                angle={-60}
                textAnchor="end"
                height={70}
              />
              <YAxis tick={{ fill: DARK, fontSize: 12 }} allowDecimals={false} />
              <Tooltip cursor={{ fill: "#d3f7ec80" }} />
              <Bar dataKey="publications" fill={ACCENT} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="rounded-xl bg-background border border-border p-4">
        <h3 className="text-sm font-semibold text-accent-dark mb-3">{t("threat_score")}</h3>
        <div className="flex flex-col md:flex-row gap-4">
          <div
            className="flex-1 min-w-0"
            style={{ height: Math.max(288, threatData.length * 44 + 60) }}
          >
            <ResponsiveContainer>
              <BarChart
                data={threatData}
                layout="vertical"
                margin={{ top: 10, right: 20, bottom: 5, left: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#d3f7ec" />
                <XAxis type="number" domain={[0, 10]} tick={{ fill: DARK, fontSize: 12 }} />
                <YAxis type="category" dataKey="drug" tick={{ fill: DARK, fontSize: 12 }} width={140} />
                <Tooltip cursor={{ fill: "#d3f7ec80" }} />
                <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                  {threatData.map((d, i) => (
                    <Cell key={i} fill={colorFor(d.color)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="md:w-48 shrink-0 rounded-lg bg-surface/60 border border-border p-3 text-xs text-accent-dark self-start">
            <div className="font-semibold mb-2">{t("legend")}</div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-3 w-3 rounded-sm shrink-0" style={{ background: "#e05252" }} />
                <span><span className="font-medium">{t("threat_high")}</span> — {t("threat_high_desc")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-3 w-3 rounded-sm shrink-0" style={{ background: "#e0b452" }} />
                <span><span className="font-medium">{t("threat_med")}</span> — {t("threat_med_desc")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-3 w-3 rounded-sm shrink-0" style={{ background: ACCENT }} />
                <span><span className="font-medium">{t("threat_low")}</span> — {t("threat_low_desc")}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-background border border-border p-4">
        <h3 className="text-sm font-semibold text-accent-dark mb-3">{t("ttm")}</h3>
        <div className="flex flex-col md:flex-row gap-4">
          <div
            className="flex-1 min-w-0"
            style={{ height: Math.max(288, timelineData.length * 44 + 60) }}
          >
            <ResponsiveContainer>
              <BarChart
                data={timelineData}
                layout="vertical"
                margin={{ top: 10, right: 20, bottom: 5, left: 10 }}
                barCategoryGap={8}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#d3f7ec" />
                <XAxis
                  type="number"
                  domain={[0, span]}
                  ticks={yearTicks}
                  tickFormatter={(v) => `${baseYear + v}`}
                  tick={{ fill: DARK, fontSize: 12 }}
                />
                <YAxis type="category" dataKey="drug" tick={{ fill: DARK, fontSize: 12 }} width={140} />
                <Tooltip formatter={(_v: unknown, _n: unknown, p: { payload?: { label?: string } }) => [p?.payload?.label ?? "—", "Range"]} />
                <Bar dataKey="offset" stackId="a" fill="transparent" />
                <Bar dataKey="duration" stackId="a" fill={ACCENT} radius={[4, 4, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="md:w-48 shrink-0 self-start">
            <div className="inline-flex flex-wrap rounded-lg bg-surface p-1">
              {(["fda", "ema", "italy"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRegion(r)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                    region === r ? "bg-primary text-primary-foreground" : "text-accent-dark"
                  }`}
                >
                  {r === "italy" ? "Italia" : r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { LIGHT };
