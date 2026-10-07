# Notas de implementação — Testes E2E (tests/e2e/)

Texto que ficava em comentários de várias linhas no código. Cada seção indica o arquivo e o trecho que o comentário acompanhava.

## `tests/e2e/happy-path.spec.js`

**`const enabled = globalThis.process?.env?.MOVA_HAPPY_PATH_E2E === "1";`**

Happy path oficial do locatário para a banca (Task 9), pela interface real.
Opt-in: roda contra o ambiente LOCAL de demonstração (frontend + API em
mova_dev, populado por `npm run db:seed:demo -- --confirmar` no backend).

MOVA_HAPPY_PATH_E2E=1 npx playwright test tests/e2e/happy-path.spec.js

Cria uma reserva nova e consome o desbloqueio da reserva semeada da Ana:
rode o seed de demonstração de novo antes da apresentação.

**`` const login = await page.request.post(`${apiBaseUrl}/conta/auth/login`, { data: { email... ``**

11. QR e desbloqueio: a reserva recém-criada só abre na data dela, então a
demonstração usa a reserva semeada da Ana, cuja janela já está aberta.

## `tests/e2e/public-home.spec.js`

**`test.beforeEach(async ({ page }, testInfo) => {`**

Suíte de contrato: NUNCA fala com a API real (Task 8.1). Esta rota é
registrada antes das rotas de cada teste — o Playwright dá prioridade à
rota registrada por último —, então só captura o que o teste não mockou.
Responde 501 com código explícito e anota a URL no relatório.

**`if (request.method() === "GET" && /\/api\/(reserva\/locatario\/[^/?]+|servico|favorito|...`**

Chamada ambiente do AppShell (reserva ativa do locatário): sem reservas,
no formato paginado real de GET /reserva/locatario/:id.
Idem para listas paginadas consultadas em segundo plano pelo detalhe
do veículo (serviços, favoritos, avisos) e pelo catálogo.

**`const trigger = page.getByRole("button", { name: "Conta" });`**

Task 8: o acionador mostra e anuncia "Conta" (antes aria-label "Menu"
escondia o texto visível — WCAG 2.5.3); o menu mistura links e botões.

**`function pagamentoConsulta(reserva, extra = {}) {`**

GET /reserva/:id/pagamento — mesmo formato de PagamentoEstornoService.consultar
(mova-backend/src/services/pagamento-estorno.ts). O mesmo path com POST
inicia o pagamento; por isso os handlers abaixo distinguem o método.

**`user: { id: "renter-1", cargo: "LOCATARIO", deficienciaId: "deficiencia-1" },`**

O veículo da fixture é adaptado: sem deficiência declarada o backend
recusaria a reserva (RN01) e o checkout pede a declaração.

## `tests/e2e/real-api.spec.js`

**`moveReservationWindowIntoTestPeriod(reservationId);`**

A API de produção exige início futuro na criação e não permite editar
uma reserva paga. O override abaixo é exclusivamente de teste e aborta
fora do banco mova_test; o desbloqueio continua passando pelo HTTP real.

## `tests/e2e/task10-edge-path.spec.js`

**`const env = globalThis.process?.env ?? {};`**

Task 10 — "edge path": as regras de negócio da Task 10 no navegador, contra a
API local real em mova_test. Opt-in como o real-api.spec.js:
MOVA_REAL_API_E2E=1 e MOVA_REAL_API_DB_OVERRIDE=1 (o relógio da reserva é
adiantado no banco de TESTE, nunca esperando 15 minutos de verdade).
