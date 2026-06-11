export interface ReportData {
  executive_summary?: string;
  pipeline?: {
    total_active_trials?: number;
    trials?: Array<{
      nct_id?: string;
      title?: string;
      phase?: string;
      status?: string;
      sponsor?: string;
      primary_endpoint?: string;
      completion_date?: string;
      strategic_notes?: string;
    }>;
  };
  approved_drugs?: Array<{
    brand_name?: string;
    generic_name?: string;
    manufacturer?: string;
    indication_summary?: string;
    agency?: "FDA" | "EMA" | "BOTH";
    auth_date?: string;                 // EMA authorization date
  }>;
  threat_assessment?: {
    summary?: string;
    threats?: Array<{
      drug?: string;
      sponsor?: string;
      phase?: string;
      threat_score?: number;
      rationale?: string;
      key_differentiator?: string;
    }>;
  };
  time_to_market?: {
    methodology_note?: string;
    forecasts?: Array<{
      drug?: string;
      sponsor?: string;
      phase?: string;
      success_probability?: string | number;
      fda?: string;
      ema?: string;
      italy?: string;
      fda_start?: number; fda_end?: number;
      ema_start?: number; ema_end?: number;
      italy_start?: number; italy_end?: number;
    }>;
  };
  aifa_innovativity?: {
    methodology_note?: string;
    assets?: Array<{
      drug?: string;
      unmet_need?: string;
      added_value?: string;
      evidence_quality?: string;
      innovativity_probability?: string;
      rationale?: string;
    }>;
  };
  endpoint_benchmarking?: {
    data_note?: string;
    rows?: Array<{
      drug?: string;
      sponsor?: string;
      pfs_months?: number | null;
      os_months?: number | null;
      orr_percent?: number | null;
      therapeutic_setting?: string;    // NEW — e.g. "1L", "2L", "adjuvant"
      study_context?: string;
      source_pmid?: string;
    }>;
  };
  top_publications?: Array<{
    title?: string;
    authors?: string;
    journal?: string;
    date?: string;
    relevance_note?: string;
    pmid?: string;
  }>;
  validation?: {
    validation_passed?: boolean;
    confidence_overall?: string;
    issues?: Array<{ section?: string; severity?: string; description?: string }>;
    data_quality_notes?: string;
  } | null;
  chart_data?: {
    pipeline_by_phase_chart?: Array<{ phase: string; trials: number }>;
    publications_by_month_chart?: Array<{ month: string; publications: number }>;
    threat_scores_chart?: Array<{ drug: string; score: number; color?: string }>;
    threat_scores?: Array<{ drug: string; score: number }>;
    timeline_chart?: Array<{
      drug: string;
      fda_start?: number; fda_end?: number;
      ema_start?: number; ema_end?: number;
      italy_start?: number; italy_end?: number;
    }>;
  };
  stats?: {
    publications?: number;
  };
}
