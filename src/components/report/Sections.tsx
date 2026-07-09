import { useI18n } from "@/lib/i18n";
import type { ReportData } from "@/lib/types";
import { Section } from "./Section";
import {
  ExternalLink, FlaskConical, Check, AlertTriangle,
  Calendar, Building2, Target, BookOpen, ShieldCheck,
} from "lucide-react";

/* ── Icon wrapper ──────────────────────────────────────────── */
const iconWrap = (Icon: React.ComponentType<{ size?: number; className?: string }>) => (
  <Icon size={17} style={{ color: "var(--accent-primary)" }} />
);

/* ── Badge helpers ─────────────────────────────────────────── */
const statusBadge = (status?: string) => {
  const s = (status ?? "").toUpperCase();
  if (s === "RECRUITING")            return { bg: "var(--success-bg)", color: "var(--success-fg)" };
  if (s === "ACTIVE_NOT_RECRUITING") return { bg: "var(--info-bg)",    color: "var(--info-fg)" };
  return { bg: "var(--muted)", color: "var(--neutral-mid)" };
};

const scoreBadge = (n?: number): React.CSSProperties => {
  if (n == null) return { background: "var(--muted)", color: "var(--neutral-mid)" };
  if (n >= 8) return { background: "var(--danger-bg)",  color: "var(--danger-fg)" };
  if (n >= 6) return { background: "var(--warning-bg)", color: "var(--warning-fg)" };
  return       { background: "var(--success-bg)", color: "var(--success-fg)" };
};

const levelBadge = (lvl?: string): React.CSSProperties => {
  const v = (lvl ?? "").toLowerCase();
  if (v.startsWith("high") || v.startsWith("alt")) return { background: "var(--success-bg)", color: "var(--success-fg)" };
  if (v.startsWith("med"))                          return { background: "var(--warning-bg)", color: "var(--warning-fg)" };
  if (v.startsWith("low") || v.startsWith("bas"))   return { background: "var(--danger-bg)",  color: "var(--danger-fg)" };
  return                                              { background: "var(--muted)", color: "var(--neutral-mid)" };
};


/* ── Table primitives ──────────────────────────────────────── */
function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      className="text-left text-[10px] font-bold uppercase tracking-[0.08em] px-3 py-2 border-b"
      style={{ color: "var(--neutral-mid)", borderColor: "var(--border-color)" }}
    >
      {children}
    </th>
  );
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <td
      className={`px-3 py-2.5 align-top text-sm border-b ${className}`}
      style={{ borderColor: "var(--border-color)", color: "var(--neutral-dark)" }}
    >
      {children}
    </td>
  );
}
function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="overflow-x-auto rounded-md"
      style={{ border: "1px solid var(--border-color)", background: "var(--surface)" }}
    >
      <table className="w-full min-w-[700px]">{children}</table>
    </div>
  );
}

function Badge({ children, style }: { children: React.ReactNode; style: React.CSSProperties }) {
  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={style}
    >
      {children}
    </span>
  );
}

/* ── Pipeline ──────────────────────────────────────────────── */
export function PipelineSection({ data }: { data: ReportData }) {
  const { t } = useI18n();
  const trials = data.pipeline?.trials ?? [];
  return (
    <Section icon={iconWrap(FlaskConical)} title={t("pipeline")} count={trials.length}>
      {trials.length === 0
        ? <p className="text-sm" style={{ color: "var(--neutral-mid)" }}>{t("no_data")}</p>
        : (
          <TableWrap>
            <thead>
              <tr style={{ background: "var(--bg)" }}>
                <Th>{t("th_nct")}</Th><Th>{t("th_title")}</Th><Th>{t("th_phase")}</Th>
                <Th>{t("th_status")}</Th><Th>{t("th_sponsor")}</Th><Th>{t("th_endpoint")}</Th>
                <Th>{t("th_completion")}</Th><Th>{t("th_notes")}</Th>
              </tr>
            </thead>
            <tbody>
              {trials.map((tr, i) => {
                const sb = statusBadge(tr.status);
                return (
                  <tr key={i}>
                    <Td>
                      {tr.nct_id
                        ? <a
                            className="inline-flex items-center gap-1 text-[12px] font-medium underline-offset-2 hover:underline"
                            style={{ color: "var(--accent-primary)" }}
                            target="_blank" rel="noreferrer"
                            href={`https://clinicaltrials.gov/study/${tr.nct_id}`}
                          >
                            {tr.nct_id} <ExternalLink className="h-3 w-3" />
                          </a>
                        : "—"}
                    </Td>
                    <Td className="max-w-xs">{tr.title || "—"}</Td>
                    <Td>{tr.phase || "—"}</Td>
                    <Td>
                      <Badge style={{ background: sb.bg, color: sb.color }}>
                        {tr.status || "—"}
                      </Badge>
                    </Td>
                    <Td>{tr.sponsor || "—"}</Td>
                    <Td className="max-w-xs">{tr.primary_endpoint || "—"}</Td>
                    <Td>{tr.completion_date || "—"}</Td>
                    <Td className="max-w-xs">{tr.strategic_notes || "—"}</Td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        )}
    </Section>
  );
}

/* ── Approved Drugs ────────────────────────────────────────── */
export function ApprovedSection({ data }: { data: ReportData }) {
  const { t, lang } = useI18n();
  const drugs    = data.approved_drugs ?? [];
  const fdaDrugs = drugs.filter((d) => !d.agency || d.agency === "FDA" || d.agency === "BOTH");
  const emaDrugs = drugs.filter((d) => d.agency === "EMA" || d.agency === "BOTH");

  if (drugs.length === 0) {
    return (
      <Section icon={iconWrap(Check)} title={t("fda_approved")} count={0}>
        <p className="text-sm" style={{ color: "var(--neutral-mid)" }}>{t("no_data")}</p>
      </Section>
    );
  }

  return (
    <Section icon={iconWrap(Check)} title={t("fda_approved")} count={drugs.length}>
      <div className="space-y-5">
        {/* FDA */}
        {fdaDrugs.length > 0 && (
          <div>
            <div
              className="text-[10px] font-bold uppercase tracking-[0.1em] mb-2"
              style={{ color: "var(--neutral-mid)" }}
            >
              FDA
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {fdaDrugs.map((d, i) => <DrugCard key={i} drug={d} />)}
            </div>
          </div>
        )}

        {/* EMA */}
        {emaDrugs.length > 0 && (
          <div>
            <div
              className="text-[10px] font-bold uppercase tracking-[0.1em] mb-2"
              style={{ color: "var(--neutral-mid)" }}
            >
              EMA — {lang === "it" ? "Farmaci autorizzati" : "Authorised medicines"}
              <span
                className="ml-2 font-normal normal-case tracking-normal"
                style={{ color: "var(--neutral-mid)" }}
              >
                ({emaDrugs.length})
              </span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {emaDrugs.map((d, i) => <DrugCard key={i} drug={d} />)}
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}

function DrugCard({ drug: d }: { drug: NonNullable<ReportData["approved_drugs"]>[number] }) {
  const isEma = d.agency === "EMA";

  // FDA badge style: blue (info); EMA badge style: green (success)
  const badgeStyle: React.CSSProperties = isEma
    ? { background: "var(--success-bg)", color: "var(--success-fg)", border: "1px solid var(--success-border)" }
    : { background: "var(--info-bg)",    color: "var(--info-fg)",    border: "1px solid var(--info-border)" };

  // For EMA drugs, indication_summary is a list of MeSH terms (e.g. "Arthritis, Rheumatoid; COVID-19")
  // — display as small tags instead of prose
  const indications = isEma && d.indication_summary
    ? d.indication_summary.split(";").map((s) => s.trim()).filter(Boolean)
    : null;

  return (
    <div
      className="rounded-md p-4 flex flex-col gap-1.5"
      style={{ border: "1px solid var(--border-color)", background: "var(--surface)" }}
    >
      {/* Header row: brand name + agency badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="font-bold text-[15px]" style={{ color: "var(--neutral-dark)" }}>
          {d.brand_name || "—"}
        </div>
        <span
          className="shrink-0 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
          style={badgeStyle}
        >
          {d.agency ?? "FDA"}
        </span>
      </div>

      {/* Generic name */}
      {d.generic_name && (
        <div className="text-[12px] italic" style={{ color: "var(--neutral-mid)" }}>
          {d.generic_name}
        </div>
      )}

      {/* Manufacturer — only if present (EMA entries often have empty manufacturer) */}
      {d.manufacturer && (
        <div className="text-[12px] font-medium" style={{ color: "var(--neutral-dark)" }}>
          {d.manufacturer}
        </div>
      )}

      {/* Auth date for EMA */}
      {isEma && d.auth_date && (
        <div className="text-[11px]" style={{ color: "var(--neutral-mid)" }}>
          Authorised: {d.auth_date}
        </div>
      )}

      {/* Indication — prose for FDA, tags for EMA */}
      {indications ? (
        <div className="flex flex-wrap gap-1 mt-1">
          {indications.map((ind, i) => (
            <span
              key={i}
              className="inline-block rounded-full px-2 py-0.5 text-[10px]"
              style={{ background: "var(--muted)", color: "var(--neutral-mid)" }}
            >
              {ind}
            </span>
          ))}
        </div>
      ) : (
        d.indication_summary && (
          <p
            className="text-[12px] leading-relaxed mt-1"
            style={{ color: "var(--neutral-mid)" }}
          >
            {/* FDA indication_summary can be very long — truncate to first sentence */}
            {d.indication_summary.split(/\.\s/)[0].replace(/^\d+\s+INDICATIONS.*?\n/i, "").trim()}
            {d.indication_summary.length > 120 ? "." : ""}
          </p>
        )
      )}
    </div>
  );
}

/* ── Threat Assessment ─────────────────────────────────────── */
export function ThreatSection({ data }: { data: ReportData }) {
  const { t } = useI18n();
  const ta    = data.threat_assessment;
  const items = ta?.threats ?? [];
  return (
    <Section icon={iconWrap(AlertTriangle)} title={t("threat_assessment")} count={items.length}>
      {ta?.summary && (
        <p className="text-sm mb-3 leading-relaxed" style={{ color: "var(--neutral-mid)" }}>
          {ta.summary}
        </p>
      )}
      {items.length === 0
        ? <p className="text-sm" style={{ color: "var(--neutral-mid)" }}>{t("no_data")}</p>
        : (
          <TableWrap>
            <thead>
              <tr style={{ background: "var(--bg)" }}>
                <Th>{t("th_drug")}</Th><Th>{t("th_sponsor")}</Th><Th>{t("th_phase")}</Th>
                <Th>{t("th_score")}</Th><Th>{t("th_rationale")}</Th><Th>{t("th_diff")}</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((r, i) => (
                <tr key={i}>
                  <Td className="font-semibold" style={{ color: "var(--neutral-dark)" } as React.CSSProperties}>{r.drug || "—"}</Td>
                  <Td>{r.sponsor || "—"}</Td>
                  <Td>{r.phase || "—"}</Td>
                  <Td><Badge style={scoreBadge(r.threat_score)}>{r.threat_score ?? "—"}</Badge></Td>
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

/* ── Time to Market ────────────────────────────────────────── */
export function TtmSection({ data }: { data: ReportData }) {
  const { t } = useI18n();
  const ttm   = data.time_to_market;
  const items = ttm?.forecasts ?? [];
  return (
    <Section icon={iconWrap(Calendar)} title={t("ttm")} count={items.length}>
      {ttm?.methodology_note && (
        <p className="text-[11px] italic mb-3" style={{ color: "var(--neutral-mid)" }}>
          {ttm.methodology_note}
        </p>
      )}
      {items.length === 0
        ? <p className="text-sm" style={{ color: "var(--neutral-mid)" }}>{t("no_data")}</p>
        : (
          <TableWrap>
            <thead>
              <tr style={{ background: "var(--bg)" }}>
                <Th>{t("th_drug")}</Th><Th>{t("th_sponsor")}</Th><Th>{t("th_phase")}</Th>
                <Th>{t("th_succ")}</Th><Th>{t("th_fda")}</Th><Th>{t("th_ema")}</Th><Th>{t("th_italy")}</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((r, i) => (
                <tr key={i}>
                  <Td className="font-semibold">{r.drug || "—"}</Td>
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

/* ── AIFA Innovativity ─────────────────────────────────────── */
export function InnovSection({ data }: { data: ReportData }) {
  const { t }  = useI18n();
  const innov  = data.aifa_innovativity;
  const items  = innov?.assets ?? [];
  return (
    <Section icon={iconWrap(Building2)} title={t("innov")} count={items.length}>
      {innov?.methodology_note && (
        <p className="text-[11px] italic mb-3" style={{ color: "var(--neutral-mid)" }}>
          {innov.methodology_note}
        </p>
      )}
      {items.length === 0
        ? <p className="text-sm" style={{ color: "var(--neutral-mid)" }}>{t("no_data")}</p>
        : (
          <div className="grid md:grid-cols-2 gap-3">
            {items.map((a, i) => (
              <div
                key={i}
                className="rounded-md p-4"
                style={{ border: "1px solid var(--border-color)", background: "var(--surface)" }}
              >
                <div className="text-[15px] font-bold mb-3" style={{ color: "var(--neutral-dark)" }}>{a.drug || "—"}</div>
                <div className="space-y-2 text-sm">
                  <LevelRow label={t("unmet")}      value={a.unmet_need} />
                  <LevelRow label={t("added_value")} value={a.added_value} />
                  <LevelRow label={t("evidence")}   value={a.evidence_quality} />
                  <div
                    className="flex items-center justify-between gap-2 pt-2 mt-1"
                    style={{ borderTop: "1px solid var(--border-color)" }}
                  >
                    <span className="font-semibold text-[13px]" style={{ color: "var(--neutral-dark)" }}>
                      {t("innov_prob")}
                    </span>
                    <Badge style={levelBadge(a.innovativity_probability)}>
                      {a.innovativity_probability || "—"}
                    </Badge>
                  </div>
                </div>
                {a.rationale && (
                  <p className="text-[12px] mt-3 leading-relaxed" style={{ color: "var(--neutral-mid)" }}>
                    {a.rationale}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
    </Section>
  );
}

function LevelRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span style={{ color: "var(--neutral-mid)" }}>{label}</span>
      <Badge style={levelBadge(value)}>{value || "—"}</Badge>
    </div>
  );
}

/* ── Endpoint Benchmarking ─────────────────────────────────── */
export function EndpointSection({ data }: { data: ReportData }) {
  const { t } = useI18n();
  const eb    = data.endpoint_benchmarking;
  const rows  = eb?.rows ?? [];
  return (
    <Section icon={iconWrap(Target)} title={t("endpoint_bench")} count={rows.length}>
      {eb?.data_note && (
        <p className="text-[11px] italic mb-3" style={{ color: "var(--neutral-mid)" }}>
          {eb.data_note}
        </p>
      )}
      {rows.length === 0
        ? <p className="text-sm" style={{ color: "var(--neutral-mid)" }}>{t("no_data")}</p>
        : (
          <TableWrap>
            <thead>
              <tr style={{ background: "var(--bg)" }}>
                <Th>{t("th_drug")}</Th><Th>{t("th_sponsor")}</Th>
                <Th>{t("th_setting")}</Th>
                <Th>{t("th_pfs")}</Th><Th>{t("th_os")}</Th><Th>{t("th_orr")}</Th>
                <Th>{t("th_context")}</Th><Th>PubMed</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <Td className="font-semibold">{r.drug || "—"}</Td>
                  <Td>{r.sponsor || "—"}</Td>
                  <Td>
                    {r.therapeutic_setting
                      ? <Badge style={{ background: "var(--info-bg)", color: "var(--info-fg)" }}>{r.therapeutic_setting}</Badge>
                      : "—"}
                  </Td>
                  <Td>{r.pfs_months ?? "—"}</Td>
                  <Td>{r.os_months  ?? "—"}</Td>
                  <Td>{r.orr_percent ?? "—"}</Td>
                  <Td className="max-w-md">{r.study_context || "—"}</Td>
                  <Td>
                    {r.source_pmid
                      ? <a
                          className="inline-flex items-center gap-1"
                          style={{ color: "var(--accent-primary)" }}
                          target="_blank" rel="noreferrer"
                          href={`https://pubmed.ncbi.nlm.nih.gov/${r.source_pmid}`}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      : "—"}
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
    </Section>
  );
}

/* ── Publications ──────────────────────────────────────────── */
export function PublicationsSection({ data }: { data: ReportData }) {
  const { t } = useI18n();
  const pubs  = data.top_publications ?? [];
  return (
    <Section icon={iconWrap(BookOpen)} title={t("literature")} count={pubs.length}>
      {pubs.length === 0
        ? <p className="text-sm" style={{ color: "var(--neutral-mid)" }}>{t("no_data")}</p>
        : (
          <div className="space-y-3">
            {pubs.map((p, i) => (
              <div
                key={i}
                className="rounded-md p-4"
                style={{ border: "1px solid var(--border-color)", background: "var(--surface)" }}
              >
                <div className="font-semibold text-[14px]" style={{ color: "var(--neutral-dark)" }}>{p.title || "—"}</div>
                <div className="text-[11px] mt-1" style={{ color: "var(--neutral-mid)" }}>
                  {[p.authors, p.journal, p.date].filter(Boolean).join(" · ")}
                </div>
                {p.relevance_note && (
                  <p className="text-[12px] italic mt-2" style={{ color: "var(--neutral-mid)" }}>{p.relevance_note}</p>
                )}
                {p.pmid && (
                  <a
                    className="inline-flex items-center gap-1.5 mt-3 text-[11px] font-semibold rounded-full px-3 py-1 transition"
                    style={{
                      border: "1px solid var(--accent-primary)",
                      color:  "var(--accent-primary)",
                    }}
                    target="_blank" rel="noreferrer"
                    href={`https://pubmed.ncbi.nlm.nih.gov/${p.pmid}`}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.background = "var(--accent-primary)";
                      (e.currentTarget as HTMLAnchorElement).style.color = "var(--primary-foreground)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                      (e.currentTarget as HTMLAnchorElement).style.color = "var(--accent-primary)";
                    }}
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

/* ── Validation ────────────────────────────────────────────── */
export function ValidationSection({
  data,
  validationError,
}: {
  data: ReportData;
  validationError?: string | null;
}) {
  const { t, lang } = useI18n();
  const v          = data.validation;
  const hasV       = v !== null && v !== undefined;
  const passed     = !!v?.validation_passed;

  return (
    <Section
      icon={iconWrap(ShieldCheck)}
      statusDot={hasV ? (passed ? "ok" : "warn") : undefined}
      title={t("validation")}
      subtitle={hasV ? (passed ? t("validation_ok") : t("validation_warn")) : undefined}
      defaultOpen={!hasV}
    >
      {!hasV ? (
        <div className="flex flex-col items-center gap-3 py-6">
          <p className="text-sm text-center" style={{ color: "var(--neutral-mid)" }}>
            {lang === "it"
              ? "Avvia la validazione dalla sidebar per controllare la qualità del report."
              : "Run validation from the sidebar to check report quality."}
          </p>
          {validationError && (
            <div
              className="text-sm rounded-md px-3 py-2"
              style={{ background: "var(--danger-bg)", color: "var(--danger-fg)", border: "1px solid var(--danger-border)" }}
            >
              {validationError}
            </div>
          )}
        </div>
      ) : (
        <>
          {v?.confidence_overall && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold" style={{ color: "var(--neutral-dark)" }}>
                {t("overall_conf")}:
              </span>
              <Badge style={levelBadge(v.confidence_overall)}>{v.confidence_overall}</Badge>
            </div>
          )}
          {!v?.issues || v.issues.length === 0
            ? <p className="text-sm" style={{ color: "var(--neutral-mid)" }}>{t("no_issues")}</p>
            : (
              <TableWrap>
                <thead>
                  <tr style={{ background: "var(--bg)" }}>
                    <Th>{t("th_section")}</Th><Th>{t("th_severity")}</Th><Th>{t("th_desc")}</Th>
                  </tr>
                </thead>
                <tbody>
                  {v.issues.map((iss, i) => (
                    <tr key={i}>
                      <Td>{iss.section || "—"}</Td>
                      <Td>
                        <Badge style={(iss.severity ?? "").toLowerCase() === "error" ? scoreBadge(9) : scoreBadge(6)}>
                          {iss.severity || "—"}
                        </Badge>
                      </Td>
                      <Td>{iss.description || "—"}</Td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            )}
          {v?.data_quality_notes && (
            <p className="text-[11px] italic mt-3" style={{ color: "var(--neutral-mid)" }}>{v.data_quality_notes}</p>
          )}
        </>
      )}
    </Section>
  );
}
