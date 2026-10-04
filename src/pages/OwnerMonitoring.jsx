import FrotaMonitoramento from "../components/FrotaMonitoramento";
import "../styles/owner.css";

export default function OwnerMonitoring() {
  return (
    <main className="owner-page" aria-labelledby="owner-monitoring-title">
      <header className="page-head">
        <h1 id="owner-monitoring-title">Monitoramento</h1>
        <p className="page-head__lede">Localizações só aparecem quando fornecidas pela API para veículos do locador.</p>
      </header>
      <FrotaMonitoramento />
    </main>
  );
}
