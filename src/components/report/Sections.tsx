import { useI18n } from "@/lib/i18n";
import type { ReportData } from "@/lib/types";
import { Section } from "./Section";
import {
  ExternalLink, FlaskConical, Check, AlertTriangle, Calendar,
  Building2, Target, BookOpen, ShieldCheck,
} from "lucide-react";

const iconWrap = (Icon: React.ComponentType<{ size?: number; className?: string }>) => (
  <Icon size={18} className="text-[#1f7f6e]" />
);

const statusBadge = (status?: string) => {
  const s = (status ?? "").toUpperCase();
  if (s === "RECRUITING") return "bg-success/20 text-accent-dark";
  if (s === "ACTIVE_NOT_RECRUITING") return "bg-blue-500/20 text-blue-800";
  return "bg-muted text-muted-foreground";
};

const scoreBadge = (n?: number) => {
  if (n == null) return "bg-muted text-muted-foreground";
  if (n >= 8) return "bg-red-500/20 text-red-700";
  if (n >= 6) return "bg-yellow-500/25 text-yellow-800";
  return "bg-success/25 text-accent-dark";
};

const levelBadge = (lvl?: string) => {
  const v = (lvl ?? "").toLowerCase();
  if (v.startsWith("high") || v.startsWith("alt")) return "bg-success/25 text-accent-dark";
  if (v.startsWith("med")) return "bg-yellow-500/25 text-yellow-800";
  if (v.startsWith("low") || v.startsWith("bas")) return "bg-red-500/20 text-red-700";
  return "bg-muted text-muted-foreground";
};

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left text-xs font-semibold uppercase tracking-wide text-accent-dark px-3 py-2 border-b border-border">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 align-top text-sm border-b border-border/60 ${className}`}>{children}</td>;
}

function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-background">
      <table className="w-full min-w-[700px]">{children}</table>
    </div>
  );
}

export function PipelineSection({ data }: { data: ReportData }) {
  const { t } = useI18n();
  const trials = data.pipeline?.trials ?? [];
  return (
    <Section icon={iconWrap(FlaskConical)} title={t("pipeline")} count={trials.length}>
      {trials.length === 0 ? <p className="text-muted-foreground text-sm">{t("no_data")}</p> : (
        <TableWrap>
          <thead>
            <tr>
              <Th>{t("th_nct")}</Th><Th>{t("th_title")}</Th><Th>{t("th_phase")}</Th>
              <Th>{t("th_status")}</Th><Th>{t("th_sponsor")}</Th><Th>{t("th_endpoint")}</Th>
              <Th>{t("th_completion")}</Th><Th>{t("th_notes")}</Th>
            </tr>
          </thead>
          <tbody>
            {trials.map((tr, i) => (
              <tr key={i}>
                <Td>
                  {tr.nct_id ? (
                    <a className="text-accent-dark underline inline-flex items-center gap-1" target="_blank" rel="noreferrer"
                      href={`https://clinicaltrials.gov/study/${tr.nct_id}`}>
                      {tr.nct_id} <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : "—"}
                </Td>
                <Td className="max-w-xs">{tr.title || "—"}</Td>
                <Td>{tr.phase || "—"}</Td>
                <Td><span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(tr.status)}`}>{tr.status || "—"}</span></Td>
                <Td>{tr.sponsor || "—"}</Td>
                <Td className="max-w-xs">{tr.primary_endpoint || "—"}</Td>
                <Td>{tr.completion_date || "—"}</Td>
                <Td className="max-w-xs">{tr.strategic_notes || "—"}</Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </Section>
  );
}

export function ApprovedSection({ data }: { data: ReportData }) {
  const { t } = useI18n();
  const drugs = data.approved_drugs ?? [];
  return (
    <Section icon={iconWrap(Check)} title={t("fda_approved")} count={drugs.length}>
      {drugs.length === 0 ? <p className="text-muted-foreground text-sm">{t("no_data")}</p> : (
        <div className="grid md:grid-cols-2 gap-3">
          {drugs.map((d, i) => (
            <div key={i} className="rounded-xl border border-border bg-background p-4">
              <div className="text-lg font-bold text-accent-dark">{d.brand_name || "—"}</div>
              {d.generic_name && <div className="text-sm text-muted-foreground italic">{d.generic_name}</div>}
              {d.manufacturer && <div className="text-sm mt-1"><span className="font-medium">{d.manufacturer}</span></div>}
              {d.indication_summary && <p className="text-sm mt-2 leading-relaxed">{d.indication_summary}</p>}
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

export function ThreatSection({ data }: { data: ReportData }) {
  const { t } = useI18n();
  const ta = data.threat_assessment;
  const items = ta?.threats ?? [];
  return (
    <Section icon={iconWrap(AlertTriangle)} title={t("threat_assessment")} count={items.length}>
      {ta?.summary && <p className="text-sm mb-3 leading-relaxed">{ta.summary}</p>}
      {items.length === 0 ? <p className="text-muted-foreground text-sm">{t("no_data")}</p> : (
        <TableWrap>
          <thead><tr>
            <Th>{t("th_drug")}</Th><Th>{t("th_sponsor")}</Th><Th>{t("th_phase")}</Th>
            <Th>{t("th_score")}</Th><Th>{t("th_rationale")}</Th><Th>{t("th_diff")}</Th>
          </tr></thead>
          <tbody>
            {items.map((r, i) => (
              <tr key={i}>
                <Td className="font-semibold text-accent-dark">{r.drug || "—"}</Td>
                <Td>{r.sponsor || "—"}</Td>
                <Td>{r.phase || "—"}</Td>
                <Td><span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${scoreBadge(r.threat_score)}`}>{r.threat_score ?? "—"}</span></Td>
                <Td className="max-w-md">{r.rationale || "—"}</Td>
                <Td className="max-w-md">{r.key_differentiator || "—"}</Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </Section>
  );
}

export function TtmSection({ data }: { data: ReportData }) {
  const { t } = useI18n();
  const ttm = data.time_to_market;
  const items = ttm?.forecasts ?? [];
  return (
    <Section icon={iconWrap(Calendar)} title={t("ttm")} count={items.length}>
      {ttm?.methodology_note && <p className="text-xs italic text-muted-foreground mb-3">{ttm.methodology_note}</p>}
      {items.length === 0 ? <p className="text-muted-foreground text-sm">{t("no_data")}</p> : (
        <TableWrap>
          <thead><tr>
            <Th>{t("th_drug")}</Th><Th>{t("th_sponsor")}</Th><Th>{t("th_phase")}</Th>
            <Th>{t("th_succ")}</Th><Th>{t("th_fda")}</Th><Th>{t("th_ema")}</Th><Th>{t("th_italy")}</Th>
          </tr></thead>
          <tbody>
            {items.map((r, i) => (
              <tr key={i}>
                <Td className="font-semibold text-accent-dark">{r.drug || "—"}</Td>
                <Td>{r.sponsor || "—"}</Td>
                <Td>{r.phase || "—"}</Td>
                <Td>{r.success_probability ?? "—"}</Td>
                <Td>{r.fda || "—"}</Td>
                <Td>{r.ema || "—"}</Td>
                <Td>{r.italy || "—"}</Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </Section>
  );
}

export function InnovSection({ data }: { data: ReportData }) {
  const { t } = useI18n();
  const innov = data.aifa_innovativity;
  const items = innov?.assets ?? [];
  return (
    <Section icon={iconWrap(Building2)} title={t("innov")} count={items.length}>
      {innov?.methodology_note && <p className="text-xs italic text-muted-foreground mb-3">{innov.methodology_note}</p>}
      {items.length === 0 ? <p className="text-muted-foreground text-sm">{t("no_data")}</p> : (
        <div className="grid md:grid-cols-2 gap-3">
          {items.map((a, i) => (
            <div key={i} className="rounded-xl border border-border bg-background p-4">
              <div className="text-lg font-bold text-accent-dark mb-3">{a.drug || "—"}</div>
              <div className="space-y-2 text-sm">
                <Row label={t("unmet")} value={a.unmet_need} />
                <Row label={t("added_value")} value={a.added_value} />
                <Row label={t("evidence")} value={a.evidence_quality} />
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-border">
                  <span className="font-medium">{t("innov_prob")}</span>
                  <span className={`inline-block rounded-full px-3 py-1 text-sm font-bold ${levelBadge(a.innovativity_probability)}`}>
                    {a.innovativity_probability || "—"}
                  </span>
                </div>
              </div>
              {a.rationale && <p className="text-sm mt-3 leading-relaxed">{a.rationale}</p>}
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${levelBadge(value)}`}>
        {value || "—"}
      </span>
    </div>
  );
}

export function EndpointSection({ data }: { data: ReportData }) {
  const { t } = useI18n();
  const eb = data.endpoint_benchmarking;
  const rows = eb?.rows ?? [];
  return (
    <Section icon={iconWrap(Target)} title={t("endpoint_bench")} count={rows.length}>
      {eb?.data_note && <p className="text-xs italic text-muted-foreground mb-3">{eb.data_note}</p>}
      {rows.length === 0 ? <p className="text-muted-foreground text-sm">{t("no_data")}</p> : (
        <TableWrap>
          <thead><tr>
            <Th>{t("th_drug")}</Th><Th>{t("th_sponsor")}</Th>
            <Th>{t("th_pfs")}</Th><Th>{t("th_os")}</Th><Th>{t("th_orr")}</Th>
            <Th>{t("th_context")}</Th><Th>PubMed</Th>
          </tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <Td className="font-semibold text-accent-dark">{r.drug || "—"}</Td>
                <Td>{r.sponsor || "—"}</Td>
                <Td>{r.pfs_months ?? "—"}</Td>
                <Td>{r.os_months ?? "—"}</Td>
                <Td>{r.orr_percent ?? "—"}</Td>
                <Td className="max-w-md">{r.study_context || "—"}</Td>
                <Td>
                  {r.source_pmid ? (
                    <a className="text-accent-dark inline-flex items-center gap-1" target="_blank" rel="noreferrer"
                      href={`https://pubmed.ncbi.nlm.nih.gov/${r.source_pmid}`}>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : "—"}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </Section>
  );
}

export function PublicationsSection({ data }: { data: ReportData }) {
  const { t } = useI18n();
  const pubs = data.top_publications ?? [];
  return (
    <Section icon={iconWrap(BookOpen)} title={t("literature")} count={pubs.length}>
      {pubs.length === 0 ? <p className="text-muted-foreground text-sm">{t("no_data")}</p> : (
        <div className="space-y-3">
          {pubs.map((p, i) => (
            <div key={i} className="rounded-xl border border-border bg-background p-4">
              <div className="font-semibold text-accent-dark">{p.title || "—"}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {[p.authors, p.journal, p.date].filter(Boolean).join(" · ")}
              </div>
              {p.relevance_note && <p className="text-sm italic mt-2">{p.relevance_note}</p>}
              {p.pmid && (
                <a
                  className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-accent-dark border border-accent-dark rounded-full px-3 py-1 hover:bg-accent-dark hover:text-primary-foreground transition"
                  target="_blank" rel="noreferrer"
                  href={`https://pubmed.ncbi.nlm.nih.gov/${p.pmid}`}
                >
                  PubMed <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

export function ValidationSection({
  data,
  validationError,
}: {
  data: ReportData;
  validationError?: string | null;
}) {
  const { t, lang } = useI18n();
  const v = data.validation;
  const hasValidation = v !== null && v !== undefined;
  const passed = !!v?.validation_passed;
  return (
    <Section
      icon={iconWrap(ShieldCheck)}
      statusDot={hasValidation ? (passed ? "ok" : "warn") : undefined}
      title={t("validation")}
      subtitle={hasValidation ? (passed ? t("validation_ok") : t("validation_warn")) : undefined}
      defaultOpen={!hasValidation}
    >
      {!hasValidation ? (
        <div className="flex flex-col items-center gap-3 py-6">
          <p className="text-sm text-center" style={{ color: "rgba(31,127,110,0.5)" }}>
            {lang === "it"
              ? "Avvia la validazione dalla sidebar per controllare la qualità del report."
              : "Run validation from the sidebar to check report quality."}
          </p>
          {validationError && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-300 rounded-md px-3 py-2">
              {validationError}
            </div>
          )}
        </div>
      ) : (
        <>
          {v?.confidence_overall && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium">{t("overall_conf")}:</span>
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${levelBadge(v.confidence_overall)}`}>
                {v.confidence_overall}
              </span>
            </div>
          )}
          {!v?.issues || v.issues.length === 0 ? (
            <p className="text-sm">{t("no_issues")}</p>
          ) : (
            <TableWrap>
              <thead><tr>
                <Th>{t("th_section")}</Th><Th>{t("th_severity")}</Th><Th>{t("th_desc")}</Th>
              </tr></thead>
              <tbody>
                {v.issues.map((iss, i) => (
                  <tr key={i}>
                    <Td>{iss.section || "—"}</Td>
                    <Td>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                        (iss.severity ?? "").toLowerCase() === "error"
                          ? "bg-red-500/20 text-red-700"
                          : "bg-yellow-500/25 text-yellow-800"
                      }`}>{iss.severity || "—"}</span>
                    </Td>
                    <Td>{iss.description || "—"}</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
          {v?.data_quality_notes && <p className="text-xs italic text-muted-foreground mt-3">{v.data_quality_notes}</p>}
        </>
      )}
    </Section>
  );
}
