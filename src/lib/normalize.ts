import type { ReportData } from "./types";

// Raw payload returned by the n8n webhook. Field names differ from the
// internal ReportData shape used by the UI; this module reconciles them.
type Raw = Record<string, any>;

export function normalizeReport(input: unknown): ReportData | null {
  if (!input) return null;
  const root: Raw | undefined = Array.isArray(input)
    ? (input[0] as Raw | undefined)
    : (input as Raw);
  if (!root || typeof root !== "object") return null;

  const pipeline = root.pipeline
    ? {
        total_active_trials: root.pipeline.total_active_trials,
        trials: (root.pipeline.trials ?? []).map((tr: Raw) => ({
          nct_id: tr.nct_id,
          title: tr.title,
          phase: tr.phase,
          status: tr.status,
          sponsor: tr.sponsor,
          // API uses primary_outcome
          primary_endpoint: tr.primary_endpoint ?? tr.primary_outcome,
          completion_date: tr.completion_date,
          strategic_notes: tr.strategic_notes,
        })),
      }
    : undefined;

  const ta = root.threat_assessment
    ? {
        summary: root.threat_assessment.summary,
        threats: (root.threat_assessment.threats ?? []).map((r: Raw) => ({
          drug: r.drug,
          sponsor: r.sponsor,
          phase: r.phase,
          threat_score: r.threat_score,
          // API uses threat_rationale
          rationale: r.rationale ?? r.threat_rationale,
          key_differentiator: r.key_differentiator,
        })),
      }
    : undefined;

  // API uses time_to_market_forecast.assets with estimated_* fields
  const ttmRaw = root.time_to_market ?? root.time_to_market_forecast;
  const ttm = ttmRaw
    ? {
        methodology_note: ttmRaw.methodology_note,
        forecasts: (ttmRaw.forecasts ?? ttmRaw.assets ?? []).map((r: Raw) => ({
          drug: r.drug,
          sponsor: r.sponsor,
          phase: r.phase ?? r.current_phase,
          success_probability:
            r.success_probability ?? r.phase_success_probability,
          fda: r.fda ?? r.estimated_fda_approval,
          ema: r.ema ?? r.estimated_ema_approval,
          italy: r.italy ?? r.estimated_italy_reimbursement,
        })),
      }
    : undefined;

  const innov = root.aifa_innovativity
    ? {
        methodology_note: root.aifa_innovativity.methodology_note,
        assets: (root.aifa_innovativity.assets ?? []).map((a: Raw) => ({
          drug: a.drug,
          unmet_need: a.unmet_need ?? a.unmet_need_score,
          added_value: a.added_value ?? a.added_value_score,
          evidence_quality: a.evidence_quality ?? a.evidence_quality_score,
          innovativity_probability: a.innovativity_probability,
          rationale: a.rationale,
        })),
      }
    : undefined;

  // API uses endpoint_benchmarking.competitors
  const eb = root.endpoint_benchmarking
    ? {
        data_note: root.endpoint_benchmarking.data_note,
        rows: (
          root.endpoint_benchmarking.rows ??
          root.endpoint_benchmarking.competitors ??
          []
        ).map((r: Raw) => ({
          drug: r.drug,
          sponsor: r.sponsor,
          pfs_months: r.pfs_months,
          os_months: r.os_months,
          orr_percent: r.orr_percent,
          study_context: r.study_context,
          source_pmid:
            r.source_pmid && r.source_pmid !== "null" ? r.source_pmid : undefined,
        })),
      }
    : undefined;

  const pubs = (root.top_publications ?? []).map((p: Raw) => ({
    title: p.title,
    authors: p.authors,
    journal: p.journal,
    date: p.date,
    relevance_note: p.relevance_note,
    pmid: p.pmid,
  }));

  return {
    executive_summary: root.executive_summary,
    pipeline,
    approved_drugs: root.approved_drugs ?? [],
    threat_assessment: ta,
    time_to_market: ttm,
    aifa_innovativity: innov,
    endpoint_benchmarking: eb,
    top_publications: pubs,
    validation: root.validation,
    chart_data: root.chart_data,
  };
}
