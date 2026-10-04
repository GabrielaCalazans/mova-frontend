# MOVA - Frontend

Aplicação web (SPA) de locação de veículos por demanda, em React + Vite. Produto final do TCC junto com `mova-backend`.

## Visão geral

- Perfis: visitante (Home, catálogo e detalhe públicos), **Locatário** (jornada de reserva, pagamento sandbox, desbloqueio, acompanhamento, devolução, avaliação, histórico, favoritos, interesses, pendências) e **Locador** (painel, frota, garagens, reservas da frota, monitoramento, relatórios). ADMIN existe só no backend.
- Interface em **pt-BR, en e es** (RNF08) com `html lang` dinâmico, `Intl` e moeda sempre BRL.
- Acessibilidade como princípio (WCAG 2.1/2.2 AA como meta): um `main` por rota, skip link, foco visível, `ModalDialog` com focus trap/retorno, `prefers-reduced-motion`, alvos de 44 px, estados com texto e ícone além da cor.
- Login só é exigido em ações protegidas; a intenção original é retomada após o login.

## Tecnologias

- React 19, Vite 7, React Router DOM 7
- styled-components (telas de acesso) + CSS do design system (`src/styles`)
- Lucide React / Font Awesome, Recharts (relatórios), qrcode
- Vitest + Testing Library (unitários), Playwright + axe (E2E e acessibilidade)

## Estrutura

```text
src/
  components/      # UI compartilhada (AppShell, OwnerAppShell, ModalDialog, cards, listas)
  hooks/           # useAuthSession, useFormSubmit, useActiveReservation...
  i18n/            # catálogo por idioma/namespace (pt-BR no bundle; en/es sob demanda)
  pages/           # uma página por rota
  routes/AppRoutes.jsx
  services/        # apiClient + um service por domínio da API
  styles/          # tokens e folhas do design system
  utils/           # jornada (sessionStorage), validações, formatação
e2e/               # Playwright (mock, real-api, real-media, edge path, happy path)
scripts/           # task9-a11y.mjs (varredura axe/reflow/foco/zoom)
```

## Requisitos

- Node.js 20+ e npm 10+
- Backend local (`mova-backend`, porta 3000) para as jornadas reais

## Configuração de ambiente

Crie `.env` a partir de `.env.example`:

| Variável | Exemplo | Uso |
|---|---|---|
| `VITE_API_BASE_URL` | `/api` | Base do client HTTP (prioritária) |
| `API_BASE_URL` | `/api` | Alternativa quando `VITE_API_BASE_URL` está ausente |
| `API_BACKEND_URL` | `http://localhost:3000` | Destino do proxy do Vite para `/api` |
| `VITE_TIMEZONE_EXIBICAO` | `America/Sao_Paulo` | Fuso de exibição de datas/horas |

## Como rodar

```bash
npm install
npm run dev        # http://localhost:5173
```

Scripts: `npm run dev`, `npm run build`, `npm run preview`, `npm run lint`, `npm run test` (watch), `npm run test:run` (uma vez), `npm run test:e2e`.

## Rotas

Acesso (sem shell): `/login`, `/cadastro`, `/cadastro-locatario`, `/cadastro-locador`, `/recuperar-senha`, `/redefinir-senha`.

Públicas (AppShell): `/`, `/home`, `/carros`, `/carros/lista`, `/carros/:id`, `/viagem/compartilhada/:token`.

Locatário (sessão obrigatória): `/escolha-garagem-retirada`, `/escolha-garagem-devolucao`, `/servicos-opcionais`, `/checkout-reserva`, `/condutores-adicionais`, `/pagamento`, `/desbloqueio`, `/reserva/:id`, `/reservas/:id`, `/reserva/:id/localizacao`, `/devolucao`, `/cancelamento`, `/avaliacao`, `/historico`, `/pendencias-financeiras`, `/interesses`, `/carros/disponiveis`, `/carros/favoritos`.

Qualquer perfil autenticado (shell conforme o cargo): `/conta`, `/suporte`, `/configuracoes`.

Locador (OwnerAppShell): `/painel`, `/reservas`, `/monitoramento`, `/relatorios`, `/relatorios/veiculos`, `/relatorios/avaliacoes-filtro`, `/relatorios/avaliacoes`, `/cadastro-carros`, `/cadastro-carros/:id`, `/cadastro-garagens`, `/cadastro-garagens/:id`, `/cadastro-garagens/:id/capacidade`.

Redirecionamentos legados: `/locador` → `/painel`; `/tipos-carros`, `/carros-screens` → `/carros`; `/escolha-garagem`, `/agendamento`, `/escolha-data-e-hora` → `/escolha-garagem-retirada`; `/checkout` → `/checkout-reserva`; `/modo-de-pagamento` → `/pagamento`; `/desbloqueio-de-carro` → `/desbloqueio`.

## Sessão e API

- `POST /api/conta/auth/login` devolve o JWT; a sessão fica em `localStorage` (`mova_auth_session`) e qualquer 401 a revoga (`apiClient`).
- Pós-login: Locatário volta à intenção original (ou `/`), Locador vai para `/painel`.
- Cadastro é **atômico**: uma única chamada a `POST /api/conta/auth/register` com o perfil aninhado (`locatario` ou `locador`).
- Todo acesso à API passa por `src/services/apiClient.js` (`Accept-Language`, `Authorization`, tratamento uniforme de erro). Erros 5xx viram mensagem genérica; `requestId` fica no console para suporte.

## Testes

```bash
npm run lint
npm run test:run                              # unitários (jsdom; nenhuma rede real: host .invalid)
npx playwright test e2e/public-home.spec.js   # E2E com API mockada (Chromium)
MOVA_REAL_API_E2E=1 npx playwright test e2e/real-api.spec.js      # contra API local em mova_test
MOVA_REAL_MEDIA_E2E=1 npx playwright test e2e/real-media.spec.js  # upload real (MinIO)
MOVA_REAL_API_E2E=1 MOVA_REAL_API_DB_OVERRIDE=1 npx playwright test e2e/task10-edge-path.spec.js
MOVA_HAPPY_PATH_E2E=1 npx playwright test e2e/happy-path.spec.js  # demo local (mova_dev)
node scripts/task9-a11y.mjs                   # axe + reflow + foco + zoom (MOVA_LOCALE=pt-BR|en|es)
```

Os números da última regressão estão na documentação de auditoria do TCC (`tcc/docs/auditoria/fase-11/`). Os E2E reais são opt-in e exigem o ambiente local; nunca rodam contra produção.

## Licença

Projeto acadêmico (FATEC).
