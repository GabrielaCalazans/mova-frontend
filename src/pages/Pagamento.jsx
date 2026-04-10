import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import movaLogo from '../assets/mova_logo.png';
import AuthLayout from '../layout/AuthLayout';
import TopBar from '../components/TopBar';
import { CheckCircle } from "lucide-react";
import {
  LogoContainer,
  Title,
  Subtitle,
  StyledForm,
  Input,
  PrimaryButton,
  FooterText,
  TabsRow,
  Tab,
  CardPreview,
  CardChip,
  CardNumber,
  CardFooter,
  CardLabel,
  CardValue,
  FormRow,
  FieldGroup,
  FieldLabel,
  PixBox,
  QrPlaceholder,
  QrCell,
  PixKey,
  PixKeyText,
  CopyBtn,
  StatusBadge,
  BoletoBox,
  BoletoLine,
  BoletoInfo,
  SecureNote,
  ModalOverlay,
  SuccessModal,
  IconCircle,
  SuccessTitle,
  SuccessSubtitle,
} from '../styles/authStyle';

const QR_PATTERN = [
  1,1,1,1,1,1,1,
  1,0,0,0,0,0,1,
  1,0,1,1,1,0,1,
  1,0,1,0,1,0,1,
  1,0,1,1,1,0,1,
  1,0,0,0,0,0,1,
  1,1,1,1,1,1,1,
];

function formatCardNumber(value) {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

function formatValidade(value) {
  return value.replace(/\D/g, '').slice(0, 4).replace(/^(\d{2})(\d)/, '$1/$2');
}

function maskCardNumber(num) {
  const digits = num.replace(/\s/g, '');
  if (!digits) return '•••• •••• •••• ••••';
  const groups = digits.padEnd(16, '•').match(/.{1,4}/g);
  return groups.join(' ');
}

const LockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

export default function Pagamento() {
  const navigate = useNavigate();

  const [metodo, setMetodo] = useState('cartao');
  const [numeroCartao, setNumeroCartao] = useState('');
  const [nomeTitular, setNomeTitular] = useState('');
  const [validade, setValidade] = useState('');
  const [cvv, setCvv] = useState('');
  const [copied, setCopied] = useState(false);
  const [boletoGerado, setBoletoGerado] = useState(false);
  const [pagamentoConfirmado, setPagamentoConfirmado] = useState(false); // ← novo

  function handleCopy() {
    navigator.clipboard?.writeText('00190000090341950047918230620704337370000010000');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setPagamentoConfirmado(true); // ← exibe o popup em vez de navegar direto
  };

  return (
    <AuthLayout>
      <TopBar />

      <LogoContainer>
        <img src={movaLogo} alt="Mova Logo" />
      </LogoContainer>

      <Title>Pagamento</Title>
      <Subtitle>Escolha seu método de pagamento</Subtitle>

      <TabsRow>
        <Tab active={metodo === 'cartao'} onClick={() => setMetodo('cartao')}>💳 Cartão</Tab>
        <Tab active={metodo === 'pix'}    onClick={() => setMetodo('pix')}>⚡ Pix</Tab>
        <Tab active={metodo === 'boleto'} onClick={() => setMetodo('boleto')}>📄 Boleto</Tab>
      </TabsRow>

      <StyledForm onSubmit={handleSubmit}>

        {metodo === 'cartao' && (
          <>
            <CardPreview>
              <CardChip />
              <CardNumber>{maskCardNumber(numeroCartao)}</CardNumber>
              <CardFooter>
                <div>
                  <CardLabel>Titular</CardLabel>
                  <CardValue>{nomeTitular || 'SEU NOME'}</CardValue>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <CardLabel>Validade</CardLabel>
                  <CardValue>{validade || 'MM/AA'}</CardValue>
                </div>
              </CardFooter>
            </CardPreview>

            <FieldGroup>
              <FieldLabel>Número do Cartão</FieldLabel>
              <Input
                placeholder="0000 0000 0000 0000"
                inputMode="numeric"
                value={numeroCartao}
                onChange={e => setNumeroCartao(formatCardNumber(e.target.value))}
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel>Nome do Titular</FieldLabel>
              <Input
                placeholder="Como impresso no cartão"
                value={nomeTitular}
                onChange={e => setNomeTitular(e.target.value.toUpperCase())}
              />
            </FieldGroup>

            <FormRow>
              <FieldGroup>
                <FieldLabel>Validade</FieldLabel>
                <Input
                  placeholder="MM/AA"
                  inputMode="numeric"
                  value={validade}
                  onChange={e => setValidade(formatValidade(e.target.value))}
                />
              </FieldGroup>
              <FieldGroup>
                <FieldLabel>CVV</FieldLabel>
                <Input
                  placeholder="•••"
                  inputMode="numeric"
                  maxLength={4}
                  type="password"
                  value={cvv}
                  onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                />
              </FieldGroup>
            </FormRow>
          </>
        )}

        {metodo === 'pix' && (
          <PixBox>
            <QrPlaceholder>
              {QR_PATTERN.map((filled, i) => <QrCell key={i} filled={filled} />)}
            </QrPlaceholder>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: '#555' }}>
                Escaneie o QR Code ou copie a chave Pix abaixo
              </p>
              <StatusBadge>⏱ Expira em 15:00</StatusBadge>
            </div>
            <PixKey onClick={handleCopy}>
              <PixKeyText>00190000090341950047918230620704337370000010000</PixKeyText>
              <CopyBtn>{copied ? '✓ Copiado' : 'Copiar'}</CopyBtn>
            </PixKey>
          </PixBox>
        )}

        {metodo === 'boleto' && (
          <BoletoBox>
            {!boletoGerado ? (
              <p style={{ margin: 0, color: '#555', fontSize: '0.9rem', textAlign: 'center' }}>
                O boleto vence em <strong style={{ color: '#003366' }}>3 dias úteis</strong>.
                A confirmação pode levar até 2 dias após o pagamento.
              </p>
            ) : (
              <>
                <BoletoLine />
                <BoletoInfo>
                  <span>Beneficiário: <strong>Mova Mobilidade</strong></span>
                  <StatusBadge>Gerado ✓</StatusBadge>
                </BoletoInfo>
                <BoletoInfo>
                  <span>Vencimento: <strong>{new Date(Date.now() + 3 * 86400000).toLocaleDateString('pt-BR')}</strong></span>
                  <span>Valor: <strong>R$ 250,00</strong></span>
                </BoletoInfo>
                <BoletoLine />
              </>
            )}
          </BoletoBox>
        )}

        {metodo === 'boleto' && !boletoGerado ? (
          <PrimaryButton type="button" onClick={() => setBoletoGerado(true)}>
            Gerar Boleto
          </PrimaryButton>
        ) : (
          <PrimaryButton type="submit" style={{ marginTop: '1rem' }}>
            Finalizar Pagamento
          </PrimaryButton>
        )}

      </StyledForm>

      <SecureNote>
        <LockIcon />
        Pagamento 100% seguro e criptografado
      </SecureNote>

      <FooterText>
        Dúvidas? <a href="#">Fale com o suporte</a>
      </FooterText>

      {/* ── Popup de pagamento confirmado ── */}
      {pagamentoConfirmado && (
        <ModalOverlay>
          <SuccessModal>
            <IconCircle>
              <CheckCircle size={48} color="#2e7d32" strokeWidth={1.5} />
            </IconCircle>
            <SuccessTitle>Pagamento Confirmado!</SuccessTitle>
            <SuccessSubtitle>
              Seu pagamento foi processado com sucesso.
              Agora você pode desbloquear o veículo.
            </SuccessSubtitle>
            <PrimaryButton onClick={() => navigate("/desbloqueio-de-carro")}>
              Desbloquear Veículo
            </PrimaryButton>
          </SuccessModal>
        </ModalOverlay>
      )}

    </AuthLayout>
  );
}