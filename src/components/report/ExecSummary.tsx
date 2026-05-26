import { useI18n } from "@/lib/i18n";
import type { ReportData } from "@/lib/types";

export function ExecSummary({ data }: { data: ReportData }) {
  const { t } = useI18n();
  const threats = data.chart_data?.threat_scores_chart ?? data.chart_data?.threat_scores ?? [];
  const top = [...threats].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
  const metrics = [
    { label: t("active_trials"), value: data.pipeline?.total_active_trials ?? data.pipeline?.trials?.length ?? 0 },
    { label: t("approved_drugs"), value: data.approved_drugs?.length ?? 0 },
    { label: t("publications"), value: data.top_publications?.length ?? 0 },
    { label: t("top_threat"), value: top?.drug ?? "—" },
  ];
  return (
    <section
      className="rounded-[16px] bg-white p-8"
      style={{ border: "1px solid rgba(78,194,167,0.2)" }}
    >
      <div
        className="text-[11px] font-bold uppercase mb-2"
        style={{ color: "#4ec2a7", letterSpacing: "0.1em" }}
      >
        {t("exec_summary")}
      </div>
      <p className="text-[16px] leading-[1.8] whitespace-pre-line" style={{ color: "#1f7f6e" }}>
        {data.executive_summary || t("no_data")}
      </p>
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="exec-chip rounded-[12px] text-center px-5 py-3.5"
            style={{
              background: "#d3f7ec",
              border: "1px solid rgba(78,194,167,0.2)",
              transition: "all 0.2s ease",
            }}
          >
            <span className="block text-[26px] font-bold leading-tight" style={{ color: "#1f7f6e" }}>
              {m.value}
            </span>
            <span
              className="block text-[11px] uppercase mt-1"
              style={{ color: "rgba(31,127,110,0.55)", letterSpacing: "0.06em" }}
            >
              {m.label}
            </span>
          </div>
        ))}
      </div>
      <style>{`
        .exec-chip:hover { background: #9fe5d0; transform: translateY(-2px); }
      `}</style>
    </section>
  );
}
