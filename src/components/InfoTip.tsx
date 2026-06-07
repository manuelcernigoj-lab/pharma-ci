import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function InfoTip({ text }: { text: string }) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center transition-colors"
            style={{ color: "var(--neutral-mid)" }}
            aria-label="info"
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--neutral-dark)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--neutral-mid)"; }}
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs text-[11px] leading-relaxed"
          style={{
            background: "var(--neutral-dark)",
            color: "#ffffff",
            border: "none",
            borderRadius: "4px",
          }}
        >
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
