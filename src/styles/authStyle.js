import styled, { css, keyframes } from 'styled-components';

/* MOVA — componentes styled legados (Task 8).
   Mesmos nomes e elementos de antes; visual só por tokens semânticos de
   tokens.css (claro/escuro trocam sozinhos). Sem gradiente, raio <= 8 px,
   sombra só em sobreposição real (diálogo/popup). */

const BaseInputStyles = css`
  width: 100%;
  min-height: var(--control-h);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  font-size: var(--text-control);
  font-family: inherit;
  background-color: var(--surface-secondary);
  color: var(--text-primary);
  box-sizing: border-box;
  transition: border-color var(--dur-fast) var(--ease-out);

  &::placeholder {
    color: var(--text-muted);
    opacity: 1;
  }

  &:hover:not(:disabled) { border-color: var(--action-primary); }

  &[aria-invalid="true"] {
    border-color: var(--feedback-danger-fg);
    box-shadow: inset 0 0 0 1px var(--feedback-danger-fg);
  }

  &:disabled {
    cursor: not-allowed;
    background-color: var(--action-disabled-bg);
    color: var(--action-disabled-text);
    border-color: var(--action-disabled-border);
  }
`;

const ButtonBase = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: var(--control-h);
  padding: var(--space-2) var(--space-5);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: var(--text-label);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-snug);
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  box-sizing: border-box;
  transition: background-color var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);

  &:disabled {
    cursor: not-allowed;
    background: var(--action-disabled-bg);
    color: var(--action-disabled-text);
    border-color: var(--action-disabled-border);
  }
`;

const PrimaryButtonStyles = css`
  ${ButtonBase}
  background: var(--action-primary);
  color: var(--action-primary-text);

  &:hover:not(:disabled) { background: var(--action-primary-hover); }
  &:active:not(:disabled) { background: var(--action-primary-active); }
`;

const SecondaryButtonStyles = css`
  ${ButtonBase}
  background: var(--action-secondary-bg);
  color: var(--action-secondary-text);
  border-color: var(--action-secondary-border);

  &:hover:not(:disabled) {
    background: var(--action-quiet-hover);
    border-color: var(--action-primary);
  }
`;

const QuietLinkStyles = css`
  display: inline-flex;
  align-items: center;
  min-height: var(--control-h);
  padding: 0 var(--space-2);
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-link);
  font-family: inherit;
  font-size: var(--text-label);
  font-weight: var(--weight-semibold);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
  cursor: pointer;

  &:hover { background: var(--action-quiet-hover); text-decoration-thickness: 2px; }
`;

const PanelStyles = css`
  background: var(--surface-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  box-sizing: border-box;
`;

// ─── Moldura ─────────────────────────────────────────────────────────────────
export const AuthPage = styled.div`
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-8) var(--gutter);
  background-color: var(--surface-primary);
  color: var(--text-primary);
`;

export const AuthCard = styled.div`
  width: 100%;
  max-width: 28rem;
  box-sizing: border-box;
`;

export const AuthLogo = styled.img`
  display: block;
  width: 200px;
  max-width: 70%;
  height: auto;
  margin: 0 auto var(--space-6);
  object-fit: contain;
`;

export const LogoContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  margin-bottom: var(--space-6);

  img {
    width: 200px;
    max-width: 70%;
    height: auto;
    object-fit: contain;
  }
`;

export const Title = styled.h1`
  margin: 0 0 var(--space-6);
  font-size: var(--text-h1);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-tight);
  color: var(--text-primary);
`;

export const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  width: 100%;
  min-width: 0;
`;

export const Input = styled.input`
  ${BaseInputStyles}
`;

export const PasswordWrapper = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  box-sizing: border-box;
`;

export const PasswordInput = styled.input`
  ${BaseInputStyles}
  padding-right: calc(var(--control-h) + var(--space-1));
`;

export const ToggleButton = styled.button`
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: var(--control-h);
  height: var(--control-h);
  padding: 0;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover { color: var(--text-primary); background: var(--action-quiet-hover); }
`;

// ─── Botões ──────────────────────────────────────────────────────────────────
export const PrimaryButton = styled.button`
  ${PrimaryButtonStyles}
  width: 100%;
  min-height: var(--control-h-lg);
`;

export const SecondaryButton = styled.button`
  ${SecondaryButtonStyles}
  width: 100%;
`;

export const FooterText = styled.p`
  margin: var(--space-4) 0 0;
  font-size: var(--text-label);
  color: var(--text-secondary);

  a {
    color: var(--text-link);
    font-weight: var(--weight-semibold);
  }
`;

export const SelectionButton = styled.button`
  ${PrimaryButtonStyles}
  width: 100%;
  margin-top: var(--space-3);
`;

// ─── Opções / garagens ───────────────────────────────────────────────────────
export const OptionsGrid = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--space-3);
  width: 100%;
`;

export const OptionCard = styled.div`
  ${PanelStyles}
  display: flex;
  flex-direction: ${props => props.variant === 'type' ? 'column' : 'row'};
  align-items: center;
  justify-content: ${props => props.variant === 'type' ? 'center' : 'flex-start'};
  gap: var(--space-4);
  width: 100%;
  min-height: var(--control-h);
  padding: var(--space-4);
  cursor: pointer;
  border-color: ${props => props.$selected ? 'var(--selected-border)' : 'var(--border-default)'};
  box-shadow: ${props => props.$selected ? 'inset 0 0 0 1px var(--selected-border)' : 'none'};
  background: ${props => props.$selected ? 'var(--surface-sunken)' : 'var(--surface-secondary)'};
  transition: border-color var(--dur-fast) var(--ease-out), background-color var(--dur-fast) var(--ease-out);

  &:hover { border-color: var(--action-primary); }

  h3 {
    margin: 0;
    color: var(--text-primary);
    font-size: var(--text-h3);
  }

  img {
    width: ${props => props.variant === 'type' ? '120px' : '64px'};
    height: auto;
    object-fit: contain;
    flex: none;
  }
`;

export const GarageInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  text-align: left;
  min-width: 0;

  p { margin: 0; font-size: var(--text-meta); color: var(--text-secondary); overflow-wrap: anywhere; }
`;

// ─── Jornada ─────────────────────────────────────────────────────────────────
export const JourneySection = styled.section`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding-top: var(--space-6);
  border-top: 1px solid var(--border-default);
`;

export const JourneySectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--space-3);
  flex-wrap: wrap;
`;

export const JourneySectionTitle = styled.h2`
  margin: 0;
  color: var(--text-primary);
  font-size: var(--text-h3);
`;

export const JourneySectionHint = styled.p`
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--text-meta);
  line-height: var(--leading-normal);
`;

export const GarageActionsRow = styled.div`
  display: flex;
  justify-content: flex-start;
  width: 100%;
`;

export const TextButton = styled.button`
  ${QuietLinkStyles}
`;

export const JourneyFieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  width: 100%;
  min-width: 0;
`;

export const JourneyFieldLabel = styled.label`
  font-size: var(--text-label);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
`;

export const JourneyFieldsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);

  @media (min-width: 520px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const JourneySummaryCard = styled.div`
  width: 100%;
  padding: var(--space-4);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-default);
  background: var(--surface-sunken);
  box-sizing: border-box;
`;

export const JourneySummaryLabel = styled.span`
  display: block;
  margin-bottom: var(--space-1);
  font-size: var(--text-meta);
  color: var(--text-muted);
`;

export const JourneySummaryValue = styled.p`
  margin: 0;
  color: var(--text-primary);
  font-size: var(--text-label);
  line-height: var(--leading-snug);
  font-weight: var(--weight-semibold);
`;

export const HeaderIcons = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  min-height: var(--control-h);
  margin-bottom: var(--space-4);
  .back-arrow { font-size: var(--text-h3); color: var(--text-link); cursor: pointer; }
  img { width: 32px; cursor: pointer; }
`;

export const StyledInput = styled.input`
  ${BaseInputStyles}
  margin-bottom: var(--space-5);
`;

// ─── Diálogos ────────────────────────────────────────────────────────────────
export const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: var(--surface-scrim);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--gutter);
  z-index: 1000;
  animation: mova-fade-in var(--dur-base) var(--ease-out);
`;

export const ModalContent = styled.div`
  width: 100%;
  max-width: 24rem;
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-default);
  background: var(--surface-elevated);
  color: var(--text-primary);
  box-shadow: var(--shadow-lg);
  box-sizing: border-box;
`;

export const MenuItem = styled.div`
  display: flex;
  align-items: center;
  min-height: 3rem;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border-default);
  color: var(--text-primary);
  font-size: var(--text-label);
  font-weight: var(--weight-semibold);
  cursor: pointer;
  &:hover { background: var(--action-quiet-hover); }
`;

// ─── Veículos ────────────────────────────────────────────────────────────────
export const CarImage = styled.img`
  width: 100px;
  height: auto;
  object-fit: contain;
  margin: var(--space-2) 0;
`;

export const CarListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
`;

export const CarCard = styled.div`
  ${PanelStyles}
  padding: var(--space-4);
  opacity: ${props => props.disponivel ? 1 : 0.6};

  img.car-img {
    width: 100%;
    height: 160px;
    object-fit: contain;
    margin-bottom: var(--space-2);
    background: var(--surface-sunken);
    border-radius: var(--radius-sm);
  }

  h3 {
    color: var(--text-primary);
    margin: 0 0 var(--space-2);
  }

  .info-grid {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    margin-bottom: var(--space-2);
  }
`;

export const CarInfoText = styled.p`
  margin: 0;
  font-size: var(--text-meta);
  color: var(--text-secondary);
`;

export const PriceTag = styled.p`
  margin: var(--space-2) 0 0;
  font-size: var(--text-price);
  font-weight: var(--weight-bold);
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
`;

export const Subtitle = styled.p`
  margin: 0 0 var(--space-6);
  font-size: var(--text-body);
  color: var(--text-secondary);
  line-height: var(--leading-normal);
`;

export const LightInput = styled(Input)`
  background-color: var(--surface-secondary);
`;

// ── EscolhaDataHora ──────────────────────────────────────────

export const InputWithIcon = styled(Input)`
  padding-right: calc(var(--control-h) + var(--space-1));
  cursor: pointer;
`;

export const IconBtn = styled.span`
  position: absolute;
  right: var(--space-3);
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
`;

export const Popup = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: calc(100% - 2 * var(--gutter));
  max-width: 24rem;
  max-height: calc(100dvh - 2 * var(--gutter));
  overflow: auto;
  background: var(--surface-elevated);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: 9999;
  padding: var(--space-4);
  box-sizing: border-box;
  animation: mova-fade-in var(--dur-base) var(--ease-out);
`;

export const PopupOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: var(--surface-scrim);
  z-index: 9998;
`;

export const FieldWrapper = styled.div`
  position: relative;
  width: 100%;
`;

export const CalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
`;

export const CalTitle = styled.span`
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
  font-size: var(--text-label);
  text-transform: capitalize;
`;

export const NavBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--control-h);
  height: var(--control-h);
  padding: 0;
  border: none;
  border-radius: var(--radius-sm);
  background: none;
  color: var(--text-link);
  font-size: var(--text-h3);
  font-family: inherit;
  cursor: pointer;
  &:hover { background: var(--action-quiet-hover); }
`;

export const DayNames = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  margin-bottom: var(--space-1);
  span { font-size: var(--text-eyebrow); font-weight: var(--weight-semibold); color: var(--text-muted); }
`;

export const DayGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
`;

export const DayCell = styled.button`
  aspect-ratio: 1;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${p => p.today && !p.selected ? 'var(--border-strong)' : 'transparent'};
  background: ${p => p.selected ? 'var(--selected-bg)' : 'none'};
  color: ${p => p.selected ? 'var(--selected-text)' : p.disabled ? 'var(--action-disabled-text)' : 'var(--text-primary)'};
  text-decoration: ${p => p.disabled && !p.empty ? 'line-through' : 'none'};
  border-radius: var(--radius-sm);
  font-size: var(--text-meta);
  font-weight: ${p => p.today || p.selected ? 'var(--weight-semibold)' : 'var(--weight-regular)'};
  font-variant-numeric: tabular-nums;
  cursor: ${p => p.disabled || p.empty ? 'default' : 'pointer'};
  font-family: inherit;
  transition: background-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);
  &:hover:not([disabled]) { background: ${p => p.selected ? 'var(--selected-bg)' : 'var(--action-quiet-hover)'}; }
`;

export const ClockDisplay = styled.div`
  text-align: center;
  font-size: var(--text-price-lg);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-3);
  user-select: none;
  font-variant-numeric: tabular-nums;
`;

export const ClockPart = styled.span`
  color: ${p => p.active ? 'var(--text-link)' : 'var(--text-secondary)'};
  text-decoration: ${p => p.active ? 'underline' : 'none'};
  text-decoration-thickness: 2px;
  text-underline-offset: 6px;
  cursor: pointer;
  background: none;
  border: 0;
  border-radius: var(--radius-sm);
  font: inherit;
  padding: var(--space-1) var(--space-2);
  min-height: var(--control-h);
`;

export const ModeBtns = styled.div`
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
`;

export const ModeBtn = styled.button`
  flex: 1;
  min-height: var(--control-h);
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  border: 1px solid ${p => p.active ? 'var(--selected-border)' : 'var(--border-strong)'};
  background: ${p => p.active ? 'var(--selected-bg)' : 'var(--surface-secondary)'};
  color: ${p => p.active ? 'var(--selected-text)' : 'var(--text-primary)'};
  font-family: inherit;
  font-weight: var(--weight-semibold);
  font-size: var(--text-label);
  cursor: pointer;
`;

export const ClockFaceWrap = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: var(--space-3);
`;

export const FaceSvg = styled.svg`
  cursor: pointer;
  overflow: visible;
  max-width: 100%;
  height: auto;
`;

export const ConfirmBtn = styled(PrimaryButton)`
  min-height: var(--control-h);
`;

export const AmPmBtns = styled.div`
  display: flex;
  gap: var(--space-2);
  justify-content: center;
  margin-bottom: var(--space-3);
`;

export const AmPmBtn = styled.button`
  min-height: var(--control-h);
  padding: var(--space-2) var(--space-6);
  border-radius: var(--radius-sm);
  border: 1px solid ${p => p.active ? 'var(--selected-border)' : 'var(--border-strong)'};
  background: ${p => p.active ? 'var(--selected-bg)' : 'var(--surface-secondary)'};
  color: ${p => p.active ? 'var(--selected-text)' : 'var(--text-primary)'};
  font-family: inherit;
  font-weight: var(--weight-semibold);
  font-size: var(--text-label);
  cursor: pointer;
  transition: background-color var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out);
`;

// ─── Keyframes ────────────────────────────────────────────────────────────────
export const slideIn = keyframes`
  from { opacity: 0; transform: translateX(20px); }
  to   { opacity: 1; transform: translateX(0); }
`;

// ─── Pagamento ────────────────────────────────────────────────────────────────
export const TabsRow = styled.div`
  display: flex;
  gap: 2px;
  margin-bottom: var(--space-6);
  padding: 2px;
  background: var(--surface-sunken);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
`;

export const Tab = styled.button`
  flex: 1;
  min-height: var(--control-h);
  padding: var(--space-2);
  border: 1px solid ${p => p.active ? 'var(--border-strong)' : 'transparent'};
  border-radius: var(--radius-xs);
  font-size: var(--text-label);
  font-weight: var(--weight-semibold);
  font-family: inherit;
  cursor: pointer;
  transition: background-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);
  background: ${p => p.active ? 'var(--surface-elevated)' : 'transparent'};
  color: ${p => p.active ? 'var(--text-primary)' : 'var(--text-muted)'};

  &:hover { color: var(--text-primary); }
`;

export const CardPreview = styled.div`
  position: relative;
  margin-bottom: var(--space-6);
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  background: var(--action-primary);
  color: var(--action-primary-text);
  text-align: left;
  overflow: hidden;
`;

export const CardChip = styled.div`
  width: 36px;
  height: 26px;
  margin-bottom: var(--space-4);
  border: 1px solid currentColor;
  border-radius: var(--radius-sm);
  opacity: 0.6;
`;

export const CardNumber = styled.p`
  margin: 0 0 var(--space-3);
  font-size: var(--text-h3);
  font-weight: var(--weight-semibold);
  letter-spacing: 0.12em;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
`;

export const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: var(--space-3);
  flex-wrap: wrap;
`;

export const CardLabel = styled.span`
  display: block;
  margin-bottom: 2px;
  font-size: var(--text-eyebrow);
  opacity: 0.85;
`;

export const CardValue = styled.span`
  font-size: var(--text-label);
  font-weight: var(--weight-semibold);
`;

export const FormRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 9rem), 1fr));
  gap: var(--space-4);
`;

export const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  text-align: left;
  min-width: 0;
`;

export const FieldLabel = styled.label`
  font-size: var(--text-label);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
`;

export const PixBox = styled.div`
  ${PanelStyles}
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-6) var(--space-4);
  background: var(--surface-sunken);
`;

export const QrPlaceholder = styled.div`
  width: 140px;
  height: 140px;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(7, 1fr);
  gap: 2px;
  padding: var(--space-2);
  background: var(--neutral-white);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  box-sizing: border-box;
`;

export const QrCell = styled.div`
  background: ${p => p.filled ? 'var(--brand-deep)' : 'transparent'};
  border-radius: 1px;
`;

export const PixKey = styled.div`
  width: 100%;
  min-height: var(--control-h);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background: var(--surface-secondary);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: var(--text-meta);
  font-weight: var(--weight-semibold);
  cursor: pointer;
  box-sizing: border-box;
  transition: background-color var(--dur-fast) var(--ease-out);
  &:hover { background: var(--action-quiet-hover); }
`;

export const PixKeyText = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  font-size: var(--text-meta);
  font-weight: var(--weight-regular);
`;

export const CopyBtn = styled.span`
  flex: none;
  font-size: var(--text-meta);
  color: var(--text-link);
  font-weight: var(--weight-semibold);
`;

export const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 2px var(--space-2);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xs);
  background: var(--surface-sunken);
  color: var(--text-secondary);
  font-size: var(--text-meta);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-snug);
`;

export const SecureNote = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: var(--space-2);
  margin-top: var(--space-3);
  font-size: var(--text-meta);
  color: var(--text-muted);
`;

export const SuccessModal = styled.div`
  width: 100%;
  max-width: 24rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-default);
  background: var(--surface-elevated);
  color: var(--text-primary);
  box-shadow: var(--shadow-lg);
  text-align: left;
  box-sizing: border-box;
  animation: mova-sheet-up var(--dur-base) var(--ease-out);
`;

export const IconCircle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md);
  background: var(--feedback-success-bg);
  color: var(--feedback-success-fg);

  svg { width: 32px; height: 32px; }
`;

export const SuccessTitle = styled.h2`
  margin: 0;
  color: var(--text-primary);
  font-size: var(--text-h2);
`;

export const SuccessSubtitle = styled.p`
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--text-meta);
  line-height: var(--leading-normal);
`;

// ─── Desbloqueio ─────────────────────────────────────────────────────────────
export const UnlockContainer = styled.div`
  ${PanelStyles}
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-5);
  margin-bottom: var(--space-4);
`;

export const UnlockText = styled.p`
  margin: var(--space-1) 0;
  font-size: var(--text-label);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
  text-align: center;
`;

export const UnlockCode = styled.p`
  margin: var(--space-3) 0 0;
  font-size: var(--text-price-lg);
  font-weight: var(--weight-bold);
  color: var(--text-primary);
  letter-spacing: 0.15em;
  font-variant-numeric: tabular-nums;
`;

// ─── Configurações / seções ──────────────────────────────────────────────────
export const Section = styled.div`
  width: 100%;
  padding: var(--space-6) 0;
  border-top: 1px solid var(--border-default);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  box-sizing: border-box;
`;

export const SectionTitle = styled.h3`
  margin: 0 0 var(--space-2);
  font-size: var(--text-h3);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
`;

export const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
  min-height: var(--control-h);
  &:is(label) { cursor: pointer; }
`;

export const Label = styled.span`
  font-size: var(--text-label);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
`;

/* Interruptor: trilho 44×24 sobre a linha inteira clicável (Row as="label"). */
export const Toggle = styled.input.attrs({ type: 'checkbox', role: 'switch' })`
  flex: none;
  width: 44px;
  height: 24px;
  margin: 0;
  appearance: none;
  background: ${p => p.checked ? 'var(--action-primary)' : 'var(--surface-sunken)'};
  border: 1px solid ${p => p.checked ? 'var(--action-primary)' : 'var(--border-strong)'};
  border-radius: var(--radius-pill);
  position: relative;
  cursor: pointer;
  transition: background-color var(--dur-fast) var(--ease-out);

  &::after {
    content: '';
    position: absolute;
    width: 18px;
    height: 18px;
    top: 2px;
    left: ${p => p.checked ? '22px' : '2px'};
    border-radius: 50%;
    background: ${p => p.checked ? 'var(--action-primary-text)' : 'var(--border-strong)'};
    transition: left var(--dur-fast) var(--ease-out);
  }
`;

export const SmallInput = styled.input`
  ${BaseInputStyles}
  width: 6rem;
  max-width: 100%;
  text-align: left;
`;

export const PageFooter = styled.div`
  margin-top: var(--space-6);
  font-size: var(--text-meta);
  color: var(--text-muted);
`;

// ─── Viagens / perfil / contato ──────────────────────────────────────────────
export const TripList = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: var(--space-3);
`;

export const TripCard = styled.div`
  ${PanelStyles}
  width: 100%;
  padding: var(--space-4);
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--space-4);
`;

export const TripImage = styled.img`
  width: 80px;
  height: 50px;
  object-fit: contain;
  flex-shrink: 0;
`;

export const TripInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  flex: 1;
  min-width: 0;
`;

export const TripText = styled.p`
  margin: 0;
  font-size: var(--text-meta);
  color: var(--text-secondary);
`;

export const ProfileContainer = styled.div`
  ${PanelStyles}
  width: 100%;
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

export const ProfileImage = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: var(--space-3);
`;

export const ProfileName = styled.h2`
  margin: 0 0 var(--space-2);
  font-size: var(--text-h3);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
`;

export const ProfileText = styled.p`
  margin: 0 0 var(--space-1);
  font-size: var(--text-meta);
  color: var(--text-secondary);
`;

export const ContactContainer = styled.div`
  width: 100%;
  padding-top: var(--space-6);
  border-top: 1px solid var(--border-default);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
`;

export const ContactTitle = styled.h3`
  margin: 0 0 var(--space-2);
  font-size: var(--text-h3);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
`;

export const ContactText = styled.p`
  margin: 0;
  font-size: var(--text-label);
  color: var(--text-primary);
  overflow-wrap: anywhere;
`;

// ─── Busca / filtros ─────────────────────────────────────────────────────────
export const SearchWrapper = styled.div`
  width: 100%;
  margin-bottom: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

export const SearchInputWrapper = styled.div`
  position: relative;
  width: 100%;
`;

export const SearchInput = styled.input`
  ${BaseInputStyles}
  padding-right: calc(var(--control-h) + var(--space-1));
`;

export const SearchIcon = styled.span`
  position: absolute;
  right: var(--space-3);
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
`;

export const FiltersRow = styled.div`
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
`;

export const FilterSelect = styled.select`
  ${BaseInputStyles}
  flex: 1;
  min-width: 8rem;
  width: auto;
  cursor: pointer;
`;

export const FilterToggle = styled.button`
  min-height: var(--control-h);
  padding: var(--space-2) var(--space-4);
  border: 1px solid ${(p) => (p.active ? "var(--selected-border)" : "var(--border-strong)")};
  border-radius: var(--radius-sm);
  font-size: var(--text-label);
  font-weight: var(--weight-semibold);
  font-family: inherit;
  background: ${(p) => (p.active ? "var(--selected-bg)" : "var(--surface-secondary)")};
  color: ${(p) => (p.active ? "var(--selected-text)" : "var(--text-primary)")};
  cursor: pointer;
  transition: background-color var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out);
  white-space: nowrap;

  &:hover { border-color: var(--action-primary); }
`;

export const ClearButton = styled.button`
  ${QuietLinkStyles}
  align-self: flex-start;
  padding: 0;
`;

export const StatusMessage = styled.p`
  margin: var(--space-6) 0;
  color: var(--text-secondary);
  font-size: var(--text-meta);
`;

export const ResultCount = styled.p`
  margin: 0 0 var(--space-2);
  font-size: var(--text-meta);
  color: var(--text-secondary);
`;
