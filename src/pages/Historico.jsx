import { useState } from "react";
import ReservasList from "../components/ReservasList";
import { useNavigate } from "react-router-dom";
import { STATUS_RESERVA } from "../services/apiEnums";
import { t } from "../i18n";

// Aguardando pagamento acompanha as confirmadas: ainda não começou e precisa ficar visível no padrão.
const FILTROS = [
  { chave: "andamento", status: [STATUS_RESERVA.EM_ANDAMENTO], rotulo: () => t("reservation.history.filterInProgress") },
  { chave: "confirmadas", status: [STATUS_RESERVA.CONFIRMADA, STATUS_RESERVA.AGUARDANDO_PAGAMENTO], rotulo: () => t("reservation.history.filterConfirmed") },
  { chave: "concluidas", status: [STATUS_RESERVA.REALIZADA], rotulo: () => t("reservation.history.filterCompleted") },
  { chave: "canceladas", status: [STATUS_RESERVA.CANCELADA], rotulo: () => t("reservation.history.filterCanceled") },
];

export default function Historico() {
  const navigate = useNavigate();
  const [ativos, setAtivos] = useState(["andamento", "confirmadas"]);
  const alternar = (chave) =>
    setAtivos((atual) => (atual.includes(chave) ? atual.filter((c) => c !== chave) : [...atual, chave]));
  // Nenhum filtro marcado = sem filtro: mostra todas.
  const status = FILTROS.filter((f) => ativos.includes(f.chave)).flatMap((f) => f.status);
  const filtrando = ativos.length > 0 && ativos.length < FILTROS.length;

  return (
    <div className="historico">
      <ReservasList
        title={t("reservation.history.title")}
        documentTitle={t("reservation.history.documentTitle")}
        status={status}
        filtros={
          <div className="booking-filters" role="group" aria-label={t("reservation.history.filters")}>
            {FILTROS.map((filtro) => (
              <button
                key={filtro.chave}
                type="button"
                className="chip"
                aria-pressed={ativos.includes(filtro.chave)}
                onClick={() => alternar(filtro.chave)}
              >
                {filtro.rotulo()}
              </button>
            ))}
          </div>
        }
        emptyMessage={filtrando ? t("reservation.history.emptyFiltered") : t("reservation.history.empty")}
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
