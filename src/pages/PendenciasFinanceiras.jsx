import { useEffect, useState } from "react";
import { rotulo, STATUS_PAGAMENTO_LABELS, TIPO_COBRANCA_LABELS } from "../services/apiEnums";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import { listarCobrancasPendentes, pagarCobranca } from "../services/cobrancaService";

import "../styles/journey.css";
import "../styles/postcompra.css";

const formatarValor = (valor) =>
  Number(valor).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function PendenciasFinanceiras() {
  const [itens, setItens] = useState([]);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);

  const carregar = async () => {
    setLoading(true);
    try {
      setItens(await listarCobrancasPendentes());
      setErro("");
    } catch (e) {
      setErro(e.message || "Não foi possível carregar pendências.");
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
    try {
      await pagarCobranca(id, { metodoPagamento: "PIX" });
      await carregar();
    } catch (e) {
      setErro(e.message || "Pagamento não aprovado.");
    }
  };

  return (
    <main className="journey-page">
      <header className="journey-head">
        <h1>Pendências financeiras</h1>
        <p className="page-head__lede">Pagamento em ambiente de teste (sandbox): nenhum valor é cobrado de verdade.</p>
      </header>
      {loading && (
        <p className="loading-state" role="status"><span className="spinner" aria-hidden="true" />Carregando pendências...</p>
      )}
      {erro && (
        <div className="alert alert--danger">
          <FontAwesomeIcon icon={faCircleExclamation} aria-hidden="true" />
          <p className="alert__body" role="alert">{erro}</p>
        </div>
      )}
      {!loading && !erro && itens.length === 0 && (
        <div className="state-block">
          <p className="state-block__title">Tudo em dia</p>
          <p className="state-block__text">Você não possui pendências financeiras.</p>
        </div>
      )}
      {itens.length > 0 && (
        <ul className="post-list">
          {itens.map((c) => (
            <li key={c.id} className="post-item">
              <div className="post-item__body">
                <p className="post-item__title tabular">{rotulo(TIPO_COBRANCA_LABELS, c.tipo)} — R$ {formatarValor(c.valor)}</p>
                <p className="post-item__meta">Status: {rotulo(STATUS_PAGAMENTO_LABELS, c.statusPagamento)}</p>
              </div>
              <button type="button" className="btn" onClick={() => pagar(c.id)}>Pagar via Pix (sandbox)</button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
