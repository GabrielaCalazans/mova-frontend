import React, { useState } from 'react';
import AuthenticatedLayout from '../layout/AuthenticatedLayout';
import {
  Title,
  Section,
  SectionTitle,
  Row,
  Label,
  Toggle,
  SmallInput,
  SelectionButton,
  PageFooter,
} from '../styles/authStyle';

export default function Configuracoes() {
  const [temaEscuro, setTemaEscuro]       = useState(false);
  const [fonte, setFonte]                 = useState(12);
  const [idioma, setIdioma]               = useState('Português');
  const [notificacoes, setNotificacoes]   = useState(true);
  const [vibrar, setVibrar]               = useState(true);
  const [segurancaV2E, setSegurancaV2E]   = useState(true);

  return (
    <AuthenticatedLayout>

      <Title>Configurações</Title>

      {/* Aparência */}
      <Section>
        <SectionTitle>Aparência</SectionTitle>

        <Row>
          <Label>Tema Escuro</Label>
          <Toggle
            checked={temaEscuro}
            onChange={() => setTemaEscuro(!temaEscuro)}
          />
        </Row>

        <Row>
          <Label>Fonte</Label>
          <SmallInput
            type="number"
            value={fonte}
            onChange={e => setFonte(Number(e.target.value))}
          />
        </Row>

        <Row>
          <Label>Idioma</Label>
          <SmallInput
            value={idioma}
            onChange={e => setIdioma(e.target.value)}
            style={{ width: '120px' }}
          />
        </Row>
      </Section>

      {/* Notificações */}
      <Section>
        <SectionTitle>Notificações</SectionTitle>

        <Row>
          <Label>Push</Label>
          <Toggle
            checked={notificacoes}
            onChange={() => setNotificacoes(!notificacoes)}
          />
        </Row>

        <Row>
          <Label>Vibrar</Label>
          <Toggle
            checked={vibrar}
            onChange={() => setVibrar(!vibrar)}
          />
        </Row>
      </Section>

      {/* Segurança */}
      <Section>
        <SectionTitle>Segurança</SectionTitle>

        <Row>
          <Label>V2E</Label>
          <Toggle
            checked={segurancaV2E}
            onChange={() => setSegurancaV2E(!segurancaV2E)}
          />
        </Row>

        <SelectionButton style={{ width: '100%', marginTop: '0.5rem' }}>
          Alterar Senha
        </SelectionButton>

        <SelectionButton style={{ width: '100%', marginTop: '0.5rem' }}>
          Limpar Cache
        </SelectionButton>
      </Section>

      <PageFooter>MOVA</PageFooter>

    </AuthenticatedLayout>
  );
}