import { useEffect, useState } from "react";
import { rotulo, STATUS_GARAGEM_LABELS } from "../services/apiEnums";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { createGaragem, listGaragens, updateGaragem } from "../services/garagemService";
import { getAuthSession } from "../services/authSession";
import { t } from "../i18n";
import "../styles/owner.css";

const STATUS_OPCOES = ["ATIVA", "INATIVA", "MANUTENCAO"];

export default function CadastroGaragemForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isNovo = id === "novo";
  const idLocador = getAuthSession()?.user?.id;

  const garagemOriginal = location.state?.garagem;

  const [values, setValues] = useState({
    nome: garagemOriginal?.nome || "",
    endereco: garagemOriginal?.endereco || "",
    capacidade: garagemOriginal?.capacidade ? String(garagemOriginal.capacidade) : "",
    acessibilidade: garagemOriginal?.acessibilidade ?? true,
    status: garagemOriginal?.status || "ATIVA",
  });
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [carregandoGaragem, setCarregandoGaragem] = useState(!isNovo && !garagemOriginal);

  useEffect(() => {
    if (isNovo || garagemOriginal || !idLocador || !id) return undefined;

    let ativo = true;
    listGaragens({ idLocador })
      .then((garagens) => {
        if (!ativo) return;
        const garagem = (Array.isArray(garagens) ? garagens : []).find(
          (item) => String(item.id) === String(id),
        );
        if (!garagem) {
          throw new Error(t("owner.garageForm.notFound"));
        }
        setValues({
          nome: garagem.nome || "",
          endereco: garagem.endereco || "",
          capacidade: garagem.capacidade ? String(garagem.capacidade) : "",
          acessibilidade: garagem.acessibilidade ?? true,
          status: garagem.status || "ATIVA",
        });
        setErro(null);
      })
      .catch((error) => {
        if (ativo) setErro(error.message || t("owner.garageForm.loadError"));
      })
      .finally(() => {
        if (ativo) setCarregandoGaragem(false);
      });

    return () => {
      ativo = false;
    };
  }, [garagemOriginal, id, idLocador, isNovo]);

  useEffect(() => {
    document.title = isNovo ? t("owner.garageForm.docTitleNew") : t("owner.garageForm.docTitleEdit");
  }, [isNovo]);

  function handleChange(key, value) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErro(null);

    const payload = {
      nome: values.nome,
      endereco: values.endereco,
      capacidade: Number(values.capacidade),
      acessibilidade: Boolean(values.acessibilidade),
      ...(isNovo ? {} : { status: values.status }),
    };

    setSalvando(true);
    try {
      if (isNovo) {
        if (!idLocador) throw new Error(t("owner.common.sessionInvalid"));
        await createGaragem({ ...payload, idLocador });
      } else {
        await updateGaragem(id, payload);
      }
      navigate("/cadastro-garagens");
    } catch (e) {
      setErro(e.message || t("owner.garageForm.saveError"));
    } finally {
      setSalvando(false);
    }
  }

  const titulo = isNovo ? t("owner.garageForm.titleNew") : t("owner.garageForm.titleEdit");

  if (carregandoGaragem) {
    return (
      <main className="owner-page" aria-labelledby="garagem-form-title">
        <header className="page-head"><h1 id="garagem-form-title">{titulo}</h1></header>
        <p className="loading-state" role="status" aria-live="polite"><span className="spinner" aria-hidden="true" />{t("owner.garageForm.loading")}</p>
      </main>
    );
  }

  return (
    <main className="owner-page" aria-labelledby="garagem-form-title">
      <header className="page-head">
        <h1 id="garagem-form-title">{titulo}</h1>
        <p className="page-head__lede">{t("owner.garageForm.lede")}</p>
      </header>
      <form className="owner-form" onSubmit={handleSubmit} noValidate>
        {erro && (
          <p className="alert alert--danger" role="status" aria-live="polite">
            {erro}
          </p>
        )}

        <fieldset className="fieldset">
          <legend>{t("owner.garageForm.details")}</legend>
          <div className="field">
            <label className="field__label" htmlFor="nome">{t("owner.garageForm.name")}</label>
            <input
              id="nome"
              className="field__control"
              type="text"
              placeholder={t("owner.garageForm.name")}
              required
              value={values.nome}
              onChange={(e) => handleChange("nome", e.target.value)}
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="endereco">{t("owner.garageForm.address")}</label>
            <input
              id="endereco"
              className="field__control"
              type="text"
              placeholder={t("owner.garageForm.address")}
              required
              value={values.endereco}
              onChange={(e) => handleChange("endereco", e.target.value)}
            />
          </div>
        </fieldset>

        <fieldset className="fieldset">
          <legend>{t("owner.common.operation")}</legend>
          <div className="owner-form__grid">
            <div className="field">
              <label className="field__label" htmlFor="capacidade">{t("owner.garageForm.capacity")}</label>
              <input
                id="capacidade"
                className="field__control"
                type="text"
                inputMode="numeric"
                placeholder={t("owner.garageForm.capacityPlaceholder")}
                required
                value={values.capacidade}
                onChange={(e) => handleChange("capacidade", e.target.value.replace(/\D/g, ""))}
              />
            </div>

            {!isNovo && (
              <div className="field">
                <label className="field__label" htmlFor="status">{t("owner.common.status")}</label>
                <select
                  id="status"
                  className="field__control"
                  value={values.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                >
                  {STATUS_OPCOES.map((status) => (
                    <option key={status} value={status}>{rotulo(STATUS_GARAGEM_LABELS, status)}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <label className="checkline">
            <input
              type="checkbox"
              checked={values.acessibilidade}
              onChange={(e) => handleChange("acessibilidade", e.target.checked)}
            />
            {t("owner.garageForm.accessible")}
          </label>
        </fieldset>

        {isNovo && <p className="owner-form__note">{t("owner.common.requiredNote")}</p>}

        <div className="owner-form__actions">
          <button type="button" className="btn btn--secondary btn--lg" onClick={() => navigate("/cadastro-garagens")} disabled={salvando}>
            {t("owner.common.cancel")}
          </button>
          <button type="submit" className="btn btn--lg" disabled={salvando}>
            {salvando ? t("owner.common.saving") : isNovo ? t("owner.common.finishRegistration") : t("owner.common.submitEdit")}
          </button>
        </div>
      </form>
    </main>
  );
}
