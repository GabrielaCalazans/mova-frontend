import React from 'react';
import AuthenticatedLayout from '../layout/AuthenticatedLayout';
import {
  ContactContainer,
  ContactTitle,
  ContactText,
} from '../styles/authStyle';
import { t } from '../i18n';

export default function Suporte() {
  return (
    <AuthenticatedLayout title={t("common.support.title")}>

      <ContactContainer>
        <ContactTitle as="h2">{t("common.support.channels")}</ContactTitle>
        <ContactText>{t("common.support.tollFree")}</ContactText>
        <ContactText>{t("common.support.whatsapp")}</ContactText>
        <ContactText>mova@system.com</ContactText>
      </ContactContainer>

    </AuthenticatedLayout>
  );
}
