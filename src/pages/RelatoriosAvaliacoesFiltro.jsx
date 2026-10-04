import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import FiltroDataPicker from "../components/FiltroDataPicker";
import "../styles/owner.css";
import "../styles/relatorios.css";

export default function RelatoriosAvaliacoesFiltro() {
  const navigate = useNavigate();

  const [dataSelecionada, setDataSelecionada] = useState(null);
  const [veiculo, setVeiculo] = useState("");
  const [avaliacao, setAvaliacao] = useState("4");

  useEffect(() => {
    document.title = "MOVA - Filtro de Relatórios de Avaliações";
  }, []);

  function handleAplicar(event) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (dataSelecionada) {
      const ano = dataSelecionada.getFullYear();
      const mes = String(dataSelecionada.getMonth() + 1).padStart(2, "0");
      const dia = String(dataSelecionada.getDate()).padStart(2, "0");
      const data = `${ano}-${mes}-${dia}`;
      params.set("dataInicio", data);
      params.set("dataFim", data);
    }
    if (veiculo) params.set("idVeiculo", veiculo);
    if (avaliacao) params.set("notaMin", avaliacao);
    navigate(`/relatorios/avaliacoes${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <main className="owner-page" aria-labelledby="filtro-avaliacoes-title">
      <header className="page-head">
        <h1 id="filtro-avaliacoes-title">Relatórios | Avaliações</h1>
        <p className="page-head__lede">Escolha a data, o veículo e a nota mínima para abrir o relatório de avaliações.</p>
      </header>

      <form className="owner-filter owner-form" onSubmit={handleAplicar}>
        <fieldset className="fieldset">
          <legend>Filtro</legend>
          <FiltroDataPicker dataSelecionada={dataSelecionada} onChange={setDataSelecionada} />

          <div className="field">
            <label className="field__label" htmlFor="veiculo">Veículo</label>
            <input
              id="veiculo"
              className="field__control"
              type="text"
              placeholder="Veículo"
              value={veiculo}
              onChange={(e) => setVeiculo(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="avaliacao">Avaliação</label>
            <select
              id="avaliacao"
              className="field__control"
              value={avaliacao}
              onChange={(e) => setAvaliacao(e.target.value)}
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
          </div>
        </fieldset>

        <div className="owner-filter__actions">
          <button type="submit" className="btn">
            Aplicar
          </button>
        </div>
      </form>

      <BottomNav />
    </main>
  );
}
