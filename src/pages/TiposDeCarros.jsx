import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import CursorGlowArea from "../components/ui/CursorGlowArea";
import { t } from "../i18n";
import "../styles/vehicle.css";

import economicoImg from "../assets/car-types/manuais.png";
import executivoImg from "../assets/car-types/automaticos.png";
import adaptadoImg from "../assets/car-types/adaptados.png";
import eletricoImg from "../assets/car-types/autonomos.png";

const TIPOS = [
  { id: "economico", img: economicoImg },
  // A ilustração é decorativa; a categoria real vem do filtro enviado à API.
  { id: "espacoso", img: executivoImg },
  { id: "executivo", img: executivoImg },
  { id: "adaptado", img: adaptadoImg },
  { id: "eletrico", img: eletricoImg },
];

function TiposDeCarros() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = t("catalog.types.documentTitle");
  }, []);

  return (
    <main className="carro-page catalog-page">
      <header className="page-head">
        <h1>{t("catalog.types.title")}</h1>
        <p className="page-head__lede">{t("catalog.types.lede")}</p>
      </header>

      <CursorGlowArea as="ul" className="type-grid">
        {TIPOS.map((tipo) => (
          <li key={tipo.id}>
            <button type="button" className="type-option cursor-card" onClick={() => navigate("/carros/lista", { state: { tipo: tipo.id } })}>
              <span className="type-option__media"><img src={tipo.img} alt="" /></span>
              <span className="type-option__body">
                <span className="type-option__name">{t(`catalog.types.${tipo.id}.name`)}</span>
                <span className="type-option__hint">{t(`catalog.types.${tipo.id}.hint`)}</span>
              </span>
            </button>
          </li>
        ))}
      </CursorGlowArea>
      <BottomNav />
    </main>
  );
}

export default TiposDeCarros;
