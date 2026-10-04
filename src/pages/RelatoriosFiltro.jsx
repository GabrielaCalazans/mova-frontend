import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import BottomNav from "../components/BottomNav";
import { t } from "../i18n";
import "../styles/owner.css";

export default function RelatoriosFiltro() {
  useEffect(() => {
    document.title = t("reports.hub.docTitle");
  }, []);

  return (
    <main className="owner-page" aria-labelledby="relatorios-title">
      <header className="page-head">
        <h1 id="relatorios-title">{t("reports.hub.title")}</h1>
        <p className="page-head__lede">{t("reports.hub.lede")}</p>
      </header>
      <ul className="owner-hub">
        <li>
          <Link to="/relatorios/veiculos">
            <span className="owner-hub__title">{t("reports.hub.fullTitle")} <ChevronRight aria-hidden="true" /></span>
            <span className="owner-hub__text">{t("reports.hub.fullText")}</span>
          </Link>
        </li>
        <li>
          <Link to="/relatorios/avaliacoes-filtro">
            <span className="owner-hub__title">{t("reports.hub.ratingsTitle")} <ChevronRight aria-hidden="true" /></span>
            <span className="owner-hub__text">{t("reports.hub.ratingsText")}</span>
          </Link>
        </li>
      </ul>
      <BottomNav />
    </main>
  );
}
