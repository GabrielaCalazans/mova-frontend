import { useCallback, useEffect, useState } from "react";
import { rotulo, STATUS_VEICULO_LABELS } from "../services/apiEnums";
import ModalDialog from "../components/ui/ModalDialog";
import { useNavigate } from "react-router-dom";
import { CircleCheck, CircleSlash, KeyRound, Pencil, Plus, Trash2, Wrench } from "lucide-react";
import BottomNav from "../components/BottomNav";
import FrotaMonitoramento from "../components/FrotaMonitoramento";
import { listFrota, deleteVeiculo } from "../services/veiculoService";
import { getAuthSession } from "../services/authSession";
import VehicleMedia from "../components/vehicle/VehicleMedia";
import { t } from "../i18n";
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
      setErro(t("owner.common.sessionInvalid"));
      return;
    }

    setLoading(true);
    setErro(null);

    try {
      const resultado = await listFrota();
      setVeiculos(resultado);
    } catch (e) {
      setErro(e.message || t("owner.cars.loadError"));
    } finally {
      setLoading(false);
    }
  }, [idLocador]);

  useEffect(() => {
    document.title = t("owner.cars.docTitle");
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
      setErro(e.message || t("owner.cars.deleteError"));
      setVeiculoParaExcluir(null);
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <main className="owner-page" aria-labelledby="frota-title">
      <header className="page-head">
        <h1 id="frota-title">{t("owner.cars.title")}</h1>
        <p className="page-head__lede">{t("owner.cars.lede")}</p>
      </header>

      <FrotaMonitoramento />

      <section className="owner-section" aria-labelledby="frota-veiculos-title">
        <div className="owner-section__head">
          <h2 id="frota-veiculos-title">{t("owner.cars.listTitle")}</h2>
          <button type="button" className="btn" onClick={() => navigate("/cadastro-carros/novo")}>
            <Plus className="icon" aria-hidden="true" />
            {t("owner.common.add")}
          </button>
        </div>

        {loading && <p className="loading-state" role="status"><span className="spinner" aria-hidden="true" />{t("owner.cars.loading")}</p>}
        {!loading && erro && <p className="alert alert--danger" role="alert">{erro}</p>}
        {!loading && !erro && veiculos.length === 0 && (
          <div className="state-block">
            <p className="state-block__title">{t("owner.cars.emptyTitle")}</p>
            <p className="state-block__text">{t("owner.cars.emptyText")}</p>
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
                        {rotulo(STATUS_VEICULO_LABELS, veiculo.status)}
                      </span>
                    </p>
                    <p className="owner-row__meta">
                      <span>{t("owner.cars.seats", { year: veiculo.ano, gearbox: veiculo.cambio, count: veiculo.capacidade })}</span>
                      <span>{garagem ? t("owner.cars.garage", { name: garagem }) : t("owner.cars.noGarage")}</span>
                    </p>
                  </div>
                  <div className="owner-row__actions">
                    <button
                      type="button"
                      className="btn btn--secondary"
                      aria-label={t("owner.common.editItem", { name: nomeExibicao })}
                      onClick={() => navigate(`/cadastro-carros/${veiculo.id}`, { state: { veiculo } })}
                    >
                      <Pencil aria-hidden="true" />
                      {t("owner.common.edit")}
                    </button>
                    <button
                      type="button"
                      className="btn btn--danger"
                      aria-label={t("owner.common.deleteItem", { name: nomeExibicao })}
                      onClick={() => setVeiculoParaExcluir(veiculo)}
                    >
                      <Trash2 aria-hidden="true" />
                      {t("owner.common.delete")}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {veiculoParaExcluir && (
        <ModalDialog
          role="alertdialog"
          className="owner-dialog"
          panelClassName="owner-dialog__panel"
          labelledBy="excluir-veiculo-title"
          describedBy="excluir-veiculo-desc"
          onClose={() => setVeiculoParaExcluir(null)}
          closeDisabled={excluindo}
        >
          <h2 id="excluir-veiculo-title">{t("owner.cars.deleteTitle")}</h2>
          <p id="excluir-veiculo-desc">{t("owner.cars.deleteDesc", { name: `${veiculoParaExcluir.marca} ${veiculoParaExcluir.modelo}`.trim(), plate: veiculoParaExcluir.placa })}</p>
          <div className="owner-dialog__actions">
            <button type="button" className="btn btn--secondary" aria-label={t("owner.common.cancelDelete")} onClick={() => setVeiculoParaExcluir(null)} disabled={excluindo} data-autofocus>
              {t("owner.common.cancel")}
            </button>
            <button type="button" className="btn btn--danger" aria-label={t("owner.common.confirmDelete")} onClick={confirmarExclusao} disabled={excluindo}>
              <Trash2 className="icon" aria-hidden="true" />
              {excluindo ? t("owner.common.deleting") : t("owner.common.confirmDelete")}
            </button>
          </div>
        </ModalDialog>
      )}
      <BottomNav />
    </main>
  );
}
