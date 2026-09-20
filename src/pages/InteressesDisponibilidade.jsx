import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import {
  cancelarInteresse,
  listarInteresses,
  listarNotificacoes,
  listarVeiculosParaInteresse,
  registrarInteresse,
} from "../services/interesseService";
import { formatMoneyBRL } from "../utils/reservationMath";
import "../styles/carselect.css";
import "../styles/relatorios.css";

function nomeVeiculo(veiculo) {
  return `${veiculo.marca ?? ""} ${veiculo.modelo ?? ""}`.trim() || "Veículo";
}

export default function InteressesDisponibilidade() {
  const navigate = useNavigate();
  const [veiculos, setVeiculos] = useState([]);
  const [interesses, setInteresses] = useState(new Set());
  const [notificacoes, setNotificacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [processando, setProcessando] = useState(new Set());

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const [descoberta, ativos, avisos] = await Promise.all([
        listarVeiculosParaInteresse(),
        listarInteresses(),
        listarNotificacoes(),
      ]);
      setVeiculos(descoberta);
      setInteresses(new Set(ativos.map((item) => String(item.idVeiculo))));
      setNotificacoes(avisos);
    } catch (error) {
      setErro(error.message || "Não foi possível carregar os interesses.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "MOVA - Avisos de disponibilidade";
    carregar();
  }, [carregar]);

  async function alternarInteresse(idVeiculo) {
    const chave = String(idVeiculo);
    if (processando.has(chave)) return;
    setProcessando((atual) => new Set(atual).add(chave));
    setFeedback(null);
    try {
      if (interesses.has(chave)) {
        await cancelarInteresse(idVeiculo);
        setInteresses((atual) => {
          const proximo = new Set(atual);
          proximo.delete(chave);
          return proximo;
        });
        setFeedback("Aviso de disponibilidade cancelado.");
      } else {
        await registrarInteresse(idVeiculo);
        setInteresses((atual) => new Set(atual).add(chave));
        setFeedback("Aviso de disponibilidade ativado.");
      }
    } catch (error) {
      setErro(error.message || "Não foi possível atualizar o aviso.");
    } finally {
      setProcessando((atual) => {
        const proximo = new Set(atual);
        proximo.delete(chave);
        return proximo;
      });
    }
  }

  return (
    <main className="carro-page">
      <div className="carro-header">
        <h1>Avisos de disponibilidade</h1>
      </div>
      <div className="carro-content">
        <p>Escolha um veículo indisponível para receber um aviso quando ele voltar a ficar disponível.</p>

        {loading && <p className="carro-status">Carregando veículos indisponíveis…</p>}
        {!loading && erro && <p className="carro-status">{erro}</p>}
        {!loading && !erro && veiculos.length === 0 && (
          <p className="carro-empty-state">Nenhum veículo indisponível encontrado.</p>
        )}

        {!loading && !erro && veiculos.length > 0 && (
          <div className="fav-list">
            {veiculos.map((veiculo) => {
              const id = String(veiculo.id);
              const ativo = interesses.has(id);
              const busy = processando.has(id);
              return (
                <article className="fav-card" key={veiculo.id}>
                  <div className="fav-card__info">
                    <h2>{nomeVeiculo(veiculo)}</h2>
                    <p>
                      Indisponível — {veiculo.status}
                      {veiculo.garagem?.status && veiculo.garagem.status !== "ATIVA"
                        ? ` (garagem ${veiculo.garagem.status})`
                        : ""}
                    </p>
                    {veiculo.ano && <p>Ano {veiculo.ano}</p>}
                    {veiculo.valorDiaria != null && <p>{formatMoneyBRL(veiculo.valorDiaria)} /dia</p>}
                    {veiculo.garagem?.nome && <p>{veiculo.garagem.nome}</p>}
                  </div>
                  <button
                    type="button"
                    className="carro-button"
                    aria-pressed={ativo}
                    disabled={busy}
                    onClick={() => alternarInteresse(veiculo.id)}
                  >
                    {ativo ? "Cancelar aviso" : "Avisar quando disponível"}
                  </button>
                </article>
              );
            })}
          </div>
        )}

        {feedback && <p role="status">{feedback}</p>}

        {notificacoes.length > 0 && (
          <section aria-labelledby="avisos-recebidos">
            <h2 id="avisos-recebidos">Avisos recebidos</h2>
            <ul>
              {notificacoes.map((notificacao) => (
                <li key={notificacao.id}>
                  <span>{notificacao.assunto}</span> — {notificacao.status}
                </li>
              ))}
            </ul>
          </section>
        )}

        <button type="button" onClick={() => navigate("/carros")}>Voltar ao catálogo</button>
      </div>
      <BottomNav />
    </main>
  );
}
