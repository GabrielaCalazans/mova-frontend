import { Link } from "react-router-dom";
<<<<<<< HEAD
import BottomNav from "../components/BottomNav";
=======
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
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
<<<<<<< HEAD
  wordmark,
  tagline,
  compactLogo = false,
  align = "center",
  hideTitle = false,
  hasBottomNav = false,
}) {
  return (
    <main className={`auth-page${hasBottomNav ? " auth-page--with-bottom-nav" : ""}`}>
      <section className={`auth-card${align === "left" ? " auth-card--left" : ""}`}>
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
        <h1 className={hideTitle ? "auth-title--sr-only" : undefined}>{title}</h1>
=======
}) {
  return (
    <main className="auth-page">
      <section className="auth-card">
        {topBarSlot}
        {logoSrc && <img src={logoSrc} className="auth-logo" alt={logoAlt} />}
        <h1>{title}</h1>
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244

        {children}

        {footerText && footerLinkTo && footerLinkLabel && (
          <p className="auth-footer">
            {footerText} <Link to={footerLinkTo}>{footerLinkLabel}</Link>
          </p>
        )}
      </section>
<<<<<<< HEAD
      {hasBottomNav && <BottomNav />}
=======
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
    </main>
  );
}

export default AuthLayout;