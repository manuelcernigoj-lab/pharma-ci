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
    "executive_summary": "The KRAS G12C landscape is shifting toward multi-drug combination strategies and the development of next-generation pan-KRAS and selective inhibitors. Amgen's Phase 3 focus on sotorasib in combination with panitumumab/FOLFIRI highlights a priority on overcoming resistance in mCRC. Simultaneously, competitive assets like divarasib and JAB-23E73 are advancing in both NSCLC and pan-solid tumor settings, indicating a move toward earlier line treatment and broader genomic targeting. While sotorasib maintains an established clinical presence, the rapid expansion of combination regimens from competitors suggests significant pressure on future market positioning. Strategic focus is now placed on maximizing survival outcomes through targeted combination therapies. Innovative approaches such as PROTACs and FTIs are also entering the clinical space to address intrinsic resistance. Market access for newer entrants will depend on demonstrating incremental PFS benefits over established standards.",
    "pipeline": {
      "total_active_trials": 9,
      "by_phase": {
        "Phase 1": 7,
        "Phase 2": 0,
        "Phase 3": 2
      },
      "trials": [
        {
          "nct_id": "NCT06252649",
          "title": "Study of Sotorasib, Panitumumab and FOLFIRI Versus FOLFIRI With or Without Bevacizumab-awwb in Treatment-naïve Participants With Metastatic Colorectal Cancer With KRAS p.G12C Mutation",
          "phase": "Phase 3",
          "status": "RECRUITING",
          "sponsor": "Amgen",
          "intervention": "FOLFIRI Regimen, Sotorasib, Panitumumab, Bevacizumab-awwb",
          "primary_outcome": "PFS per Response Evaluation Criteria in Solid Tumors (RECIST v1.1)",
          "completion_date": "2028-01-31",
          "enrollment": 450,
          "regulatory_designations": [],
          "strategic_notes": "Targets the treatment-naive metastatic population to improve progression-free survival in combination with anti-EGFR therapy."
        },
        {
          "nct_id": "NCT06793215",
          "title": "A Study Evaluating the Efficacy and Safety of Divarasib and Pembrol and Pembrolizumab Versus Pembrolizumab and Pemetrexed and Carboplatin or Cisplatin in Participants With Previously Untreated, KRAS G12C-Mutated, Advanced or Metastatic Non-Squamous Non-Small Cell Lung Cancer",
          "phase": "Phase 3",
          "status": "RECRUITING",
          "sponsor": "Hoffmann-La Roche",
          "intervention": "Divarasib, Pembrolizumab, Pemetrexed, Carboplatin, Cisplatin",
          "primary_outcome": "Progression-Free Survival (PFS); Overall Survival (OS)",
          "completion_date": "2028-11-30",
          "enrollment": 600,
          "regulatory_designations": [],
          "strategic_notes": "Divarasib is being positioned as a direct challenger in the first-line setting for NSCLC against platinum-based chemotherapy."
        },
        {
          "nct_id": "NCT05585320",
          "title": "A Phase 1/2a Study of IMM-1-104 in Participants With Advanced or Metastatic Solid Tumors",
          "phase": "Phase 1/2",
          "status": "ACTIVE_NOT_RECRUITING",
          "sponsor": "Immuneering Corporation",
          "intervention": "IMM-1-104 Monotherapy (Treatment Group A), IMM-1-104 + modified Gemcitabine/nab-Paclitaxel (Treatment Group B), IMM-1-104 + modified FOLFIRINOX (Treatment Group C), IMM-1-104 + dabrafenib (Treatment Group D), IMM-1-104 + pembrolizumab (Treatment Group E)",
          "primary_outcome": "Phase 1: Adverse Events; Phase 1: Dose-Limiting Toxicities; Phase 1: Recommended Phase 2 Candidate Optimal Dose; Phase 2a: Overall Response Rate",
          "completion_date": "2026-06",
          "enrollment": 209,
          "regulatory_designations": [],
          "strategic_notes": "Broad exploration of combination therapy strategies for various RAS-mutant solid tumors."
        },
        {
          "nct_id": "NCT06959615",
          "title": "A Phase I/IIa Study of JAB-23E73 in Patients With Advanced Solid Tumors Harboring KRAS Gene Alteration",
          "phase": "Phase 1/2",
          "status": "RECRUITING",
          "sponsor": "Jacobio Pharmaceuticals Co., Ltd.",
          "intervention": "JAB-23E73",
          "primary_outcome": "Phase 1: Number of participants with dose limiting toxicities (DLT); Phase 2a: Objective response rate (ORR)",
          "completion_date": "2026-12-31",
          "enrollment": 334,
          "regulatory_designations": [],
          "strategic_notes": "Evaluating a pan-KRAS inhibitor which could provide a competitive advantage over G12C-specific inhibitors."
        },
        {
          "nct_id": "NCT06235983",
          "title": "A Study of LY3537982 in Chinese Participants With Advanced Solid Tumors",
          "phase": "Phase 1",
          "status": "ACTIVE_NOT_RECRUITING",
          "sponsor": "Eli Lilly and Company",
          "intervention": "LY3537982",
          "primary_outcome": "Pharmacokinetics (PK): Maximum Observed Plasma Concentration (Cmax) of LY3537982; PK: Area Under the Plasma Concentration Versus Time Curve (AUC) of L",
          "completion_date": "2026-04",
          "enrollment": 12,
          "regulatory_designations": [],
          "strategic_notes": "Focus on regional pharmacokinetic validation for G12C inhibition."
        },
        {
          "nct_id": "NCT06946927",
          "title": "A Phase Ib Study of JMKX001899 in Combination With Other Therapies in Advanced NSCLC Harboring KRAS G12C Mutation",
          "phase": "Phase 1",
          "status": "RECRUITING",
          "sponsor": "Jemincare",
          "intervention": "JMKX001899, IN10018, Chemotherapy: Pemetrexed, Carboplatin",
          "primary_outcome": "Recommended Phase II dose (RP2D); adverse events",
          "completion_date": "2026-02",
          "enrollment": 72,
          "regulatory_designations": [],
          "strategic_notes": "Combinatorial approach using novel agents alongside standard platinum-doublet chemotherapy."
        },
        {
          "nct_id": "NCT06026410",
          "title": "KO-2806 Monotherapy and Combination Therapies in Advanced Solid Tumors",
          "phase": "Phase 1",
          "status": "RECRUITING",
          "sponsor": "Kura Oncology, Inc.",
          "intervention": "Darlifarnib, Cabozantinib, Adagrasib",
          "primary_outcome": "Rate of dose-limiting toxicities (DLTs); Descriptive statistics of adverse events (AEs); Incidence of dose interruptions, reductions, and discontinuat",
          "completion_date": "2027-01",
          "enrollment": 300,
          "regulatory_designations": [],
          "strategic_notes": "Evaluating farnesyltransferase inhibitor synergy with existing G12C inhibitors."
        },
        {
          "nct_id": "NCT05504278",
          "title": "Efficacy and Safety of IBI351 in Combination With Chemotherapy in Advanced Non-squamous Non-small Cell Lung Cancer Subjects With KRAS G12C Mutation",
          "phase": "Phase 1",
          "status": "RECRUITING",
          "sponsor": "Innovent Biologics (Suzhou) Co. Ltd.",
          "intervention": "IBI351, Cetuximab, pemetrexed, Carboplatin, Sintilimab, cis-platinum",
          "primary_outcome": "Number of participants with dose limiting toxicity; Evaluate clinical efficacy of IBI351 in combination with other therapeutic agents; Safety indicato",
          "completion_date": "2025-05-31",
          "enrollment": 144,
          "regulatory_designations": [],
          "strategic_notes": "Explores intensive combination therapy including anti-EGFR and immune checkpoint inhibitors."
        },
        {
          "nct_id": "NCT03260491",
          "title": "U3-1402 in Metastatic or Unresectable Non-Small Cell Lung Cancer",
          "phase": "Phase 1",
          "status": "ACTIVE_NOT_RECRUITING",
          "sponsor": "Daiichi Sankyo",
          "intervention": "HER3-DXd (FL-DP), HER3-DXd (CTM-1 Lyo-DP), HER3-DXd (CTM-3 Lyo-DP)",
          "primary_outcome": "Dose-limiting toxicities (DLTs) during dose escalation; Summary of adverse events during dose escalation; Overall response rate (ORR) assessed by Blin",
          "completion_date": "2026-03-31",
          "enrollment": 312,
          "regulatory_designations": [],
          "strategic_notes": "Evaluating targeted payload efficacy in advanced NSCLC populations."
        }
      ]
    },
    "approved_drugs": [
      {
        "brand_name": "LUMAKRAS",
        "generic_name": "SOTORASIB",
        "manufacturer": "Amgen Inc",
        "indication_summary": "Indicated for adult patients with KRAS G12C-mutated locally advanced or metastatic NSCLC after at least one prior systemic therapy."
      }
    ],
    "threat_assessment": {
      "summary": "The primary threats arise from agents in Phase 3 or advanced Phase 1/2 trials that focus on combinations to bypass intrinsic resistance or improve first-line outcomes. Divarasib is the most imminent clinical threat, directly targeting first-line NSCLC.",
      "threats": [
        {
          "drug": "Divarasib",
          "sponsor": "Hoffmann-La Roche",
          "phase": "Phase 3",
          "threat_score": 9,
          "threat_rationale": "Directly targets the first-line NSCLC indication currently held by standard of care treatments with a potential for superior combo efficacy.",
          "key_differentiator": "Combination potential with PD-1 inhibitors in first-line treatment."
        },
        {
          "drug": "JAB-23E73",
          "sponsor": "Jacobio Pharmaceuticals Co., Ltd.",
          "phase": "Phase 1/2",
          "threat_score": 6,
          "threat_rationale": "The pan-KRAS mechanism potentially addresses a broader patient cohort than G12C-specific agents.",
          "key_differentiator": "Pan-KRAS activity versus target-specific mutation."
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
        },
        {
          "drug": "Divarasib",
          "sponsor": "Hoffmann-La Roche",
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
      "methodology_note": "Qualitative assessment based on 3 AIFA criteria: unmet medical need, added therapeutic value vs SoC, evidence quality.",
      "assets": [
        {
          "drug": "Sotorasib (combination)",
          "unmet_need_score": "high",
          "added_value_score": "medium",
          "evidence_quality_score": "medium",
          "innovativity_probability": "medium",
          "rationale": "High unmet need in refractory CRC, but evidence rests on combination strategies requiring further validation."
        }
      ]
    },
    "endpoint_benchmarking": {
      "data_note": "Data extracted from available abstracts — partial coverage only.",
      "competitors": []
    },
    "top_publications": [
      {
        "pmid": "40783289",
        "title": "Adagrasib versus docetaxel in KRAS(G12C)-mutated non-small-cell lung cancer (KRYSTAL-12): a randomised, open-label, phase 3 trial.",
        "journal": "Lancet (London, England)",
        "authors": "Barlesi F, Yao W, Duruisseaux M",
        "date": "2025 Aug 9",
        "pubmed_url": "https://pubmed.ncbi.nlm.nih.gov/40783289",
        "relevance_note": "Provides benchmark data for KRAS G12C inhibition in NSCLC."
      },
      {
        "pmid": "40215429",
        "title": "Overall Survival Analysis of the Phase III CodeBreaK 300 Study of Sotorasib Plus Panitumumab Versus Investigator's Choice in Chemorefractory KRAS G12C Colorectal Cancer.",
        "journal": "Journal of clinical oncology : official journal of the American Society of Clinical Oncology",
        "authors": "Pietrantonio F, Salvatore L, Esaki T",
        "date": "2025 Jul",
        "pubmed_url": "https://pubmed.ncbi.nlm.nih.gov/40215429",
        "relevance_note": "Key clinical study reporting efficacy of sotorasib in combination with panitumumab."
      }
    ],
    "chart_data": {
      "pipeline_by_phase": {
        "Phase 1": 7,
        "Phase 2": 0,
        "Phase 3": 2
      },
      "publications_by_month": {
        "2025-07": 5,
        "2025-10": 2,
        "2025-06": 4,
        "2025-08": 3,
        "2025-11": 1,
        "2026-03": 1,
        "2025-09": 2,
        "2026-01": 1,
        "2026-04": 1
      },
      "threat_scores": [
        {
          "drug": "Divarasib",
          "score": 9
        },
        {
          "drug": "JAB-23E73",
          "score": 6
        }
      ],
      "pipeline_by_phase_chart": [
        {
          "phase": "Phase 1",
          "trials": 7
        },
        {
          "phase": "Phase 2",
          "trials": 0
        },
        {
          "phase": "Phase 3",
          "trials": 2
        }
      ],
      "publications_by_month_chart": [
        {
          "month": "2025-06",
          "publications": 4
        },
        {
          "month": "2025-07",
          "publications": 5
        },
        {
          "month": "2025-08",
          "publications": 3
        },
        {
          "month": "2025-09",
          "publications": 2
        },
        {
          "month": "2025-10",
          "publications": 2
        },
        {
          "month": "2025-11",
          "publications": 1
        },
        {
          "month": "2026-01",
          "publications": 1
        },
        {
          "month": "2026-03",
          "publications": 1
        },
        {
          "month": "2026-04",
          "publications": 1
        }
      ],
      "threat_scores_chart": [
        {
          "drug": "Divarasib",
          "score": 9,
          "color": "red"
        },
        {
          "drug": "JAB-23E73",
          "score": 6,
          "color": "yellow"
        }
      ],
      "timeline_chart": [
        {
          "drug": "Sotorasib (mCRC combo)",
          "sponsor": "Amgen",
          "phase": "Phase 3",
          "probability": "58%",
          "fda_start": 2030,
          "fda_end": 2031,
          "ema_start": 2031,
          "ema_end": 2032,
          "italy_start": 2032,
          "italy_end": 2033
        },
        {
          "drug": "Divarasib",
          "sponsor": "Hoffmann-La Roche",
          "phase": "Phase 3",
          "probability": "58%",
          "fda_start": 2030,
          "fda_end": 2031,
          "ema_start": 2031,
          "ema_end": 2032,
          "italy_start": 2032,
          "italy_end": 2033
        }
      ]
    },
    "validation": null,
    "status": "success"
  }
]

## Known quirks
- report.stats.publications = total publications count (use this for the chip, NOT top_publications.length)
- chart_data.pipeline_by_phase_chart = array pre-formatted for Recharts
- chart_data.publications_by_month_chart = array pre-formatted for Recharts, già ordinato
- chart_data.timeline_chart = array con fda_start/fda_end/ema_start/ema_end/italy_start/italy_end come interi (anni)
- validation è null finché l'utente non clicca "Run Validation" (POST separato a /webhook/ci-agent-critic)

## Design system
| Token | Value |
|---|---|
| Background | `#f4fffb` |
| Surface / cards | `#d3f7ec` |
| Accent light | `#9fe5d0` |
| Accent primary | `#4ec2a7` |
| Accent dark / text | `#1f7f6e` |

## Open bugs
- Il chip "Publications" mostra top_publications.length (3) invece di stats.publications — da correggere