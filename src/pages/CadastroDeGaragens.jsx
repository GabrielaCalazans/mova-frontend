import { useCallback, useEffect, useState } from "react";
import { rotulo, STATUS_GARAGEM_LABELS } from "../services/apiEnums";
import { useNavigate } from "react-router-dom";
import { CircleCheck, CircleSlash, Gauge, Pencil, Plus, Trash2, Wrench } from "lucide-react";
import BottomNav from "../components/BottomNav";
import ModalDialog from "../components/ui/ModalDialog";
import { listGaragens, deleteGaragem } from "../services/garagemService";
import { getAuthSession } from "../services/authSession";
import { t } from "../i18n";
import "../styles/owner.css";

// Status com ícone e texto: nunca só cor.
const STATUS_GARAGEM = {
  ATIVA: ["success", CircleCheck],
  MANUTENCAO: ["warning", Wrench],
  INATIVA: ["neutral", CircleSlash],
};

export default function CadastroDeGaragens() {
  const navigate = useNavigate();
  const idLocador = getAuthSession()?.user?.id;
  const [garagens, setGaragens] = useState([]);
  const [loading, setLoading] = useState(Boolean(idLocador));
  const [erro, setErro] = useState(null);
  const [garagemParaExcluir, setGaragemParaExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  const carregar = useCallback(async () => {
    if (!idLocador) {
      setErro(t("owner.common.sessionInvalid"));
      return;
    }

    setLoading(true);
    setErro(null);
    try {
      const resultado = await listGaragens({ idLocador });
      setGaragens(resultado);
    } catch (e) {
      setErro(e.message || t("owner.garages.loadError"));
    } finally {
      setLoading(false);
    }
  }, [idLocador]);

  useEffect(() => {
    document.title = t("owner.garages.docTitle");
    queueMicrotask(() => {
      void carregar();
    });
  }, [carregar]);

  async function confirmarExclusao() {
    if (!garagemParaExcluir) return;

    setExcluindo(true);
    try {
      await deleteGaragem(garagemParaExcluir.id);
      setGaragemParaExcluir(null);
      await carregar();
    } catch (e) {
      setErro(e.message || t("owner.garages.deleteError"));
      setGaragemParaExcluir(null);
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <main className="owner-page" aria-labelledby="garagens-title">
      <header className="page-head">
        <h1 id="garagens-title">{t("owner.garages.title")}</h1>
        <p className="page-head__lede">{t("owner.garages.lede")}</p>
      </header>

      <section className="owner-section" aria-labelledby="garagens-lista-title">
        <div className="owner-section__head">
          <h2 id="garagens-lista-title">{t("owner.garages.listTitle")}</h2>
          <button type="button" className="btn" onClick={() => navigate("/cadastro-garagens/novo")}>
            <Plus className="icon" aria-hidden="true" />
            {t("owner.common.add")}
          </button>
        </div>

        {loading && <p className="loading-state" role="status"><span className="spinner" aria-hidden="true" />{t("owner.garages.loading")}</p>}
        {!loading && erro && <p className="alert alert--danger" role="alert">{erro}</p>}
        {!loading && !erro && garagens.length === 0 && (
          <div className="state-block">
            <p className="state-block__title">{t("owner.garages.emptyTitle")}</p>
            <p className="state-block__text">{t("owner.garages.emptyText")}</p>
          </div>
        )}

        {!loading && !erro && garagens.length > 0 && (
          <ul className="owner-list">
            {garagens.map((garagem) => {
              const disponivel = garagem.capacidade - (garagem.veiculosAlocados ?? 0);
              const ocupacao = garagem.capacidade > 0 ? Math.min(100, Math.round(((garagem.veiculosAlocados ?? 0) / garagem.capacidade) * 100)) : 0;
              const [tom, IconeStatus] = STATUS_GARAGEM[garagem.status] || ["neutral", null];

              return (
                <li className="owner-row owner-row--plain" key={garagem.id}>
                  <div className="owner-row__body">
                    <h3 className="owner-row__title">{garagem.nome}</h3>
                    <p className="owner-row__meta">
                      <span className={`badge badge--${tom}`}>
                        {IconeStatus && <IconeStatus className="icon-sm" aria-hidden="true" />}
                        {t("owner.garages.statusLabel", { status: rotulo(STATUS_GARAGEM_LABELS, garagem.status) })}
                      </span>
                      <span>{garagem.endereco}</span>
                    </p>
                    <div className="owner-meter">
                      <span className="owner-row__meta tabular">{t("owner.garages.freeSpots", { free: disponivel, total: garagem.capacidade })}</span>
                      <span className="owner-meter__bar" aria-hidden="true"><span className="owner-meter__fill" style={{ width: `${ocupacao}%` }} /></span>
                    </div>
                  </div>
                  <div className="owner-row__actions">
                    <button
                      type="button"
                      className="btn btn--quiet"
                      onClick={() => navigate(`/cadastro-garagens/${garagem.id}/capacidade`)}
                    >
                      <Gauge aria-hidden="true" />
                      {t("owner.garages.viewOccupancy")}
                    </button>
                    <button
                      type="button"
                      className="btn btn--secondary"
                      aria-label={t("owner.common.editItem", { name: garagem.nome })}
                      onClick={() => navigate(`/cadastro-garagens/${garagem.id}`, { state: { garagem } })}
                    >
                      <Pencil aria-hidden="true" />
                      {t("owner.common.edit")}
                    </button>
                    <button
                      type="button"
                      className="btn btn--danger"
                      aria-label={t("owner.common.deleteItem", { name: garagem.nome })}
                      onClick={() => setGaragemParaExcluir(garagem)}
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

      {garagemParaExcluir && (
        <ModalDialog
          role="alertdialog"
          className="owner-dialog"
          panelClassName="owner-dialog__panel"
          labelledBy="excluir-garagem-title"
          describedBy="excluir-garagem-desc"
          onClose={() => setGaragemParaExcluir(null)}
          closeDisabled={excluindo}
        >
          <h2 id="excluir-garagem-title">{t("owner.garages.deleteTitle")}</h2>
          {/* O backend faz exclusão lógica: a garagem vira INATIVA. */}
          <p id="excluir-garagem-desc">{t("owner.garages.deleteDesc", { name: garagemParaExcluir.nome })}</p>
          <div className="owner-dialog__actions">
            <button type="button" className="btn btn--secondary" aria-label={t("owner.common.cancelDelete")} onClick={() => setGaragemParaExcluir(null)} disabled={excluindo} data-autofocus>
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
