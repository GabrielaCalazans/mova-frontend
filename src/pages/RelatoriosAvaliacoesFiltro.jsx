import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import FiltroDataPicker, { formatarDataBR } from "../components/FiltroDataPicker";
import "../styles/carselect.css";
import "../styles/auth.css";
import "../styles/relatorios.css";

export default function RelatoriosAvaliacoesFiltro() {
  const navigate = useNavigate();

  const [dataSelecionada, setDataSelecionada] = useState(null);
  const [veiculo, setVeiculo] = useState("");
  const [tipo, setTipo] = useState("Automático");
  const [avaliacao, setAvaliacao] = useState("4");

  useEffect(() => {
    document.title = "MOVA - Filtro de Relatórios de Avaliações";
  }, []);

  function handleAplicar(event) {
    event.preventDefault();
    navigate("/relatorios/avaliacoes", {
      state: {
        data: formatarDataBR(dataSelecionada),
        veiculo,
        tipo,
        avaliacao,
      },
    });
  }

  return (
    <main className="carro-page">
      <div className="carro-header">
        <h1>Relatórios | Avaliações</h1>
      </div>

      <div className="carro-content">
        <h2 className="filtro-title">Filtro</h2>

        <form onSubmit={handleAplicar}>
          <FiltroDataPicker dataSelecionada={dataSelecionada} onChange={setDataSelecionada} />

          <div className="filtro-card">
            <div className="auth-field">
              <label htmlFor="veiculo">Veículo</label>
              <input
                id="veiculo"
                type="text"
                placeholder="Veículo"
                value={veiculo}
                onChange={(e) => setVeiculo(e.target.value)}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="tipo">Tipo</label>
              <select
                id="tipo"
                className="filtro-select"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                <option value="Automático">Automático</option>
                <option value="Manual">Manual</option>
                <option value="Semi-automático">Semi-automático</option>
              </select>
            </div>

            <div className="auth-field">
              <label htmlFor="avaliacao">Avaliação</label>
              <select
                id="avaliacao"
                className="filtro-select"
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
          </div>

          <button type="submit" className="carro-button">
            Aplicar
          </button>
        </form>
      </div>

      <BottomNav />
    </main>
  );
}
