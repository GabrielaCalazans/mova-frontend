import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthenticatedLayout from "../layout/AuthenticatedLayout";
import { listServicos } from "../services/servicoService";
import { getJourneyStep, updateJourneyStep } from "../utils/journeyStorage";
import { formatMoneyBRL } from "../utils/reservationMath";
import "../styles/carselect.css";

export default function ServicosOpcionais() {
  const navigate = useNavigate();
  const [servicos, setServicos] = useState([]);
  const [selecionados, setSelecionados] = useState(() => getJourneyStep("servicos")?.selecionados ?? []);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    document.title = "MOVA - Serviços adicionais";
    listServicos().then(setServicos).catch((error) => {
      setErro(error?.message || "Não foi possível carregar os serviços.");
    }).finally(() => setCarregando(false));
  }, []);

  function alternar(servico) {
    setSelecionados((atual) => atual.some((item) => item.id === servico.id)
      ? atual.filter((item) => item.id !== servico.id)
      : [...atual, servico]);
  }

  function continuar() {
    updateJourneyStep("servicos", { ids: selecionados.map((s) => s.id), selecionados });
    navigate("/checkout-reserva");
  }

  const estimativa = selecionados.reduce((total, servico) => total + Number(servico.valor || 0), 0);
  return <AuthenticatedLayout title="Serviços adicionais" align="left">
    <p>Escolha serviços para esta reserva. O valor final será recalculado pelo sistema ao confirmar.</p>
    {carregando && <p className="carro-status">Carregando serviços…</p>}
    {erro && <p role="alert" className="carro-status">{erro}</p>}
    {!carregando && !erro && servicos.length === 0 && <p>Nenhum serviço adicional está disponível.</p>}
    {servicos.map((servico) => {
      const marcado = selecionados.some((item) => item.id === servico.id);
      return <label key={servico.id} className="payment-method-card" style={{ display: "block", cursor: "pointer", marginBottom: "0.75rem" }}>
        <input type="checkbox" checked={marcado} onChange={() => alternar(servico)} />
        <strong style={{ marginLeft: "0.5rem" }}>{servico.nome}</strong>
        <p>{servico.descricao}</p>
        <p>{formatMoneyBRL(servico.valor)}</p>
      </label>;
    })}
    <p data-testid="estimativa-servicos">Estimativa dos serviços: {formatMoneyBRL(estimativa)}</p>
    <button type="button" className="carro-button" onClick={continuar}>Continuar para checkout</button>
  </AuthenticatedLayout>;
}
