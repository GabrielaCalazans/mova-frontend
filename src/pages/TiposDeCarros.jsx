import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import movaLogo from "../assets/mova_logo.png";
import AuthLayout from "../layout/AuthLayout";
import TopBar from "../components/TopBar";

import {
    LogoContainer,
    PrimaryButton,
    Title,
    OptionsGrid,
    OptionCard,
    CarImage
} from "../styles/authStyle";

import economicoImg from "../assets/car-types/manuais.png";
import executivoImg from "../assets/car-types/automaticos.png";
import adaptadoImg from "../assets/car-types/adaptados.png";
import eletricoImg from "../assets/car-types/autonomos.png";

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
        <AuthLayout>
            <TopBar />

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
                            onClick={() => navigate("/carros-screens", { state: { tipo: carro.id } })}
                            style={{ width: "80%" }}
                        >
                            Selecionar
                        </PrimaryButton>
                    </OptionCard>
                ))}
            </OptionsGrid>
        </AuthLayout>
    );
}

export default TiposDeCarros;