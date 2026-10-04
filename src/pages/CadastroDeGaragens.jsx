import { useCallback, useEffect, useState } from "react";
import { rotulo, STATUS_GARAGEM_LABELS } from "../services/apiEnums";
import { useNavigate } from "react-router-dom";
import { CircleCheck, CircleSlash, Gauge, Pencil, Plus, Trash2, Wrench } from "lucide-react";
import BottomNav from "../components/BottomNav";
import ModalDialog from "../components/ui/ModalDialog";
import { listGaragens, deleteGaragem } from "../services/garagemService";
import { getAuthSession } from "../services/authSession";
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
      setErro(e.message || "Não foi possível excluir a garagem.");
      setGaragemParaExcluir(null);
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <main className="owner-page" aria-labelledby="garagens-title">
      <header className="page-head">
        <h1 id="garagens-title">Cadastro de Garagens</h1>
        <p className="page-head__lede">Pontos de retirada e devolução da sua frota, com vagas e status.</p>
      </header>

      <section className="owner-section" aria-labelledby="garagens-lista-title">
        <div className="owner-section__head">
          <h2 id="garagens-lista-title">Garagens</h2>
          <button type="button" className="btn" onClick={() => navigate("/cadastro-garagens/novo")}>
            <Plus className="icon" aria-hidden="true" />
            Adicionar
          </button>
        </div>

        {loading && <p className="loading-state" role="status"><span className="spinner" aria-hidden="true" />Carregando garagens…</p>}
        {!loading && erro && <p className="alert alert--danger" role="alert">{erro}</p>}
        {!loading && !erro && garagens.length === 0 && (
          <div className="state-block">
            <p className="state-block__title">Nenhuma garagem cadastrada</p>
            <p className="state-block__text">Você ainda não cadastrou nenhuma garagem. Toque em "Adicionar" para começar.</p>
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
                        Status: {rotulo(STATUS_GARAGEM_LABELS, garagem.status)}
                      </span>
                      <span>{garagem.endereco}</span>
                    </p>
                    <div className="owner-meter">
                      <span className="owner-row__meta tabular">{disponivel} de {garagem.capacidade} vagas livres</span>
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
                      Ver ocupação
                    </button>
                    <button
                      type="button"
                      className="btn btn--secondary"
                      aria-label={`Editar ${garagem.nome}`}
                      onClick={() => navigate(`/cadastro-garagens/${garagem.id}`, { state: { garagem } })}
                    >
                      <Pencil aria-hidden="true" />
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn btn--danger"
                      aria-label={`Excluir ${garagem.nome}`}
                      onClick={() => setGaragemParaExcluir(garagem)}
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
          <h2 id="excluir-garagem-title">Deseja excluir essa garagem?</h2>
          {/* O backend faz exclusão lógica: a garagem vira INATIVA. */}
          <p id="excluir-garagem-desc">{garagemParaExcluir.nome}. A garagem será desativada (status Inativa) e deixará de aparecer no catálogo público.</p>
          <div className="owner-dialog__actions">
            <button type="button" className="btn btn--secondary" aria-label="Cancelar exclusão" onClick={() => setGaragemParaExcluir(null)} disabled={excluindo} data-autofocus>
              Cancelar
            </button>
            <button type="button" className="btn btn--danger" aria-label="Confirmar exclusão" onClick={confirmarExclusao} disabled={excluindo}>
              <Trash2 className="icon" aria-hidden="true" />
              {excluindo ? "Excluindo…" : "Confirmar exclusão"}
            </button>
          </div>
        </ModalDialog>
      )}
      <BottomNav />
    </main>
  );
}
