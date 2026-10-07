# Notas de implementação — src/styles

Texto que ficava em comentários de várias linhas no código. Cada seção indica o arquivo e o trecho que o comentário acompanhava.

## `src/styles/auth.css`

**`.auth-page {`**

MOVA — telas de formulário (Task 8).
Fora do shell (login, cadastro, recuperação): coluna única centralizada,
marca oficial no topo, h1 de 32 px, rótulo sempre visível acima do campo.
Dentro do shell (.auth-page--in-shell: Conta, Configurações, Suporte e
formulários da jornada): só conteúdo, alinhado à esquerda, seções entre
réguas de 1 px. Só tokens semânticos; os dois temas vêm de tokens.css.

## `src/styles/authStyle.js`

**`` const BaseInputStyles = css` ``**

MOVA — componentes styled legados (Task 8).
Mesmos nomes e elementos de antes; visual só por tokens semânticos de
tokens.css (claro/escuro trocam sozinhos). Sem gradiente, raio &lt;= 8 px,
sombra só em sobreposição real (diálogo/popup).

## `src/styles/base.css`

**`html { -webkit-text-size-adjust: 100%; scroll-padding-top: calc(var(--appbar-h) + var(-...`**

MOVA — base, tipografia, utilitários e primitivas (Task 8).
Portado de mova-prototype/src/styles/global.css e ajustado ao produto real.
Regras: superfícies neutras carregam as grandes áreas; o azul fica com a
hierarquia e a ação; raio pequeno; sombra só em sobreposição real (menu,
folha, diálogo). Componentes consomem tokens semânticos de tokens.css.

**`.badge {`**

---------------------------------------------------------------- distintivo
Só o que muda a decisão: acessibilidade, energia e status. Sempre com texto.

**`.alert:not(:has(> svg))::before,`**

RNF13: além da cor, cada variante tem um símbolo fixo (✓ sucesso, ✕ erro,
! alerta, i informação). Só quando a mensagem não traz ícone próprio; o
texto alternativo vazio ("/ \"\"") evita que leitores de tela o anunciem.

**`.brand-img { display: block; height: auto; max-width: 100%; }`**

---------------------------------------------------------------- marca
Os PNGs oficiais têm versão clara e escura; a troca segue o tema efetivo
(data-theme explícito ou prefers-color-scheme) sem depender de JS.

## `src/styles/carselect.css`

**`.carro-list,`**

MOVA — estrutura residual das telas legadas (Task 8).
Aparência (superfície, borda, botão, campos) vem de editorial-journey.css e
base.css; aqui fica só o arranjo dos blocos ainda usados.

## `src/styles/editorial-journey.css`

**`main.carro-page { display: flex; flex-direction: column; gap: var(--space-6); min-width...`**

MOVA — camada de compatibilidade das telas legadas (Task 8).
Telas que ainda usam `carro-page`, `carro-header`, `carro-content`,
`carro-button` etc. passam a se comportar como conteúdo do AppShell:
sem fundo próprio, sem altura de viewport, título 32 px, cartões neutros.
Estilos de .auth-page vivem em auth.css.

## `src/styles/journey.css`

**`.journey-page { display: flex; flex-direction: column; gap: var(--space-6); min-width: ...`**

MOVA — jornada de reserva e pós-compra (Task 8).
Cada etapa responde: o que estou alugando, quando, onde retiro/devolvo,
quanto custa, quais serviços e qual o próximo passo.

## `src/styles/owner.css`

**`.owner-page { display: flex; flex-direction: column; gap: var(--space-8); min-width: 0; }`**

MOVA — área do locador (Task 8). Modo "operar": leitura rápida, réguas de
1 px, números tabulares, sem cartão dentro de cartão. Cabeçalho e navegação
do locador vivem em shell.css; aqui só o conteúdo das páginas.
Só tokens semânticos (tokens.css); claro e escuro trocam sozinhos.

**`.owner-summary {`**

---------------------------------------------------------------- resumo do painel
Faixa única com divisórias: rótulo pequeno, valor grande, link de destino.

## `src/styles/payment.css`

**`.pay-layout .journey-layout__aside { order: -1; }`**

MOVA — pagamento (Task 8). Reaproveita journey.css (resumo, layout) e
base.css (campos, alertas). Aqui só o que é próprio do pagamento.

## `src/styles/postcompra.css`

**`.historico { display: flex; flex-direction: column; gap: var(--space-8); min-width: 0; }`**

MOVA — pós-compra (Task 8): lista de reservas, desbloqueio, devolução,
cancelamento, avaliação, pendências e telas avulsas. Complementa
journey.css e base.css; nenhuma cor fora dos tokens.

**`.unlock-code {`**

---------------------------------------------------------------- desbloqueio
Código de desbloqueio: grande, tabular, espaçado e selecionável inteiro.

## `src/styles/relatorios.css`

**`.filtro-select {`**

MOVA — relatórios do locador e seletor de data (Task 8). Só tokens.
Gráficos (recharts) recebem cor por CSS: as propriedades vencem os atributos
de apresentação do SVG, então claro/escuro trocam sem JS.

## `src/styles/reservation-detail.css`

**`.detail-head { flex-direction: row; flex-wrap: wrap; align-items: center; gap: var(--sp...`**

MOVA — detalhe da reserva (Task 8). Estrutura vem de journey.css
(itinerário, resumo financeiro) e postcompra.css; aqui só o encaixe.

## `src/styles/shell.css`

**`.app-shell,`**

MOVA — shells (Task 8): visitante/locatário (AppShell) e locador (OwnerAppShell).
Cabeçalho neutro com a marca oficial; o azul só marca o destino atual.
Mobile: tab bar fixa com safe-area. ≥1024 px: navegação no cabeçalho.

## `src/styles/tokens.css`

**`:root {`**

MOVA — identidade oficial (Task 7.4, portada para o mova-frontend na Task 8).
Primitivas oficiais: azul primário #003366, azul secundário #D0E7FF.
\#0E2B49 é variação de apoio para superfícies escuras e texto de alta leitura.
Componentes consomem tokens semânticos; HEX não aparece fora desta camada.
Fonte única desta camada: mova-prototype/src/styles/tokens.css + theme-dark.css.

**`}`**

CursorCard: brilho que segue o ponteiro (desktop, hover fino).
primaryHue = #D0E7FF, secondaryHue = #003366, em alfa baixo.

## `src/styles/vehicle.css`

**`.vmedia {`**

MOVA — veículo: mídia, cartão, grade, filtros e detalhe (Task 8).
O carro é o objeto principal: mídia grande, inteira (contain), sobre uma
superfície rebaixada que funciona como "estúdio" nos dois temas.

**`.cursor-card { position: relative; isolation: isolate; --mx: -999px; --my: -999px; }`**

---------------------------------------------------------------- CursorCard
Brilho que segue o ponteiro (ver CursorGlowArea). Borda: anel de 1px
mascarado; superfície: halo muito suave atrás do conteúdo. Claro: borda
\#003366 sobre halo #D0E7FF. Escuro: borda #D0E7FF sobre halo #003366.

**`.vdetail__bar { display: none; }`**

Mobile: barra fixa com preço e "Reservar" ao alcance do polegar, acima da
tab bar e da safe area. A página ganha folga para nada ficar escondido.
