import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircleCheck, CircleSlash, KeyRound, Pencil, Plus, Trash2, Wrench } from "lucide-react";
import BottomNav from "../components/BottomNav";
import FrotaMonitoramento from "../components/FrotaMonitoramento";
import { listFrota, deleteVeiculo } from "../services/veiculoService";
import { getAuthSession } from "../services/authSession";
import VehicleMedia from "../components/vehicle/VehicleMedia";
import "../styles/vehicle.css";
import "../styles/owner.css";

// Status com ícone e texto: nunca só cor.
const STATUS_VEICULO = {
  DISPONIVEL: ["success", CircleCheck],
  RESERVADO: ["info", KeyRound],
  MANUTENCAO: ["warning", Wrench],
  INATIVO: ["neutral", CircleSlash],
};

export default function CadastroDeCarros() {
  const navigate = useNavigate();
  const idLocador = getAuthSession()?.user?.id;
  const [veiculos, setVeiculos] = useState([]);
  const [loading, setLoading] = useState(Boolean(idLocador));
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
      const resultado = await listFrota();
      setVeiculos(resultado);
    } catch (e) {
      setErro(e.message || "Não foi possível carregar os veículos.");
    } finally {
      setLoading(false);
    }
  }, [idLocador]);

  useEffect(() => {
    document.title = "MOVA - Cadastro de Carros";
    queueMicrotask(() => {
      void carregar();
    });
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
    <main className="owner-page" aria-labelledby="frota-title">
      <header className="page-head">
        <h1 id="frota-title">Cadastro de Carros</h1>
        <p className="page-head__lede">Veículos da sua frota, com placa, status e garagem operacional.</p>
      </header>

      <FrotaMonitoramento />

      <section className="owner-section" aria-labelledby="frota-veiculos-title">
        <div className="owner-section__head">
          <h2 id="frota-veiculos-title">Veículos</h2>
          <button type="button" className="btn" onClick={() => navigate("/cadastro-carros/novo")}>
            <Plus className="icon" aria-hidden="true" />
            Adicionar
          </button>
        </div>

        {loading && <p className="loading-state" role="status"><span className="spinner" aria-hidden="true" />Carregando veículos…</p>}
        {!loading && erro && <p className="alert alert--danger" role="alert">{erro}</p>}
        {!loading && !erro && veiculos.length === 0 && (
          <div className="state-block">
            <p className="state-block__title">Nenhum veículo cadastrado</p>
            <p className="state-block__text">Você ainda não cadastrou nenhum veículo. Toque em "Adicionar" para começar.</p>
          </div>
        )}

        {!loading && !erro && veiculos.length > 0 && (
          <ul className="owner-list">
            {veiculos.map((veiculo) => {
              const nomeExibicao = `${veiculo.marca} ${veiculo.modelo}`.trim();
              const [tom, IconeStatus] = STATUS_VEICULO[veiculo.status] || ["neutral", null];
              const garagem = veiculo.garagemNome || veiculo.garagem?.nome;

              return (
                <li className="owner-row" key={veiculo.id}>
                  <VehicleMedia vehicle={veiculo} className="owner-row__media" />
                  <div className="owner-row__body">
                    <h3 className="owner-row__title">{nomeExibicao}</h3>
                    <p className="owner-row__meta">
                      <span className="owner-plate">{veiculo.placa}</span>
                      <span className={`badge badge--${tom}`}>
                        {IconeStatus && <IconeStatus className="icon-sm" aria-hidden="true" />}
                        {veiculo.status}
                      </span>
                    </p>
                    <p className="owner-row__meta">
                      <span>{veiculo.ano} • {veiculo.cambio} • {veiculo.capacidade} lugares</span>
                      <span>{garagem ? `Garagem: ${garagem}` : "Sem garagem"}</span>
                    </p>
                  </div>
                  <div className="owner-row__actions">
                    <button
                      type="button"
                      className="btn btn--secondary"
                      aria-label={`Editar ${nomeExibicao}`}
                      onClick={() => navigate(`/cadastro-carros/${veiculo.id}`, { state: { veiculo } })}
                    >
                      <Pencil aria-hidden="true" />
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn btn--danger"
                      aria-label={`Excluir ${nomeExibicao}`}
                      onClick={() => setVeiculoParaExcluir(veiculo)}
                    >
                      <Trash2 aria-hidden="true" />
                      Excluir
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {veiculoParaExcluir && (
        <div className="owner-dialog" onClick={() => !excluindo && setVeiculoParaExcluir(null)} onKeyDown={(event) => event.key === "Escape" && !excluindo && setVeiculoParaExcluir(null)}>
          <div className="owner-dialog__panel" role="alertdialog" aria-modal="true" aria-labelledby="excluir-veiculo-title" aria-describedby="excluir-veiculo-desc" onClick={(event) => event.stopPropagation()}>
            <h2 id="excluir-veiculo-title">Deseja excluir esse veículo?</h2>
            <p id="excluir-veiculo-desc">{`${veiculoParaExcluir.marca} ${veiculoParaExcluir.modelo}`.trim()} · {veiculoParaExcluir.placa}. Esta ação não pode ser desfeita.</p>
            <div className="owner-dialog__actions">
              <button type="button" className="btn btn--secondary" aria-label="Cancelar exclusão" onClick={() => setVeiculoParaExcluir(null)} disabled={excluindo} autoFocus>
                Cancelar
              </button>
              <button type="button" className="btn btn--danger" aria-label="Confirmar exclusão" onClick={confirmarExclusao} disabled={excluindo}>
                <Trash2 className="icon" aria-hidden="true" />
                {excluindo ? "Excluindo…" : "Confirmar exclusão"}
              </button>
            </div>
          </div>
        </div>
      )}
      <BottomNav />
    </main>
  );
}
