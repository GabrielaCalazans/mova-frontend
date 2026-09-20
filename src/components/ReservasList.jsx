import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthenticatedLayout from "../layout/AuthenticatedLayout";
import { getAuthSession } from "../services/authSession";
import { getReservasDoLocatarioPage } from "../services/reservaService";
import { formatMoneyBRL } from "../utils/reservationMath";
import { updateJourneyStep } from "../utils/journeyStorage";
import {
  STATUS_PAGAMENTO,
  STATUS_RESERVA,
  STATUS_RESERVA_LABELS,
  rotulo,
} from "../services/apiEnums";
import "../styles/carselect.css";

// A resposta da reserva agora traz o veículo aninhado (veiculo.modeloVeiculo),
// no mesmo formato de GET /api/veiculo/:id.
function resolveVeiculoNome(reserva) {
  const modeloVeiculo = reserva.veiculo?.modeloVeiculo ?? {};
  const marca = modeloVeiculo.marca ?? "";
  const modelo = modeloVeiculo.modelo ?? "";
  const nome = `${marca} ${modelo}`.trim();

  return nome || "Veículo";
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

function nomeGaragem(garagem, fallback) {
  return garagem?.nome || fallback || "Não informada";
}

// Reserva paga e ainda nao desbloqueada leva para o desbloqueio; as demais,
// para a avaliacao. O id vai no state — a tela de destino confirma o estado
// real com o backend.
function acaoDaReserva(reserva) {
  if (reserva.status === STATUS_RESERVA.AGUARDANDO_PAGAMENTO) {
    return { rota: "/pagamento", rotulo: "Pagar" };
  }
  if (reserva.status === STATUS_RESERVA.CONFIRMADA && reserva.statusPagamento === STATUS_PAGAMENTO.SUCESSO) {
    return { rota: "/desbloqueio", rotulo: "Desbloquear veículo" };
  }
  if (reserva.status === STATUS_RESERVA.EM_ANDAMENTO) {
    return { rota: "/devolucao", rotulo: "Devolver veículo" };
  }
  if (reserva.status === STATUS_RESERVA.REALIZADA) {
    return { rota: "/avaliacao", rotulo: "Avaliar" };
  }
  return null;
}

// Conveniência visual. O backend continua validando posse, estado e período
// ao atender GET /reserva/:id/localizacao.
function podeExibirRastreamento(reserva, agora = new Date()) {
  if (
    reserva.status !== STATUS_RESERVA.CONFIRMADA &&
    reserva.status !== STATUS_RESERVA.EM_ANDAMENTO
  ) return false;

  const inicio = new Date(reserva.dataHoraInicio).getTime();
  const fim = new Date(reserva.dataHoraFim).getTime();
  const instante = agora.getTime();
  return Number.isFinite(inicio) && Number.isFinite(fim) && inicio <= instante && instante <= fim;
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
 * (somente as com status REALIZADA), via a prop somenteConcluidas.
 */
export default function ReservasList({ title, documentTitle, somenteConcluidas = false, emptyMessage }) {
  const navigate = useNavigate();
  const idLocatario = getAuthSession()?.user?.id;

  const [reservas, setReservas] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [paginacao, setPaginacao] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(() => Boolean(idLocatario));
  const [erro, setErro] = useState(null);

  useEffect(() => {
    document.title = documentTitle;

    if (!idLocatario) return;

    let active = true;

    getReservasDoLocatarioPage(idLocatario, { page: pagina })
      .then((resultado) => {
        if (!active) return;
        const ordenadas = [...resultado.reservas].sort(
          (a, b) => new Date(b.dataHoraInicio) - new Date(a.dataHoraInicio)
        );
        setReservas(ordenadas);
        setPaginacao(resultado.pagination);
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
  }, [idLocatario, documentTitle, pagina]);

  const reservasExibidas = useMemo(
    () =>
      somenteConcluidas
        ? reservas.filter((r) => r.status === STATUS_RESERVA.REALIZADA)
        : reservas,
    [reservas, somenteConcluidas]
  );

  const gruposPorData = useMemo(() => agruparPorData(reservasExibidas), [reservasExibidas]);
  const erroExibido = !idLocatario ? "Sessão inválida. Faça login novamente." : erro;

  return (
    <AuthenticatedLayout title={title} align="left">
      <div style={{ textAlign: "left" }}>
        {loading && <p className="carro-status">Carregando…</p>}
        {!loading && erroExibido && <p className="carro-status">{erroExibido}</p>}

        {!loading && !erroExibido && reservasExibidas.length === 0 && (
          <p className="carro-empty-state">{emptyMessage}</p>
        )}

        {!loading && !erroExibido && gruposPorData.map(([data, reservasDoDia]) => (
          <div key={data} style={{ marginBottom: "1.5rem" }}>
            <p style={{ color: "var(--color-primary-strong)", fontWeight: 700, margin: "0 0 0.6rem" }}>
              {data}
            </p>

            <div className="frota-list">
              {reservasDoDia.map((reserva) => (
                (() => {
                  const acao = acaoDaReserva(reserva);
                  const abrir = () => {
                    if (!acao) return;
                    updateJourneyStep("reserva", {
                      id: reserva.id,
                      valorTotal: reserva.valorTotal,
                      codigoDesbloqueio: reserva.codigoDesbloqueio || "",
                    });
                    navigate(acao.rota, { state: { reservaId: reserva.id } });
                  };
                  return (
                <div
                  className="frota-card"
                  key={reserva.id}
                  onClick={abrir}
                  style={{ cursor: acao ? "pointer" : "default" }}
                >
                  <div className="frota-card__info">
                    <h3>{resolveVeiculoNome(reserva)}</h3>
                    <p>
                      {formatarHora(reserva.dataHoraInicio)} — {formatarHora(reserva.dataHoraFim)}
                    </p>
                    <p>{rotulo(STATUS_RESERVA_LABELS, reserva.status)}</p>
                    <p>Retirada: {nomeGaragem(reserva.garagemRetirada, reserva.idGaragemRetirada)}</p>
                    <p>Devolução: {nomeGaragem(reserva.garagemDevolucao, reserva.idGaragemDevolucao)}</p>
                    <p>Pagamento: {reserva.statusPagamento}</p>
                    <p>
                      {reserva.valorTotal != null ? formatMoneyBRL(reserva.valorTotal) : "Valor não informado"}
                    </p>
                    {reserva.servicos?.length > 0 && (
                      <div aria-label="Serviços contratados">
                        <p>Serviços contratados:</p>
                        <ul>
                          {reserva.servicos.map((servico) => (
                            <li key={servico.idServico}>
                              {servico.nome} — {formatMoneyBRL(servico.valor)}
                              {servico.descricao && <p>{servico.descricao}</p>}
                              {servico.detalhesCobertura && (
                                <details>
                                  <summary>Ver detalhes da cobertura</summary>
                                  <p>{servico.detalhesCobertura}</p>
                                </details>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {(reserva.status === STATUS_RESERVA.AGUARDANDO_PAGAMENTO || reserva.status === STATUS_RESERVA.CONFIRMADA) && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate("/cancelamento", { state: { reservaId: reserva.id } });
                        }}
                      >
                        Cancelar reserva
                      </button>
                    )}
                    {acao && (
                      <button type="button" onClick={(event) => { event.stopPropagation(); abrir(); }}>
                        {acao.rotulo}
                      </button>
                    )}
                    {podeExibirRastreamento(reserva) && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/reserva/${reserva.id}/localizacao`);
                        }}
                      >
                        Acompanhar veículo
                      </button>
                    )}
                  </div>
                </div>
                  );
                })()
              ))}
            </div>
          </div>
        ))}
        {!loading && !erroExibido && paginacao.totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "1rem" }}>
            <button type="button" disabled={pagina <= 1} onClick={() => setPagina((atual) => atual - 1)}>
              Anterior
            </button>
            <span>Página {paginacao.page} de {paginacao.totalPages} ({paginacao.total})</span>
            <button type="button" disabled={pagina >= paginacao.totalPages} onClick={() => setPagina((atual) => atual + 1)}>
              Próxima
            </button>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
