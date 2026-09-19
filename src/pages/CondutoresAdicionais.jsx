import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthenticatedLayout from "../layout/AuthenticatedLayout";
import { getJourneyStep } from "../utils/journeyStorage";
import { addCondutor, listCondutores, removeCondutor } from "../services/condutorService";
import "../styles/carselect.css";

const VAZIO = { nome: "", cpf: "", cnh: "" };

export default function CondutoresAdicionais() {
  const navigate = useNavigate();
  const reservaId = getJourneyStep("reserva")?.id;
  const [condutores, setCondutores] = useState([]);
  const [form, setForm] = useState(VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

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
    if (!reservaId) return;
    setErro("");
    try {
      await removeCondutor(reservaId, condutor.id);
      setCondutores((atual) => atual.filter((item) => item.id !== condutor.id));
    } catch (error) { setErro(error?.message || "Não foi possível remover o condutor."); }
  }

  if (!reservaId) return <AuthenticatedLayout title="Condutores adicionais"><p role="alert">Não encontramos uma reserva para configurar.</p></AuthenticatedLayout>;
  return <AuthenticatedLayout title="Condutores adicionais" align="left">
    <p>Inclua até 3 pessoas autorizadas a dirigir. Você pode continuar sem adicionar condutores.</p>
    {carregando && <p className="carro-status">Carregando condutores…</p>}
    {erro && <p className="carro-status" role="alert">{erro}</p>}
    {condutores.map((condutor) => <div className="payment-method-card" key={condutor.id}>
      <strong>{condutor.nome}</strong><p>CPF: {condutor.cpf || "Não informado"}<br />CNH: {condutor.cnh}</p>
      <button type="button" onClick={() => remover(condutor)}>Remover</button>
    </div>)}
    {!carregando && condutores.length < 3 && <form onSubmit={adicionar} className="payment-method-card">
      <label htmlFor="condutor-nome">Nome</label><input id="condutor-nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
      <label htmlFor="condutor-cpf">CPF (opcional)</label><input id="condutor-cpf" inputMode="numeric" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
      <label htmlFor="condutor-cnh">CNH</label><input id="condutor-cnh" inputMode="numeric" value={form.cnh} onChange={(e) => setForm({ ...form, cnh: e.target.value })} required />
      <button type="submit" className="carro-button" disabled={enviando}>{enviando ? "Adicionando…" : "Adicionar condutor"}</button>
    </form>}
    {condutores.length >= 3 && <p>Limite de 3 condutores adicionais atingido.</p>}
    <button type="button" className="carro-button" onClick={() => navigate("/pagamento")}>Continuar para pagamento</button>
  </AuthenticatedLayout>;
}
