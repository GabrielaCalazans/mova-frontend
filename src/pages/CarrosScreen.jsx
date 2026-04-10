import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../layout/AuthLayout";
import TopBar from "../components/TopBar";
import movaLogo from "../assets/mova_logo.png";

import argoImg from "../assets/fiat-argo-drive.png";
import hb20Img from "../assets/hiunday-hb20-plus.png";
import civicImg from "../assets/honda-civic-confort.png";

import {
    LogoContainer,
    Title,
    PrimaryButton,
    CarListContainer,
    CarCard,
    CarInfoText,
    PriceTag
} from "../styles/authStyle";

const carros = [
    {
        nome: "Fiat Argo Drive",
        dados: {
            marca: "Fiat", modelo: "Argo", ano: 2022,
            transmissao: "Manual", motor: "1.3L", combustivel: "Flex",
            autonomia: 455, preco: 99.0, imagem: argoImg,
            localizacao: "Garagem Norte", disponivel: true,
        },
    },
    {
        nome: "Hyundai HB20 Plus",
        dados: {
            marca: "Hyundai", modelo: "HB20", ano: 2024,
            transmissao: "Manual", motor: "1.0L", combustivel: "Flex",
            autonomia: 675, preco: 140.9, imagem: hb20Img,
            localizacao: "Garagem Sul", disponivel: true,
        },
    },
    {
        nome: "Honda Civic Confort",
        dados: {
            marca: "Honda", modelo: "Civic", ano: 2023,
            transmissao: "Automática", motor: "2.0L", combustivel: "Gasolina",
            autonomia: 448, preco: 99.99, imagem: civicImg,
            localizacao: "Garagem Oeste", disponivel: false,
        },
    },
];

function CarrosScreen() {
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "MOVA - Escolha seu Carro";
    }, []);

    return (
        <AuthLayout>
            <TopBar />

            <LogoContainer>
                <img src={movaLogo} alt="Mova Logo" />
            </LogoContainer>

            <Title>Escolha seu Carro</Title>

            <CarListContainer>
                {carros.map((carro, index) => (
                    <CarCard key={index} disponivel={carro.dados.disponivel}>
                        <img src={carro.dados.imagem} alt={carro.nome} className="car-img" />

                        <h3>{carro.nome}</h3>

                        <div className="info-grid">
                            <CarInfoText>{carro.dados.marca} • {carro.dados.modelo}</CarInfoText>
                            <CarInfoText>{carro.dados.ano} • {carro.dados.transmissao}</CarInfoText>
                            <CarInfoText>Motor: {carro.dados.motor} • {carro.dados.combustivel}</CarInfoText>
                            <CarInfoText>Autonomia: {carro.dados.autonomia} km</CarInfoText>
                            <CarInfoText>Local: {carro.dados.localizacao}</CarInfoText>
                        </div>

                        <PriceTag>R$ {carro.dados.preco.toFixed(2)} / dia</PriceTag>

                        <PrimaryButton
                            disabled={!carro.dados.disponivel}
                            onClick={() => navigate("/escolha-garagem")}
                            style={{
                                marginTop: "15px",
                                opacity: carro.dados.disponivel ? 1 : 0.5,
                                cursor: carro.dados.disponivel ? "pointer" : "not-allowed",
                            }}
                        >
                            {carro.dados.disponivel ? "Selecionar" : "Indisponível"}
                        </PrimaryButton>
                    </CarCard>
                ))}
            </CarListContainer>
        </AuthLayout>
    );
}

export default CarrosScreen;