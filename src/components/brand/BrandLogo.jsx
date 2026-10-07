import { t } from "../../i18n";

const VARIANTS = {
  header: { file: "logo-header.png", width: 585, height: 180 },
  loading: { file: "logo-loading.png", width: 640, height: 480 },
  icon: { file: "icon-loading.png", width: 256, height: 256 },
};

export default function BrandLogo({ variant = "header", label, className = "", decorative = false }) {
  const { file, width, height } = VARIANTS[variant];
  const a11y = decorative ? { "aria-hidden": true } : { role: "img", "aria-label": label ?? t("common.brand.name") };

  return (
    <span className={`brand-logo brand-logo--${variant} ${className}`.trim()} {...a11y}>
      <img className="brand-img brand-img--light" src={`/brand/light/${file}`} width={width} height={height} alt="" decoding="async" />
      <img className="brand-img brand-img--dark" src={`/brand/dark/${file}`} width={width} height={height} alt="" decoding="async" />
    </span>
  );
}
