import FrotaMonitoramento from "../components/FrotaMonitoramento";

export default function OwnerMonitoring() {
  return (
    <main className="owner-page" aria-labelledby="owner-monitoring-title">
        <header className="owner-page__intro">
          <p className="mova-eyebrow">Estado real da frota</p>
          <h1 id="owner-monitoring-title">Monitoramento</h1>
          <p>Localizações só aparecem quando fornecidas pela API para veículos do locador.</p>
        </header>
        <FrotaMonitoramento />
    </main>
  );
}
