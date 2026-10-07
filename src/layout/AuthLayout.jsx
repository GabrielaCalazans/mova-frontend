import { Link } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import BrandLogo from "../components/brand/BrandLogo";
import { useShell } from "../components/layout/shell-context";
import "../styles/auth.css";
import { t } from "../i18n";

function AuthLayout({
  title,
  children,
  footerText,
  footerLinkTo,
  footerLinkLabel,
  logoSrc,
  topBarSlot,
  align = "center",
  hideTitle = false,
  hasBottomNav = false,
}) {
  const shell = useShell();
  const showBrand = Boolean(logoSrc) && !shell;
  const slot = shell ? null : topBarSlot;

  return (
    <main className={`auth-page${shell ? " auth-page--in-shell" : ""}${align === "left" ? " auth-page--left" : ""}`}>
      {(slot || showBrand) && (
        <div className="auth-header">
          {slot}
          {showBrand && (
            <Link to="/" className="auth-brand" aria-label={t("common.brand.home")}>
              <BrandLogo variant="loading" decorative />
            </Link>
          )}
        </div>
      )}

      <section className="auth-card">
        <h1 className={hideTitle ? "auth-title--sr-only" : undefined}>{title}</h1>

        {children}

        {footerText && footerLinkTo && footerLinkLabel && (
          <p className="auth-footer">
            {footerText} <Link to={footerLinkTo}>{footerLinkLabel}</Link>
          </p>
        )}
      </section>
      {hasBottomNav && <BottomNav />}
    </main>
  );
}

export default AuthLayout;
