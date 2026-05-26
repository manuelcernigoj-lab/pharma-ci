import { useI18n } from "@/lib/i18n";
import logo from "@/assets/logo.png";

export function Brand({ size = "md" }: { size?: "md" | "lg" }) {
  const { t } = useI18n();
  const big = size === "lg";
  return (
    <div className="flex items-center gap-3">
      <img
        src={logo}
        alt="PharmaCI logo"
        className={`${big ? "h-12 w-12" : "h-9 w-9"} rounded-xl object-contain`}
      />
      <div className="leading-tight">
        <div className={`${big ? "text-3xl" : "text-xl"} font-bold text-accent-dark tracking-tight`}>
          PharmaCI
        </div>
        {big && <div className="text-sm text-muted-foreground">{t("brand_tag")}</div>}
      </div>
    </div>
  );
}
