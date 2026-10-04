import ReservasList from "../components/ReservasList";
import { useNavigate } from "react-router-dom";

export default function Historico() {
  const navigate = useNavigate();
  return (
    <div className="historico">
      <ReservasList
        title="Histórico"
        documentTitle="MOVA - Histórico de Reservas"
        somenteConcluidas={false}
        emptyMessage="Você ainda não fez nenhuma reserva. Escolha um carro no catálogo para começar."
      />
      {/* Fica fora da lista para manter o atalho visível mesmo sem reservas. */}
      <section className="historico__pendencias" aria-label="Pendências financeiras">
        <p className="journey-muted">Cobranças de atraso ou cancelamento aparecem em pendências financeiras.</p>
        <button type="button" className="btn btn--secondary" onClick={() => navigate("/pendencias-financeiras")}>
          Ver pendências financeiras
        </button>
      </section>
    </div>
  );
}
