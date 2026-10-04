import { useEffect, useState } from "react";
import { rotulo, STATUS_PAGAMENTO, STATUS_PAGAMENTO_LABELS, TIPO_COBRANCA_LABELS } from "../services/apiEnums";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import { listarCobrancasPendentes, pagarCobranca } from "../services/cobrancaService";
import { formatCurrency, t } from "../i18n";

import "../styles/journey.css";
import "../styles/postcompra.css";

export default function PendenciasFinanceiras() {
  const [itens, setItens] = useState([]);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);
  const [pagandoId, setPagandoId] = useState(null);
  const [sucesso, setSucesso] = useState("");

  const carregar = async () => {
    setLoading(true);
    try {
      setItens(await listarCobrancasPendentes());
      setErro("");
    } catch (e) {
      setErro(e.message || t("payment.pending.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      void carregar();
    });
  }, []);

  const pagar = async (id) => {
    setPagandoId(id);
    setSucesso("");
    setErro("");
    try {
      const resultado = await pagarCobranca(id, { metodoPagamento: "PIX" });
      const status = resultado?.cobranca?.statusPagamento;
      setSucesso(
        status && status !== STATUS_PAGAMENTO.SUCESSO
          ? t("payment.pending.sent", { status: rotulo(STATUS_PAGAMENTO_LABELS, status) })
          : t("payment.pending.approved"),
      );
      await carregar();
    } catch (e) {
      setErro(e.message || t("payment.pending.declined"));
    } finally {
      setPagandoId(null);
    }
  };

  return (
    <main className="journey-page">
      <header className="journey-head">
        <h1>{t("payment.pending.title")}</h1>
        <p className="page-head__lede">{t("payment.pending.sandboxLede")}</p>
      </header>
      {loading && (
        <p className="loading-state" role="status"><span className="spinner" aria-hidden="true" />{t("payment.pending.loading")}</p>
      )}
      {sucesso && (
        <div className="alert alert--success" role="status">
          <FontAwesomeIcon icon={faCircleCheck} aria-hidden="true" />
          <p className="alert__body">{sucesso}</p>
        </div>
      )}
      {erro && (
        <div className="alert alert--danger">
          <FontAwesomeIcon icon={faCircleExclamation} aria-hidden="true" />
          <p className="alert__body" role="alert">{erro}</p>
        </div>
      )}
      {!loading && !erro && itens.length === 0 && (
        <div className="state-block">
          <p className="state-block__title">{t("payment.pending.emptyTitle")}</p>
          <p className="state-block__text">{t("payment.pending.emptyText")}</p>
        </div>
      )}
      {itens.length > 0 && (
        <ul className="post-list">
          {itens.map((c) => (
            <li key={c.id} className="post-item">
              <div className="post-item__body">
                <p className="post-item__title tabular">{rotulo(TIPO_COBRANCA_LABELS, c.tipo)} — {formatCurrency(c.valor)}</p>
                <p className="post-item__meta">{t("payment.pending.status", { status: rotulo(STATUS_PAGAMENTO_LABELS, c.statusPagamento) })}</p>
              </div>
              <button
                type="button"
                className="btn"
                onClick={() => pagar(c.id)}
                disabled={pagandoId !== null}
                aria-busy={pagandoId === c.id || undefined}
              >
                {pagandoId === c.id ? t("payment.pending.paying") : t("payment.pending.payPix")}
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
