# Notas de implementação — Scripts (scripts/)

Texto que ficava em comentários de várias linhas no código. Cada seção indica o arquivo e o trecho que o comentário acompanhava.

## `scripts/task8-capture.mjs`

**`import { chromium } from "@playwright/test";`**

Task 8 — evidências visuais (light/dark × mobile/desktop).
Uso: node scripts/task8-capture.mjs &lt;antes|depois> [filtro-de-tela]
Requer o front no ar (MOVA_BASE, padrão http://localhost:5180).
A API é respondida por fixtures no formato do contrato real (page.route),
igual à suíte e2e/public-home.spec.js: nenhuma tela do produto é alterada.

## `scripts/task9-a11y.mjs`

**`import { chromium } from "@playwright/test";`**

Task 9 — verificação de acessibilidade no ambiente LOCAL de demonstração
(frontend + API reais em mova_dev, dados do seed de demonstração).

`node scripts/task9-a11y.mjs [saida.json]`

MOVA_BASE (padrão http://localhost:5173), MOVA_DEMO_PASSWORD (senha do seed).
Para cada tela × tema (claro/escuro) × largura: axe WCAG 2.x A/AA e overflow
horizontal (reflow). Em 1280 px: sequência de Tab com foco visível. Também
confere prefers-reduced-motion e zoom de 200 % (1280 px → 640 px CSS).
Não substitui teste com leitor de tela nem avaliação humana.
