import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { useForceOpen } from "./force-open";

export function Section({
  icon,
  title,
  count,
  subtitle,
  defaultOpen = false,
  children,
  statusDot,
}: {
  icon?: ReactNode;
  title: string;
  count?: number;
  subtitle?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  statusDot?: "ok" | "warn";
}) {
  const [openState, setOpen] = useState(defaultOpen);
  const forced = useForceOpen();
  const open = forced || openState;
  return (
    <section className="rounded-2xl bg-card shadow-sm border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-surface/60 transition text-left"
      >
        {statusDot && (
          <span
            className={`h-3 w-3 rounded-full ${statusDot === "ok" ? "bg-success" : "bg-warning"}`}
          />
        )}
        {icon && <span className="text-xl leading-none">{icon}</span>}
        <h2 className="text-lg font-semibold text-accent-dark flex-1 m-0">{title}</h2>
        {subtitle && <span className="text-sm text-muted-foreground hidden sm:inline">{subtitle}</span>}
        {typeof count === "number" && (
          <span className="rounded-full bg-accent text-accent-foreground text-xs font-semibold px-2.5 py-1">
            {count}
          </span>
        )}
        <ChevronDown
          className={`h-5 w-5 text-accent-dark transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`collapsible-content grid transition-all duration-300 ease-in-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 pt-1 border-t border-border">{children}</div>
        </div>
      </div>
    </section>
  );
}
