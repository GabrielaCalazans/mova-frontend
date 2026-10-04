import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashCan } from "@fortawesome/free-solid-svg-icons";
import JourneySteps from "../components/reservation/JourneySteps";
import { getJourneyStep } from "../utils/journeyStorage";
import { addCondutor, listCondutores, removeCondutor } from "../services/condutorService";
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
    document.title = "MOVA - Condutores adicionais";
    if (!reservaId) return;
    listCondutores(reservaId).then(setCondutores).catch((error) => {
      setErro(error?.message || "Não foi possível carregar os condutores.");
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
      setErro(error?.message || "Não foi possível adicionar o condutor.");
    } finally { setEnviando(false); }
  }

  async function remover(condutor) {
    if (!reservaId || removendoId) return;
    setErro("");
    setRemovendoId(condutor.id);
    try {
      await removeCondutor(reservaId, condutor.id);
      setCondutores((atual) => atual.filter((item) => item.id !== condutor.id));
    } catch (error) { setErro(error?.message || "Não foi possível remover o condutor."); } finally { setRemovendoId(null); }
  }

  const head = (
    <>
      <JourneySteps current="condutores" />
      <header className="journey-head">
        <h1>Condutores adicionais</h1>
        <p className="page-head__lede">Inclua até 3 pessoas autorizadas a dirigir. Você pode continuar sem adicionar condutores.</p>
      </header>
    </>
  );

  if (!reservaId) {
    return (
      <main className="journey-page">
        {head}
        <p className="alert alert--warning" role="alert">Não encontramos uma reserva para configurar.</p>
      </main>
    );
  }

  return (
    <main className="journey-page">
      {head}
      {carregando && <p className="loading-state" role="status"><span className="spinner" aria-hidden="true" />Carregando condutores…</p>}
      {erro && <p className="alert alert--danger" role="alert">{erro}</p>}

      {condutores.length > 0 && (
        <section className="journey-section" aria-labelledby="condutores-lista">
          <h2 id="condutores-lista">Autorizados a dirigir <span className="journey-muted tabular">({condutores.length} de 3)</span></h2>
          <ul className="line-list">
            {condutores.map((condutor) => (
              <li className="line-list__item" key={condutor.id}>
                <div>
                  <strong>{condutor.nome}</strong>
                  <p className="line-list__desc">CPF: <span className="tabular">{condutor.cpf || "Não informado"}</span> · CNH: <span className="tabular">{condutor.cnh}</span></p>
                </div>
                <button
                  type="button"
                  className="btn btn--danger"
                  aria-label={`Remover ${condutor.nome}`}
                  onClick={() => remover(condutor)}
                  disabled={removendoId !== null}
                  aria-busy={removendoId === condutor.id || undefined}
                >
                  <FontAwesomeIcon icon={faTrashCan} aria-hidden="true" />{removendoId === condutor.id ? "Removendo…" : "Remover"}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!carregando && condutores.length < 3 && (
        <form onSubmit={adicionar} className="journey-section form-panel" aria-labelledby="condutor-form-title">
          <h2 id="condutor-form-title">Adicionar condutor</h2>
          <div className="field">
            <label className="field__label" htmlFor="condutor-nome">Nome</label>
            <input id="condutor-nome" className="field__control" autoComplete="name" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
          </div>
          <div className="datetime-grid">
            <div className="field">
              <label className="field__label" htmlFor="condutor-cpf">CPF (opcional)</label>
              <input id="condutor-cpf" className="field__control" inputMode="numeric" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="condutor-cnh">CNH</label>
              <input id="condutor-cnh" className="field__control" inputMode="numeric" value={form.cnh} onChange={(e) => setForm({ ...form, cnh: e.target.value })} required />
            </div>
          </div>
          <div>
            <button type="submit" className="btn btn--secondary" disabled={enviando} aria-busy={enviando || undefined}>{enviando ? "Adicionando…" : "Adicionar condutor"}</button>
          </div>
        </form>
      )}
      {condutores.length >= 3 && <p className="alert alert--info">Limite de 3 condutores adicionais atingido.</p>}

      <div className="journey-footer">
        <button type="button" className="btn btn--lg" onClick={() => navigate("/pagamento")}>Continuar para pagamento</button>
      </div>
    </main>
  );
}
