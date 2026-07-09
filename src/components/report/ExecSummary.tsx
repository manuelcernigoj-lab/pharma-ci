import { useI18n } from "@/lib/i18n";
import type { ReportData } from "@/lib/types";

export function ExecSummary({ data }: { data: ReportData }) {
  const { t } = useI18n();
  const threats = data.chart_data?.threat_scores_chart ?? data.chart_data?.threat_scores ?? [];
  const top = [...threats].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];

  // Bug fix: use stats.publications (total count from API), not top_publications.length
  const metrics = [
    { label: t("active_trials"),  value: data.pipeline?.total_active_trials ?? data.pipeline?.trials?.length ?? 0 },
    { label: t("approved_drugs"), value: data.approved_drugs?.length ?? 0 },
    { label: t("publications"),   value: data.stats?.publications ?? data.top_publications?.length ?? 0 },
    { label: t("top_threat"),     value: top?.drug ?? "—" },
  ];

  return (
    <section
      className="rounded-lg p-8"
      style={{ background: "var(--surface)", border: "1px solid var(--border-color)" }}
    >
      {/* Label */}
      <div
        className="text-[10px] font-bold uppercase mb-3 tracking-[0.12em]"
        style={{ color: "var(--neutral-mid)" }}
      >
        {t("exec_summary")}
      </div>

      {/* Summary text */}
      <p
        className="text-[15px] leading-[1.8] whitespace-pre-line"
        style={{ color: "var(--neutral-dark)" }}
      >
        {data.executive_summary || t("no_data")}
      </p>

      {/* Metric chips */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-md text-center px-4 py-4"
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border-color)",
            }}
          >
            <span
              className="block text-[28px] font-bold leading-tight"
              style={{ color: "var(--accent-primary)" }}
            >
              {m.value}
            </span>
            <span
              className="block text-[10px] uppercase mt-1.5 tracking-[0.08em]"
              style={{ color: "var(--neutral-mid)" }}
            >
              {m.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
