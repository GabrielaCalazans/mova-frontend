import { Link } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import "../styles/auth.css";

function AuthLayout({
  title,
  children,
  footerText,
  footerLinkTo,
  footerLinkLabel,
  logoSrc,
  logoAlt = "Logo",
  topBarSlot,
  wordmark,
  tagline,
  compactLogo = false,
  align = "center",
  hideTitle = false,
  hasBottomNav = false,
}) {
  return (
    <main className={`auth-page${hasBottomNav ? " auth-page--with-bottom-nav" : ""}`}>
      {(topBarSlot || logoSrc) && (
        <div className={`auth-header${align === "left" ? " auth-header--left" : ""}`}>
          {topBarSlot}
          {logoSrc && (
            <div className="auth-brand">
              <img
                src={logoSrc}
                className={`auth-logo${compactLogo ? " auth-logo--compact" : ""}`}
                alt={logoAlt}
              />
              {wordmark && <p className="auth-wordmark">{wordmark}</p>}
              {tagline && <p className="auth-tagline">{tagline}</p>}
            </div>
          )}
        </div>
      )}

      <section className={`auth-card${align === "left" ? " auth-card--left" : ""}`}>
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