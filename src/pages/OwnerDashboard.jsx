import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import "../styles/owner.css";
import { getFinanceiro, getFrota, getReservas, getUtilizacao } from "../services/dashboardService";
import { formatCurrency, formatNumber, t } from "../i18n";

const sections = [
  ["frota", getFrota],
  ["reservas", getReservas],
  ["financeiro", getFinanceiro],
  ["utilizacao", getUtilizacao],
];

function valueOrUnavailable(value, format = (item) => item) {
  return value === null || value === undefined ? t("owner.dashboard.unavailable") : format(value);
}

export default function OwnerDashboard() {
  const [data, setData] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = t("owner.dashboard.docTitle");
    let active = true;

    Promise.all(sections.map(async ([key, load]) => {
      try {
        return [key, { ok: true, value: await load() }];
      } catch (error) {
        return [key, { ok: false, message: error?.message || t("owner.dashboard.blockError") }];
      }
    })).then((results) => {
      if (!active) return;
      const nextData = {};
      const nextErrors = {};
      results.forEach(([key, result]) => {
        if (result.ok) nextData[key] = result.value;
        else nextErrors[key] = result.message;
      });
      setData(nextData);
      setErrors(nextErrors);
      setLoading(false);
    });

    return () => { active = false; };
  }, []);

  const frota = data.frota;
  const reservas = data.reservas;
  const utilizacao = data.utilizacao;
  const financeiro = data.financeiro;
  const alertas = frota?.alertasPorTipo || {};
  // Antes da resposta, "Indisponível" afirmaria algo que ainda não se sabe.
  const show = (value, format) => (loading ? t("owner.common.loading") : valueOrUnavailable(value, format));

  return (
    <main className="owner-page" aria-labelledby="owner-dashboard-title">
      <header className="page-head">
        <h1 id="owner-dashboard-title">{t("owner.dashboard.title")}</h1>
        <p className="page-head__lede">{t("owner.dashboard.lede")}</p>
      </header>

      <section aria-label={t("owner.dashboard.summaryLabel")} aria-busy={loading || undefined}>
        <dl className="owner-summary">
          <div className="owner-summary__item">
            <dt>{t("owner.dashboard.vehicles")}</dt>
            {errors.frota ? <dd role="alert">{errors.frota}</dd> : <dd>{show(frota?.veiculos?.total, (value) => t("owner.dashboard.vehiclesTotal", { value }))}</dd>}
            <dd className="owner-summary__link"><Link className="owner-link" to="/cadastro-carros">{t("owner.dashboard.openFleet")} <ChevronRight aria-hidden="true" /></Link></dd>
          </div>
          <div className="owner-summary__item">
            <dt>{t("owner.dashboard.reservations")}</dt>
            {errors.reservas ? <dd role="alert">{errors.reservas}</dd> : <dd>{show(reservas?.total, (value) => t("owner.dashboard.reservationsPeriod", { value }))}</dd>}
            <dd className="owner-summary__link"><Link className="owner-link" to="/reservas">{t("owner.dashboard.viewReservations")} <ChevronRight aria-hidden="true" /></Link></dd>
          </div>
          <div className="owner-summary__item">
            <dt>{t("owner.dashboard.occupancy")}</dt>
            {errors.utilizacao ? <dd role="alert">{errors.utilizacao}</dd> : <dd>{show(utilizacao?.taxaOcupacao, (value) => t("owner.dashboard.occupancyValue", { rate: formatNumber(Number(value) * 100), allocated: valueOrUnavailable(utilizacao?.veiculosAlocados, String) }))}</dd>}
            <dd className="owner-summary__link"><Link className="owner-link" to="/relatorios/veiculos">{t("owner.dashboard.viewReports")} <ChevronRight aria-hidden="true" /></Link></dd>
          </div>
          <div className="owner-summary__item">
            <dt>{t("owner.dashboard.revenue")}</dt>
            {errors.financeiro ? <dd role="alert">{errors.financeiro}</dd> : <dd>{show(financeiro?.faturamentoBruto, formatCurrency)}</dd>}
            <dd className="owner-summary__link"><Link className="owner-link" to="/relatorios/veiculos">{t("owner.dashboard.openFinance")} <ChevronRight aria-hidden="true" /></Link></dd>
          </div>
        </dl>
      </section>

      <section className="owner-section" aria-labelledby="owner-alerts-title">
        <div className="owner-section__head">
          <h2 id="owner-alerts-title">{t("owner.dashboard.alertsTitle")}</h2>
          <Link className="btn btn--secondary" to="/monitoramento">{t("owner.dashboard.openMonitoring")}</Link>
        </div>
        {errors.frota ? <p className="alert alert--danger" role="alert">{errors.frota}</p> : (
          <ul className="owner-counts" aria-busy={loading || undefined}>
            <li><span className="owner-counts__value">{show(alertas.INATIVIDADE, String)}</span><span className="owner-counts__label">{t("owner.dashboard.inactivity")}</span><span className="owner-counts__desc">{t("owner.dashboard.inactivityDesc")}</span></li>
            <li><span className="owner-counts__value">{show(alertas.BAIXA_AVALIACAO, String)}</span><span className="owner-counts__label">{t("owner.dashboard.lowRating")}</span><span className="owner-counts__desc">{t("owner.dashboard.lowRatingDesc")}</span></li>
          </ul>
        )}
      </section>

      <section className="owner-section" aria-labelledby="owner-next-title">
        <div className="owner-section__head">
          <h2 id="owner-next-title">{t("owner.dashboard.nextTitle")}</h2>
        </div>
        <ul className="owner-actions">
          <li><Link to="/cadastro-garagens">{t("owner.dashboard.manageGarages")} <ChevronRight aria-hidden="true" /></Link></li>
          <li><Link to="/cadastro-carros">{t("owner.dashboard.manageVehicles")} <ChevronRight aria-hidden="true" /></Link></li>
        </ul>
        <p className="owner-note">{t("owner.dashboard.mileageNote")}</p>
      </section>
    </main>
  );
}
