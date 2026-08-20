import styled, { css, keyframes } from 'styled-components';

const BaseInputStyles = css`
  width: 100%;
  padding: 0.75rem;
<<<<<<< HEAD
<<<<<<< HEAD
  border: 1px solid var(--color-primary);
  border-radius: 0.7rem;
  font-size: 1rem;
  font-family: inherit;
  background-color: var(--color-surface);
  color: var(--color-text);
  box-sizing: border-box;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &::placeholder {
    color: var(--color-text-muted);
    opacity: 1;
  }

  &:focus {
    outline: none;
    border-color: var(--color-primary-soft);
=======
  border: 1px solid #003366;
=======
  border: 1px solid var(--color-primary);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  border-radius: 0.7rem;
  font-size: 1rem;
  font-family: inherit;
  background-color: var(--color-surface);
  color: var(--color-text);
  box-sizing: border-box;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &::placeholder {
    color: var(--color-text-muted);
    opacity: 1;
  }

  &:focus {
    outline: none;
<<<<<<< HEAD
    border-color: #aec5e7;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
    border-color: var(--color-primary-soft);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
    box-shadow: 0 0 0 3px rgba(174, 197, 231, 0.3);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
<<<<<<< HEAD
<<<<<<< HEAD
    background-color: var(--color-disabled-bg);
=======
    background-color: #f7fafc;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
    background-color: var(--color-disabled-bg);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  }
`;

export const AuthPage = styled.div`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 1.5rem;
<<<<<<< HEAD
<<<<<<< HEAD
  background-color: var(--color-page-bg);
=======
  background-color: #f4f4f4;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  background-color: var(--color-page-bg);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
`;

export const AuthCard = styled.div`
  width: 100%;
  max-width: 500px;
<<<<<<< HEAD
<<<<<<< HEAD
  background: var(--color-surface);
=======
  background: #fff;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  background: var(--color-surface);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
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
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  background: var(--color-logo-backdrop);
  border-radius: var(--radius-md);
  padding: 0.35rem 0.6rem;
  box-sizing: content-box;
<<<<<<< HEAD
=======
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
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
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
    background: var(--color-logo-backdrop);
    border-radius: var(--radius-md);
    padding: 0.3rem 0.5rem;
    box-sizing: content-box;
<<<<<<< HEAD
=======
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  }
`;

export const Title = styled.h1`
  margin-bottom: 1.5rem;
<<<<<<< HEAD
<<<<<<< HEAD
  color: var(--color-primary);
=======
  color: #003366;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  color: var(--color-primary);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
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
<<<<<<< HEAD
<<<<<<< HEAD
  color: var(--color-primary);
=======
  color: #003366;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  color: var(--color-primary);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
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
<<<<<<< HEAD
<<<<<<< HEAD
  border: 1px solid var(--color-primary);
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-soft));
  color: var(--color-surface);
=======
  border: 1px solid #003366;
  background: linear-gradient(135deg, #003366, #aec5e7);
  color: #ffffff;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  border: 1px solid var(--color-primary);
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-soft));
  color: var(--color-surface);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  cursor: pointer;
  font-weight: 600;
  font-size: 1.1rem;
  box-sizing: border-box;
  transition: opacity 0.2s;

  &:hover { opacity: 0.9; }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

export const SecondaryButton = styled.button`
  width: 100%;
  margin-top: 0.5rem;
  padding: 0.8rem;
  border-radius: 0.7rem;
<<<<<<< HEAD
<<<<<<< HEAD
  border: 1px solid var(--color-primary-soft);
  background: var(--color-hover-bg-soft);
  color: var(--color-primary);
=======
  border: 1px solid #aec5e7;
  background: #f7fbff;
  color: #003366;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  border: 1px solid var(--color-primary-soft);
  background: var(--color-hover-bg-soft);
  color: var(--color-primary);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  cursor: pointer;
  font-weight: 700;
  font-size: 1.05rem;
  box-sizing: border-box;
  transition: background 0.2s, border-color 0.2s, opacity 0.2s;

  &:hover {
<<<<<<< HEAD
<<<<<<< HEAD
    background: var(--color-hover-bg-strong);
    border-color: var(--color-accent-soft);
=======
    background: #eef5ff;
    border-color: #7da2d6;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
    background: var(--color-hover-bg-strong);
    border-color: var(--color-accent-soft);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

// ESTE ERA O QUE ESTAVA FALTANDO E QUEBROU O LOGIN:
export const FooterText = styled.p`
  margin-top: 1.5rem;
  font-size: 0.95rem;
<<<<<<< HEAD
<<<<<<< HEAD
  color: var(--color-text-secondary);

  a {
    color: var(--color-primary);
=======
  color: #444;

  a {
    color: #003366;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  color: var(--color-text-secondary);

  a {
    color: var(--color-primary);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
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
<<<<<<< HEAD
<<<<<<< HEAD
  background-color: var(--color-primary);
  color: var(--color-surface);
=======
  background-color: #003366;
  color: white;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  background-color: var(--color-primary);
  color: var(--color-surface);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
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
<<<<<<< HEAD
<<<<<<< HEAD
  background-color: ${props => props.variant === 'type' ? 'var(--color-card-bg-alt)' : 'var(--color-primary)'};
=======
  background-color: ${props => props.variant === 'type' ? '#E0F7FA' : '#003366'};
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  background-color: ${props => props.variant === 'type' ? 'var(--color-card-bg-alt)' : 'var(--color-primary)'};
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  padding: 15px 20px;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  cursor: pointer;
  box-sizing: border-box;
  transition: transform 0.2s;
  margin: calc(10px + 0.25rem) 0;
<<<<<<< HEAD
<<<<<<< HEAD
  border: 2px solid ${props => props.$selected ? 'var(--color-primary-soft)' : 'transparent'};
=======
  border: 2px solid ${props => props.$selected ? '#aec5e7' : 'transparent'};
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  border: 2px solid ${props => props.$selected ? 'var(--color-primary-soft)' : 'transparent'};
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  box-shadow: ${props => props.$selected ? '0 0 0 3px rgba(174, 197, 231, 0.2)' : 'none'};

  &:hover { transform: scale(1.02); }

  h3 {
    margin: 0;
<<<<<<< HEAD
<<<<<<< HEAD
    color: ${props => props.variant === 'type' ? 'var(--color-primary)' : 'var(--color-surface)'};
=======
    color: ${props => props.variant === 'type' ? '#003366' : '#ffffff'};
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
    color: ${props => props.variant === 'type' ? 'var(--color-primary)' : 'var(--color-surface)'};
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
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
 
<<<<<<< HEAD
<<<<<<< HEAD
  p { margin: 2px 0 0 0; font-size: 0.85rem; color: var(--color-muted-light); }
=======
  p { margin: 2px 0 0 0; font-size: 0.85rem; color: #dcdcdc; }
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  p { margin: 2px 0 0 0; font-size: 0.85rem; color: var(--color-muted-light); }
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
`;

export const JourneySection = styled.section`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  margin-top: 0.3rem;
`;

export const JourneySectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

export const JourneySectionTitle = styled.h2`
  margin: 0;
<<<<<<< HEAD
<<<<<<< HEAD
  color: var(--color-primary);
=======
  color: #003366;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  color: var(--color-primary);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  font-size: 1.05rem;
`;

export const JourneySectionHint = styled.p`
  margin: -0.15rem 0 0;
<<<<<<< HEAD
<<<<<<< HEAD
  color: var(--color-text-secondary);
=======
  color: #555;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  color: var(--color-text-secondary);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  font-size: 0.92rem;
  line-height: 1.4;
`;

export const GarageActionsRow = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
`;

export const TextButton = styled.button`
  border: none;
  background: transparent;
<<<<<<< HEAD
<<<<<<< HEAD
  color: var(--color-primary);
=======
  color: #003366;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  color: var(--color-primary);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  text-decoration: underline;
  text-underline-offset: 3px;

  &:hover {
<<<<<<< HEAD
<<<<<<< HEAD
    color: var(--color-accent);
=======
    color: #2b5ba8;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
    color: var(--color-accent);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  }
`;

export const JourneyFieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  width: 100%;
`;

export const JourneyFieldLabel = styled.label`
  font-size: 0.8rem;
  font-weight: 700;
<<<<<<< HEAD
<<<<<<< HEAD
  color: var(--color-primary);
=======
  color: #003366;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  color: var(--color-primary);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

export const JourneyFieldsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.8rem;

  @media (min-width: 520px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const JourneySummaryCard = styled.div`
  width: 100%;
  max-width: 400px;
  padding: 1rem 1.1rem;
  border-radius: 12px;
<<<<<<< HEAD
<<<<<<< HEAD
  border: 1px solid var(--color-primary-soft);
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
=======
  border: 1px solid #aec5e7;
  background: linear-gradient(135deg, #003366, #2b5ba8);
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  border: 1px solid var(--color-primary-soft);
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  box-sizing: border-box;
`;

export const JourneySummaryLabel = styled.span`
  display: block;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.72);
  margin-bottom: 0.35rem;
`;

export const JourneySummaryValue = styled.p`
  margin: 0;
<<<<<<< HEAD
<<<<<<< HEAD
  color: var(--color-surface);
=======
  color: #ffffff;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  color: var(--color-surface);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  font-size: 0.98rem;
  line-height: 1.45;
  font-weight: 600;
`;

export const HeaderIcons = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 20px;
<<<<<<< HEAD
<<<<<<< HEAD
  .back-arrow { font-size: 1.8rem; color: var(--color-primary); cursor: pointer; }
=======
  .back-arrow { font-size: 1.8rem; color: #003366; cursor: pointer; }
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  .back-arrow { font-size: 1.8rem; color: var(--color-primary); cursor: pointer; }
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  img { width: 30px; cursor: pointer; }
`;

export const StyledInput = styled.input`
  width: 100%;
  max-width: 400px;
  height: 45px;
<<<<<<< HEAD
<<<<<<< HEAD
  border: 1px solid var(--color-border-soft);
=======
  border: 1px solid #ccc;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  border: 1px solid var(--color-border-soft);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  border-radius: 8px;
  padding: 0 15px;
  margin-bottom: 20px;
  box-sizing: border-box;
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  background-color: var(--color-surface);
  color: var(--color-text);

  &::placeholder {
    color: var(--color-text-muted);
    opacity: 1;
  }
<<<<<<< HEAD
=======
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
`;

export const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 1000;
`;

export const ModalContent = styled.div`
<<<<<<< HEAD
<<<<<<< HEAD
  background: var(--color-surface); width: 80%; max-width: 350px; border-radius: 12px; padding: 20px; text-align: center;
`;

export const MenuItem = styled.div`
  padding: 15px; border-bottom: 1px solid var(--color-divider); color: var(--color-primary); font-weight: 500; cursor: pointer;
  &:hover { background: var(--color-hover-bg); }
=======
  background: white; width: 80%; max-width: 350px; border-radius: 12px; padding: 20px; text-align: center;
`;

export const MenuItem = styled.div`
  padding: 15px; border-bottom: 1px solid #eee; color: #003366; font-weight: 500; cursor: pointer;
  &:hover { background: #f0f8ff; }
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  background: var(--color-surface); width: 80%; max-width: 350px; border-radius: 12px; padding: 20px; text-align: center;
`;

export const MenuItem = styled.div`
  padding: 15px; border-bottom: 1px solid var(--color-divider); color: var(--color-primary); font-weight: 500; cursor: pointer;
  &:hover { background: var(--color-hover-bg); }
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
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
<<<<<<< HEAD
<<<<<<< HEAD
  background: var(--color-surface);
=======
  background: #fff;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  background: var(--color-surface);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
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
<<<<<<< HEAD
<<<<<<< HEAD
    color: var(--color-primary);
=======
    color: #003366;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
    color: var(--color-primary);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
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
<<<<<<< HEAD
<<<<<<< HEAD
  color: var(--color-text-secondary);
=======
  color: #555;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  color: var(--color-text-secondary);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
`;
 
export const PriceTag = styled.p`
  font-size: 1rem;
  font-weight: 700;
<<<<<<< HEAD
<<<<<<< HEAD
  color: var(--color-primary);
=======
  color: #003366;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  color: var(--color-primary);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  margin: 8px 0 0;
`;

export const Subtitle = styled.p`
  font-size: 1rem;
  text-align: center;
<<<<<<< HEAD
<<<<<<< HEAD
  color: var(--color-text-secondary);
=======
  color: #555;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  color: var(--color-text-secondary);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  margin-bottom: 2rem;
  line-height: 1.4;
`;

export const LightInput = styled(Input)`
<<<<<<< HEAD
<<<<<<< HEAD
  background-color: var(--color-hover-bg); /* Azul bem clarinho para diferenciar */
  border-bottom: 2px solid var(--color-primary); /* Estilo que remete ao mobile original */
=======
  background-color: #f0f8ff; /* Azul bem clarinho para diferenciar */
  border-bottom: 2px solid #003366; /* Estilo que remete ao mobile original */
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  background-color: var(--color-hover-bg); /* Azul bem clarinho para diferenciar */
  border-bottom: 2px solid var(--color-primary); /* Estilo que remete ao mobile original */
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
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
<<<<<<< HEAD
<<<<<<< HEAD
  color: var(--color-primary);
=======
  color: #003366;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  color: var(--color-primary);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
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
<<<<<<< HEAD
<<<<<<< HEAD
  background: var(--color-surface);
  border: 1px solid var(--color-primary-soft);
=======
  background: #fff;
  border: 1px solid #aec5e7;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  background: var(--color-surface);
  border: 1px solid var(--color-primary-soft);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
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
<<<<<<< HEAD
<<<<<<< HEAD
  color: var(--color-primary);
=======
  color: #003366;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  color: var(--color-primary);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  font-size: .9rem;
`;

export const NavBtn = styled.button`
  background: none;
  border: none;
<<<<<<< HEAD
<<<<<<< HEAD
  color: var(--color-primary);
=======
  color: #003366;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  color: var(--color-primary);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  font-size: 1.2rem;
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 6px;
<<<<<<< HEAD
<<<<<<< HEAD
  &:hover { background: var(--color-hover-bg); }
=======
  &:hover { background: #f0f8ff; }
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  &:hover { background: var(--color-hover-bg); }
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
`;

export const DayNames = styled.div`
  display: grid;
  grid-template-columns: repeat(7,1fr);
  text-align: center;
  margin-bottom: 4px;
<<<<<<< HEAD
<<<<<<< HEAD
  span { font-size:.68rem; font-weight:700; color:var(--color-primary-soft); }
=======
  span { font-size:.68rem; font-weight:700; color:#aec5e7; }
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  span { font-size:.68rem; font-weight:700; color:var(--color-primary-soft); }
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
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
<<<<<<< HEAD
<<<<<<< HEAD
  background: ${p => p.selected ? 'var(--color-primary)' : 'none'};
  color: ${p => p.selected ? 'var(--color-surface)' : p.disabled ? 'var(--color-border-soft)' : p.today ? 'var(--color-accent)' : 'var(--color-primary)'};
=======
  background: ${p => p.selected ? '#003366' : 'none'};
  color: ${p => p.selected ? '#fff' : p.disabled ? '#ccc' : p.today ? '#2b5ba8' : '#003366'};
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  background: ${p => p.selected ? 'var(--color-primary)' : 'none'};
  color: ${p => p.selected ? 'var(--color-surface)' : p.disabled ? 'var(--color-border-soft)' : p.today ? 'var(--color-accent)' : 'var(--color-primary)'};
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  border-radius: 50%;
  font-size: .82rem;
  font-weight: 600;
  cursor: ${p => p.disabled || p.empty ? 'default' : 'pointer'};
<<<<<<< HEAD
<<<<<<< HEAD
  outline: ${p => p.today && !p.selected ? '2px solid var(--color-primary-soft)' : 'none'};
  font-family: inherit;
  transition: background .15s, color .15s;
  &:hover:not([disabled]) { background: ${p => p.selected ? 'var(--color-primary)' : 'var(--color-hover-bg)'}; }
=======
  outline: ${p => p.today && !p.selected ? '2px solid #aec5e7' : 'none'};
  font-family: inherit;
  transition: background .15s, color .15s;
  &:hover:not([disabled]) { background: ${p => p.selected ? '#003366' : '#f0f8ff'}; }
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  outline: ${p => p.today && !p.selected ? '2px solid var(--color-primary-soft)' : 'none'};
  font-family: inherit;
  transition: background .15s, color .15s;
  &:hover:not([disabled]) { background: ${p => p.selected ? 'var(--color-primary)' : 'var(--color-hover-bg)'}; }
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
`;

export const ClockDisplay = styled.div`
  text-align: center;
  font-size: 2.6rem;
  font-weight: 900;
<<<<<<< HEAD
<<<<<<< HEAD
  color: var(--color-primary);
=======
  color: #003366;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  color: var(--color-primary);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  margin-bottom: 14px;
  user-select: none;
  letter-spacing: .04em;
`;

export const ClockPart = styled.span`
<<<<<<< HEAD
<<<<<<< HEAD
  color: ${p => p.active ? 'var(--color-accent)' : 'var(--color-primary)'};
=======
  color: ${p => p.active ? '#2b5ba8' : '#003366'};
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  color: ${p => p.active ? 'var(--color-accent)' : 'var(--color-primary)'};
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
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
<<<<<<< HEAD
<<<<<<< HEAD
  border: 2px solid ${p => p.active ? 'var(--color-primary)' : 'var(--color-unselected-border)'};
  background: ${p => p.active ? 'var(--color-hover-bg)' : 'none'};
  color: ${p => p.active ? 'var(--color-primary)' : 'var(--color-primary-soft)'};
=======
  border: 2px solid ${p => p.active ? '#003366' : '#d0dff0'};
  background: ${p => p.active ? '#f0f8ff' : 'none'};
  color: ${p => p.active ? '#003366' : '#aec5e7'};
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  border: 2px solid ${p => p.active ? 'var(--color-primary)' : 'var(--color-unselected-border)'};
  background: ${p => p.active ? 'var(--color-hover-bg)' : 'none'};
  color: ${p => p.active ? 'var(--color-primary)' : 'var(--color-primary-soft)'};
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
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
<<<<<<< HEAD
<<<<<<< HEAD
  border: 2px solid ${p => p.active ? 'var(--color-primary)' : 'var(--color-unselected-border)'};
  background: ${p => p.active ? 'var(--color-primary)' : 'none'};
  color: ${p => p.active ? 'var(--color-surface)' : 'var(--color-primary-soft)'};
=======
  border: 2px solid ${p => p.active ? '#003366' : '#d0dff0'};
  background: ${p => p.active ? '#003366' : 'none'};
  color: ${p => p.active ? '#fff' : '#aec5e7'};
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  border: 2px solid ${p => p.active ? 'var(--color-primary)' : 'var(--color-unselected-border)'};
  background: ${p => p.active ? 'var(--color-primary)' : 'none'};
  color: ${p => p.active ? 'var(--color-surface)' : 'var(--color-primary-soft)'};
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
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
<<<<<<< HEAD
<<<<<<< HEAD
  background: var(--color-page-bg);
=======
  background: #f4f4f4;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  background: var(--color-page-bg);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
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
<<<<<<< HEAD
<<<<<<< HEAD
  background: ${p => p.active ? 'var(--color-surface)' : 'transparent'};
  color: ${p => p.active ? 'var(--color-primary)' : 'var(--color-muted)'};
=======
  background: ${p => p.active ? '#fff' : 'transparent'};
  color: ${p => p.active ? '#003366' : '#888'};
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  background: ${p => p.active ? 'var(--color-surface)' : 'transparent'};
  color: ${p => p.active ? 'var(--color-primary)' : 'var(--color-muted)'};
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  box-shadow: ${p => p.active ? '0 1px 4px rgba(0,51,102,0.12)' : 'none'};
`;

export const CardPreview = styled.div`
<<<<<<< HEAD
<<<<<<< HEAD
  background: linear-gradient(135deg, var(--color-primary) 60%, var(--color-accent));
=======
  background: linear-gradient(135deg, #003366 60%, #2b5ba8);
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  background: linear-gradient(135deg, var(--color-primary) 60%, var(--color-accent));
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  border-radius: 16px;
  padding: 1.4rem 1.5rem;
  margin-bottom: 1.5rem;
  text-align: left;
<<<<<<< HEAD
<<<<<<< HEAD
  color: var(--color-surface);
=======
  color: white;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  color: var(--color-surface);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
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
<<<<<<< HEAD
<<<<<<< HEAD
  color: var(--color-primary);
=======
  color: #003366;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  color: var(--color-primary);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

export const PixBox = styled.div`
<<<<<<< HEAD
<<<<<<< HEAD
  background: var(--color-hover-bg);
  border: 2px dashed var(--color-primary-soft);
=======
  background: #f0f8ff;
  border: 2px dashed #aec5e7;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  background: var(--color-hover-bg);
  border: 2px dashed var(--color-primary-soft);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
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
<<<<<<< HEAD
<<<<<<< HEAD
  background: var(--color-surface);
=======
  background: white;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  background: var(--color-surface);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  border-radius: 10px;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(7, 1fr);
  gap: 2px;
  padding: 10px;
  box-shadow: 0 2px 12px rgba(0,51,102,0.1);
`;

export const QrCell = styled.div`
<<<<<<< HEAD
<<<<<<< HEAD
  background: ${p => p.filled ? 'var(--color-primary)' : 'transparent'};
=======
  background: ${p => p.filled ? '#003366' : 'transparent'};
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  background: ${p => p.filled ? 'var(--color-primary)' : 'transparent'};
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  border-radius: 1px;
`;

export const PixKey = styled.div`
<<<<<<< HEAD
<<<<<<< HEAD
  background: var(--color-surface);
  border: 1px solid var(--color-primary-soft);
  border-radius: 8px;
  padding: 0.6rem 1rem;
  font-size: 0.85rem;
  color: var(--color-primary);
=======
  background: white;
  border: 1px solid #aec5e7;
  border-radius: 8px;
  padding: 0.6rem 1rem;
  font-size: 0.85rem;
  color: #003366;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  background: var(--color-surface);
  border: 1px solid var(--color-primary-soft);
  border-radius: 8px;
  padding: 0.6rem 1rem;
  font-size: 0.85rem;
  color: var(--color-primary);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  font-weight: 600;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  box-sizing: border-box;
  transition: background 0.15s;
<<<<<<< HEAD
<<<<<<< HEAD
  &:hover { background: var(--color-hover-bg); }
=======
  &:hover { background: #f0f8ff; }
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  &:hover { background: var(--color-hover-bg); }
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
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
<<<<<<< HEAD
<<<<<<< HEAD
  color: var(--color-primary-soft);
=======
  color: #aec5e7;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  color: var(--color-primary-soft);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
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
<<<<<<< HEAD
<<<<<<< HEAD
  color: var(--color-primary);
  background: var(--color-selected-bg);
=======
  color: #003366;
  background: #e8f0fd;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  color: var(--color-primary);
  background: var(--color-selected-bg);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  padding: 3px 10px;
  border-radius: 20px;
`;

export const BoletoBox = styled.div`
<<<<<<< HEAD
<<<<<<< HEAD
  background: var(--color-hover-bg);
=======
  background: #f0f8ff;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  background: var(--color-hover-bg);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
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
<<<<<<< HEAD
<<<<<<< HEAD
    var(--color-primary) 0px, var(--color-primary) 8px,
=======
    #003366 0px, #003366 8px,
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
    var(--color-primary) 0px, var(--color-primary) 8px,
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
    transparent 8px, transparent 14px
  );
  border-radius: 2px;
`;

export const BoletoInfo = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.82rem;
<<<<<<< HEAD
<<<<<<< HEAD
  color: var(--color-text-secondary);
=======
  color: #555;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  color: var(--color-text-secondary);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
`;

export const SecureNote = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  font-size: 0.75rem;
<<<<<<< HEAD
<<<<<<< HEAD
  color: var(--color-muted);
=======
  color: #888;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  color: var(--color-muted);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  margin-top: 0.75rem;
`;

const scaleIn = keyframes`
  from { opacity: 0; transform: scale(0.85); }
  to   { opacity: 1; transform: scale(1); }
`;

export const SuccessModal = styled.div`
<<<<<<< HEAD
<<<<<<< HEAD
  background: var(--color-surface);
=======
  background: white;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  background: var(--color-surface);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
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
<<<<<<< HEAD
<<<<<<< HEAD
  background: var(--color-success-soft);
=======
  background: #e8f5e9;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  background: var(--color-success-soft);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
`;

export const SuccessTitle = styled.h2`
<<<<<<< HEAD
<<<<<<< HEAD
  color: var(--color-primary);
=======
  color: #003366;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  color: var(--color-primary);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  margin: 0;
  font-size: 1.4rem;
`;

export const SuccessSubtitle = styled.p`
<<<<<<< HEAD
<<<<<<< HEAD
  color: var(--color-text-secondary);
=======
  color: #666;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  color: var(--color-text-secondary);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.5;
`;

export const UnlockContainer = styled.div`
  width: 90%;
<<<<<<< HEAD
<<<<<<< HEAD
  background: var(--color-card-bg);
=======
  background: #e0ffff;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  background: var(--color-card-bg);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
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
<<<<<<< HEAD
<<<<<<< HEAD
  color: var(--color-text-strong);
=======
  color: #333;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  color: var(--color-text-strong);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  margin: 0.2rem 0;
  text-align: center;
`;

export const UnlockCode = styled.p`
  font-size: 1.3rem;
  font-weight: bold;
<<<<<<< HEAD
<<<<<<< HEAD
  color: var(--color-primary);
=======
  color: #003366;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  color: var(--color-primary);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  margin-top: 0.8rem;
  letter-spacing: 0.15em;
`;

export const Section = styled.div`
<<<<<<< HEAD
<<<<<<< HEAD
  background: var(--color-card-bg);
=======
  background: #e0ffff;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  background: var(--color-card-bg);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  padding: 1rem;
  border-radius: 10px;
  width: 90%;
  margin-bottom: 1rem;
`;

export const SectionTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: bold;
  margin: 0 0 0.8rem;
<<<<<<< HEAD
<<<<<<< HEAD
  color: var(--color-primary);
=======
  color: #003366;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  color: var(--color-primary);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
`;

export const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
`;

export const Label = styled.span`
  font-size: 1rem;
<<<<<<< HEAD
<<<<<<< HEAD
  color: var(--color-text-secondary);
=======
  color: #555;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  color: var(--color-text-secondary);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
`;

export const Toggle = styled.input.attrs({ type: 'checkbox' })`
  width: 40px;
  height: 22px;
  appearance: none;
<<<<<<< HEAD
<<<<<<< HEAD
  background: ${p => p.checked ? 'var(--color-primary)' : 'var(--color-border-soft)'};
=======
  background: ${p => p.checked ? '#003366' : '#ccc'};
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  background: ${p => p.checked ? 'var(--color-primary)' : 'var(--color-border-soft)'};
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  border-radius: 20px;
  position: relative;
  cursor: pointer;
  transition: background 0.2s;

  &::after {
    content: '';
    position: absolute;
    width: 18px;
    height: 18px;
<<<<<<< HEAD
<<<<<<< HEAD
    background: var(--color-surface);
=======
    background: white;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
    background: var(--color-surface);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
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
<<<<<<< HEAD
<<<<<<< HEAD
  border-bottom: 1px solid var(--color-primary);
  text-align: center;
  background: var(--color-surface);
  border-radius: 5px;
  font-size: 0.95rem;
  font-family: inherit;
  color: var(--color-primary);
=======
  border-bottom: 1px solid #003366;
=======
  border-bottom: 1px solid var(--color-primary);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  text-align: center;
  background: var(--color-surface);
  border-radius: 5px;
  font-size: 0.95rem;
  font-family: inherit;
<<<<<<< HEAD
  color: #003366;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  color: var(--color-primary);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
`;

export const PageFooter = styled.div`
  text-align: center;
  margin-top: 1.5rem;
  font-size: 1.1rem;
  font-weight: bold;
<<<<<<< HEAD
<<<<<<< HEAD
  color: var(--color-primary);
=======
  color: #003366;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  color: var(--color-primary);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
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
<<<<<<< HEAD
<<<<<<< HEAD
  background: var(--color-card-bg);
=======
  background: #e0ffff;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  background: var(--color-card-bg);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
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
<<<<<<< HEAD
<<<<<<< HEAD
  color: var(--color-text-secondary);
`;

export const ProfileContainer = styled.div`
  background: var(--color-card-bg);
=======
  color: #555;
`;

export const ProfileContainer = styled.div`
  background: #e0ffff;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  color: var(--color-text-secondary);
`;

export const ProfileContainer = styled.div`
  background: var(--color-card-bg);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
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
<<<<<<< HEAD
<<<<<<< HEAD
  color: var(--color-primary);
=======
  color: #003366;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  color: var(--color-primary);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  margin: 0 0 0.6rem;
`;

export const ProfileText = styled.p`
  font-size: 1rem;
<<<<<<< HEAD
<<<<<<< HEAD
  color: var(--color-text-secondary);
=======
  color: #555;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  color: var(--color-text-secondary);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  text-align: center;
  margin: 0 0 0.3rem;
`;

export const ContactContainer = styled.div`
<<<<<<< HEAD
<<<<<<< HEAD
  background: var(--color-card-bg);
=======
  background: #e0ffff;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  background: var(--color-card-bg);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
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
<<<<<<< HEAD
<<<<<<< HEAD
  color: var(--color-primary);
=======
  color: #003366;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  color: var(--color-primary);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  margin: 0 0 0.5rem;
`;

export const ContactText = styled.p`
  font-size: 1rem;
<<<<<<< HEAD
<<<<<<< HEAD
  color: var(--color-text-secondary);
=======
  color: #555;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  color: var(--color-text-secondary);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  margin: 0;
`;

export const SearchWrapper = styled.div`
  width: 100%;
  margin-bottom: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;
 
export const SearchInputWrapper = styled.div`
  position: relative;
  width: 100%;
`;
 
export const SearchInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 0.7rem 2.5rem 0.7rem 0.9rem;
<<<<<<< HEAD
<<<<<<< HEAD
  border: 1.5px solid var(--color-primary);
  border-radius: 10px;
  font-size: 0.95rem;
  font-family: inherit;
  background: var(--color-surface);
  color: var(--color-text);
  transition: border-color 0.2s, box-shadow 0.2s;

  &::placeholder {
    color: var(--color-text-muted);
    opacity: 1;
  }
 
  &:focus {
    outline: none;
    border-color: var(--color-primary-soft);
=======
  border: 1.5px solid #003366;
=======
  border: 1.5px solid var(--color-primary);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  border-radius: 10px;
  font-size: 0.95rem;
  font-family: inherit;
  background: var(--color-surface);
  color: var(--color-text);
  transition: border-color 0.2s, box-shadow 0.2s;

  &::placeholder {
    color: var(--color-text-muted);
    opacity: 1;
  }
 
  &:focus {
    outline: none;
<<<<<<< HEAD
    border-color: #aec5e7;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
    border-color: var(--color-primary-soft);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
    box-shadow: 0 0 0 3px rgba(174, 197, 231, 0.3);
  }
`;
 
export const SearchIcon = styled.span`
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.1rem;
  pointer-events: none;
<<<<<<< HEAD
<<<<<<< HEAD
  color: var(--color-primary);
=======
  color: #003366;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  color: var(--color-primary);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
`;
 
export const FiltersRow = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;
 
export const FilterSelect = styled.select`
  flex: 1;
  min-width: 120px;
  padding: 0.55rem 0.7rem;
<<<<<<< HEAD
<<<<<<< HEAD
  border: 1.5px solid var(--color-primary);
  border-radius: 8px;
  font-size: 0.85rem;
  font-family: inherit;
  background: var(--color-surface);
  color: var(--color-primary);
=======
  border: 1.5px solid #003366;
  border-radius: 8px;
  font-size: 0.85rem;
  font-family: inherit;
  background: #fff;
  color: #003366;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  border: 1.5px solid var(--color-primary);
  border-radius: 8px;
  font-size: 0.85rem;
  font-family: inherit;
  background: var(--color-surface);
  color: var(--color-primary);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  cursor: pointer;
 
  &:focus {
    outline: none;
<<<<<<< HEAD
<<<<<<< HEAD
    border-color: var(--color-primary-soft);
=======
    border-color: #aec5e7;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
    border-color: var(--color-primary-soft);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
    box-shadow: 0 0 0 3px rgba(174, 197, 231, 0.3);
  }
`;
 
export const FilterToggle = styled.button`
  padding: 0.55rem 0.9rem;
<<<<<<< HEAD
<<<<<<< HEAD
  border: 1.5px solid ${(p) => (p.active ? "var(--color-primary)" : "var(--color-border-soft)")};
  border-radius: 8px;
  font-size: 0.8rem;
  font-family: inherit;
  background: ${(p) => (p.active ? "var(--color-primary)" : "var(--color-surface)")};
  color: ${(p) => (p.active ? "var(--color-surface)" : "var(--color-text-secondary)")};
=======
  border: 1.5px solid ${(p) => (p.active ? "#003366" : "#ccc")};
  border-radius: 8px;
  font-size: 0.8rem;
  font-family: inherit;
  background: ${(p) => (p.active ? "#003366" : "#fff")};
  color: ${(p) => (p.active ? "#fff" : "#555")};
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  border: 1.5px solid ${(p) => (p.active ? "var(--color-primary)" : "var(--color-border-soft)")};
  border-radius: 8px;
  font-size: 0.8rem;
  font-family: inherit;
  background: ${(p) => (p.active ? "var(--color-primary)" : "var(--color-surface)")};
  color: ${(p) => (p.active ? "var(--color-surface)" : "var(--color-text-secondary)")};
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  cursor: pointer;
  transition: all 0.18s;
  white-space: nowrap;
 
  &:hover {
<<<<<<< HEAD
<<<<<<< HEAD
    border-color: var(--color-primary);
=======
    border-color: #003366;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
    border-color: var(--color-primary);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  }
`;
 
export const ClearButton = styled.button`
  background: none;
  border: none;
<<<<<<< HEAD
<<<<<<< HEAD
  color: var(--color-primary);
=======
  color: #003366;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  color: var(--color-primary);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  font-size: 0.8rem;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
  align-self: flex-start;
 
  &:hover {
<<<<<<< HEAD
<<<<<<< HEAD
    color: var(--color-accent-strong);
=======
    color: #001f4d;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
    color: var(--color-accent-strong);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  }
`;
 
export const StatusMessage = styled.p`
  text-align: center;
<<<<<<< HEAD
<<<<<<< HEAD
  color: var(--color-text-muted);
=======
  color: #777;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  color: var(--color-text-muted);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  font-size: 0.9rem;
  margin: 2rem 0;
`;
 
export const ResultCount = styled.p`
  font-size: 0.82rem;
<<<<<<< HEAD
<<<<<<< HEAD
  color: var(--color-text-secondary);
=======
  color: #555;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  color: var(--color-text-secondary);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  margin: 0 0 0.5rem;
`;