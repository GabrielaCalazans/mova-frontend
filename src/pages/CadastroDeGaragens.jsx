import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, XCircle, CheckCircle2 } from "lucide-react";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import garagemImg from "../assets/garagem.png";
import { listGaragens, deleteGaragem } from "../services/garagemService";
import { getAuthSession } from "../services/authSession";
import "../styles/carselect.css";
import "../styles/payment.css";

export default function CadastroDeGaragens() {
  const navigate = useNavigate();
  const idLocador = getAuthSession()?.user?.id;
  const [garagens, setGaragens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [garagemParaExcluir, setGaragemParaExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  const carregar = useCallback(async () => {
    if (!idLocador) {
      setErro("Sessão inválida. Faça login novamente.");
      return;
    }

    setLoading(true);
    setErro(null);
    try {
      const resultado = await listGaragens({ idLocador });
      setGaragens(resultado);
    } catch (e) {
      setErro(e.message || "Não foi possível carregar as garagens.");
    } finally {
      setLoading(false);
    }
  }, [idLocador]);

  useEffect(() => {
    document.title = "MOVA - Cadastro de Garagens";
    carregar();
  }, [carregar]);

  async function confirmarExclusao() {
    if (!garagemParaExcluir) return;

    setExcluindo(true);
    try {
      await deleteGaragem(garagemParaExcluir.id);
      setGaragemParaExcluir(null);
      await carregar();
    } catch (e) {
      setErro(e.message || "Não foi possível excluir a garagem.");
      setGaragemParaExcluir(null);
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <main className="carro-page">
      <div className="carro-header">
        <TopBar showLogo iconColor="white" />
        <h1>Cadastro de Garagens</h1>
      </div>

      <div className="carro-content">
        <div className="frota-header-row">
          <h2>Garagens</h2>
          <button
            type="button"
            className="frota-add-btn"
            onClick={() => navigate("/cadastro-garagens/novo")}
          >
            Adicionar
          </button>
        </div>

        {loading && <p className="carro-status">Carregando garagens…</p>}
        {!loading && erro && <p className="carro-status">{erro}</p>}
        {!loading && !erro && garagens.length === 0 && (
          <p className="carro-empty-state">
            Você ainda não cadastrou nenhuma garagem. Toque em "Adicionar" para começar.
          </p>
        )}

        {!loading && !erro && garagens.length > 0 && (
          <div className="frota-list">
            {garagens.map((garagem) => {
              const disponivel = garagem.capacidade - (garagem.veiculosAlocados ?? 0);

              return (
                <div
                  className="frota-card"
                  key={garagem.id}
                  onClick={() => navigate(`/cadastro-garagens/${garagem.id}/capacidade`)}
                  style={{ cursor: "pointer" }}
                >
                  <img src={garagemImg} alt={garagem.nome} className="frota-card__image" />
                  <div className="frota-card__info">
                    <h3>{garagem.nome}</h3>
                    <p>{garagem.endereco}</p>
                    <p>
                      Capacidade: {disponivel}/{garagem.capacidade} Carros
                    </p>
                  </div>
                  <div className="frota-card__actions">
                    <button
                      type="button"
                      className="frota-edit"
                      aria-label={`Editar ${garagem.nome}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(`/cadastro-garagens/${garagem.id}`, { state: { garagem } });
                      }}
                    >
                      <Pencil size={22} />
                    </button>
                    <button
                      type="button"
                      className="frota-delete"
                      aria-label={`Excluir ${garagem.nome}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setGaragemParaExcluir(garagem);
                      }}
                    >
                      <XCircle size={26} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {garagemParaExcluir && (
        <div className="payment-validating-overlay" onClick={() => !excluindo && setGaragemParaExcluir(null)}>
          <div className="payment-validating-card" onClick={(event) => event.stopPropagation()}>
            <h2>Deseja excluir essa garagem?</h2>
            <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginTop: "0.5rem" }}>
              <button
                type="button"
                aria-label="Confirmar exclusão"
                onClick={confirmarExclusao}
                disabled={excluindo}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#1e8e5a" }}
              >
                <CheckCircle2 size={30} />
              </button>
              <button
                type="button"
                aria-label="Cancelar exclusão"
                onClick={() => setGaragemParaExcluir(null)}
                disabled={excluindo}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#c0392b" }}
              >
                <XCircle size={30} />
              </button>
            </div>
          </div>
        </div>
      )}
          <BottomNav />
    </main>
  );
}
