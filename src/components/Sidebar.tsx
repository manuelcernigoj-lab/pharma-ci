import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  PanelLeftClose, PanelLeftOpen, Home, Info, Github, FileText, Globe,
  Menu, X, LayoutList, BarChart3, FlaskConical, Check, AlertTriangle,
  Calendar, Building2, Target, BookOpen, ShieldCheck,
  Loader2, Plus, Download,
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
  { id: "exec-summary", labelEn: "Executive Summary", labelIt: "Sintesi", Icon: LayoutList },
  { id: "visual-analysis", labelEn: "Visual Analysis", labelIt: "Analisi Visiva", Icon: BarChart3 },
  { id: "pipeline", labelEn: "Clinical Pipeline", labelIt: "Pipeline Clinica", Icon: FlaskConical },
  { id: "approved", labelEn: "Approved Drugs", labelIt: "Farmaci Approvati", Icon: Check },
  { id: "threat", labelEn: "Threat Assessment", labelIt: "Threat Assessment", Icon: AlertTriangle },
  { id: "ttm", labelEn: "Time to Market", labelIt: "Time to Market", Icon: Calendar },
  { id: "innov", labelEn: "AIFA Innovativity", labelIt: "Innovatività AIFA", Icon: Building2 },
  { id: "endpoint", labelEn: "Endpoint Benchmarking", labelIt: "Endpoint Benchmarking", Icon: Target },
  { id: "literature", labelEn: "Literature", labelIt: "Letteratura", Icon: BookOpen },
  { id: "validation", labelEn: "Validation", labelIt: "Validazione", Icon: ShieldCheck },
];

export function Sidebar(props: SidebarProps) {
  const { page } = props;
  const { lang, setLang } = useI18n();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>(page === "report" ? "exec-summary" : "home");

  // IntersectionObserver for report active section
  useEffect(() => {
    if (page !== "report") return;
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: [0, 0.2, 0.5, 1] }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [page]);

  // Expose sidebar width to layout via CSS variable on <html>
  useEffect(() => {
    const w = collapsed ? "56px" : "240px";
    document.documentElement.style.setProperty("--sidebar-w", w);
    return () => {
      document.documentElement.style.setProperty("--sidebar-w", "0px");
    };
  }, [collapsed]);

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    if (id === "__new__") {
      navigate({ to: "/" });
      return;
    }
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    else if (id === "home") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const sidebarBody = (
    <SidebarBody
      {...props}
      collapsed={collapsed && !mobileOpen}
      activeSection={activeSection}
      onNavigate={scrollTo}
      lang={lang}
      setLang={setLang}
    />
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-2 left-2 z-40 p-3 rounded-lg text-[#1f7f6e]"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex fixed left-0 top-0 h-screen bg-white border-r flex-col z-30 transition-[width] duration-300 ease-out overflow-y-auto"
        style={{
          width: collapsed ? 56 : 240,
          borderColor: "rgba(78,194,167,0.2)",
          scrollbarGutter: "stable",
        }}
      >
        <div className="pt-3 pb-1">
          <CollapseToggle
            collapsed={collapsed}
            onClick={() => setCollapsed((v) => !v)}
            lang={lang}
          />
        </div>
        <div className="flex-1">{sidebarBody}</div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className="absolute left-0 top-0 h-full w-[280px] bg-white flex flex-col animate-in slide-in-from-left duration-300"
            style={{ boxShadow: "4px 0 24px rgba(31,127,110,0.12)" }}
          >
            <div className="flex items-center justify-between px-4 pt-5 pb-3">
              <div className="flex items-center gap-2">
                <img src={logo} alt="" className="h-6 w-6 rounded" />
                <span className="font-bold text-[17px] text-[#1f7f6e]">PharmaCI</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="text-[#1f7f6e] p-1"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarBody
                {...props}
                collapsed={false}
                activeSection={activeSection}
                onNavigate={scrollTo}
                lang={lang}
                setLang={setLang}
              />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

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
          <NavItem collapsed={collapsed} active={activeSection === "home"} Icon={Home} label={T("Home", "Home")} onClick={() => onNavigate("home")} />
          <NavItem collapsed={collapsed} active={activeSection === "how"} Icon={Info} label={T("How it works", "Come funziona")} onClick={() => onNavigate("how")} />
          <div className="flex-1" />
          <SectionLabel collapsed={collapsed}>{T("RESOURCES", "RISORSE")}</SectionLabel>
          <NavItem collapsed={collapsed} Icon={Github} label="GitHub" href="#" />
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
          <div className="my-2 mx-4 border-t" style={{ borderColor: "rgba(78,194,167,0.15)" }} />
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
          <div className="my-2 mx-4 border-t" style={{ borderColor: "rgba(78,194,167,0.15)" }} />
          <SectionLabel collapsed={collapsed}>{T("ACTIONS", "AZIONI")}</SectionLabel>
          <ActionButton
            collapsed={collapsed}
            Icon={validating ? Loader2 : (validation ? (validationPassed ? ShieldCheck : AlertTriangle) : ShieldCheck)}
            iconSpin={validating}
            label={
              validating ? T("Validating...", "Validazione...")
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
      <div className="pb-3">
        <button
          type="button"
          onClick={() => setLang(lang === "it" ? "en" : "it")}
          className={
            "flex items-center gap-2.5 mx-2 my-0.5 rounded-lg text-sm transition-colors w-[calc(100%-16px)] hover:bg-[rgba(78,194,167,0.1)] " +
            (collapsed ? "justify-center px-0 py-2.5" : "px-4 py-2.5")
          }
          style={{ color: "rgba(31,127,110,0.7)" }}
          title={collapsed ? "EN / IT" : undefined}
        >
          <Globe size={18} className="flex-shrink-0" />
          {!collapsed && <span>{lang === "it" ? "IT / EN" : "EN / IT"}</span>}
        </button>
      </div>
    </div>
  );
}

function SectionLabel({ children, collapsed }: { children: ReactNode; collapsed: boolean }) {
  if (collapsed) return <div className="h-3" />;
  return (
    <div
      className="text-[10px] font-semibold px-4 pt-4 pb-1 tracking-[0.1em]"
      style={{ color: "#9fe5d0" }}
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
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  onClick?: () => void;
  href?: string;
}) {
  const cls =
    "flex items-center gap-2.5 mx-2 my-0.5 rounded-lg text-sm transition-colors cursor-pointer " +
    (collapsed ? "justify-center px-0 py-2.5" : "px-4 py-2.5");
  const style = active
    ? { background: "#d3f7ec", color: "#1f7f6e", fontWeight: 600 }
    : { color: "rgba(31,127,110,0.7)" };
  const content = (
    <>
      <Icon size={18} className="flex-shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </>
  );
  const common = {
    className: cls + (!active ? " hover:bg-[rgba(78,194,167,0.1)] hover:text-[#1f7f6e]" : ""),
    style,
    title: collapsed ? label : undefined,
  };
  if (href) return <a href={href} {...common}>{content}</a>;
  return <button type="button" onClick={onClick} {...common}>{content}</button>;
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
  let style: React.CSSProperties = {
    background: "linear-gradient(135deg, #4ec2a7 0%, #1f7f6e 100%)",
    color: "white",
    border: "none",
  };
  if (tone === "muted-ok") {
    style = {
      background: "rgba(78,194,167,0.15)",
      color: "#1f7f6e",
      border: "1px solid rgba(78,194,167,0.3)",
    };
  } else if (tone === "muted-warn") {
    style = {
      background: "rgba(224,180,82,0.15)",
      color: "#b7770d",
      border: "1px solid rgba(224,180,82,0.3)",
    };
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mx-2 my-1 rounded-lg text-[13px] font-semibold flex items-center justify-center gap-2 transition-all disabled:cursor-default"
      style={{ ...style, height: 38, width: "calc(100% - 16px)" }}
      title={collapsed ? label : undefined}
    >
      <Icon size={16} className={iconSpin ? "animate-spin" : ""} />
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
    ? (lang === "it" ? "Espandi menu" : "Expand menu")
    : (lang === "it" ? "Comprimi menu" : "Collapse menu");
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={
        "group relative flex items-center gap-2.5 mx-2 my-0.5 rounded-lg text-sm transition-colors hover:bg-[rgba(78,194,167,0.1)] hover:text-[#1f7f6e] " +
        (collapsed ? "justify-center px-0 py-2.5" : "px-4 py-2.5")
      }
      style={{ color: "rgba(31,127,110,0.7)" }}
    >
      <Icon size={18} className="flex-shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
      {collapsed && (
        <span
          className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity z-50"
          style={{ background: "#1f7f6e", color: "white" }}
        >
          {label}
        </span>
      )}
    </button>
  );
}
