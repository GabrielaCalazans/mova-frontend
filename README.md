# MOVA - Frontend

Aplicação web (SPA) de locação de veículos por demanda, com foco em acessibilidade. Feita em React + Vite, é o produto final do TCC (FATEC) junto com o [`mova-backend`](https://github.com/mateusvcsmoura/mova-backend). Roda localmente e conversa só com a API local, por meio do proxy do Vite.

## Visão geral

**Perfis**
- **Visitante:** Home, catálogo e detalhe do veículo.
- **Locatário:**
  - jornada de reserva e pagamento sandbox;
  - desbloqueio por código ou QR, acompanhamento, devolução e avaliação;
  - histórico com filtros de situação, favoritos, lista de interesse e pendências financeiras.
- **Locador:** painel, frota, garagens, reservas da frota, monitoramento e relatórios.
- O perfil ADMIN existe só no backend.

**Interface**
- Idiomas pt-BR, en e es (RNF08), com `html lang` dinâmico e formatação via `Intl`. A moeda é sempre BRL.
- Tema claro, escuro ou do sistema. O padrão segue o sistema; uma escolha manual fica salva no navegador.
- Acessibilidade como princípio, com meta WCAG 2.1/2.2 AA. Os mecanismos estão descritos em [Acessibilidade](#acessibilidade).
- Login só é pedido em ações protegidas, e depois dele a pessoa volta para onde estava.

## Tecnologias

- React 19, Vite 7 e React Router DOM 7. O projeto é só JavaScript (JSX), sem TypeScript.
- CSS próprio do design system (`src/styles`), com tokens. styled-components fica restrito às telas de acesso antigas.
- i18n próprio (`src/i18n`), sem biblioteca externa.
- Bibliotecas de interface:
  - fonte Inter (`@fontsource-variable/inter`, embutida);
  - ícones Lucide React e Font Awesome;
  - gráficos com Recharts (relatórios);
  - QR Code com `qrcode`.
- Testes e qualidade:
  - Vitest + Testing Library para os unitários;
  - Playwright + axe para E2E e acessibilidade;
  - ESLint;
  - Allure para relatórios no CI.

## Arquitetura

```
Navegador
  └─ index.html          script inline aplica o tema salvo antes da 1ª pintura
     └─ main.jsx         carrega o idioma salvo e monta <App/>
        └─ App.jsx       ThemeProvider; remonta as rotas quando o idioma muda
           └─ AppRoutes  React Router, páginas lazy, ProtectedRoute por token e cargo
              └─ Shell   AppShell (visitante/locatário) ou OwnerAppShell (locador)
                 └─ Página
                    └─ services/*  ->  apiClient  ->  /api (proxy do Vite)  ->  mova-backend
```

A página nunca chama `fetch` direto. Ela usa um service por domínio da API (`reservaService`, `veiculoService`, `garagemService`...), e todos passam pelo `apiClient`. O estado vem da API a cada tela. O navegador guarda só a sessão, as preferências e atalhos da jornada.

### Rotas e shells (`src/routes/AppRoutes.jsx`)

- **Carregamento sob demanda:** as páginas e o `OwnerAppShell` usam `React.lazy`. Cada rota passa por `RouteView`, que junta um `RouteErrorBoundary` e um `Suspense` com aviso próprio da tela ("Abrindo …", em `role="status"`).
- **`ProtectedRoute`:**
  - sem token, vai para `/login` e guarda o destino em `state.from`;
  - com cargo diferente do exigido, vai para a rota inicial do cargo (`resolveAuthRoute`: locador vai para `/painel`, os demais para `/home`);
  - com `requiredCargo="LOCADOR"`, envolve a página no `OwnerAppShell`.
- **Shells:**
  - visitante e locatário dividem um único `AppShell`, que fica montado entre rotas (rota de layout com `<Outlet/>`);
  - `/conta`, `/suporte` e `/configuracoes` usam o `RoleShell`, que escolhe o shell conforme o cargo.
- **`FocusOnRouteChange`:** a cada troca de `pathname` ou `search`, leva o foco para `#conteudo-principal` (`tabIndex=-1`) no próximo frame. Assim o leitor de tela anuncia a tela nova.
- **`ShellContext`:** componentes antigos que desenham o próprio cabeçalho ou menu (`BottomNav`, `PublicAppShell`, `AuthLayout`) não renderizam nada quando já estão dentro de um shell. Isso evita navegação duplicada, e fora do shell (em testes de página isolada) eles continuam funcionando.
- **`navItems.js`:** fonte única dos destinos do locatário. Vira tab bar no mobile e barra superior a partir de 1024 px. "Alugar" só aparece quando existe uma reserva ativa de verdade (`useActiveReservation`).

### Sessão

- **Login:** `POST /api/conta/auth/login` devolve o JWT.
- **Pós-login:**
  - com `state.from`, volta para esse destino (incluindo search e hash);
  - sem ele, o locatário vai para `/home` e o locador para `/painel`.
- **Cadastro atômico:** uma única chamada a `POST /api/conta/auth/register`, com o perfil aninhado (`locatario` ou `locador`).
- **Sincronização:** login, logout e um 401 do `apiClient` disparam o evento `mova:auth-session-changed`. O `useAuthSession` escuta esse evento e também o `storage`, o que cobre outras abas. Ele relê a sessão ao se inscrever, o que cobre uma mudança ocorrida enquanto um chunk lazy carregava.
- **Expiração:** qualquer 401 revoga a sessão. A mensagem fica em `sessionStorage` e o Login a exibe uma única vez.

O que fica guardado no navegador:

| Chave | Onde | Conteúdo |
|---|---|---|
| `mova_auth_session` | `localStorage` | sessão (token e usuário) |
| `mova_locale` | `localStorage` | idioma escolhido |
| `mova:tema-escuro:v2` | `localStorage` | `"true"`, `"false"` ou ausente (segue o sistema) |
| `mova_journey_flow` | `sessionStorage` | etapas da jornada de reserva |
| `mova_auth_feedback` | `sessionStorage` | aviso de sessão expirada |

### Jornada de reserva (`src/utils/journeyStorage.js`)

**Etapas e estado no navegador**
- São 7 etapas: veículo, retirada, devolução, serviços, resumo, condutores e pagamento.
- `JourneySteps` mostra "Etapa N de 7" no mobile e a lista completa no desktop. A etapa atual tem `aria-current="step"` e as concluídas dizem "concluída" em texto.
- A chave `mova_journey_flow` tem as seções `veiculo`, `retirada`, `devolucao`, `servicos`, `pagamento` e `reserva`. `updateJourneyStep` faz merge parcial, e um JSON inválido volta ao estado vazio.
- A chave nunca é limpa, nem no logout: dura enquanto a aba estiver aberta.

**A jornada parte do veículo**
- A retirada é sempre a garagem atual do carro.
- A devolução é escolhida entre as garagens ativas do mesmo locador.
- Sem veículo escolhido, a etapa de garagem volta para `/carros`.

**O navegador guarda só atalhos**
- `sessionStorage` guarda, por exemplo, o id da reserva.
- Pagamento, Desbloqueio e Avaliação sempre reconfirmam a reserva com a API.
- O Desbloqueio procura o id nesta ordem: `location.state`, depois a jornada, depois a lista do locatário.

### O servidor é a autoridade

O front antecipa validações para dar retorno rápido, mas toda regra de negócio é decidida no backend.

- **Preço:**
  - o checkout chama `POST /reserva/precificacao` (diária, número de diárias, serviços e total);
  - o valor gravado é o `valorTotal` devolvido pelo `POST /reserva`;
  - o front nunca envia `status`, `statusPagamento` nem `valorTotal`, e toda reserva nasce `AGUARDANDO_PAGAMENTO`.
- **Período (RN05):** `validarPeriodoReserva` repete as mensagens do backend (duração mínima de 1 h) antes do envio. As datas trafegam em UTC e são exibidas no fuso `VITE_TIMEZONE_EXIBICAO`.
- **Veículo adaptado (RN01):** veículo adaptado ou da categoria PCD exige deficiência declarada. O checkout só pede a declaração se o perfil ainda não tiver uma.
- **Pagamento sandbox:**
  - o front envia só o meio de pagamento e os dados de um cartão de teste;
  - `POST /reserva/:id/pagamento` responde 202;
  - a confirmação chega ao backend pelo webhook assinado do gateway simulado, e a tela consulta o status a cada 2 s, por até 15 tentativas;
  - nenhum segredo fica no frontend e não existe boleto;
  - o prazo de 15 min aparece só como aviso, porque quem expira a reserva é o backend. Uma reserva expirada chega como `CANCELADA`, com `expiradaEm`, e aparece como "Expirada".
- **Desbloqueio:**
  - só acontece depois do 200 de `POST /reserva/:id/desbloqueio`;
  - as recusas vêm do backend: 400 para código errado, 409 fora da janela ou para código já usado, 403 fora do raio da garagem;
  - a geolocalização é pedida no envio (timeout de 8 s), e latitude e longitude vão juntas ou nenhuma (RN03);
  - o QR é gerado no app (`qrcode`) a partir de um token assinado pelo backend e abre `/desbloqueio?qr=<token>`.
- **Histórico:** os filtros de situação (Em andamento, Confirmadas, Concluídas, Canceladas) viram `GET /reserva?status=A,B`. Filtrar no servidor mantém a paginação correta.
- **Exportação de relatórios:** o CSV prefixa com apóstrofo os valores que começam com `= + - @`, tab ou CR, como proteção contra CSV injection.

### Comunicação com a API (`src/services/apiClient.js`)

**Cabeçalhos e erros**
- Envia `Authorization: Bearer` e `Accept-Language`, e a API responde as mensagens no idioma da interface.
- `ApiError` preserva `status`, `code`, `errors`, `payload` e `requestId`, com atalhos `isUnauthorized`, `isForbidden`, `isNotFound` e `isValidation`.
- As telas decidem pelo `code` (por exemplo `VEICULO_COM_RESERVA_FUTURA_CONFIRMADA`). Erros Zod viram a mensagem `campo: regra | …`.
- Erros 5xx viram uma mensagem genérica. O console registra só método, status e `requestId`, nunca credenciais nem parâmetros de caminho.

**Listagens e uploads**
- As listagens respondem `{ result, pagination }`. `apiRequestPaginado` percorre todas as páginas quando a tela precisa da lista inteira (100 por página, até 20 páginas). Uma lista vazia responde 200 com `result: []`.
- Uploads com progresso usam XHR, com o mesmo tratamento de erro.

**Contrato com o backend**
- `apiEnums.js` espelha os enums do `prisma/schema.prisma`. O código do enum é o que trafega, e o rótulo é traduzido na tela. `apiEnums.test.js` trava a paridade com o backend.
- `normalizeVeiculo` traz os campos de `modeloVeiculo` (incluindo `valorDiaria`) para o nível do veículo.
- As imagens de veículos vêm da URL pública do MinIO local, informada pela API.

### i18n (`src/i18n`)

- **Dicionários:** ficam em `locales/<idioma>/<namespace>.json`, e a chave é usada como `t("namespace.caminho")`. Sem tradução no idioma ativo, cai para pt-BR e depois para a própria chave. Plural com `count` (`chave_one`/`chave_other` via `Intl.PluralRules`) e interpolação com `{var}`.
- **Carregamento:** pt-BR vai no bundle. en e es são chunks carregados sob demanda, e o `main.jsx` carrega o idioma salvo antes do primeiro render.
- **Troca de idioma:**
  - `t` é função de módulo, não hook, então o `App` remonta as rotas com `key={locale}`. A tela perde o estado local, o que é aceitável porque a troca é rara;
  - `changeLocale` aplica só o pedido mais recente. Isso corrige um bug real com as setas do seletor no NVDA + Firefox.
- **Formatação:** `formatCurrency` usa sempre BRL com `narrowSymbol`, para mostrar "R$" em qualquer idioma.
- **Garantia:** `catalog.test.js` exige as mesmas chaves nos três idiomas e que todo `t("...")` literal do código exista em pt-BR.

### Tema e design system (`src/styles`)

**Tokens**
- `tokens.css` tem duas camadas. As primitivas são as únicas com HEX: `#003366` primário, `#D0E7FF` secundário e `#0E2B49` de apoio. Os tokens semânticos (`--surface-*`, `--text-*`, `--action-*`, `--feedback-*`, `--border-*`, `--focus-ring`) são o que os componentes consomem.
- Também há escalas de espaço, raio (até 8 px), `--control-h` de 44 px, alturas de barras, z-index e durações.

**Tema escuro**
- É composto à parte, não uma inversão do claro. Vale com `:root[data-theme="dark"]` ou com `prefers-color-scheme: dark` quando não há `data-theme="light"`. O modo "sistema" remove o atributo.
- Durante a troca, `data-theme-switching` desliga as transições por dois frames.

**Folhas de estilo**
- `index.css` e `editorial-journey.css` são globais. As demais são importadas pela página e entram no chunk lazy dela.
- `index.css` também mantém os nomes legados (`--color-*`, `--mova-*`) apontando para os tokens semânticos, para existir um único sistema de cores.
- styled-components fica restrito a `authStyle.js` e a telas antigas (Cadastro, Conta, Configurações, Suporte, GarageJourneyStep). Consome só tokens semânticos e não deve ser usado em código novo.

**Regras visuais e gráficos**
- Superfícies neutras nas áreas grandes; o azul fica com hierarquia e ação.
- Sombra só em sobreposição real (menu, folha, diálogo). Sem gradiente e sem cartão dentro de cartão.
- As cores dos gráficos Recharts vêm do CSS, então trocam com o tema sem JS. A lista abaixo de cada gráfico é a alternativa textual.

### Acessibilidade

**Estrutura e navegação**
- Um `main` por rota e skip link.
- Foco visível e foco levado ao conteúdo a cada troca de rota.
- Alvos de toque de 44 px e `prefers-reduced-motion` respeitado.

**Diálogos e menus**
- `ModalDialog`:
  - abre em portal e deixa o `#root` com `inert`;
  - o foco inicial vai para `[data-autofocus]` ou para o primeiro elemento focável;
  - Tab circula dentro do painel e Esc fecha;
  - ao fechar, o foco volta ao acionador ou, se ele saiu do DOM, ao `#conteudo-principal`.
- O menu da conta é um diálogo modal (folha no mobile, painel no desktop).
- `ThemeToggle` é um `radiogroup` com `aria-checked`. `LanguageSelect` é um `<select>` nativo, com cada idioma escrito no próprio idioma e com `lang`.

**Status e conteúdo**
- Status, badges e alertas sempre têm texto. Cada alerta tem um símbolo fixo, e nada depende só de cor.
- Os filtros do histórico são botões com `aria-pressed` dentro de um `role="group"` com nome.
- No `VehicleCard`, o título é o único link e as ações são botões. A acessibilidade do veículo aparece sempre, inclusive quando é "não".
- Sem foto, o veículo mostra o texto "sem foto", e não um ícone que pareça o carro.

**Formulários**
- `useFormSubmit` bloqueia um segundo envio no mesmo instante (duplo clique ou Enter).

Nenhum script automatizado substitui o teste com leitor de tela. As auditorias com NVDA estão em `scripts/task11-3-*`.

## Estrutura

```text
src/
  main.jsx, App.jsx  # entrada, tema e remontagem por idioma
  routes/AppRoutes.jsx
  pages/             # uma página por rota (testes *.test.jsx ao lado)
  components/        # UI compartilhada
    layout/          # AppShell, OwnerAppShell, menu da conta, navItems
    ui/              # ModalDialog, LanguageSelect, ThemeToggle
    vehicle/, reservation/, brand/, icons/
  layout/            # AuthLayout e AuthenticatedLayout
  context/           # tema (claro/escuro/sistema)
  hooks/             # useAuthSession, useFormSubmit, useFormState, useActiveReservation
  services/          # apiClient, apiEnums e um service por domínio da API
  i18n/              # index.js + locales/<idioma>/<namespace>.json
  styles/            # tokens.css e folhas do design system
  utils/             # jornada (sessionStorage), validações, formatação, cálculo de período
  assets/            # imagens
  test/              # setup do Vitest, isolamento de rede e grupos do Allure
public/              # marca, favicons e ícones
tests/e2e/           # Playwright: mock, real-api, real-media, edge path, happy path
scripts/             # capturas (task8), auditoria a11y (task9) e roteiros com NVDA (task11)
```

## Requisitos

- Node.js 20.19+ e npm (o CI usa Node 24).
- Backend local ([`mova-backend`](https://github.com/mateusvcsmoura/mova-backend), porta 3000) para as jornadas reais.

## Configuração de ambiente

Crie `.env` a partir de `.env.example`. O Vite só expõe ao navegador as variáveis com prefixo `VITE_`.

| Variável | Padrão | Uso |
|---|---|---|
| `VITE_API_BASE_URL` | `/api` | Base do client HTTP |
| `API_BACKEND_URL` | `http://localhost:3000` | Destino do proxy do Vite para `/api` (lida só pelo `vite.config.js`) |
| `VITE_TIMEZONE_EXIBICAO` | `America/Sao_Paulo` | Fuso de exibição de datas e horas |
| `VITE_APP_URL` | origem da página | Base dos links de compartilhamento de viagem |
| `VITE_AUTH_DEBUG` | desligado | `true` liga logs de diagnóstico do `authService` |

## Como rodar

```bash
npm install
npm run dev        # http://localhost:5173 (com o backend em http://localhost:3000)
```

No Windows, `mova-backend/scripts/start-mova.ps1` sobe o ambiente inteiro (PostgreSQL, MinIO, backend e este frontend) e `check-mova.ps1` confere tudo.

Scripts: `npm run dev`, `npm run build`, `npm run preview`, `npm run lint`, `npm run test` (watch), `npm run test:run` (uma vez) e `npm run test:e2e`.

## Rotas

- **Acesso (sem shell):** `/login`, `/cadastro`, `/cadastro-locatario`, `/cadastro-locador`, `/recuperar-senha`, `/redefinir-senha`.
- **Públicas (AppShell):** `/`, `/home`, `/carros`, `/carros/lista`, `/carros/:id`, `/viagem/compartilhada/:token`. Rotas desconhecidas mostram a página 404.
- **Locatário (sessão obrigatória):** `/escolha-garagem-retirada`, `/escolha-garagem-devolucao`, `/servicos-opcionais`, `/checkout-reserva`, `/condutores-adicionais`, `/pagamento`, `/desbloqueio`, `/reserva/:id`, `/reservas/:id`, `/reserva/:id/localizacao`, `/devolucao`, `/cancelamento`, `/avaliacao`, `/historico`, `/pendencias-financeiras`, `/interesses`, `/carros/disponiveis`, `/carros/favoritos`.
- **Qualquer perfil autenticado (shell conforme o cargo):** `/conta`, `/suporte`, `/configuracoes`.
- **Locador (OwnerAppShell):** `/painel`, `/reservas`, `/monitoramento`, `/relatorios`, `/relatorios/veiculos`, `/relatorios/avaliacoes-filtro`, `/relatorios/avaliacoes`, `/cadastro-carros`, `/cadastro-carros/:id`, `/cadastro-garagens`, `/cadastro-garagens/:id`, `/cadastro-garagens/:id/capacidade`.
- **Redirecionamentos legados:**
  - `/locador` → `/painel`;
  - `/tipos-carros` e `/carros-screens` → `/carros`;
  - `/escolha-garagem`, `/agendamento` e `/escolha-data-e-hora` → `/escolha-garagem-retirada`;
  - `/checkout` → `/checkout-reserva`;
  - `/modo-de-pagamento` → `/pagamento`;
  - `/desbloqueio-de-carro` → `/desbloqueio`.

## Testes

```bash
npm run lint
npm run test:run                              # unitários (jsdom, sem rede real)
npx playwright test tests/e2e/public-home.spec.js   # E2E com API mockada (Chromium)
MOVA_REAL_API_E2E=1 npx playwright test tests/e2e/real-api.spec.js      # contra a API local em mova_test
MOVA_REAL_MEDIA_E2E=1 npx playwright test tests/e2e/real-media.spec.js  # upload real (MinIO)
MOVA_REAL_API_E2E=1 MOVA_REAL_API_DB_OVERRIDE=1 npx playwright test tests/e2e/task10-edge-path.spec.js
MOVA_HAPPY_PATH_E2E=1 npx playwright test tests/e2e/happy-path.spec.js  # demo local (mova_dev)
node scripts/task9-a11y.mjs                   # axe + reflow + foco + zoom (MOVA_LOCALE=pt-BR|en|es)
```

**Unitários**
- O isolamento de rede tem duas camadas:
  - o `vite.config.js` aponta `VITE_API_BASE_URL` para um host `.invalid`;
  - o `setupTests.js` troca `fetch` e `XMLHttpRequest` por versões que falham na hora e registram a tentativa, vigiada por `networkIsolation.test.js`.
- Um teste que precise de resposta deve mockar o service.
- Os testes ficam ao lado do código (`*.test.js(x)`) e rodam em série.

**E2E**
- O Playwright roda contra `vite preview` (`127.0.0.1:4173`), ou seja, contra o build: rode `npm run build` antes, senão ele testa um `dist` antigo.
- `public-home.spec.js` responde 501 a qualquer `/api/**` não mockado, para nenhuma chamada escapar sem querer.
- `real-api` e `task10-edge-path`:
  - rodam contra o `mova_test`;
  - as credenciais vêm de `MOVA_REAL_API_{OWNER,RENTER,SECOND_OWNER,SECOND_RENTER}_{EMAIL,PASSWORD}` e a URL de `MOVA_API_BASE_URL`;
  - o override de banco adianta o relógio da reserva e aborta fora do `mova_test`.
- `happy-path` consome o desbloqueio da reserva semeada da locatária demo. Antes de uma apresentação, rode de novo `npm run db:seed:demo -- --confirmar` no backend.

**CI**

O CI (`.github/workflows/tests.yml`) roda lint, unitários, build e o E2E mockado, e publica o relatório Allure no GitHub Pages. Na aba Suites, os testes aparecem agrupados por ator, entidade ou segmento. O grupo de cada arquivo fica em `src/test/allureSuites.js`, e um teste falha se um arquivo novo ficar sem grupo.

## Pontos de atenção

- As páginas `CorridasRealizadas`, `DataHora`, `EscolhaGaragem` e `Perfil` não têm rota, assim como `src/utils/favoritesStore.js`. São legado do MVP: os favoritos vêm de `favoritoService`, e as datas e garagens estão na jornada atual.
- As variáveis `--bp-*` (520, 720, 1024, 1280) só documentam a escala, porque CSS não aceita variável dentro de `@media`. Os media queries usam valores fixos.

## Licença

Projeto acadêmico (FATEC).
