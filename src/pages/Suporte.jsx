import React from 'react';
import AuthenticatedLayout from '../layout/AuthenticatedLayout';
import {
  Title,
  ContactContainer,
  ContactTitle,
  ContactText,
  PageFooter,
} from '../styles/authStyle';

export default function Suporte() {
  return (
    <AuthenticatedLayout>

      <Title>Suporte</Title>

      <ContactContainer>
        <ContactTitle>Canais de Atendimento:</ContactTitle>
        <ContactText>0800 999 999 (SAC 0800)</ContactText>
        <ContactText>+55 11 99999-9999 (WhatsApp)</ContactText>
        <ContactText>mova@system.com</ContactText>
      </ContactContainer>

      <PageFooter>MOVA</PageFooter>

    </AuthenticatedLayout>
  );
}