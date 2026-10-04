import { useEffect, useState } from "react";
import { formatCurrency, formatDate, t } from "../../i18n";
import { rotulo, STATUS_VEICULO_LABELS } from "../../services/apiEnums";
import { listHistoricoVeiculo } from "../../services/auditoriaService";

// RN09: trilha de auditoria do veículo, só leitura. Mostra quem (cargo), quando,
// a operação e os campos que mudaram (antes → depois).
function valor(campo, bruto, garagens) {
  if (bruto === null || bruto === undefined || bruto === "") return t("owner.history.empty");
  if (campo === "status") return rotulo(STATUS_VEICULO_LABELS, bruto);
  if (campo === "garagemId") return garagens.find((g) => g.id === bruto)?.nome ?? t("owner.history.otherGarage");
  if (campo === "valorDiaria") return formatCurrency(bruto);
  if (typeof bruto === "boolean") return bruto ? t("owner.history.yes") : t("owner.history.no");
  return String(bruto);
}

export default function HistoricoAlteracoes({ idVeiculo, garagens = [] }) {
  const [estado, setEstado] = useState({ carregando: true, itens: [], erro: "" });

  useEffect(() => {
    let ativo = true;
    listHistoricoVeiculo(idVeiculo)
      .then((itens) => ativo && setEstado({ carregando: false, itens, erro: "" }))
      .catch(() => ativo && setEstado({ carregando: false, itens: [], erro: t("owner.history.error") }));
    return () => { ativo = false; };
  }, [idVeiculo]);

  return (
    <section className="owner-history" aria-labelledby="historico-titulo">
      <h2 id="historico-titulo">{t("owner.history.title")}</h2>
      {estado.carregando && <p className="loading-state" role="status"><span className="spinner" aria-hidden="true" />{t("owner.history.loading")}</p>}
      {estado.erro && <p className="alert alert--danger" role="alert">{estado.erro}</p>}
      {!estado.carregando && !estado.erro && estado.itens.length === 0 && <p className="journey-muted">{t("owner.history.none")}</p>}
      {estado.itens.length > 0 && (
        <ol className="owner-history__list">
          {estado.itens.map((item) => {
            const campos = Object.keys(item.depois ?? {});
            return (
              <li key={item.id} className="owner-history__item">
                <p className="owner-history__head">
                  <strong>{t(`owner.history.actions.${item.acao}`)}</strong>
                  <span className="journey-muted">
                    {" · "}
                    <time dateTime={item.criadoEm}>{formatDate(item.criadoEm, { dateStyle: "short", timeStyle: "short" })}</time>
                    {" · "}
                    {t(`owner.history.actors.${item.cargoAtor}`)}
                  </span>
                </p>
                {item.acao !== "CRIACAO" && campos.length > 0 && (
                  <ul className="owner-history__changes">
                    {campos.map((campo) => (
                      <li key={campo}>
                        {t(`owner.history.fields.${campo}`)}: {valor(campo, item.antes?.[campo], garagens)} → {valor(campo, item.depois[campo], garagens)}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
