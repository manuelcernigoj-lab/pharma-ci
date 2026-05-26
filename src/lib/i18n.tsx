import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type Lang = "it" | "en";

type Dict = Record<string, { it: string; en: string }>;

export const dict = {
  // form
  brand_tag: { it: "Pharma Strategic Intelligence", en: "Pharma Strategic Intelligence" },
  query_label: { it: "Target / Area terapeutica", en: "Target / Therapeutic Area" },
  query_ph: { it: "es. KRAS G12C non-small cell lung cancer", en: "e.g. KRAS G12C non-small cell lung cancer" },
  query_tip: {
    it: "Inserisci il target biologico o l'area terapeutica da analizzare. Esempio: KRAS G12C NSCLC, CDK4/6 breast cancer.",
    en: "Enter the biological target or therapeutic area to analyze. Example: KRAS G12C NSCLC, CDK4/6 breast cancer.",
  },
  ref_label: { it: "Farmaco di riferimento (opzionale)", en: "Reference Drug (optional)" },
  ref_ph: { it: "es. sotorasib", en: "e.g. sotorasib" },
  ref_tip: {
    it: "Se specificato, il report includerà un benchmarking competitivo centrato su questo farmaco.",
    en: "If provided, the report will include a competitive benchmark focused on this drug.",
  },
  trials_label: { it: "Numero massimo di trial", en: "Maximum number of trials" },
  trials_tip: {
    it: "Numero massimo di trial clinici da recuperare da ClinicalTrials.gov. Valori più bassi = risposta più veloce.",
    en: "Maximum number of clinical trials to retrieve from ClinicalTrials.gov. Lower values = faster response.",
  },
  months_label: { it: "Mesi di letteratura", en: "Literature lookback (months)" },
  months_tip: {
    it: "Finestra temporale in mesi per la ricerca di pubblicazioni su PubMed.",
    en: "Time window in months for PubMed publication search.",
  },
  generate: { it: "Genera Report", en: "Generate Report" },
  err_required: { it: "Campo obbligatorio", en: "Required field" },
  err_submit: { it: "Errore nella generazione del report. Riprova.", en: "Error generating the report. Please try again." },
  // report
  exec_summary: { it: "Executive Summary", en: "Executive Summary" },
  active_trials: { it: "Trial attivi", en: "Active trials" },
  approved_drugs: { it: "Farmaci approvati", en: "Approved drugs" },
  publications: { it: "Pubblicazioni", en: "Publications" },
  top_threat: { it: "Minaccia più alta", en: "Top threat" },
  visual_analysis: { it: "Analisi Visiva", en: "Visual Analysis" },
  trials_by_phase: { it: "Trial per Fase", en: "Trials by Phase" },
  pubs_over_time: { it: "Pubblicazioni nel Tempo", en: "Publications Over Time" },
  threat_score: { it: "Threat Score Competitivo", en: "Competitive Threat Score" },
  ttm: { it: "Stima Time-to-Market", en: "Time-to-Market Forecast" },
  pipeline: { it: "Pipeline Clinica", en: "Clinical Pipeline" },
  fda_approved: { it: "Farmaci Approvati FDA", en: "FDA Approved Drugs" },
  threat_assessment: { it: "Threat Assessment", en: "Threat Assessment" },
  innov: { it: "Innovatività AIFA", en: "AIFA Innovativity" },
  endpoint_bench: { it: "Endpoint Benchmarking", en: "Endpoint Benchmarking" },
  literature: { it: "Letteratura Scientifica", en: "Scientific Literature" },
  validation: { it: "Qualità e Validazione Report", en: "Report Quality & Validation" },
  validation_ok: { it: "Nessun errore critico rilevato", en: "No critical issues detected" },
  validation_warn: { it: "Rilevati alcuni warning", en: "Some warnings detected" },
  no_issues: { it: "Nessun problema rilevato dal Critic Agent.", en: "No issues detected by Critic Agent." },
  overall_conf: { it: "Confidenza complessiva", en: "Overall Confidence" },
  // table headers
  th_nct: { it: "NCT ID", en: "NCT ID" },
  th_title: { it: "Titolo", en: "Title" },
  th_phase: { it: "Fase", en: "Phase" },
  th_status: { it: "Status", en: "Status" },
  th_sponsor: { it: "Sponsor", en: "Sponsor" },
  th_endpoint: { it: "Endpoint Primario", en: "Primary Endpoint" },
  th_completion: { it: "Completion", en: "Completion" },
  th_notes: { it: "Note Strategiche", en: "Strategic Notes" },
  th_drug: { it: "Drug", en: "Drug" },
  th_score: { it: "Threat Score", en: "Threat Score" },
  th_rationale: { it: "Rationale", en: "Rationale" },
  th_diff: { it: "Key Differentiator", en: "Key Differentiator" },
  th_succ: { it: "Probabilità di successo", en: "Success Probability" },
  th_fda: { it: "FDA", en: "FDA" },
  th_ema: { it: "EMA", en: "EMA" },
  th_italy: { it: "Italia (rimborso)", en: "Italy (reimbursement)" },
  th_pfs: { it: "PFS (mesi)", en: "PFS (months)" },
  th_os: { it: "OS (mesi)", en: "OS (months)" },
  th_orr: { it: "ORR (%)", en: "ORR (%)" },
  th_context: { it: "Contesto studio", en: "Study context" },
  th_section: { it: "Sezione", en: "Section" },
  th_severity: { it: "Severità", en: "Severity" },
  th_desc: { it: "Descrizione", en: "Description" },
  // innov
  unmet: { it: "Bisogno insoddisfatto", en: "Unmet Need" },
  added_value: { it: "Valore aggiunto", en: "Added Value" },
  evidence: { it: "Qualità evidenza", en: "Evidence Quality" },
  innov_prob: { it: "Probabilità innovatività", en: "Innovativity Probability" },
  // export
  export: { it: "Esporta", en: "Export" },
  save_pdf: { it: "Salva come PDF", en: "Save as PDF" },
  charts_hd: { it: "Esporta grafici (HD)", en: "Export charts (HD)" },
  charts_sd: { it: "Esporta grafici (SD)", en: "Export charts (SD)" },
  // loading
  loading_1: { it: "Recupero trial clinici...", en: "Fetching clinical trials..." },
  loading_2: { it: "Analisi pipeline competitiva...", en: "Analyzing competitive pipeline..." },
  loading_3: { it: "Generazione report strategico...", en: "Generating strategic report..." },
  loading_4: { it: "Validazione in corso...", en: "Running validation..." },
  back: { it: "Nuova ricerca", en: "New search" },
  no_data: { it: "Nessun dato disponibile.", en: "No data available." },
  legend: { it: "Legenda", en: "Legend" },
  threat_high: { it: "Alta", en: "High" },
  threat_high_desc: { it: "score ≥ 7: minaccia competitiva rilevante", en: "score ≥ 7: significant competitive threat" },
  threat_med: { it: "Media", en: "Medium" },
  threat_med_desc: { it: "score 4–6: da monitorare", en: "score 4–6: to monitor" },
  threat_low: { it: "Bassa", en: "Low" },
  threat_low_desc: { it: "score < 4: impatto limitato", en: "score < 4: limited impact" },
  run_validation: { it: "Avvia Validazione", en: "Run Validation" },
  running_critic: { it: "Analisi in corso...", en: "Running critic agent..." },
  validation_failed: { it: "Validazione non riuscita. Riprova.", en: "Validation failed. Try again." },
} satisfies Dict;

export type DictKey = keyof typeof dict;

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: DictKey) => string;
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  const t = useCallback((k: DictKey) => dict[k][lang], [lang]);
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n must be used inside I18nProvider");
  return v;
}
