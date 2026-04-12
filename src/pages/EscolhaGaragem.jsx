import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthenticatedLayout from "../layout/AuthenticatedLayout";
import movaLogo from "../assets/mova_logo.png";
import garagemImg from "../assets/garagem.png";

import {
    LogoContainer,
    Title,
    StyledInput,
    OptionCard,
    GarageInfo,
} from "../styles/authStyle";

function EscolhaGaragem() {
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "MOVA - Escolher Garagem";
    }, []);

    const garagens = [
        { id: 1, nome: "Garagem Centro", endereco: "Endereço: Rua Principal, 123", info: "" },
        { id: 2, nome: "Garagem Sul", endereco: "Endereço: Avenida Sul, 456", info: "Capacidade: 30 carros" },
        { id: 3, nome: "Garagem Norte", endereco: "Endereço: Rua Norte, 789", info: "Capacidade: 40 carros" },
    ];

    return (
        <AuthenticatedLayout>

            <LogoContainer>
                <img src={movaLogo} alt="Mova Logo" />
            </LogoContainer>
            <Title>Escolha uma Garagem para retirar o veículo</Title>

            <StyledInput
                type="text"
                placeholder="Digite seu endereço atual"
            />

            <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                {garagens.map((garagem) => (
                    <OptionCard
                        key={garagem.id}
                        onClick={() => navigate("/agendamento")}
                    >
                        <img src={garagemImg} alt="Garagem" />
                        <GarageInfo>
                            <h3>{garagem.nome}</h3>
                            <p>{garagem.endereco}</p>
                            {garagem.info && <p>{garagem.info}</p>}
                        </GarageInfo>
                    </OptionCard>
                ))}
            </div>
        </AuthenticatedLayout>
    );
}

export default EscolhaGaragem;