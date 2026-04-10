import styled, { css, keyframes } from 'styled-components';

const BaseInputStyles = css`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #003366;
  border-radius: 0.7rem;
  font-size: 1rem;
  font-family: inherit;
  background-color: #fff;
  box-sizing: border-box;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    outline: none;
    border-color: #aec5e7;
    box-shadow: 0 0 0 3px rgba(174, 197, 231, 0.3);
  }
`;

export const AuthPage = styled.div`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  background-color: #f4f4f4;
`;

export const AuthCard = styled.div`
  width: 100%;
  max-width: 500px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 2.5rem 2rem;
  text-align: center;
  box-sizing: border-box;
`;

export const AuthLogo = styled.img`
  height: 7em;
  margin-bottom: 1rem;
  object-fit: contain;
`;

export const LogoContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1rem;
  width: 100%;

  img {
    height: 6em; /* Altura que você definiu no inline */
    object-fit: contain;
  }
`;

export const Title = styled.h1`
  margin-bottom: 1.5rem;
  color: #003366;
`;

export const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  width: 100%;
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
  padding-right: 3rem;
`;

export const ToggleButton = styled.button`
  position: absolute;
  right: 0.8rem;
  background: none;
  border: none;
  color: #003366;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
`;

export const PrimaryButton = styled.button`
  width: 100%;
  margin-top: 0.5rem;
  padding: 0.8rem;
  border-radius: 0.7rem;
  border: 1px solid #003366;
  background: linear-gradient(135deg, #003366, #aec5e7);
  color: #ffffff;
  cursor: pointer;
  font-weight: 600;
  font-size: 1.1rem;
  box-sizing: border-box;
  transition: opacity 0.2s;

  &:hover { opacity: 0.9; }
`;

// ESTE ERA O QUE ESTAVA FALTANDO E QUEBROU O LOGIN:
export const FooterText = styled.p`
  margin-top: 1.5rem;
  font-size: 0.95rem;
  color: #444;

  a {
    color: #003366;
    font-weight: 700;
    text-decoration: none;

    &:hover { text-decoration: underline; }
  }
`;

// Estilo para o botão "Selecionar" nos cards claros
export const SelectionButton = styled.button`
  width: 70%;
  padding: 10px;
  border-radius: 8px;
  border: none;
  background-color: #003366;
  color: white;
  font-weight: bold;
  cursor: pointer;
  margin-top: 10px;
`;

export const OptionsGrid = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.2rem;
  width: 100%;
  margin-top: 1rem;
`;

export const OptionCard = styled.div`
  display: flex;
  flex-direction: ${props => props.variant === 'type' ? 'column' : 'row'};
  align-items: center;
  justify-content: ${props => props.variant === 'type' ? 'center' : 'flex-start'};
  background-color: ${props => props.variant === 'type' ? '#E0F7FA' : '#003366'};
  padding: 15px 20px;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  cursor: pointer;
  box-sizing: border-box;
  transition: transform 0.2s;
   margin: calc(10px + 0.25rem) 0;

  &:hover { transform: scale(1.02); }

  h3 {
    margin: 0;
    color: ${props => props.variant === 'type' ? '#003366' : '#ffffff'};
    font-size: 1.2rem;
  }

  img {
    width: ${props => props.variant === 'type' ? '120px' : '60px'};
    height: auto;
    margin: ${props => props.variant === 'type' ? '10px 0' : '0 15px 0 0'};
    object-fit: contain;
  }
`;

export const GarageInfo = styled.div`
  display: flex;
  flex-direction: column;
  text-align: left;
 
  p { margin: 2px 0 0 0; font-size: 0.85rem; color: #dcdcdc; }
`;

export const HeaderIcons = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 20px;
  .back-arrow { font-size: 1.8rem; color: #003366; cursor: pointer; }
  img { width: 30px; cursor: pointer; }
`;

export const StyledInput = styled.input`
  width: 100%;
  max-width: 400px;
  height: 45px;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 0 15px;
  margin-bottom: 20px;
  box-sizing: border-box;
`;

export const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 1000;
`;

export const ModalContent = styled.div`
  background: white; width: 80%; max-width: 350px; border-radius: 12px; padding: 20px; text-align: center;
`;

export const MenuItem = styled.div`
  padding: 15px; border-bottom: 1px solid #eee; color: #003366; font-weight: 500; cursor: pointer;
  &:hover { background: #f0f8ff; }
`;

export const CarImage = styled.img`
  width: 100px;
  height: auto;
  object-fit: contain;
  margin: 8px 0;
`;
 
export const CarListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  width: 100%;
`;
 
export const CarCard = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  opacity: ${props => props.disponivel ? 1 : 0.6};
 
  img.car-img {
    width: 100%;
    height: 160px;
    object-fit: contain;
    margin-bottom: 8px;
  }
 
  h3 {
    color: #003366;
    margin: 0 0 8px;
  }
 
  .info-grid {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-bottom: 8px;
  }
`;
 
export const CarInfoText = styled.p`
  margin: 0;
  font-size: 0.85rem;
  color: #555;
`;
 
export const PriceTag = styled.p`
  font-size: 1rem;
  font-weight: 700;
  color: #003366;
  margin: 8px 0 0;
`;

export const Subtitle = styled.p`
  font-size: 1rem;
  text-align: center;
  color: #555;
  margin-bottom: 2rem;
  line-height: 1.4;
`;

export const LightInput = styled(Input)`
  background-color: #f0f8ff; /* Azul bem clarinho para diferenciar */
  border-bottom: 2px solid #003366; /* Estilo que remete ao mobile original */
`;

// ── EscolhaDataHora ──────────────────────────────────────────

export const InputWithIcon = styled(Input)`
  padding-right: 2.8rem;
  cursor: pointer;
  caret-color: transparent;
  user-select: none;
`;

export const IconBtn = styled.span`
  position: absolute;
  right: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #003366;
  display: flex;
  align-items: center;
`;

export const Popup = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 380px;
  background: #fff;
  border: 1px solid #aec5e7;
  border-radius: 12px;
  box-shadow: 0 8px 28px rgba(0,51,102,.25);
  z-index: 9999;
  padding: 16px;
  animation: fadeDown .18s ease;
  @keyframes fadeDown {
    from { opacity:0; transform: translate(-50%, -52%) }
    to   { opacity:1; transform: translate(-50%, -50%) }
  }
`;

export const PopupOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.2);
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
  margin-bottom: 12px;
`;

export const CalTitle = styled.span`
  font-weight: 800;
  color: #003366;
  font-size: .9rem;
`;

export const NavBtn = styled.button`
  background: none;
  border: none;
  color: #003366;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 6px;
  &:hover { background: #f0f8ff; }
`;

export const DayNames = styled.div`
  display: grid;
  grid-template-columns: repeat(7,1fr);
  text-align: center;
  margin-bottom: 4px;
  span { font-size:.68rem; font-weight:700; color:#aec5e7; }
`;

export const DayGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7,1fr);
  gap: 2px;
`;

export const DayCell = styled.button`
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: ${p => p.selected ? '#003366' : 'none'};
  color: ${p => p.selected ? '#fff' : p.disabled ? '#ccc' : p.today ? '#2b5ba8' : '#003366'};
  border-radius: 50%;
  font-size: .82rem;
  font-weight: 600;
  cursor: ${p => p.disabled || p.empty ? 'default' : 'pointer'};
  outline: ${p => p.today && !p.selected ? '2px solid #aec5e7' : 'none'};
  font-family: inherit;
  transition: background .15s, color .15s;
  &:hover:not([disabled]) { background: ${p => p.selected ? '#003366' : '#f0f8ff'}; }
`;

export const ClockDisplay = styled.div`
  text-align: center;
  font-size: 2.6rem;
  font-weight: 900;
  color: #003366;
  margin-bottom: 14px;
  user-select: none;
  letter-spacing: .04em;
`;

export const ClockPart = styled.span`
  color: ${p => p.active ? '#2b5ba8' : '#003366'};
  text-decoration: ${p => p.active ? 'underline' : 'none'};
  text-underline-offset: 4px;
  cursor: pointer;
`;

export const ModeBtns = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
`;

export const ModeBtn = styled.button`
  flex: 1;
  padding: 8px;
  border-radius: 8px;
  border: 2px solid ${p => p.active ? '#003366' : '#d0dff0'};
  background: ${p => p.active ? '#f0f8ff' : 'none'};
  color: ${p => p.active ? '#003366' : '#aec5e7'};
  font-family: inherit;
  font-weight: 700;
  font-size: .85rem;
  cursor: pointer;
`;

export const ClockFaceWrap = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 14px;
`;

export const FaceSvg = styled.svg`
  cursor: pointer;
  overflow: visible;
`;

export const ConfirmBtn = styled(PrimaryButton)`
  margin-top: 0;
  padding: 10px;
  font-size: .95rem;
`;

export const AmPmBtns = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 14px;
`;

export const AmPmBtn = styled.button`
  padding: 6px 24px;
  border-radius: 8px;
  border: 2px solid ${p => p.active ? '#003366' : '#d0dff0'};
  background: ${p => p.active ? '#003366' : 'none'};
  color: ${p => p.active ? '#fff' : '#aec5e7'};
  font-family: inherit;
  font-weight: 700;
  font-size: .85rem;
  cursor: pointer;
  transition: all .15s;
`;

// ─── Keyframes ────────────────────────────────────────────────────────────────
export const slideIn = keyframes`
  from { opacity: 0; transform: translateX(20px); }
  to   { opacity: 1; transform: translateX(0); }
`;
 
// ─── Pagamento ────────────────────────────────────────────────────────────────
export const TabsRow = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  background: #f4f4f4;
  border-radius: 10px;
  padding: 4px;
`;

export const Tab = styled.button`
  flex: 1;
  padding: 0.55rem 0.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  background: ${p => p.active ? '#fff' : 'transparent'};
  color: ${p => p.active ? '#003366' : '#888'};
  box-shadow: ${p => p.active ? '0 1px 4px rgba(0,51,102,0.12)' : 'none'};
`;

export const CardPreview = styled.div`
  background: linear-gradient(135deg, #003366 60%, #2b5ba8);
  border-radius: 16px;
  padding: 1.4rem 1.5rem;
  margin-bottom: 1.5rem;
  text-align: left;
  color: white;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -30px; right: -30px;
    width: 120px; height: 120px;
    background: rgba(174,197,231,0.15);
    border-radius: 50%;
  }
  &::after {
    content: '';
    position: absolute;
    bottom: -40px; right: 40px;
    width: 90px; height: 90px;
    background: rgba(174,197,231,0.1);
    border-radius: 50%;
  }
`;

export const CardChip = styled.div`
  width: 36px; height: 26px;
  background: rgba(255,255,255,0.25);
  border-radius: 5px;
  margin-bottom: 1rem;
  border: 1px solid rgba(255,255,255,0.3);
`;

export const CardNumber = styled.p`
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  margin: 0 0 0.8rem;
  font-family: 'Courier New', monospace;
`;

export const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
`;

export const CardLabel = styled.span`
  font-size: 0.6rem;
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  display: block;
  margin-bottom: 2px;
`;

export const CardValue = styled.span`
  font-size: 0.88rem;
  font-weight: 600;
`;

export const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
`;

export const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  text-align: left;
`;

export const FieldLabel = styled.label`
  font-size: 0.75rem;
  font-weight: 700;
  color: #003366;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

export const PixBox = styled.div`
  background: #f0f8ff;
  border: 2px dashed #aec5e7;
  border-radius: 12px;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

export const QrPlaceholder = styled.div`
  width: 140px;
  height: 140px;
  background: white;
  border-radius: 10px;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(7, 1fr);
  gap: 2px;
  padding: 10px;
  box-shadow: 0 2px 12px rgba(0,51,102,0.1);
`;

export const QrCell = styled.div`
  background: ${p => p.filled ? '#003366' : 'transparent'};
  border-radius: 1px;
`;

export const PixKey = styled.div`
  background: white;
  border: 1px solid #aec5e7;
  border-radius: 8px;
  padding: 0.6rem 1rem;
  font-size: 0.85rem;
  color: #003366;
  font-weight: 600;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  box-sizing: border-box;
  transition: background 0.15s;
  &:hover { background: #f0f8ff; }
`;

export const PixKeyText = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 80%;
  font-size: 0.75rem;
`;

export const CopyBtn = styled.span`
  font-size: 0.72rem;
  color: #aec5e7;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

export const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #003366;
  background: #e8f0fd;
  padding: 3px 10px;
  border-radius: 20px;
`;

export const BoletoBox = styled.div`
  background: #f0f8ff;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const BoletoLine = styled.div`
  height: 3px;
  background: repeating-linear-gradient(
    90deg,
    #003366 0px, #003366 8px,
    transparent 8px, transparent 14px
  );
  border-radius: 2px;
`;

export const BoletoInfo = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.82rem;
  color: #555;
`;

export const SecureNote = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  color: #888;
  margin-top: 0.75rem;
`;

const scaleIn = keyframes`
  from { opacity: 0; transform: scale(0.85); }
  to   { opacity: 1; transform: scale(1); }
`;

export const SuccessModal = styled.div`
  background: white;
  width: 85%;
  max-width: 340px;
  border-radius: 20px;
  padding: 2.5rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
  animation: ${scaleIn} 0.25s ease;
`;

export const IconCircle = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #e8f5e9;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
`;

export const SuccessTitle = styled.h2`
  color: #003366;
  margin: 0;
  font-size: 1.4rem;
`;

export const SuccessSubtitle = styled.p`
  color: #666;
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.5;
`;

export const UnlockContainer = styled.div`
  width: 90%;
  background: #e0ffff;
  padding: 1.2rem;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1rem;
`;

export const UnlockText = styled.p`
  font-size: 1.1rem;
  font-weight: bold;
  color: #333;
  margin: 0.2rem 0;
  text-align: center;
`;

export const UnlockCode = styled.p`
  font-size: 1.3rem;
  font-weight: bold;
  color: #003366;
  margin-top: 0.8rem;
  letter-spacing: 0.15em;
`;

export const Section = styled.div`
  background: #e0ffff;
  padding: 1rem;
  border-radius: 10px;
  width: 90%;
  margin-bottom: 1rem;
`;

export const SectionTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: bold;
  margin: 0 0 0.8rem;
  color: #003366;
`;

export const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
`;

export const Label = styled.span`
  font-size: 1rem;
  color: #555;
`;

export const Toggle = styled.input.attrs({ type: 'checkbox' })`
  width: 40px;
  height: 22px;
  appearance: none;
  background: ${p => p.checked ? '#003366' : '#ccc'};
  border-radius: 20px;
  position: relative;
  cursor: pointer;
  transition: background 0.2s;

  &::after {
    content: '';
    position: absolute;
    width: 18px;
    height: 18px;
    background: white;
    border-radius: 50%;
    top: 2px;
    left: ${p => p.checked ? '20px' : '2px'};
    transition: left 0.2s;
  }
`;

export const SmallInput = styled.input`
  width: 60px;
  height: 36px;
  border: none;
  border-bottom: 1px solid #003366;
  text-align: center;
  background: #fff;
  border-radius: 5px;
  font-size: 0.95rem;
  font-family: inherit;
  color: #003366;
`;

export const PageFooter = styled.div`
  text-align: center;
  margin-top: 1.5rem;
  font-size: 1.1rem;
  font-weight: bold;
  color: #003366;
`;

export const TripList = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  gap: 1rem;
`;

export const TripCard = styled.div`
  width: 90%;
  background: #e0ffff;
  padding: 1rem;
  border-radius: 10px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
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
  gap: 3px;
  flex: 1;
`;

export const TripText = styled.p`
  margin: 0;
  font-size: 0.95rem;
  color: #555;
`;

export const ProfileContainer = styled.div`
  background: #e0ffff;
  padding: 1.5rem;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 90%;
`;

export const ProfileImage = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 0.8rem;
`;

export const ProfileName = styled.h2`
  font-size: 1.25rem;
  font-weight: bold;
  color: #003366;
  margin: 0 0 0.6rem;
`;

export const ProfileText = styled.p`
  font-size: 1rem;
  color: #555;
  text-align: center;
  margin: 0 0 0.3rem;
`;

export const ContactContainer = styled.div`
  background: #e0ffff;
  padding: 1.2rem;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 90%;
  gap: 0.4rem;
`;

export const ContactTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: bold;
  color: #003366;
  margin: 0 0 0.5rem;
`;

export const ContactText = styled.p`
  font-size: 1rem;
  color: #555;
  margin: 0;
`;