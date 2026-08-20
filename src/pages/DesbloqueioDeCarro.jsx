<<<<<<< HEAD
import { useEffect, useState } from "react";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import { getJourneyStep } from "../utils/journeyStorage";
import "../styles/carselect.css";
import "../styles/payment.css";

export default function TelaDeDesbloqueio() {
  const [codigo, setCodigo] = useState("");

  useEffect(() => {
    document.title = "MOVA - Desbloqueio";
    setCodigo(getJourneyStep("reserva")?.codigoDesbloqueio || "");
  }, []);

  return (
    <main className="carro-page">
      <div className="carro-header">
        <TopBar showLogo iconColor="white" />
        <h1>Pagamento</h1>
      </div>

      <div className="carro-content" style={{ marginTop: "-1.75rem", textAlign: "center" }}>
        <h2 style={{ color: "var(--color-primary-strong)", fontSize: "1.3rem", margin: "2.5rem 0 1.5rem" }}>
          Veículo Desbloqueado
        </h2>

        <div className="payment-method-card">
          <p style={{ margin: "0 0 0.75rem", color: "var(--color-primary-strong)" }}>
            Sua reserva foi efetuada com sucesso!
          </p>
          <p style={{ margin: "0 0 0.5rem", color: "var(--color-primary-strong)" }}>
            Seu código de desbloqueio é:
          </p>
          <p style={{ margin: 0, color: "var(--color-primary-strong)", fontSize: "1.4rem", fontWeight: 700 }}>
            {codigo || "Código indisponível"}
          </p>
        </div>
      </div>
          <BottomNav />
    </main>
  );
}
=======
import React from 'react';
import { useNavigate } from 'react-router-dom';
import movaLogo from '../assets/mova_logo.png';
import AuthenticatedLayout from '../layout/AuthenticatedLayout';
import {
  LogoContainer,
  Title,
  UnlockContainer,
  UnlockText,
  UnlockCode,
} from '../styles/authStyle';

export default function TelaDeDesbloqueio() {
  return (
    <AuthenticatedLayout>

      <LogoContainer>
        <img src={movaLogo} alt="Mova Logo" />
      </LogoContainer>

      <Title>Desbloqueio do Veículo</Title>

      <UnlockContainer>
        <UnlockText>Reserva efetuada com sucesso!</UnlockText>
        <UnlockText>Código de Desbloqueio:</UnlockText>
        <UnlockCode>1234-5678</UnlockCode>
      </UnlockContainer>
    </AuthenticatedLayout>
  );
}
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
