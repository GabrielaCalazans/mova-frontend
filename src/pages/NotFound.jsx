import { Link } from "react-router-dom";
import "../styles/journey.css";
import "../styles/postcompra.css";
import { t } from "../i18n";

function NotFound() {
  return (
    <main className="journey-page">
      <section className="state-block" aria-labelledby="not-found-title">
        <p className="notfound__code">{t("common.notFound.code")}</p>
        <h1 id="not-found-title">{t("common.notFound.title")}</h1>
        <p className="state-block__text">{t("common.notFound.text")}</p>
        <div className="journey-actions">
          <Link to="/" className="btn">{t("common.notFound.home")}</Link>
          <Link to="/login" className="btn btn--secondary">{t("common.notFound.login")}</Link>
        </div>
      </section>
    </main>
  );
}

export default NotFound;
