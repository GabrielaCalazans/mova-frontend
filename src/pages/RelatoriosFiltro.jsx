import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import "../styles/carselect.css";
import "../styles/relatorios.css";

export default function RelatoriosFiltro() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "MOVA - Filtro de Relatórios";
  }, []);

  return (
    <main className="carro-page">
      <div className="carro-header"><h1>Relatórios | Veículos</h1></div>
      <div className="carro-content">
        <h2 className="filtro-title">Relatório agregado</h2>
        <p className="relatorio-filter-summary">A fonte atual de relatórios de veículos não oferece filtros por período, garagem, veículo ou status.</p>
        <button type="button" className="carro-button" onClick={() => navigate("/relatorios/veiculos")}>Ver relatório</button>
      </div>
      <BottomNav />
    </main>
  );
}
