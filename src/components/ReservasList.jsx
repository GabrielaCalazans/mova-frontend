import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthenticatedLayout from "../layout/AuthenticatedLayout";
import { getAuthSession } from "../services/authSession";
import { listReservasDoLocatario } from "../services/reservaService";
import { formatMoneyBRL } from "../utils/reservationMath";
import "../styles/carselect.css";

const STATUS_LABELS = {
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  CONFIRMADA: "Confirmada",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

function resolveVeiculoNome(reserva) {
  const veiculo = reserva.veiculo ?? reserva.Veiculo ?? {};
  const modeloVeiculo = veiculo.modeloVeiculo ?? {};
  const marca = veiculo.marca ?? modeloVeiculo.marca;
  const modelo = veiculo.modelo ?? modeloVeiculo.modelo;

  if (marca || modelo) {
    return `${marca ?? ""} ${modelo ?? ""}`.trim();
  }

  return "Veículo";
}

function formatarData(valor) {
  if (!valor) return "";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "";
  return data.toLocaleDateString("pt-BR");
}

function formatarHora(valor) {
  if (!valor) return "";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "";
  return data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function agruparPorData(reservas) {
  const grupos = new Map();

  for (const reserva of reservas) {
    const chave = formatarData(reserva.dataHoraInicio) || "Data não informada";
    if (!grupos.has(chave)) {
      grupos.set(chave, []);
    }
    grupos.get(chave).push(reserva);
  }

  return Array.from(grupos.entries());
}

/**
 * Lista de reservas do locatario, agrupada por data. Usada tanto pelo
 * "Historico" (todas as reservas) quanto por "Corridas Realizadas"
 * (somente as com status CONCLUIDA), via a prop somenteConcluidas.
 */
export default function ReservasList({ title, documentTitle, somenteConcluidas = false, emptyMessage }) {
  const navigate = useNavigate();
  const idLocatario = getAuthSession()?.user?.id;

  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    document.title = documentTitle;

    if (!idLocatario) {
      setErro("Sessão inválida. Faça login novamente.");
      return;
    }

    let active = true;
    setLoading(true);
    setErro(null);

    listReservasDoLocatario(idLocatario)
      .then((resultado) => {
        if (!active) return;
        const ordenadas = [...resultado].sort(
          (a, b) => new Date(b.dataHoraInicio) - new Date(a.dataHoraInicio)
        );
        setReservas(ordenadas);
      })
      .catch((error) => {
        if (!active) return;
        setErro(error.message || "Não foi possível carregar suas reservas.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [idLocatario, documentTitle]);

  const reservasExibidas = useMemo(
    () => (somenteConcluidas ? reservas.filter((r) => r.status === "CONCLUIDA") : reservas),
    [reservas, somenteConcluidas]
  );

  const gruposPorData = useMemo(() => agruparPorData(reservasExibidas), [reservasExibidas]);

  return (
    <AuthenticatedLayout title={title} align="left">
      <div style={{ textAlign: "left" }}>
        {loading && <p className="carro-status">Carregando…</p>}
        {!loading && erro && <p className="carro-status">{erro}</p>}

        {!loading && !erro && reservasExibidas.length === 0 && (
          <p className="carro-empty-state">{emptyMessage}</p>
        )}

        {!loading && !erro && gruposPorData.map(([data, reservasDoDia]) => (
          <div key={data} style={{ marginBottom: "1.5rem" }}>
            <p style={{ color: "var(--color-primary-strong)", fontWeight: 700, margin: "0 0 0.6rem" }}>
              {data}
            </p>

            <div className="frota-list">
              {reservasDoDia.map((reserva) => (
                <div
                  className="frota-card"
                  key={reserva.id}
                  onClick={() => navigate(`/avaliacao`, { state: { reservaId: reserva.id } })}
                  style={{ cursor: "pointer" }}
                >
                  <div className="frota-card__info">
                    <h3>{resolveVeiculoNome(reserva)}</h3>
                    <p>
                      {formatarHora(reserva.dataHoraInicio)} — {formatarHora(reserva.dataHoraFim)}
                    </p>
                    <p>{STATUS_LABELS[reserva.status] ?? reserva.status}</p>
                    <p>
                      {reserva.valorTotal != null ? formatMoneyBRL(reserva.valorTotal) : "Valor não informado"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AuthenticatedLayout>
  );
}
