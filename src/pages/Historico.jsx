import ReservasList from "../components/ReservasList";
import { useNavigate } from "react-router-dom";
import { t } from "../i18n";

export default function Historico() {
  const navigate = useNavigate();
  return (
    <div className="historico">
      <ReservasList
        title={t("reservation.history.title")}
        documentTitle={t("reservation.history.documentTitle")}
        somenteConcluidas={false}
        emptyMessage={t("reservation.history.empty")}
      />
      {/* Fica fora da lista para manter o atalho visível mesmo sem reservas. */}
      <section className="historico__pendencias" aria-label={t("reservation.history.pendingRegion")}>
        <p className="journey-muted">{t("reservation.history.pendingNotice")}</p>
        <button type="button" className="btn btn--secondary" onClick={() => navigate("/pendencias-financeiras")}>
          {t("reservation.history.viewPending")}
        </button>
      </section>
    </div>
  );
}
