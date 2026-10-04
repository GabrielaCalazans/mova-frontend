import React from 'react';
import AuthenticatedLayout from '../layout/AuthenticatedLayout';
import {
  ContactContainer,
  ContactTitle,
  ContactText,
} from '../styles/authStyle';

export default function Suporte() {
  return (
    <AuthenticatedLayout title="Suporte">

      <ContactContainer>
        <ContactTitle as="h2">Canais de atendimento</ContactTitle>
        <ContactText>0800 999 999 (SAC 0800)</ContactText>
        <ContactText>+55 11 99999-9999 (WhatsApp)</ContactText>
        <ContactText>mova@system.com</ContactText>
      </ContactContainer>

    </AuthenticatedLayout>
  );
}
