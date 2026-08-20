import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import { listVeiculos, deleteVeiculo } from "../services/veiculoService";
import { getAuthSession } from "../services/authSession";
import { resolveModelDetails } from "../utils/vehicleDisplay";
import "../styles/carselect.css";
import "../styles/payment.css";

export default function CadastroDeCarros() {
  const navigate = useNavigate();
  const idLocador = getAuthSession()?.user?.id;
  const [veiculos, setVeiculos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [veiculoParaExcluir, setVeiculoParaExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  const carregar = useCallback(async () => {
    if (!idLocador) {
      setErro("Sessão inválida. Faça login novamente.");
      return;
    }

    setLoading(true);
    setErro(null);

    try {
      const resultado = await listVeiculos({ idLocador });
      setVeiculos(resultado);
    } catch (e) {
      setErro(e.message || "Não foi possível carregar os veículos.");
    } finally {
      setLoading(false);
    }
  }, [idLocador]);

  useEffect(() => {
    document.title = "MOVA - Cadastro de Carros";
    carregar();
  }, [carregar]);

  async function confirmarExclusao() {
    if (!veiculoParaExcluir) return;

    setExcluindo(true);
    try {
      await deleteVeiculo(veiculoParaExcluir.id);
      setVeiculoParaExcluir(null);
      await carregar();
    } catch (e) {
      setErro(e.message || "Não foi possível excluir o veículo.");
      setVeiculoParaExcluir(null);
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <main className="carro-page">
      <div className="carro-header">
        <TopBar showLogo iconColor="white" />
        <h1>Cadastro de Carros</h1>
      </div>

      <div className="carro-content">
        <div className="frota-header-row">
          <h2>Veículos</h2>
          <button
            type="button"
            className="frota-add-btn"
            onClick={() => navigate("/cadastro-carros/novo")}
          >
            Adicionar
          </button>
        </div>

        {loading && <p className="carro-status">Carregando veículos…</p>}
        {!loading && erro && <p className="carro-status">{erro}</p>}
        {!loading && !erro && veiculos.length === 0 && (
          <p className="carro-empty-state">
            Você ainda não cadastrou nenhum veículo. Toque em "Adicionar" para começar.
          </p>
        )}

        {!loading && !erro && veiculos.length > 0 && (
          <div className="frota-list">
            {veiculos.map((veiculo) => {
              const details = resolveModelDetails(veiculo.marca, veiculo.modelo);
              const nomeExibicao = `${veiculo.marca} ${veiculo.modelo}`.trim();

              return (
                <div className="frota-card" key={veiculo.id}>
                  <img src={details.image} alt={nomeExibicao} className="frota-card__image" />
                  <div className="frota-card__info">
                    <h3>{nomeExibicao}</h3>
                    <p>{veiculo.placa}</p>
                    <p>
                      {veiculo.ano} • {veiculo.cambio} • {veiculo.capacidade} lugares
                    </p>
                    <p>{veiculo.status}</p>
                  </div>
                  <div className="frota-card__actions">
                    <button
                      type="button"
                      className="frota-edit"
                      aria-label={`Editar ${nomeExibicao}`}
                      onClick={() => navigate(`/cadastro-carros/${veiculo.id}`, { state: { veiculo } })}
                    >
                      <CheckCircle2 size={26} />
                    </button>
                    <button
                      type="button"
                      className="frota-delete"
                      aria-label={`Excluir ${nomeExibicao}`}
                      onClick={() => setVeiculoParaExcluir(veiculo)}
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

      {veiculoParaExcluir && (
        <div className="payment-validating-overlay" onClick={() => !excluindo && setVeiculoParaExcluir(null)}>
          <div className="payment-validating-card" onClick={(event) => event.stopPropagation()}>
            <h2>Deseja excluir esse veículo?</h2>
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
                onClick={() => setVeiculoParaExcluir(null)}
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
