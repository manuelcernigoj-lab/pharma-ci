import type { ReportData } from "./types";

type Setter = (val: string) => void;

// Collect all translatable fields. Returns parallel arrays of strings + setters
// so we can call the translation API once and write the results back.
export function collectTranslatable(data: ReportData): {
  texts: string[];
  setters: Setter[];
} {
  const texts: string[] = [];
  const setters: Setter[] = [];

  const push = (val: string | undefined, setter: Setter) => {
    if (typeof val === "string" && val.trim()) {
      texts.push(val);
      setters.push(setter);
    }
  };

  push(data.executive_summary, (v) => (data.executive_summary = v));

  data.pipeline?.trials?.forEach((tr) => {
    push(tr.strategic_notes, (v) => (tr.strategic_notes = v));
  });

  data.approved_drugs?.forEach((d) => {
    push(d.indication_summary, (v) => (d.indication_summary = v));
  });

  if (data.threat_assessment) {
    push(data.threat_assessment.summary, (v) => (data.threat_assessment!.summary = v));
    data.threat_assessment.threats?.forEach((t) => {
      push(t.rationale, (v) => (t.rationale = v));
      push(t.key_differentiator, (v) => (t.key_differentiator = v));
    });
  }

  if (data.time_to_market) {
    push(data.time_to_market.methodology_note, (v) => (data.time_to_market!.methodology_note = v));
  }

  if (data.aifa_innovativity) {
    push(data.aifa_innovativity.methodology_note, (v) => (data.aifa_innovativity!.methodology_note = v));
    data.aifa_innovativity.assets?.forEach((a) => {
      push(a.rationale, (v) => (a.rationale = v));
    });
  }

  data.top_publications?.forEach((p) => {
    push(p.relevance_note, (v) => (p.relevance_note = v));
  });

  if (data.validation) {
    push(data.validation.data_quality_notes, (v) => (data.validation!.data_quality_notes = v));
  }

  return { texts, setters };
}

export function applyTranslations(data: ReportData, translations: string[]) {
  const { setters } = collectTranslatable(data);
  setters.forEach((set, i) => {
    if (typeof translations[i] === "string") set(translations[i]);
  });
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
