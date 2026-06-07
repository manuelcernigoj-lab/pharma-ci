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
  const open   = forced || openState;

  return (
    <section
      className="rounded-md bg-white overflow-hidden"
      style={{ border: "1px solid var(--border-color)" }}
    >
      {/* Header / trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors"
        style={{ background: open ? "#faf9f5" : "white" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#faf9f5"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = open ? "#faf9f5" : "white"; }}
      >
        {/* Status dot */}
        {statusDot && (
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ background: statusDot === "ok" ? "#5a9e6f" : "#c8922a" }}
          />
        )}

        {/* Icon */}
        {icon && <span className="leading-none shrink-0">{icon}</span>}

        {/* Title */}
        <h2
          className="text-[15px] font-bold flex-1 m-0"
          style={{ color: "var(--neutral-dark)" }}
        >
          {title}
        </h2>

        {/* Subtitle */}
        {subtitle && (
          <span
            className="text-[11px] hidden sm:inline"
            style={{ color: "var(--neutral-mid)" }}
          >
            {subtitle}
          </span>
        )}

        {/* Count badge */}
        {typeof count === "number" && (
          <span
            className="rounded-full text-[11px] font-semibold px-2.5 py-0.5"
            style={{
              background: "var(--accent-primary)",
              color: "#ffffff",
            }}
          >
            {count}
          </span>
        )}

        {/* Chevron */}
        <ChevronDown
          className={`h-4 w-4 transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
          style={{ color: "var(--neutral-mid)" }}
        />
      </button>

      {/* Collapsible body */}
      <div
        className={`collapsible-content grid transition-all duration-300 ease-in-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div
            className="px-5 pb-5 pt-3"
            style={{ borderTop: "1px solid var(--border-color)" }}
          >
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
