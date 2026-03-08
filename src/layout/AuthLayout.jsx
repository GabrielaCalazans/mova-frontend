import { Link } from "react-router-dom";
import "../styles/auth.css";

function AuthLayout({
  title,
  children,
  footerText,
  footerLinkTo,
  footerLinkLabel,
  logoSrc,
  logoAlt = "Logo",
}) {
  return (
    <main className="auth-page">
      <section className="auth-card">
        {logoSrc && <img src={logoSrc} className="auth-logo" alt={logoAlt} />}
        <h1>{title}</h1>

        {children}

        <p className="auth-footer">
          {footerText} <Link to={footerLinkTo}>{footerLinkLabel}</Link>
        </p>
      </section>
    </main>
  );
}

export default AuthLayout;