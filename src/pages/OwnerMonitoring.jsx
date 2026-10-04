import FrotaMonitoramento from "../components/FrotaMonitoramento";
import { t } from "../i18n";
import "../styles/owner.css";

export default function OwnerMonitoring() {
  return (
    <main className="owner-page" aria-labelledby="owner-monitoring-title">
      <header className="page-head">
        <h1 id="owner-monitoring-title">{t("owner.monitoring.title")}</h1>
        <p className="page-head__lede">{t("owner.monitoring.lede")}</p>
      </header>
      <FrotaMonitoramento />
    </main>
  );
}
