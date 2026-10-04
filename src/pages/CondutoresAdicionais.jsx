import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashCan } from "@fortawesome/free-solid-svg-icons";
import JourneySteps from "../components/reservation/JourneySteps";
import { getJourneyStep } from "../utils/journeyStorage";
import { addCondutor, listCondutores, removeCondutor } from "../services/condutorService";
import { t } from "../i18n";
import "../styles/journey.css";

const VAZIO = { nome: "", cpf: "", cnh: "" };

export default function CondutoresAdicionais() {
  const navigate = useNavigate();
  const reservaId = getJourneyStep("reserva")?.id;
  const [condutores, setCondutores] = useState([]);
  const [form, setForm] = useState(VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [removendoId, setRemovendoId] = useState(null);

  useEffect(() => {
    document.title = t("journey.drivers.documentTitle");
    if (!reservaId) return;
    listCondutores(reservaId).then(setCondutores).catch((error) => {
      setErro(error?.message || t("journey.drivers.loadError"));
    }).finally(() => setCarregando(false));
  }, [reservaId]);

  async function adicionar(event) {
    event.preventDefault();
    if (!reservaId || enviando || condutores.length >= 3) return;
    setEnviando(true); setErro("");
    try {
      const condutor = await addCondutor(reservaId, {
        nome: form.nome.trim(),
        cnh: form.cnh.replace(/\D/g, ""),
        ...(form.cpf.trim() ? { cpf: form.cpf.replace(/\D/g, "") } : {}),
      });
      setCondutores((atual) => [...atual, condutor]);
      setForm(VAZIO);
    } catch (error) {
      setErro(error?.message || t("journey.drivers.addError"));
    } finally { setEnviando(false); }
  }

  async function remover(condutor) {
    if (!reservaId || removendoId) return;
    setErro("");
    setRemovendoId(condutor.id);
    try {
      await removeCondutor(reservaId, condutor.id);
      setCondutores((atual) => atual.filter((item) => item.id !== condutor.id));
    } catch (error) { setErro(error?.message || t("journey.drivers.removeError")); } finally { setRemovendoId(null); }
  }

  const head = (
    <>
      <JourneySteps current="condutores" />
      <header className="journey-head">
        <h1>{t("journey.drivers.title")}</h1>
        <p className="page-head__lede">{t("journey.drivers.lede")}</p>
      </header>
    </>
  );

  if (!reservaId) {
    return (
      <main className="journey-page">
        {head}
        <p className="alert alert--warning" role="alert">{t("journey.drivers.noReservation")}</p>
      </main>
    );
  }

  return (
    <main className="journey-page">
      {head}
      {carregando && <p className="loading-state" role="status"><span className="spinner" aria-hidden="true" />{t("journey.drivers.loading")}</p>}
      {erro && <p className="alert alert--danger" role="alert">{erro}</p>}

      {condutores.length > 0 && (
        <section className="journey-section" aria-labelledby="condutores-lista">
          <h2 id="condutores-lista">{t("journey.drivers.listTitle")} <span className="journey-muted tabular">{t("journey.drivers.countOf", { count: condutores.length })}</span></h2>
          <ul className="line-list">
            {condutores.map((condutor) => (
              <li className="line-list__item" key={condutor.id}>
                <div>
                  <strong>{condutor.nome}</strong>
                  <p className="line-list__desc">{t("journey.drivers.cpf")} <span className="tabular">{condutor.cpf || t("journey.drivers.notInformed")}</span> · {t("journey.drivers.cnh")} <span className="tabular">{condutor.cnh}</span></p>
                </div>
                <button
                  type="button"
                  className="btn btn--danger"
                  aria-label={t("journey.drivers.removeLabel", { name: condutor.nome })}
                  onClick={() => remover(condutor)}
                  disabled={removendoId !== null}
                  aria-busy={removendoId === condutor.id || undefined}
                >
                  <FontAwesomeIcon icon={faTrashCan} aria-hidden="true" />{removendoId === condutor.id ? t("journey.drivers.removing") : t("journey.drivers.remove")}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!carregando && condutores.length < 3 && (
        <form onSubmit={adicionar} className="journey-section form-panel" aria-labelledby="condutor-form-title">
          <h2 id="condutor-form-title">{t("journey.drivers.formTitle")}</h2>
          <div className="field">
            <label className="field__label" htmlFor="condutor-nome">{t("journey.drivers.name")}</label>
            <input id="condutor-nome" className="field__control" autoComplete="name" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
          </div>
          <div className="datetime-grid">
            <div className="field">
              <label className="field__label" htmlFor="condutor-cpf">{t("journey.drivers.cpfOptional")}</label>
              <input id="condutor-cpf" className="field__control" inputMode="numeric" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="condutor-cnh">{t("journey.drivers.cnhLabel")}</label>
              <input id="condutor-cnh" className="field__control" inputMode="numeric" value={form.cnh} onChange={(e) => setForm({ ...form, cnh: e.target.value })} required />
            </div>
          </div>
          <div>
            <button type="submit" className="btn btn--secondary" disabled={enviando} aria-busy={enviando || undefined}>{enviando ? t("journey.drivers.adding") : t("journey.drivers.add")}</button>
          </div>
        </form>
      )}
      {condutores.length >= 3 && <p className="alert alert--info">{t("journey.drivers.limit")}</p>}

      <div className="journey-footer">
        <button type="button" className="btn btn--lg" onClick={() => navigate("/pagamento")}>{t("journey.drivers.next")}</button>
      </div>
    </main>
  );
}
