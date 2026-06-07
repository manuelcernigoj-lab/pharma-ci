import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  PanelLeftClose, PanelLeftOpen, Home, Info, FileText,
  Menu, X, LayoutList, BarChart3, FlaskConical, Check, AlertTriangle,
  Calendar, Building2, Target, BookOpen, ShieldCheck,
  Loader2, Plus, Download, Globe,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import logo from "@/assets/logo.png";

export type SidebarPage = "home" | "report";

export interface ReportSidebarProps {
  validation?: unknown | null;
  validationPassed?: boolean;
  validating?: boolean;
  onRunValidation?: () => void;
  onOpenExport?: () => void;
}

interface SidebarProps extends ReportSidebarProps {
  page: SidebarPage;
}

const SECTIONS = [
  { id: "exec-summary",   labelEn: "Executive Summary",       labelIt: "Sintesi",               Icon: LayoutList    },
  { id: "visual-analysis",labelEn: "Visual Analysis",         labelIt: "Analisi Visiva",        Icon: BarChart3     },
  { id: "pipeline",       labelEn: "Clinical Pipeline",       labelIt: "Pipeline Clinica",      Icon: FlaskConical  },
  { id: "approved",       labelEn: "Approved Drugs",          labelIt: "Farmaci Approvati",     Icon: Check         },
  { id: "threat",         labelEn: "Threat Assessment",       labelIt: "Threat Assessment",     Icon: AlertTriangle },
  { id: "ttm",            labelEn: "Time to Market",          labelIt: "Time to Market",        Icon: Calendar      },
  { id: "innov",          labelEn: "AIFA Innovativity",       labelIt: "Innovatività AIFA",     Icon: Building2     },
  { id: "endpoint",       labelEn: "Endpoint Benchmarking",   labelIt: "Endpoint Benchmarking", Icon: Target        },
  { id: "literature",     labelEn: "Literature",              labelIt: "Letteratura",           Icon: BookOpen      },
  { id: "validation",     labelEn: "Validation",              labelIt: "Validazione",           Icon: ShieldCheck   },
];

export function Sidebar(props: SidebarProps) {
  const { page } = props;
  const { lang, setLang } = useI18n();
  const navigate = useNavigate();
  const [collapsed,    setCollapsed]   = useState(false);
  const [mobileOpen,   setMobileOpen]  = useState(false);
  const [activeSection,setActiveSection] = useState<string>(page === "report" ? "exec-summary" : "home");

  /* Scroll-spy for report sections */
  useEffect(() => {
    if (page !== "report") return;
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: [0, 0.2, 0.5, 1] }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [page]);

  /* Expose sidebar width as CSS variable */
  useEffect(() => {
    const w = collapsed ? "56px" : "224px";
    document.documentElement.style.setProperty("--sidebar-w", w);
    return () => { document.documentElement.style.setProperty("--sidebar-w", "0px"); };
  }, [collapsed]);

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    if (id === "__new__") { navigate({ to: "/" }); return; }
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    else if (id === "home") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const bodyProps = {
    ...props,
    collapsed: false,
    activeSection,
    onNavigate: scrollTo,
    lang,
    setLang,
  };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-40 p-2 rounded"
        style={{ color: "var(--accent-primary)" }}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex fixed left-0 top-0 h-screen flex-col z-30 transition-[width] duration-300 ease-out overflow-y-auto bg-white"
        style={{
          width: collapsed ? 56 : 224,
          borderRight: "1px solid var(--border-color)",
          scrollbarGutter: "stable",
        }}
      >
        <div className="pt-3 pb-1 shrink-0">
          <CollapseToggle collapsed={collapsed} onClick={() => setCollapsed((v) => !v)} lang={lang} />
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarBody {...bodyProps} collapsed={collapsed && !mobileOpen} />
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/20" onClick={() => setMobileOpen(false)} />
          <aside
            className="absolute left-0 top-0 h-full w-[260px] bg-white flex flex-col"
            style={{ borderRight: "1px solid var(--border-color)", boxShadow: "4px 0 20px rgba(0,0,0,0.08)" }}
          >
            <div className="flex items-center justify-between px-4 pt-5 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <img src={logo} alt="" className="h-5 w-5 rounded" />
                <span className="font-bold text-[15px]" style={{ color: "var(--neutral-dark)" }}>PharmaCI</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                style={{ color: "var(--neutral-mid)" }}
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarBody {...bodyProps} />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

/* ── Sidebar body ────────────────────────────────────────────── */
interface BodyProps extends ReportSidebarProps {
  page: SidebarPage;
  collapsed: boolean;
  activeSection: string;
  onNavigate: (id: string) => void;
  lang: "it" | "en";
  setLang: (l: "it" | "en") => void;
}

function SidebarBody({
  page, collapsed, activeSection, onNavigate, lang, setLang,
  validation, validationPassed, validating, onRunValidation, onOpenExport,
}: BodyProps) {
  const T = (en: string, it: string) => (lang === "it" ? it : en);
  return (
    <div className="flex flex-col h-full">
      {page === "home" && (
        <>
          <SectionLabel collapsed={collapsed}>{T("NAVIGATION", "NAVIGAZIONE")}</SectionLabel>
          <NavItem collapsed={collapsed} active={activeSection === "home"} Icon={Home}     label={T("Home", "Home")}           onClick={() => onNavigate("home")} />
          <NavItem collapsed={collapsed} active={activeSection === "how"}  Icon={Info}     label={T("How it works", "Come funziona")} onClick={() => onNavigate("how")} />
          <div className="flex-1" />
          <SectionLabel collapsed={collapsed}>{T("RESOURCES", "RISORSE")}</SectionLabel>
          <NavItem collapsed={collapsed} Icon={FileText} label={T("Docs", "Docs")} href="#" />
        </>
      )}

      {page === "report" && (
        <>
          <SectionLabel collapsed={collapsed}>{T("REPORT", "REPORT")}</SectionLabel>
          <NavItem
            collapsed={collapsed}
            Icon={Plus}
            label={T("New search", "Nuova ricerca")}
            onClick={() => onNavigate("__new__")}
          />
          <div className="mx-3 my-2" style={{ borderTop: "1px solid var(--border-color)" }} />
          {SECTIONS.map((s) => (
            <NavItem
              key={s.id}
              collapsed={collapsed}
              active={activeSection === s.id}
              Icon={s.Icon}
              label={T(s.labelEn, s.labelIt)}
              onClick={() => onNavigate(s.id)}
            />
          ))}
          <div className="mx-3 my-2" style={{ borderTop: "1px solid var(--border-color)" }} />
          <SectionLabel collapsed={collapsed}>{T("ACTIONS", "AZIONI")}</SectionLabel>
          <ActionButton
            collapsed={collapsed}
            Icon={validating ? Loader2 : ShieldCheck}
            iconSpin={validating}
            label={
              validating
                ? T("Validating...", "Validazione...")
                : validation
                  ? (validationPassed ? T("Validated ✓", "Validato ✓") : T("Warnings found", "Warning rilevati"))
                  : T("Run Validation", "Avvia Validazione")
            }
            onClick={onRunValidation}
            disabled={validating || !!validation}
            tone={validation ? (validationPassed ? "muted-ok" : "muted-warn") : "primary"}
          />
          <ActionButton
            collapsed={collapsed}
            Icon={Download}
            label={T("Export", "Esporta")}
            onClick={onOpenExport}
            tone="primary"
          />
          <div className="flex-1" />
        </>
      )}

      {/* Language toggle */}
      <div className="pb-3 shrink-0">
        <button
          type="button"
          onClick={() => setLang(lang === "it" ? "en" : "it")}
          className={`flex items-center gap-2.5 mx-2 my-0.5 rounded text-[12px] transition-colors w-[calc(100%-16px)]
            ${collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"}`}
          style={{ color: "var(--neutral-mid)" }}
          title={collapsed ? "EN / IT" : undefined}
        >
          <Globe size={16} className="flex-shrink-0" />
          {!collapsed && <span>{lang === "it" ? "IT / EN" : "EN / IT"}</span>}
        </button>
      </div>
    </div>
  );
}

/* ── Helper components ─────────────────────────────────────── */
function SectionLabel({ children, collapsed }: { children: ReactNode; collapsed: boolean }) {
  if (collapsed) return <div className="h-2" />;
  return (
    <div
      className="text-[9px] font-bold px-4 pt-4 pb-1 tracking-[0.12em]"
      style={{ color: "var(--neutral-mid)" }}
    >
      {children}
    </div>
  );
}

function NavItem({
  collapsed, active, Icon, label, onClick, href,
}: {
  collapsed: boolean;
  active?: boolean;
  Icon: React.ComponentType<{ size?: number }>;
  label: string;
  onClick?: () => void;
  href?: string;
}) {
  const base: React.CSSProperties = active
    ? { background: "#faf9f5", color: "var(--accent-primary)", fontWeight: 600 }
    : { color: "var(--neutral-mid)" };

  const cls = `flex items-center gap-2.5 mx-2 my-px rounded text-[13px] transition-colors cursor-pointer
    ${collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2"}`;

  const inner = (
    <>
      <Icon size={16} />
      {!collapsed && <span className="truncate">{label}</span>}
    </>
  );

  if (href) return <a href={href} className={cls} style={base} title={collapsed ? label : undefined}>{inner}</a>;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cls}
      style={base}
      title={collapsed ? label : undefined}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = "var(--neutral-dark)"; }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = "var(--neutral-mid)"; }}
    >
      {inner}
    </button>
  );
}

function ActionButton({
  collapsed, Icon, label, onClick, disabled, tone, iconSpin,
}: {
  collapsed: boolean;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  tone: "primary" | "muted-ok" | "muted-warn";
  iconSpin?: boolean;
}) {
  let style: React.CSSProperties;
  if (tone === "primary") {
    style = { background: "var(--accent-primary)", color: "#ffffff", border: "none" };
  } else if (tone === "muted-ok") {
    style = { background: "#e8f5ee", color: "#2d7a4f", border: "1px solid #b8dfc5" };
  } else {
    style = { background: "#fef3e2", color: "#8a5e0a", border: "1px solid #f0d090" };
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mx-2 my-1 rounded text-[12px] font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-default"
      style={{ ...style, height: 36, width: "calc(100% - 16px)" }}
      title={collapsed ? label : undefined}
    >
      <Icon size={14} className={iconSpin ? "animate-spin" : ""} />
      {!collapsed && <span className="truncate">{label}</span>}
    </button>
  );
}

function CollapseToggle({
  collapsed, onClick, lang,
}: {
  collapsed: boolean;
  onClick: () => void;
  lang: "it" | "en";
}) {
  const label = collapsed
    ? (lang === "it" ? "Espandi" : "Expand")
    : (lang === "it" ? "Comprimi" : "Collapse");
  const Icon  = collapsed ? PanelLeftOpen : PanelLeftClose;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex items-center gap-2.5 mx-2 my-px rounded text-[13px] transition-colors
        ${collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2"}`}
      style={{ color: "var(--neutral-mid)" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--neutral-dark)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--neutral-mid)"; }}
    >
      <Icon size={16} className="flex-shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </button>
  );
}
