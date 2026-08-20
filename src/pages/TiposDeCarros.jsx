<<<<<<< HEAD
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import "../styles/carselect.css";
=======
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import movaLogo from "../assets/mova_logo.png";
import AuthenticatedLayout from "../layout/AuthenticatedLayout";

import {
    LogoContainer,
    PrimaryButton,
    Title,
    OptionsGrid,
    OptionCard,
    CarImage
} from "../styles/authStyle";
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244

import economicoImg from "../assets/car-types/manuais.png";
import executivoImg from "../assets/car-types/automaticos.png";
import adaptadoImg from "../assets/car-types/adaptados.png";
import eletricoImg from "../assets/car-types/autonomos.png";

<<<<<<< HEAD
const TIPOS = [
  { id: "economico", nome: "Carro Econômico", img: economicoImg },
  { id: "executivo", nome: "Carro Executivo", img: executivoImg },
  { id: "adaptado", nome: "Carro Adaptado", img: adaptadoImg },
  { id: "eletrico", nome: "Carro Elétrico", img: eletricoImg },
];

function TiposDeCarros() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    document.title = "MOVA - Tipos de Carros";
  }, []);

  const tipo = TIPOS[index];

  function goPrev() {
    setIndex((current) => (current === 0 ? TIPOS.length - 1 : current - 1));
  }

  function goNext() {
    setIndex((current) => (current === TIPOS.length - 1 ? 0 : current + 1));
  }

  function selecionarTipo() {
    navigate("/carros/lista", { state: { tipo: tipo.id } });
  }

  return (
    <main className="carro-page">
      <div className="carro-header">
        <TopBar showLogo iconColor="white" />
        <h1>Escolha o Tipo de Carro</h1>
      </div>

      <div className="carro-content">
        <div className="carro-type-card">
          <div className="carro-type-card__label">
            <h2>{tipo.nome}</h2>
          </div>
          <div className="carro-type-card__body">
            <button
              type="button"
              className="carro-type-card__nav"
              onClick={goPrev}
              aria-label="Tipo anterior"
            >
              <ChevronLeft size={26} />
            </button>

            <img src={tipo.img} alt={tipo.nome} className="carro-type-card__icon" />

            <button
              type="button"
              className="carro-type-card__nav"
              onClick={goNext}
              aria-label="Próximo tipo"
            >
              <ChevronRight size={26} />
            </button>
          </div>
          <div className="carro-type-card__footer">
            <button type="button" className="carro-button" onClick={selecionarTipo}>
              Selecionar
            </button>
          </div>
        </div>

        <div className="carro-dots" role="tablist" aria-label="Tipos de carro disponiveis">
          {TIPOS.map((item, itemIndex) => (
            <span
              key={item.id}
              className={`carro-dots__dot${itemIndex === index ? " carro-dots__dot--active" : ""}`}
            />
          ))}
        </div>
      </div>
          <BottomNav />
    </main>
  );
}

export default TiposDeCarros;
=======
function TiposDeCarros() {
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "MOVA - Tipos de Carros";
    }, []);

    const tipos = [
        { id: 1, nome: "Carro Econômico", img: economicoImg },
        { id: 2, nome: "Carro Executivo", img: executivoImg },
        { id: 3, nome: "Carro Adaptado", img: adaptadoImg },
        { id: 4, nome: "Carro Elétrico", img: eletricoImg },
    ];

    return (
        <AuthenticatedLayout>

            <LogoContainer>
                <img src={movaLogo} alt="Mova Logo" />
            </LogoContainer>

            <Title>Escolha o Tipo de Carro</Title>

            <OptionsGrid>
                {tipos.map((carro) => (
                    <OptionCard key={carro.id} variant="type">
                        <h3>{carro.nome}</h3>
                        <CarImage src={carro.img} alt={carro.nome} />
                        <PrimaryButton
                            onClick={() => navigate("/carros", { state: { tipo: carro.id } })}
                            style={{ width: "80%" }}
                        >
                            Selecionar
                        </PrimaryButton>
                    </OptionCard>
                ))}
            </OptionsGrid>
        </AuthenticatedLayout>
    );
}

export default TiposDeCarros;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
