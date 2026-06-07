import { useI18n } from "@/lib/i18n";
import logo from "@/assets/logo.png";

export function Brand({ size = "md" }: { size?: "md" | "lg" }) {
  const { t } = useI18n();
  const big   = size === "lg";
  return (
    <div className="flex items-center gap-3">
      <img
        src={logo}
        alt="PharmaCI logo"
        className={`${big ? "h-10 w-10" : "h-8 w-8"} rounded object-contain`}
      />
      <div className="leading-tight">
        <div
          className={`${big ? "text-[28px]" : "text-[18px]"} font-bold tracking-tight`}
          style={{ color: "var(--neutral-dark)" }}
        >
          PharmaCI
        </div>
        {big && (
          <div className="text-[12px]" style={{ color: "var(--neutral-mid)" }}>
            {t("brand_tag")}
          </div>
        )}
      </div>
    </div>
  );
}
