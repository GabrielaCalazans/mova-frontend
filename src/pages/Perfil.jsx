import React from 'react';
import AuthLayout from '../layout/AuthLayout';
import TopBar from '../components/TopBar';
import movaLogo from '../assets/mova_logo.png';
import perfilIcon from '../assets/perfil-icon.png';
import {
  LogoContainer,
  ProfileContainer,
  ProfileImage,
  ProfileName,
  ProfileText,
  PageFooter,
} from '../styles/authStyle';

export default function Perfil() {
  return (
    <AuthLayout>
      <TopBar />

      <LogoContainer>
        <img src={movaLogo} alt="Mova Logo" />
      </LogoContainer>

      <ProfileContainer>
        <ProfileImage src={perfilIcon} alt="Foto de perfil" />
        <ProfileName>Nome do Usuário</ProfileName>
        <ProfileText>Data de Registro: 01/01/2025</ProfileText>
        <ProfileText>E-mail: usuario@email.com</ProfileText>
        <ProfileText>Plano: Grátis</ProfileText>
        <ProfileText>Viagens Realizadas: 0</ProfileText>
        <ProfileText>Avaliações: 0</ProfileText>
      </ProfileContainer>

      <PageFooter>MOVA</PageFooter>

    </AuthLayout>
  );
}