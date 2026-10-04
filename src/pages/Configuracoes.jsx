import React, { useState } from 'react';
import AuthenticatedLayout from '../layout/AuthenticatedLayout';
import ThemeToggle from '../components/ui/ThemeToggle';
import {
  Section,
  SectionTitle,
  Row,
  Label,
  Toggle,
  SmallInput,
  SecondaryButton,
} from '../styles/authStyle';

export default function Configuracoes() {
  const [fonte, setFonte]                 = useState(12);
  const [idioma, setIdioma]               = useState('Português');
  const [notificacoes, setNotificacoes]   = useState(true);
  const [vibrar, setVibrar]               = useState(true);
  const [segurancaV2E, setSegurancaV2E]   = useState(true);

  return (
    <AuthenticatedLayout title="Configurações">

      <Section aria-labelledby="cfg-aparencia">
        <SectionTitle as="h2" id="cfg-aparencia">Aparência</SectionTitle>

        <Row>
          <Label>Tema</Label>
          <ThemeToggle labeled />
        </Row>

        <Row as="label">
          <Label>Fonte</Label>
          <SmallInput
            type="number"
            value={fonte}
            onChange={e => setFonte(Number(e.target.value))}
          />
        </Row>

        <Row as="label">
          <Label>Idioma</Label>
          <SmallInput
            value={idioma}
            onChange={e => setIdioma(e.target.value)}
            style={{ width: '10rem' }}
          />
        </Row>
      </Section>

      <Section aria-labelledby="cfg-notificacoes">
        <SectionTitle as="h2" id="cfg-notificacoes">Notificações</SectionTitle>

        <Row as="label">
          <Label>Push</Label>
          <Toggle
            checked={notificacoes}
            onChange={() => setNotificacoes(!notificacoes)}
          />
        </Row>

        <Row as="label">
          <Label>Vibrar</Label>
          <Toggle
            checked={vibrar}
            onChange={() => setVibrar(!vibrar)}
          />
        </Row>
      </Section>

      <Section aria-labelledby="cfg-seguranca">
        <SectionTitle as="h2" id="cfg-seguranca">Segurança</SectionTitle>

        <Row as="label">
          <Label>V2E</Label>
          <Toggle
            checked={segurancaV2E}
            onChange={() => setSegurancaV2E(!segurancaV2E)}
          />
        </Row>

        <SecondaryButton type="button">
          Alterar Senha
        </SecondaryButton>

        <SecondaryButton type="button">
          Limpar Cache
        </SecondaryButton>
      </Section>

    </AuthenticatedLayout>
  );
}
