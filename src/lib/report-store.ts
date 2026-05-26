import type { ReportData } from "./types";

const KEY = "pharmaci.report";

let _report: ReportData | null = null;

function readStorage(): ReportData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ReportData) : null;
  } catch {
    return null;
  }
}

function writeStorage(data: ReportData | null) {
  if (typeof window === "undefined") return;
  try {
    if (data) window.sessionStorage.setItem(KEY, JSON.stringify(data));
    else window.sessionStorage.removeItem(KEY);
  } catch {
    /* quota / privacy mode — fall back to in-memory only */
  }
}

export const reportStore = {
  set(data: ReportData) {
    _report = data;
    writeStorage(data);
  },
  get(): ReportData | null {
    if (_report) return _report;
    const fromStorage = readStorage();
    if (fromStorage) _report = fromStorage;
    return _report;
  },
  clear() {
    _report = null;
    writeStorage(null);
  },
};
