import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import BottomNav from "../components/BottomNav";
import "../styles/owner.css";

export default function RelatoriosFiltro() {
  useEffect(() => {
    document.title = "MOVA - Filtro de Relatórios";
  }, []);

  return (
    <main className="owner-page" aria-labelledby="relatorios-title">
      <header className="page-head">
        <h1 id="relatorios-title">Relatórios</h1>
        <p className="page-head__lede">Consulte reservas, utilização, receita e avaliações da sua frota.</p>
      </header>
      <ul className="owner-hub">
        <li>
          <Link to="/relatorios/veiculos">
            <span className="owner-hub__title">Ver relatório completo <ChevronRight aria-hidden="true" /></span>
            <span className="owner-hub__text">Reservas, faturamento por veículo, ocupação e avaliações em um só relatório agregado.</span>
          </Link>
        </li>
        <li>
          <Link to="/relatorios/avaliacoes-filtro">
            <span className="owner-hub__title">Filtrar avaliações <ChevronRight aria-hidden="true" /></span>
            <span className="owner-hub__text">Notas por data, veículo e nota mínima, com exportação em CSV.</span>
          </Link>
        </li>
      </ul>
      <BottomNav />
    </main>
  );
}
