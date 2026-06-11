import type { ReportData } from "./types";

// Raw payload from n8n webhook — field names may differ from internal ReportData shape.
type Raw = Record<string, unknown>;

export function normalizeReport(input: unknown): ReportData | null {
  if (!input) return null;
  const root: Raw | undefined = Array.isArray(input)
    ? (input[0] as Raw | undefined)
    : (input as Raw);
  if (!root || typeof root !== "object") return null;

  /* ── Pipeline ──────────────────────────────────────────────── */
  const pipelineRaw = root.pipeline as Raw | undefined;
  const pipeline = pipelineRaw
    ? {
      total_active_trials: pipelineRaw.total_active_trials as number | undefined,
      trials: ((pipelineRaw.trials ?? []) as Raw[]).map((tr) => ({
        nct_id: tr.nct_id as string | undefined,
        title: tr.title as string | undefined,
        phase: tr.phase as string | undefined,
        status: tr.status as string | undefined,
        sponsor: tr.sponsor as string | undefined,
        // API uses primary_outcome, UI uses primary_endpoint
        primary_endpoint: (tr.primary_endpoint ?? tr.primary_outcome) as string | undefined,
        completion_date: tr.completion_date as string | undefined,
        strategic_notes: tr.strategic_notes as string | undefined,
      })),
    }
    : undefined;

  /* ── Approved drugs — FDA ──────────────────────────────────── */
  const fdaDrugs = ((root.approved_drugs ?? []) as Raw[]).map((d) => ({
    brand_name: d.brand_name as string | undefined,
    generic_name: d.generic_name as string | undefined,
    manufacturer: d.manufacturer as string | undefined,
    indication_summary: d.indication_summary as string | undefined,
    agency: (d.agency as "FDA" | "EMA" | "BOTH" | undefined) ?? "FDA",
  }));

  /* ── Approved drugs — EMA (optional separate field) ────────── */
  // n8n returns ema_approved_drugs as a separate array.
  // We merge them here with agency = "EMA".
  const emaDrugsRaw = (root.ema_approved_drugs ?? []) as Raw[];
  const emaDrugs = emaDrugsRaw.map((d) => ({
    brand_name: d.brand_name as string | undefined,
    generic_name: d.generic_name as string | undefined,
    manufacturer: d.manufacturer as string | undefined,
    indication_summary: d.indication_summary as string | undefined,
    agency: "EMA" as const,
    auth_date: d.auth_date as string | undefined,
  }));

  const approved_drugs = [...fdaDrugs, ...emaDrugs];

  /* ── Threat assessment ─────────────────────────────────────── */
  const taRaw = root.threat_assessment as Raw | undefined;
  const ta = taRaw
    ? {
      summary: taRaw.summary as string | undefined,
      threats: ((taRaw.threats ?? []) as Raw[]).map((r) => ({
        drug: r.drug as string | undefined,
        sponsor: r.sponsor as string | undefined,
        phase: r.phase as string | undefined,
        threat_score: r.threat_score as number | undefined,
        rationale: (r.rationale ?? r.threat_rationale) as string | undefined,
        key_differentiator: r.key_differentiator as string | undefined,
      })),
    }
    : undefined;

  /* ── Time to market ────────────────────────────────────────── */
  const ttmRaw = (root.time_to_market ?? root.time_to_market_forecast) as Raw | undefined;
  const ttm = ttmRaw
    ? {
      methodology_note: ttmRaw.methodology_note as string | undefined,
      forecasts: ((ttmRaw.forecasts ?? ttmRaw.assets ?? []) as Raw[]).map((r) => ({
        drug: r.drug as string | undefined,
        sponsor: r.sponsor as string | undefined,
        phase: (r.phase ?? r.current_phase) as string | undefined,
        success_probability: (r.success_probability ?? r.phase_success_probability) as string | undefined,
        fda: (r.fda ?? r.estimated_fda_approval) as string | undefined,
        ema: (r.ema ?? r.estimated_ema_approval) as string | undefined,
        italy: (r.italy ?? r.estimated_italy_reimbursement) as string | undefined,
      })),
    }
    : undefined;

  /* ── AIFA innovativity ─────────────────────────────────────── */
  const innovRaw = root.aifa_innovativity as Raw | undefined;
  const innov = innovRaw
    ? {
      methodology_note: innovRaw.methodology_note as string | undefined,
      assets: ((innovRaw.assets ?? []) as Raw[]).map((a) => ({
        drug: a.drug as string | undefined,
        unmet_need: (a.unmet_need ?? a.unmet_need_score) as string | undefined,
        added_value: (a.added_value ?? a.added_value_score) as string | undefined,
        evidence_quality: (a.evidence_quality ?? a.evidence_quality_score) as string | undefined,
        innovativity_probability: a.innovativity_probability as string | undefined,
        rationale: a.rationale as string | undefined,
      })),
    }
    : undefined;

  /* ── Endpoint benchmarking ─────────────────────────────────── */
  const ebRaw = root.endpoint_benchmarking as Raw | undefined;
  const eb = ebRaw
    ? {
      data_note: ebRaw.data_note as string | undefined,
      rows: ((ebRaw.rows ?? ebRaw.competitors ?? []) as Raw[]).map((r) => ({
        drug: r.drug as string | undefined,
        sponsor: r.sponsor as string | undefined,
        pfs_months: r.pfs_months as number | null | undefined,
        os_months: r.os_months as number | null | undefined,
        orr_percent: r.orr_percent as number | null | undefined,
        therapeutic_setting: r.therapeutic_setting as string | undefined,  // NEW
        study_context: r.study_context as string | undefined,
        source_pmid:
          r.source_pmid && r.source_pmid !== "null"
            ? (r.source_pmid as string)
            : undefined,
      })),
    }
    : undefined;

  /* ── Publications ──────────────────────────────────────────── */
  const pubs = ((root.top_publications ?? []) as Raw[]).map((p) => ({
    title: p.title as string | undefined,
    authors: p.authors as string | undefined,
    journal: p.journal as string | undefined,
    date: p.date as string | undefined,
    relevance_note: p.relevance_note as string | undefined,
    pmid: p.pmid as string | undefined,
  }));

  return {
    executive_summary: root.executive_summary as string | undefined,
    pipeline,
    approved_drugs,
    threat_assessment: ta,
    time_to_market: ttm,
    aifa_innovativity: innov,
    endpoint_benchmarking: eb,
    top_publications: pubs,
    validation: root.validation as ReportData["validation"],
    chart_data: root.chart_data as ReportData["chart_data"],
    stats: root.stats as ReportData["stats"],
  };
}
