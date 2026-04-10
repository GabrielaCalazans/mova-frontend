import React from 'react';
import { useNavigate } from 'react-router-dom';
import movaLogo from '../assets/mova_logo.png';
import AuthLayout from '../layout/AuthLayout';
import TopBar from '../components/TopBar';
import {
  LogoContainer,
  Title,
  UnlockContainer,
  UnlockText,
  UnlockCode,
} from '../styles/authStyle';

export default function TelaDeDesbloqueio() {
  return (
    <AuthLayout>
      <TopBar />

      <LogoContainer>
        <img src={movaLogo} alt="Mova Logo" />
      </LogoContainer>

      <Title>Desbloqueio do Veículo</Title>

      <UnlockContainer>
        <UnlockText>Reserva efetuada com sucesso!</UnlockText>
        <UnlockText>Código de Desbloqueio:</UnlockText>
        <UnlockCode>1234-5678</UnlockCode>
      </UnlockContainer>
    </AuthLayout>
  );
}