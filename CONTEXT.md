# PharmaCI — Project Context for Antigravity

## What this is
React frontend for a Pharma Competitive Intelligence tool.
Data comes from an n8n webhook at: https://agent-8.duckdns.org/webhook/ci-agent

## API contract
The webhook returns a JSON report with this structure:
[
  {
    "query": "KRAS G12C",
    "reference_drug": "sotorasib",
    "generated_at": "2026-05-26T07:14:39.611Z",
    "executive_summary": "...",
    "pipeline": {
      "total_active_trials": 9,
      "by_phase": { "Phase 1": 7, "Phase 2": 0, "Phase 3": 2 },
      "trials": [
        {
          "nct_id": "NCT06252649",
          "title": "...",
          "phase": "Phase 3",
          "status": "RECRUITING",
          "sponsor": "Amgen",
          "intervention": "...",
          "primary_outcome": "...",
          "completion_date": "2028-01-31",
          "enrollment": 450,
          "regulatory_designations": [],
          "strategic_notes": "..."
        }
      ]
    },
    "approved_drugs": [
      {
        "brand_name": "LUMAKRAS",
        "generic_name": "SOTORASIB",
        "manufacturer": "Amgen Inc",
        "indication_summary": "...",
        "agency": "FDA"
      }
    ],
    "threat_assessment": {
      "summary": "...",
      "threats": [
        {
          "drug": "Divarasib",
          "sponsor": "Hoffmann-La Roche",
          "phase": "Phase 3",
          "threat_score": 9,
          "rationale": "...",
          "key_differentiator": "..."
        }
      ]
    },
    "time_to_market_forecast": {
      "methodology_note": "Estimates based on BIO 2021 benchmarks. Fast track/breakthrough designation reduces FDA timeline by 3-6 months.",
      "assets": [
        {
          "drug": "Sotorasib (mCRC combo)",
          "sponsor": "Amgen",
          "current_phase": "Phase 3",
          "phase_success_probability": "58%",
          "estimated_fda_approval": "2030-2031",
          "estimated_ema_approval": "2031-2032",
          "estimated_italy_reimbursement": "2032-2033",
          "accelerating_factors": []
        }
      ]
    },
    "aifa_innovativity": {
      "methodology_note": "...",
      "assets": [
        {
          "drug": "Sotorasib (combination)",
          "unmet_need_score": "high",
          "added_value_score": "medium",
          "evidence_quality_score": "medium",
          "innovativity_probability": "medium",
          "rationale": "..."
        }
      ]
    },
    "endpoint_benchmarking": {
      "data_note": "Data extracted from available abstracts — partial coverage only.",
      "competitors": [
        {
          "drug": "...",
          "sponsor": "...",
          "pfs_months": null,
          "os_months": null,
          "orr_percent": null,
          "therapeutic_setting": "1L / 2L / adjuvant / neoadjuvant / etc.",
          "study_context": "...",
          "source_pmid": null
        }
      ]
    },
    "top_publications": [
      {
        "pmid": "40783289",
        "title": "...",
        "journal": "...",
        "authors": "...",
        "date": "2025 Aug 9",
        "pubmed_url": "https://pubmed.ncbi.nlm.nih.gov/40783289",
        "relevance_note": "..."
      }
    ],
    "chart_data": {
      "pipeline_by_phase_chart": [{ "phase": "Phase 1", "trials": 7 }],
      "publications_by_month_chart": [{ "month": "2025-06", "publications": 4 }],
      "threat_scores_chart": [{ "drug": "Divarasib", "score": 9, "color": "red" }],
      "timeline_chart": [
        {
          "drug": "Sotorasib (mCRC combo)",
          "sponsor": "Amgen",
          "phase": "Phase 3",
          "probability": "58%",
          "fda_start": 2030, "fda_end": 2031,
          "ema_start": 2031, "ema_end": 2032,
          "italy_start": 2032, "italy_end": 2033
        }
      ]
    },
    "stats": {
      "publications": 20
    },
    "validation": null,
    "status": "success"
  }
]

## Known quirks
- report.stats.publications = total publications count (use this for the chip, NOT top_publications.length) — BUG FIXED in ExecSummary.tsx
- chart_data.pipeline_by_phase_chart = array pre-formatted for Recharts
- chart_data.publications_by_month_chart = array pre-formatted for Recharts, already sorted
- chart_data.timeline_chart = array with fda_start/fda_end/ema_start/ema_end/italy_start/italy_end as integers (years)
- validation is null until user clicks "Run Validation" (separate POST to /webhook/ci-agent-critic)
- approved_drugs now includes optional "agency" field ("FDA" | "EMA" | "BOTH") — used to filter/badge in the UI
- endpoint_benchmarking rows now include optional "therapeutic_setting" field (e.g. "1L", "2L", "adjuvant")

## Design system (updated — Corporate Minimal)
| Token | Value | Usage |
|---|---|---|
| `--color-accent` | `#d97757` | CTAs, highlights, primary series, active states |
| `--color-contrast` | `#6a9bcc` | Secondary badges, info states, secondary charts |
| `--color-neutral-dark` | `#141413` | Body text, headings, structural elements |
| `--color-neutral-mid` | `#b0aea5` | Labels, muted text, secondary annotations |
| `--color-bg` | `#faf9f5` | Page / canvas background |
| `--color-surface` | `#ffffff` | Cards, modals, input fields |
| `--color-border` | `#e2e0db` | Card borders, dividers |

Chart color assignment:
- Primary series / growth / high threat → `#d97757`
- Secondary series / contrast / info    → `#6a9bcc`
- Historical / neutral                  → `#141413`
- Muted / placeholders                  → `#b0aea5`

## n8n backend notes
- Main workflow: POST /webhook/ci-agent-core (renamed from ci-agent)
- Critic workflow: POST /webhook/ci-agent-critic
- EMA drug search: add OpenFDA EMA-equivalent or EMA EPAR API call in parallel with FDA node
  - EMA EPAR API: https://www.ema.europa.eu/en/medicines/download-medicine-data (CSV/Excel)
  - Alternative: filter OpenFDA results by market (EU) or add a separate EMA node
  - approved_drugs array should include { ..., agency: "FDA" | "EMA" | "BOTH" }

## Open bugs (all resolved)
- [FIXED] Publications chip showed top_publications.length instead of stats.publications
