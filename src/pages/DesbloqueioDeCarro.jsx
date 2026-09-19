import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { getJourneyStep, updateJourneyStep } from "../utils/journeyStorage";
import { getAuthSession } from "../services/authSession";
import { STATUS_PAGAMENTO, STATUS_RESERVA } from "../services/apiEnums";
import {
  desbloquearReserva,
  desbloquearReservaPorQr,
  getReservaById,
  listReservasDoLocatario,
} from "../services/reservaService";
import "../styles/carselect.css";
import "../styles/payment.css";

// TASK 05 — esta tela NUNCA declara o veiculo desbloqueado por conta propria.
// "Veiculo Desbloqueado" so aparece depois que POST /reserva/:id/desbloqueio
// respondeu 200 (ou quando o GET da reserva ja traz codigoUsadoEm). O
// sessionStorage e so um atalho para achar o id; o estado vem do backend.
// Ver auditoria/DESBLOQUEIO.md.

const TIMEOUT_GEO_MS = 8000;

// A posicao deve ser obtida no momento do pedido. Falhas do navegador
// interrompem o envio; o backend continua responsavel por validar o raio.
function obterCoordenadas() {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation?.getCurrentPosition) {
      reject(new Error("Este navegador não oferece geolocalização. Use um navegador compatível para desbloquear."));
      return;
    }

    let concluido = false;
    const concluir = (acao, valor) => {
      if (concluido) return;
      concluido = true;
      clearTimeout(prazo);
      acao(valor);
    };
    // O timeout da API pode nao contar enquanto o prompt de permissao esta aberto.
    const prazo = setTimeout(() => concluir(reject, new Error("Tempo esgotado ao obter sua localização. Tente novamente.")), TIMEOUT_GEO_MS);
    try {
      navigator.geolocation.getCurrentPosition(
        (posicao) => {
          const latitude = posicao?.coords?.latitude;
          const longitude = posicao?.coords?.longitude;
          if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
              latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            concluir(reject, new Error("O dispositivo retornou uma localização inválida. Tente novamente."));
            return;
          }
          concluir(resolve, { latitude, longitude });
        },
        (erro) => {
          const mensagem = erro?.code === 1
            ? "Permissão de localização negada. Autorize o acesso no navegador e tente novamente."
            : erro?.code === 3
              ? "Tempo esgotado ao obter sua localização. Tente novamente."
              : "Localização indisponível. Verifique o GPS ou a conexão e tente novamente.";
          concluir(reject, new Error(mensagem));
        },
        { timeout: TIMEOUT_GEO_MS, enableHighAccuracy: true, maximumAge: 0 },
      );
    } catch {
      concluir(reject, new Error("Não foi possível solicitar sua localização. Tente novamente."));
    }
  });
}

// Reserva que ainda pode ser desbloqueada: paga e confirmada (ou ja em
// andamento). Quem ainda nao foi desbloqueada vem primeiro — e o que o usuario
// veio fazer; entre iguais, a mais proxima do inicio. Usada so na recuperacao,
// quando o estado local da jornada se perdeu.
function escolherReservaDesbloqueavel(reservas) {
  return (
    [...reservas]
      .filter(
        (r) =>
          r.statusPagamento === STATUS_PAGAMENTO.SUCESSO &&
          (r.status === STATUS_RESERVA.CONFIRMADA ||
            r.status === STATUS_RESERVA.EM_ANDAMENTO),
      )
      .sort(
        (a, b) =>
          Number(Boolean(a.codigoUsadoEm)) - Number(Boolean(b.codigoUsadoEm)) ||
          new Date(a.dataHoraInicio) - new Date(b.dataHoraInicio),
      )[0] ?? null
  );
}

function formatarDataHora(valor) {
  if (!valor) return "";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "";
  const hora = data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${data.toLocaleDateString("pt-BR")} as ${hora}`;
}

export default function TelaDeDesbloqueio() {
  const navigate = useNavigate();
  const location = useLocation();
  // Deep link do QR: /desbloqueio?qr=<token assinado>. O token carrega
  // idReserva + codigo e e revalidado inteiro pelo backend.
  const qrToken = new URLSearchParams(location?.search || "").get("qr") || "";

  const [reserva, setReserva] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState("");
  const [codigo, setCodigo] = useState("");
  const [desbloqueando, setDesbloqueando] = useState(false);
  const [erroDesbloqueio, setErroDesbloqueio] = useState("");

  useEffect(() => {
    document.title = "MOVA - Desbloqueio";
  }, []);

  // Carrega a reserva pelo backend. O id vem do historico (location.state), da
  // jornada em sessao ou — se os dois faltarem — da listagem do proprio
  // locatario. O codigo exibido e sempre o que o backend devolveu.
  useEffect(() => {
    let ativo = true;

    async function carregar() {
      setCarregando(true);
      setErroCarregamento("");

      try {
        const idDireto =
          location?.state?.reservaId || getJourneyStep("reserva")?.id || "";

        let encontrada = idDireto ? await getReservaById(idDireto) : null;

        if (!encontrada) {
          const idLocatario = getAuthSession()?.user?.id;
          if (!idLocatario) {
            throw new Error("Sessão inválida. Faça login novamente.");
          }
          const reservas = await listReservasDoLocatario(idLocatario);
          encontrada = escolherReservaDesbloqueavel(reservas);
        }

        if (!ativo) return;

        if (!encontrada) {
          setErroCarregamento(
            "Não encontramos nenhuma reserva confirmada para desbloquear.",
          );
          return;
        }

        setReserva(encontrada);
        setCodigo(encontrada.codigoDesbloqueio || "");
        // Reidrata a jornada para as telas seguintes (avaliacao/devolucao).
        updateJourneyStep("reserva", {
          id: encontrada.id,
          valorTotal: encontrada.valorTotal,
          codigoDesbloqueio: encontrada.codigoDesbloqueio || "",
        });
      } catch (error) {
        if (!ativo) return;
        setErroCarregamento(
          error?.message || "Não foi possível carregar sua reserva.",
        );
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregar();

    return () => {
      ativo = false;
    };
  }, [location?.state]);

  async function enviarDesbloqueio(usarQr) {
    if (!reserva?.id) return;

    setErroDesbloqueio("");
    setDesbloqueando(true);

    try {
      const coord = await obterCoordenadas();
      const atualizada = usarQr
        ? await desbloquearReservaPorQr(reserva.id, qrToken, coord)
        : await desbloquearReserva(reserva.id, codigo.trim(), coord);

      // So aqui o veiculo esta desbloqueado: e a reserva que o backend
      // devolveu, com codigoUsadoEm preenchido e status EM_ANDAMENTO.
      setReserva(atualizada);
    } catch (error) {
      setErroDesbloqueio(
        error?.message || "Não foi possível desbloquear o veículo.",
      );
    } finally {
      setDesbloqueando(false);
    }
  }

  const desbloqueado = Boolean(reserva?.codigoUsadoEm);
  const pagamentoConfirmado =
    reserva?.statusPagamento === STATUS_PAGAMENTO.SUCESSO;
  const temCodigo = Boolean(reserva?.codigoDesbloqueio);

  return (
    <main className="carro-page">
      <div className="carro-header">
        <h1>Desbloqueio</h1>
      </div>

      <div
        className="carro-content"
        style={{ marginTop: "-1.75rem", textAlign: "center" }}
      >
        {carregando && <p className="carro-status">Carregando sua reserva…</p>}

        {!carregando && erroCarregamento && (
          <>
            <p className="carro-status" role="alert">
              {erroCarregamento}
            </p>
            <button
              type="button"
              className="carro-button"
              onClick={() => navigate("/historico")}
            >
              Ver minhas reservas
            </button>
          </>
        )}

        {!carregando && !erroCarregamento && reserva && desbloqueado && (
          <>
            <h2
              style={{
                color: "var(--color-primary-strong)",
                fontSize: "1.3rem",
                margin: "2.5rem 0 1.5rem",
              }}
              data-testid="titulo-desbloqueado"
            >
              Veículo Desbloqueado
            </h2>

            <div className="payment-method-card">
              <p style={{ margin: 0, color: "var(--color-primary-strong)" }}>
                Desbloqueio confirmado pelo sistema em{" "}
                {formatarDataHora(reserva.codigoUsadoEm)}.
              </p>
              <p
                style={{
                  margin: "0.75rem 0 0",
                  color: "var(--color-text-secondary)",
                }}
                data-testid="status-reserva"
              >
                Status da reserva: {reserva.status}
              </p>
            </div>

            <p
              style={{
                marginTop: "1.25rem",
                color: "var(--color-text-secondary)",
                fontSize: "0.85rem",
              }}
            >
              Depois de devolver o veículo, você pode avaliar sua experiência a
              qualquer momento pela tela de Histórico.
            </p>

            <button
              type="button"
              className="carro-button"
              onClick={() => navigate("/historico")}
            >
              Ver minhas reservas
            </button>
          </>
        )}

        {!carregando &&
          !erroCarregamento &&
          reserva &&
          !desbloqueado &&
          (!pagamentoConfirmado || !temCodigo) && (
            <>
              <h2
                style={{
                  color: "var(--color-primary-strong)",
                  fontSize: "1.2rem",
                  margin: "2.5rem 0 1rem",
                }}
              >
                Pagamento ainda não confirmado
              </h2>
              <p className="carro-status">
                O código de desbloqueio é gerado quando o gateway confirma o
                pagamento. Conclua o pagamento para continuar.
              </p>
              <button
                type="button"
                className="carro-button"
                onClick={() => navigate("/pagamento")}
              >
                Ir para o pagamento
              </button>
            </>
          )}

        {!carregando &&
          !erroCarregamento &&
          reserva &&
          !desbloqueado &&
          pagamentoConfirmado &&
          temCodigo && (
            <form
              onSubmit={(evento) => {
                evento.preventDefault();
                enviarDesbloqueio(false);
              }}
            >
              <h2
                style={{
                  color: "var(--color-primary-strong)",
                  fontSize: "1.2rem",
                  margin: "2.5rem 0 1rem",
                }}
              >
                Desbloqueie seu veículo
              </h2>

              <div className="payment-method-card">
                <p
                  style={{
                    margin: "0 0 0.5rem",
                    color: "var(--color-primary-strong)",
                  }}
                >
                  Seu código de desbloqueio é:
                </p>
                <p
                  style={{
                    margin: 0,
                    color: "var(--color-primary-strong)",
                    fontSize: "1.4rem",
                    fontWeight: 700,
                  }}
                  data-testid="codigo-desbloqueio"
                >
                  {reserva.codigoDesbloqueio}
                </p>
                <p
                  style={{
                    margin: "0.75rem 0 0",
                    color: "var(--color-text-secondary)",
                    fontSize: "0.8rem",
                  }}
                >
                  Válido a partir de {formatarDataHora(reserva.dataHoraInicio)},
                  para este veículo e de uso único.
                </p>
              </div>

              {qrToken && (
                <button
                  type="button"
                  className="carro-button"
                  onClick={() => enviarDesbloqueio(true)}
                  disabled={desbloqueando}
                >
                  {desbloqueando
                    ? "Desbloqueando…"
                    : "Desbloquear pelo QR Code"}
                </button>
              )}

              <label
                htmlFor="codigo-desbloqueio"
                style={{
                  display: "block",
                  margin: "1.25rem 0 0.4rem",
                  color: "var(--color-primary-strong)",
                }}
              >
                Código de desbloqueio
              </label>
              <input
                id="codigo-desbloqueio"
                name="codigo"
                className="payment-input"
                value={codigo}
                onChange={(evento) =>
                  setCodigo(evento.target.value.toUpperCase())
                }
                placeholder="XXXX-XXXX"
                maxLength={9}
                autoComplete="off"
              />

              <button
                type="submit"
                className="carro-button"
                disabled={desbloqueando || codigo.trim().length === 0}
              >
                {desbloqueando ? "Desbloqueando…" : "Desbloquear veículo"}
              </button>

              {erroDesbloqueio && (
                <p
                  className="carro-status"
                  role="alert"
                  style={{ color: "#c0392b" }}
                >
                  {erroDesbloqueio}
                </p>
              )}
            </form>
          )}
      </div>
      <BottomNav />
    </main>
  );
}
