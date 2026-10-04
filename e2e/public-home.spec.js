import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Suíte de contrato: NUNCA fala com a API real (Task 8.1). Esta rota é
// registrada antes das rotas de cada teste — o Playwright dá prioridade à
// rota registrada por último —, então só captura o que o teste não mockou.
// Responde 501 com código explícito e anota a URL no relatório.
test.beforeEach(async ({ page }, testInfo) => {
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    // Chamada ambiente do AppShell (reserva ativa do locatário): sem reservas,
    // no formato paginado real de GET /reserva/locatario/:id.
    // Idem para listas paginadas consultadas em segundo plano pelo detalhe
    // do veículo (serviços, favoritos, avisos) e pelo catálogo.
    if (request.method() === "GET" && /\/api\/(reserva\/locatario\/[^/?]+|servico|favorito|interesse|veiculo)(\?|$)/.test(request.url())) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: [], pagination: { total: 0, page: 1, limit: 100, totalPages: 0 } }) });
      return;
    }
    testInfo.annotations.push({ type: "unmocked-api", description: `${request.method()} ${new URL(request.url()).pathname}` });
    await route.fulfill({
      status: 501,
      contentType: "application/json",
      body: JSON.stringify({ success: false, code: "E2E_UNMOCKED", message: "Endpoint não mockado na suíte de contrato." }),
    });
  });
});

test("legacy owner routes keep owner shell", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("mova_auth_session", JSON.stringify({
      token: "owner-token",
      user: { id: "owner-1", cargo: "LOCADOR" },
    }));
  });
  await page.route("**/api/veiculo/meus**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ result: [], pagination: { total: 0, page: 1, limit: 100, totalPages: 1 } }),
    });
  });
  await page.route("**/api/dashboard/frota**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        result: {
          veiculos: { total: 0, disponivel: 0, reservado: 0, manutencao: 0, inativo: 0 },
          alertasAtivos: 0,
          ultimasLocalizacoes: [],
        },
      }),
    });
  });

  await page.goto("/cadastro-carros");
  await expect(page.getByRole("navigation", { name: /Navega.*locador/i })).toBeVisible();
  await expect(page.getByRole("navigation", { name: /Navega.*principal/i })).toHaveCount(0);
});

test("reservas do locador envia filtros UTC/status/veículo ao contrato", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("mova_auth_session", JSON.stringify({ token: "owner-token", user: { id: "owner-1", cargo: "LOCADOR" } }));
  });
  const requests = [];
  await page.route("**/api/veiculo/meus**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: [{ id: "vehicle-1", placa: "ABC-1234", marca: "Fiat", modelo: "Argo" }] }) });
  });
  await page.route("**/api/dashboard/reservas**", async (route) => {
    requests.push(new URL(route.request().url()));
    const filtered = requests.at(-1).searchParams.has("dataInicio");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ result: filtered ? { total: 0, reservas: [] } : { total: 2, reservas: [{ id: "reservation-1", idVeiculo: "vehicle-1", status: "CONFIRMADA", dataHoraInicio: "2026-01-01T10:00:00Z", dataHoraFim: "2026-01-02T10:00:00Z", veiculo: { marca: "Fiat", modelo: "Argo" }, garagemRetirada: { nome: "Centro" } }, { id: "reservation-2", idVeiculo: "vehicle-1", status: "AGUARDANDO_PAGAMENTO", dataHoraInicio: "2026-01-03T10:00:00Z", dataHoraFim: "2026-01-04T10:00:00Z", veiculo: { marca: "Fiat", modelo: "Argo" }, garagemRetirada: { nome: "Centro" } }] } }),
    });
  });

  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/reservas");
  await expect(page.getByRole("row", { name: /Fiat Argo.*Confirmada/ })).toBeVisible();
  const accessibilityScan = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(accessibilityScan.violations.filter((violation) => ["critical", "serious"].includes(violation.impact))).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.screenshot({ path: "../auditoria/fase-7-7/capturas/owner-reservations-light-320.png", fullPage: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.reload();
  await expect(page.getByRole("row", { name: /Fiat Argo.*Confirmada/ })).toBeVisible();
  await page.screenshot({ path: "../auditoria/fase-7-7/capturas/owner-reservations-light-1440.png", fullPage: true });
  const requestCountBeforeFilter = requests.length;
  await page.getByLabel("Data inicial").fill("2026-01-01");
  await page.getByLabel("Data final").fill("2026-01-31");
  await page.getByLabel("Status").selectOption("CONFIRMADA");
  await page.getByLabel("Veículo", { exact: true }).selectOption("vehicle-1");
  await page.getByRole("button", { name: "Aplicar filtros" }).click();

  await expect.poll(() => requests.length).toBe(requestCountBeforeFilter + 1);
  const filteredRequest = requests.at(-1);
  expect(filteredRequest.searchParams.get("dataInicio")).toBe("2026-01-01");
  expect(filteredRequest.searchParams.get("dataFim")).toBe("2026-01-31");
  expect(filteredRequest.searchParams.get("status")).toBe("CONFIRMADA");
  expect(filteredRequest.searchParams.get("idVeiculo")).toBe("vehicle-1");
});

test("B9 bloqueia transferencia de veiculo e preserva garagem escolhida", async ({ page }) => {
  const ownerVehicle = { ...vehicle, id: "vehicle-b9", garagemId: "garage-old" };
  let updateMethod = null;
  let updateBody = null;
  await page.addInitScript(() => {
    window.localStorage.setItem("mova_auth_session", JSON.stringify({ token: "owner-token", user: { id: "owner-1", cargo: "LOCADOR" } }));
  });
  await page.route("**/api/veiculo/meus**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: [ownerVehicle], pagination: { total: 1, page: 1, limit: 100, totalPages: 1 } }) });
  });
  await page.route("**/api/garagem**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: [{ id: "garage-new", nome: "Garagem Norte", status: "ATIVA", capacidade: 5, veiculosAlocados: 0 }], pagination: { total: 1, page: 1, limit: 100, totalPages: 1 } }) });
  });
  await page.route("**/api/dashboard/frota", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: { veiculos: { total: 1 }, alertasPorTipo: {} } }) });
  });
  await page.route("**/api/veiculo/vehicle-b9", async (route) => {
    updateMethod = route.request().method();
    updateBody = JSON.parse(route.request().postData() || route.request().postDataBuffer()?.toString() || "{}");
    await route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ code: "VEHICLE_HAS_ACTIVE_RESERVATION", message: "O veiculo possui uma reserva que impede sua transferencia de garagem." }) });
  });

  await page.goto("/cadastro-carros");
  await page.getByRole("button", { name: /editar fiat argo/i }).click();
  await expect(page.getByLabel("Garagem operacional")).toBeVisible();
  await page.getByLabel("Garagem operacional").selectOption("garage-new");
  await page.getByRole("button", { name: "Editar" }).click();

  await expect(page.getByRole("status")).toContainText(/reserva.*impede.*transfer/i);
  await expect(page.getByLabel("Garagem operacional")).toHaveValue("garage-new");
  expect(updateMethod).toBe("PUT");
  expect(updateBody).toMatchObject({ garagemId: "garage-new" });
});

test("edição de veículo mantém dados ao abrir deep link e após refresh", async ({ page }) => {
  const ownerVehicle = { ...vehicle, id: "vehicle-direct", placa: "XYZ9A99", garagemId: "garage-1" };
  await page.addInitScript(() => {
    window.localStorage.setItem("mova_auth_session", JSON.stringify({
      token: "owner-token",
      user: { id: "owner-1", cargo: "LOCADOR" },
    }));
  });
  await page.route("**/api/veiculo/meus**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: [ownerVehicle], pagination: { total: 1, page: 1, limit: 100, totalPages: 1 } }) });
  });
  await page.route("**/api/garagem**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: [{ id: "garage-1", nome: "Garagem Centro", status: "ATIVA", capacidade: 10, veiculosAlocados: 1 }], pagination: { total: 1, page: 1, limit: 100, totalPages: 1 } }) });
  });

  await page.goto("/cadastro-carros/vehicle-direct");
  await expect(page.locator("#placa")).toHaveValue("XYZ9A99");
  await expect(page.locator("#marca")).toHaveValue("Fiat");
  await page.reload();
  await expect(page.locator("#placa")).toHaveValue("XYZ9A99");
  await expect(page.getByLabel("Garagem operacional")).toHaveValue("garage-1");
});

test("edição de garagem mantém dados ao abrir deep link e após refresh", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("mova_auth_session", JSON.stringify({
      token: "owner-token",
      user: { id: "owner-1", cargo: "LOCADOR" },
    }));
  });
  await page.route("**/api/garagem**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ result: [{ id: "garage-direct", nome: "Garagem Norte", endereco: "Rua das Palmeiras, 20", capacidade: 12, acessibilidade: false, status: "ATIVA" }], pagination: { total: 1, page: 1, limit: 100, totalPages: 1 } }),
    });
  });

  await page.goto("/cadastro-garagens/garage-direct");
  await expect(page.locator("#nome")).toHaveValue("Garagem Norte");
  await expect(page.locator("#endereco")).toHaveValue("Rua das Palmeiras, 20");
  await page.reload();
  await expect(page.locator("#nome")).toHaveValue("Garagem Norte");
  await expect(page.getByLabel("Status")).toHaveValue("ATIVA");
});

test("payment refusal never opens success state", async ({ page }) => {
  const reservationId = "reservation-payment-refused";
  await seedRenterJourney(page, reservationId);
  await page.route(`**/api/reserva/${reservationId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ result: { id: reservationId, status: "AGUARDANDO_PAGAMENTO", statusPagamento: "AGUARDANDO_PAGAMENTO", valorTotal: 100 } }),
    });
  });
  await page.route(`**/api/reserva/${reservationId}/pagamento`, async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: pagamentoConsulta({ id: reservationId, status: "AGUARDANDO_PAGAMENTO", statusPagamento: "AGUARDANDO_PAGAMENTO", valorTotal: 100 }) }) });
      return;
    }
    await route.fulfill({
      status: 202,
      contentType: "application/json",
      body: JSON.stringify({ result: { reserva: { id: reservationId, status: "AGUARDANDO_PAGAMENTO", statusPagamento: "FALHA", valorTotal: 100 } } }),
    });
  });

  await page.goto("/pagamento");
  await page.getByLabel(/n.mero.*cart.o/i).fill("4111111111111111");
  await page.getByLabel(/nome do titular/i).fill("Cliente Teste");
  await page.getByLabel(/validade/i).fill("10/30");
  await page.getByLabel("CVV").fill("123");
  await page.getByRole("button", { name: "Pagar" }).click();

  await expect(page.getByRole("status")).toContainText(/pagamento n.o aprovado/i);
  await expect(page.getByRole("heading", { name: /pagamento aprovado/i })).toHaveCount(0);
});

test("detalhe da reserva carrega GET real e deriva ação do status", async ({ page }) => {
  const reservationId = "reservation-detail-1";
  await seedRenterJourney(page, reservationId);
  await page.route(`**/api/reserva/${reservationId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ result: {
        id: reservationId,
        status: "CONFIRMADA",
        statusPagamento: "SUCESSO",
        dataHoraInicio: "2030-10-01T13:00:00.000Z",
        dataHoraFim: "2030-10-03T13:00:00.000Z",
        valorTotal: 549.9,
        codigoDesbloqueio: "ABCD-1234",
        veiculo: { modeloVeiculo: { marca: "Fiat", modelo: "Argo" } },
        garagemRetirada: { id: "garage-1", nome: "Garagem Centro" },
        garagemDevolucao: { id: "garage-2", nome: "Garagem Sul" },
        servicos: [],
      } }),
    });
  });
  await page.route(`**/api/reserva/${reservationId}/pagamento`, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: pagamentoConsulta({ id: reservationId, status: "CONFIRMADA", statusPagamento: "SUCESSO", valorTotal: 549.9 }) }) });
  });

  await page.goto(`/reservas/${reservationId}`);
  await expect(page.getByRole("heading", { name: "Detalhe da reserva" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Fiat Argo" })).toBeVisible();
  await expect(page.getByText("Garagem Centro")).toBeVisible();
  await expect(page.getByRole("button", { name: "Desbloquear veículo" })).toBeVisible();
  await page.getByRole("button", { name: "Desbloquear veículo" }).click();
  await expect(page).toHaveURL(/\/desbloqueio$/);
});

test("payment already processing stays pending after reload", async ({ page }) => {
  const reservationId = "reservation-payment-processing";
  await seedRenterJourney(page, reservationId);
  await page.route(`**/api/reserva/${reservationId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ result: { id: reservationId, status: "AGUARDANDO_PAGAMENTO", statusPagamento: "PROCESSANDO", valorTotal: 100 } }),
    });
  });
  await page.route(`**/api/reserva/${reservationId}/pagamento`, async (route) => {
    // Só a consulta é permitida aqui: um POST significaria pagar de novo.
    expect(route.request().method()).toBe("GET");
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: pagamentoConsulta({ id: reservationId, status: "AGUARDANDO_PAGAMENTO", statusPagamento: "PROCESSANDO", valorTotal: 100 }) }) });
  });

  await page.goto("/pagamento");
  await expect(page.getByRole("heading", { name: "Processando pagamento" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Pagar$/i })).toHaveCount(0);
});

test("QR recusado pelo servidor n.o anuncia desbloqueio", async ({ page }) => {
  const reservationId = "reservation-qr-rejected";
  const reservation = {
    id: reservationId,
    status: "CONFIRMADA",
    statusPagamento: "SUCESSO",
    codigoDesbloqueio: "ABCD-1234",
    dataHoraInicio: "2030-10-01T13:00:00.000Z",
    dataHoraFim: "2030-10-03T13:00:00.000Z",
  };
  await seedRenterJourney(page, reservationId);
  await page.context().grantPermissions(["geolocation"]);
  await page.context().setGeolocation({ latitude: -23.5505, longitude: -46.6333 });
  await page.route(`**/api/reserva/${reservationId}`, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: reservation }) });
  });
  await page.route(`**/api/reserva/${reservationId}/desbloqueio/qr`, async (route) => {
    await route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ code: "QR_ALREADY_USED", message: "Token QR inválido" }) });
  });

  const qrPayload = btoa(JSON.stringify({ idReserva: reservationId, codigo: reservation.codigoDesbloqueio }))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  await page.goto(`/desbloqueio?qr=header.${qrPayload}.assinatura-invalida`);
  await page.getByRole("button", { name: /desbloquear pelo QR/i }).click();
  await expect(page.getByRole("alert")).toContainText(/token qr inv.lido/i);
  await expect(page.getByTestId("titulo-desbloqueado")).toHaveCount(0);
});

test("tracking interrompe ao receber 409 e mostra erro do servidor", async ({ page }) => {
  const reservationId = "reservation-tracking-conflict";
  await seedRenterJourney(page, reservationId);
  await page.route(`**/api/reserva/${reservationId}/localizacao`, async (route) => {
    await route.fulfill({
      status: 409,
      contentType: "application/json",
      body: JSON.stringify({ code: "TRACKING_NOT_ALLOWED", message: "A reserva não está em andamento" }),
    });
  });

  await page.goto(`/reserva/${reservationId}/localizacao`);
  await expect(page.getByRole("alert")).toContainText(/reserva n.o est. em andamento/i);
  await expect(page.getByText(/latitude|longitude/i)).toHaveCount(0);
});

test("capturas visuais das telas criticas em light/dark", async ({ page }) => {
  await mockCatalog(page);
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /veículos disponíveis agora/i })).toBeVisible();
  await page.screenshot({ path: "../auditoria/fase-7-7/capturas/home-light-320.png", fullPage: true });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /veículos disponíveis agora/i })).toBeVisible();
  await page.screenshot({ path: "../auditoria/fase-7-7/capturas/home-light-1440.png", fullPage: true });

  await page.addInitScript(() => window.localStorage.setItem("mova:tema-escuro:v2", "true"));
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("heading", { name: /veículos disponíveis agora/i })).toBeVisible();
  await page.screenshot({ path: "../auditoria/fase-7-7/capturas/home-dark-375.png", fullPage: true });
  const homeDarkScan = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(homeDarkScan.violations.filter((violation) => ["critical", "serious"].includes(violation.impact))).toEqual([]);

  await page.evaluate(() => window.localStorage.setItem("mova:tema-escuro:v2", "false"));
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/login");
  await page.evaluate(() => {
    window.localStorage.setItem("mova:tema-escuro:v2", "false");
    document.documentElement.setAttribute("data-theme", "light");
  });
  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
  // Task 8: "Cadastre-se" virou ação secundária na cor oficial #003366.
  await expect(page.getByRole("link", { name: "Cadastre-se" })).toHaveCSS("color", "rgb(0, 51, 102)");
  await page.screenshot({ path: "../auditoria/fase-7-7/capturas/login-light-375.png", fullPage: true });
  const loginLightScan = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(loginLightScan.violations.filter((violation) => ["critical", "serious"].includes(violation.impact))).toEqual([]);

  await page.evaluate(() => {
    window.localStorage.setItem("mova:tema-escuro:v2", "true");
    document.documentElement.setAttribute("data-theme", "dark");
  });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
  // No escuro a ação secundária usa a cor oficial #D0E7FF.
  await expect(page.getByRole("link", { name: "Cadastre-se" })).toHaveCSS("color", "rgb(208, 231, 255)");
  await page.screenshot({ path: "../auditoria/fase-7-7/capturas/login-dark-375.png", fullPage: true });
  const loginDarkScan = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(loginDarkScan.violations.filter((violation) => ["critical", "serious"].includes(violation.impact))).toEqual([]);
});

test("capturas visuais do shell locador em light/dark", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("mova_auth_session", JSON.stringify({ token: "owner-token", user: { id: "owner-1", cargo: "LOCADOR" } }));
  });
  await page.route("**/api/dashboard/frota", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: { veiculos: { total: 7 }, alertasPorTipo: { INATIVIDADE: 2, BAIXA_AVALIACAO: 1 } } }) });
  });
  await page.route("**/api/dashboard/reservas", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: { total: 3, reservas: [] } }) });
  });
  await page.route("**/api/dashboard/financeiro", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: { faturamentoBruto: 12345.67 } }) });
  });
  await page.route("**/api/dashboard/utilizacao", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: { taxaOcupacao: 0.5, veiculosAlocados: 4 } }) });
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/painel");
  await expect(page.getByRole("heading", { name: "Painel do locador" })).toBeVisible();
  await page.screenshot({ path: "../auditoria/fase-7-7/capturas/owner-light-1440.png", fullPage: true });

  await page.evaluate(() => window.localStorage.setItem("mova:tema-escuro:v2", "true"));
  await page.setViewportSize({ width: 375, height: 900 });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Painel do locador" })).toBeVisible();
  await page.screenshot({ path: "../auditoria/fase-7-7/capturas/owner-dark-375.png", fullPage: true });
});

test("capturas visuais da jornada legada com linguagem editorial", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("mova_auth_session", JSON.stringify({
      token: "owner-token",
      user: { id: "owner-1", cargo: "LOCADOR" },
    }));
  });
  await page.route("**/api/veiculo/meus**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ result: [], pagination: { total: 0, page: 1, limit: 100, totalPages: 1 } }),
    });
  });
  await page.route("**/api/dashboard/frota", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ result: { veiculos: { total: 0 }, alertasPorTipo: {} } }),
    });
  });

  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/cadastro-carros");
  await expect(page.getByRole("heading", { name: "Cadastro de Carros" })).toBeVisible();
  await page.screenshot({ path: "../auditoria/fase-7-7/capturas/legacy-owner-light-320.png", fullPage: true });
  const legacyLightScan = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(legacyLightScan.violations.filter((violation) => ["critical", "serious"].includes(violation.impact))).toEqual([]);

  await page.evaluate(() => window.localStorage.setItem("mova:tema-escuro:v2", "true"));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("heading", { name: "Cadastro de Carros" })).toBeVisible();
  await page.screenshot({ path: "../auditoria/fase-7-7/capturas/legacy-owner-dark-1440.png", fullPage: true });
});

test("falha de chunk de rota mostra recuperacao acessivel", async ({ page }) => {
  await page.route("**/assets/Home-*.js", (route) => route.abort());
  await page.goto("/");

  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByRole("heading", { name: /n.o foi poss.vel carregar esta tela/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /recarregar tela/i })).toBeVisible();
});

test("falha de chunk do shell do locador mostra recuperação acessível", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("mova_auth_session", JSON.stringify({
      token: "owner-token",
      user: { id: "owner-1", cargo: "LOCADOR" },
    }));
  });
  await page.route("**/assets/OwnerAppShell-*.js", (route) => route.abort());
  await page.goto("/painel");
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByRole("button", { name: /recarregar tela/i })).toBeVisible();
});

test("rede lenta mostra fallback da rota antes do conteudo", async ({ page }) => {
  await page.route("**/assets/Home-*.js", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await route.continue();
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("status")).toContainText(/p.gina inicial/i);
  await expect(page.getByRole("heading", { name: /veículos disponíveis agora/i })).toBeVisible();
});

const vehicle = {
  id: "vehicle-public-1",
  idLocador: "owner-1",
  idModeloVeiculo: "model-1",
  garagemId: "garage-1",
  garagem: { id: "garage-1", nome: "Garagem Centro", status: "ATIVA" },
  marca: "Fiat",
  modelo: "Argo",
  ano: 2025,
  cambio: "Automatico",
  capacidade: 5,
  adaptado: true,
  eletrico: false,
  categoria: "ECONOMICO",
  valorDiaria: 180,
  status: "DISPONIVEL",
};

async function mockCatalog(page, requests = [], vehicles = [vehicle]) {
  await page.route("**/api/veiculo**", async (route) => {
    requests.push(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ result: vehicles, pagination: { total: vehicles.length, page: 1, limit: 100, totalPages: 1 } }),
    });
  });
}

test("Home pública mostra catálogo real e passa axe crítico/serious", async ({ page }) => {
  await mockCatalog(page);
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /veículos disponíveis agora/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Fiat Argo" })).toBeVisible();
  await expect(page.getByRole("link", { name: /entrar/i })).toBeVisible();
  await expect(page.getByRole("group", { name: "Filtrar por categoria" })).toBeVisible();

  const accessibilityScan = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(accessibilityScan.violations.filter((violation) => ["critical", "serious"].includes(violation.impact))).toEqual([]);
});

test("Home autenticada mostra reserva ativa e aba Alugar somente com dado real", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("mova_auth_session", JSON.stringify({
      token: "renter-token",
      user: { id: "renter-1", cargo: "LOCATARIO" },
    }));
  });
  await mockCatalog(page);
  await page.route("**/api/reserva/locatario/renter-1**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        result: [{
          id: "reservation-active-1",
          status: "CONFIRMADA",
          statusPagamento: "SUCESSO",
          dataHoraInicio: "2030-10-01T13:00:00.000Z",
          dataHoraFim: "2030-10-03T13:00:00.000Z",
          garagemRetirada: { nome: "Garagem Centro" },
          veiculo: { modeloVeiculo: { marca: "Fiat", modelo: "Argo" } },
        }],
        pagination: { total: 1, page: 1, limit: 100, totalPages: 1 },
      }),
    });
  });

  await page.goto("/");
  await expect(page.getByRole("complementary", { name: /sua reserva ativa/i })).toBeVisible();
  await expect(page.getByRole("complementary", { name: /sua reserva ativa/i }).getByText("Fiat Argo")).toBeVisible();
  // Destinos de navegação agora são links (antes botões com navigate()).
  await expect(page.getByRole("link", { name: "Alugar" })).toBeVisible();
});

test("menu de conta mantém foco por teclado e devolve foco ao acionador", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("mova_auth_session", JSON.stringify({
      token: "renter-token",
      user: { id: "renter-1", cargo: "LOCATARIO" },
    }));
  });
  await mockCatalog(page);
  await page.route("**/api/reserva/locatario/renter-1**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ result: [], pagination: { total: 0, page: 1, limit: 100, totalPages: 0 } }),
    });
  });

  await page.goto("/");
  // Task 8: o acionador mostra e anuncia "Conta" (antes aria-label "Menu"
  // escondia o texto visível — WCAG 2.5.3); o menu mistura links e botões.
  const trigger = page.getByRole("button", { name: "Conta" });
  await trigger.click();

  const dialog = page.getByRole("dialog", { name: "Menu da conta" });
  const buttons = dialog.locator('a[href], button:not([tabindex="-1"])');
  await expect(dialog).toBeVisible();
  await expect(buttons.first()).toBeFocused();

  await page.keyboard.press("Shift+Tab");
  await expect(buttons.last()).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(buttons.first()).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("filtros independentes chegam combinados ao catálogo", async ({ page }) => {
  const requests = [];
  await mockCatalog(page, requests);
  await page.goto("/");

  await page.getByLabel("Marca").fill("Fiat");
  await page.getByLabel("Modelo").fill("Argo");
  await page.getByLabel("PCD").check();

  await expect.poll(() => requests.some((url) => url.includes("marca=Fiat") && url.includes("modelo=Argo") && url.includes("pcd=true"))).toBe(true);
});

test("ação protegida retorna à intenção original após login", async ({ page }) => {
  await mockCatalog(page);
  await page.route("**/api/veiculo/vehicle-public-1", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: vehicle }) });
  });
  await page.route("**/api/conta/auth/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ result: { token: "test-token", user: { id: "renter-1", cargo: "LOCATARIO" } } }),
    });
  });
  await page.route("**/api/conta/auth/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ result: { id: "renter-1", nome: "Cliente teste", email: "cliente@example.test", cargo: "LOCATARIO" } }),
    });
  });

  await page.goto("/");
  // "Ver detalhes" agora é link para /carros/:id (antes botão com navigate()).
  await page.getByRole("link", { name: /ver detalhes/i }).first().click();
  await page.getByRole("button", { name: /reservar este carro/i }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel("E-mail").fill("cliente@example.test");
  await page.getByLabel("Senha").fill("Senha12345");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL(/\/carros\/vehicle-public-1$/);
  await expect(page.getByRole("heading", { name: /fiat argo/i })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: /fiat argo/i })).toBeVisible();
});

test("rota do locador permanece protegida sem sessão", async ({ page }) => {
  await page.goto("/painel");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
});

test("cargos não atravessam shells ou fluxos protegidos", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("mova_auth_session", JSON.stringify({
      token: "owner-token",
      user: { id: "owner-1", cargo: "LOCADOR" },
    }));
  });
  await page.goto("/historico");
  await expect(page).toHaveURL(/\/painel$/);

  await page.evaluate(() => {
    window.localStorage.setItem("mova_auth_session", JSON.stringify({
      token: "renter-token",
      user: { id: "renter-1", cargo: "LOCATARIO" },
    }));
    window.dispatchEvent(new Event("mova:auth-session-changed"));
  });
  await expect(page).toHaveURL(/\/home$/);
});

test("painel do locador mostra métricas e alertas retornados pela API", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("mova_auth_session", JSON.stringify({
      token: "owner-token",
      user: { id: "owner-1", cargo: "LOCADOR" },
    }));
  });
  await page.route("**/api/dashboard/frota", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ result: { veiculos: { total: 7 }, alertasPorTipo: { INATIVIDADE: 2, BAIXA_AVALIACAO: 1 } } }),
    });
  });
  await page.route("**/api/dashboard/reservas", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: { total: 3, reservas: [] } }) });
  });
  await page.route("**/api/dashboard/financeiro", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: { faturamentoBruto: 12345.67 } }) });
  });
  await page.route("**/api/dashboard/utilizacao", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: { taxaOcupacao: 0.5, veiculosAlocados: 4 } }) });
  });

  await page.goto("/painel");
  await expect(page.getByRole("heading", { name: "Painel do locador" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Painel do locador" })).toBeVisible();
  await expect(page.getByText("7 no total")).toBeVisible();
  await expect(page.getByText("3 no período")).toBeVisible();
  await expect(page.getByText(/50 % · 4 alocados/)).toBeVisible();
  await expect(page.getByText("R$ 12.345,67")).toBeVisible();
  const ownerAccessibilityScan = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(ownerAccessibilityScan.violations.filter((violation) => ["critical", "serious"].includes(violation.impact))).toEqual([]);
  await expect(page.getByText("Inatividade").locator("..").getByText("2")).toBeVisible();
  await expect(page.getByText("Baixa avaliação").locator("..").getByText("1")).toBeVisible();
});

test("relatório de avaliações envia limites UTC sem deslocamento", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("mova_auth_session", JSON.stringify({
      token: "owner-token",
      user: { id: "owner-1", cargo: "LOCADOR" },
    }));
  });
  const requests = [];
  await page.route("**/api/avaliacao/relatorio**", async (route) => {
    requests.push(new URL(route.request().url()));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        result: {
          resumo: { total: 1, media: 4.5 },
          ranking: [{ veiculo: { id: "vehicle-1", placa: "ABC-1234", marca: "Fiat", modelo: "Argo" } }],
          mediaPorVeiculo: [{ veiculo: { id: "vehicle-1", placa: "ABC-1234" }, quantidade: 1, media: 4.5, maior: 5, menor: 4 }],
        },
      }),
    });
  });

  await page.goto("/relatorios/avaliacoes?dataInicio=2026-01-01&dataFim=2026-01-31");
  await expect(page.getByText(/1 avalia.*4\.5/)).toBeVisible();
  expect(requests).toHaveLength(1);
  expect(requests[0].searchParams.get("dataInicio")).toBe("2026-01-01");
  expect(requests[0].searchParams.get("dataFim")).toBe("2026-01-31");
});

test("relatório de veículos formata instantes UTC no timezone de exibição", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("mova_auth_session", JSON.stringify({
      token: "owner-token",
      user: { id: "owner-1", cargo: "LOCADOR" },
    }));
  });
  const reservationRequests = [];
  await page.route("**/api/dashboard/reservas**", async (route) => {
    reservationRequests.push(new URL(route.request().url()));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        result: {
          total: 1,
          reservas: [{
            id: "reservation-report-1",
            idVeiculo: "vehicle-1",
            status: "CONFIRMADA",
            statusPagamento: "SUCESSO",
            dataHoraInicio: "2026-02-01T02:00:00.000Z",
            dataHoraFim: "2026-02-02T02:00:00.000Z",
            valorTotal: 100,
            veiculo: { placa: "ABC-1234", marca: "Fiat", modelo: "Argo" },
          }],
        },
      }),
    });
  });
  await page.route("**/api/dashboard/financeiro", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: { faturamentoBruto: 100, porVeiculo: [] } }) });
  });
  await page.route("**/api/dashboard/utilizacao", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: { taxaOcupacao: 0, veiculosAlocados: 1, maisUtilizados: [] } }) });
  });
  await page.route("**/api/avaliacao/relatorio", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: { resumo: { total: 0, media: 0 } } }) });
  });

  await page.goto("/relatorios/veiculos");
  await expect(page.getByText(/31\/01\/2026 a 01\/02\/2026/)).toBeVisible();
  await page.getByLabel("Data inicial").fill("2026-01-01");
  await page.getByLabel("Data final").fill("2026-01-31");
  // exact: o <main> rotulado "Relatórios | Veículos" também casaria com "Veículo".
  await page.getByLabel("Veículo", { exact: true }).selectOption("vehicle-1");
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect.poll(() => reservationRequests.length).toBe(2);
  expect(reservationRequests[1].searchParams.get("dataInicio")).toBe("2026-01-01");
  expect(reservationRequests[1].searchParams.get("dataFim")).toBe("2026-01-31");
  expect(reservationRequests[1].searchParams.get("idVeiculo")).toBe("vehicle-1");
});

test("sessão revogada limpa credencial e expõe erro contextual", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("mova_auth_session", JSON.stringify({
      token: "revoked-token",
      user: { id: "owner-1", cargo: "LOCADOR" },
    }));
  });
  await page.route("**/api/dashboard/**", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ code: "SESSION_REVOKED", message: "Sessão revogada" }),
    });
  });

  await page.goto("/painel");
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem("mova_auth_session"))).toBeNull();
  await expect(page.getByRole("alert").first()).toContainText("Sessão revogada");
});

// GET /reserva/:id/pagamento — mesmo formato de PagamentoEstornoService.consultar
// (mova-backend/src/services/pagamento-estorno.ts). O mesmo path com POST
// inicia o pagamento; por isso os handlers abaixo distinguem o método.
function pagamentoConsulta(reserva, extra = {}) {
  const pago = reserva.statusPagamento === "SUCESSO";
  return {
    idReserva: reserva.id,
    statusReserva: reserva.status,
    statusPagamento: reserva.statusPagamento,
    metodoPagamento: "CARTAO_CREDITO",
    valorReserva: reserva.valorTotal,
    valorPago: pago ? reserva.valorTotal : 0,
    multaCancelamento: 0,
    valorElegivelEstorno: pago ? reserva.valorTotal : 0,
    statusEstorno: "NAO_SOLICITADO",
    estornoSolicitadoEm: null,
    estornoConcluidoEm: null,
    historico: [],
    simulado: true,
    aviso: "Pagamento e estorno simulados — nenhum dinheiro real movimentado",
    atualizadoEm: "2030-09-30T12:00:00.000Z",
    ...extra,
  };
}

function seedRenterJourney(page, reservationId, dates = {}) {
  return page.addInitScript(({ id, pickup, dropoff }) => {
    window.localStorage.setItem("mova_auth_session", JSON.stringify({
      token: "renter-token",
      // O veículo da fixture é adaptado: sem deficiência declarada o backend
      // recusaria a reserva (RN01) e o checkout pede a declaração.
      user: { id: "renter-1", cargo: "LOCATARIO", deficienciaId: "deficiencia-1" },
    }));
    window.sessionStorage.setItem("mova_journey_flow", JSON.stringify({
      veiculo: { id: "vehicle-public-1", marca: "Fiat", modelo: "Argo", garagemId: "garage-1" },
      retirada: { garageId: "garage-1", date: pickup?.date || "01/10/2030", time: pickup?.time || "10:00" },
      devolucao: { garageId: "garage-1", date: dropoff?.date || "03/10/2030", time: dropoff?.time || "10:00" },
      pagamento: { metodoPagamento: "CARTAO_CREDITO" },
      reserva: { id, codigoDesbloqueio: "" },
      servicos: { ids: [] },
    }));
  }, { id: reservationId, pickup: dates.pickup, dropoff: dates.dropoff });
}

test("pagamento sandbox só confirma quando API retorna SUCESSO", async ({ page }) => {
  const reservationId = "reservation-payment-1";
  const reservation = {
    id: reservationId,
    status: "AGUARDANDO_PAGAMENTO",
    statusPagamento: "AGUARDANDO_PAGAMENTO",
    valorTotal: 549.9,
    dataHoraInicio: "2030-10-01T13:00:00.000Z",
    dataHoraFim: "2030-10-03T13:00:00.000Z",
  };
  const paymentRequests = [];
  await seedRenterJourney(page, reservationId);
  await page.route(`**/api/reserva/${reservationId}`, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: reservation }) });
  });
  let pago = false;
  await page.route(`**/api/reserva/${reservationId}/pagamento`, async (route) => {
    if (route.request().method() === "GET") {
      const atual = pago ? { ...reservation, status: "CONFIRMADA", statusPagamento: "SUCESSO" } : reservation;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: pagamentoConsulta(atual) }) });
      return;
    }
    paymentRequests.push(JSON.parse(route.request().postData() || "{}"));
    pago = true;
    await route.fulfill({
      status: 202,
      contentType: "application/json",
      body: JSON.stringify({ result: { reserva: { ...reservation, status: "CONFIRMADA", statusPagamento: "SUCESSO", codigoDesbloqueio: "ABCD-1234" } } }),
    });
  });

  await page.goto("/pagamento");
  await page.getByLabel(/número do cartão/i).fill("4111111111111111");
  await page.getByLabel(/nome do titular/i).fill("Cliente Teste");
  await page.getByLabel(/validade/i).fill("10/30");
  await page.getByLabel("CVV").fill("123");
  await page.getByRole("button", { name: "Pagar" }).click();

  await expect(page.getByRole("heading", { name: "Pagamento aprovado" })).toBeVisible();
  expect(paymentRequests).toHaveLength(1);
  expect(paymentRequests[0]).toMatchObject({ metodoPagamento: "CARTAO_CREDITO" });
  expect(paymentRequests[0]).not.toHaveProperty("valorTotal");
  expect(paymentRequests[0]).not.toHaveProperty("status");
});

test("cancelamento usa POST e mostra multa retornada pelo servidor", async ({ page }) => {
  const reservationId = "reservation-cancel-1";
  const reservation = {
    id: reservationId,
    status: "CONFIRMADA",
    statusPagamento: "SUCESSO",
    valorTotal: 549.9,
    dataHoraInicio: "2030-10-01T13:00:00.000Z",
    dataHoraFim: "2030-10-03T13:00:00.000Z",
    veiculo: { modeloVeiculo: { marca: "Fiat", modelo: "Argo" } },
  };
  const methods = [];
  const cancelMethods = [];
  let cancelCompleted = false;
  await seedRenterJourney(page, reservationId);
  await page.route(`**/api/reserva/${reservationId}`, async (route) => {
    methods.push(route.request().method());
    if (route.request().method() !== "GET") {
      await route.fulfill({ status: 405, contentType: "application/json", body: JSON.stringify({ code: "METHOD_NOT_ALLOWED", message: "Use o endpoint de cancelamento." }) });
      return;
    }
    const result = reservation;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result }) });
  });
  await page.route(`**/api/reserva/${reservationId}/pagamento`, async (route) => {
    const atual = cancelCompleted ? { ...reservation, status: "CANCELADA" } : reservation;
    const extra = cancelCompleted ? { multaCancelamento: 80, valorElegivelEstorno: 469.9, statusEstorno: "SOLICITADO" } : {};
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: pagamentoConsulta(atual, extra) }) });
  });
  await page.route(`**/api/reserva/${reservationId}/cancelar`, async (route) => {
    cancelMethods.push(route.request().method());
    if (route.request().method() !== "POST") {
      await route.fulfill({ status: 405, contentType: "application/json", body: JSON.stringify({ code: "METHOD_NOT_ALLOWED" }) });
      return;
    }
    cancelCompleted = true;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: { ...reservation, status: "CANCELADA", multaCancelamento: 80 } }) });
  });
  await page.route("**/api/reserva/locatario/renter-1**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: cancelCompleted ? [{ ...reservation, status: "CANCELADA", multaCancelamento: 80 }] : [], pagination: { page: 1, limit: 10, total: cancelCompleted ? 1 : 0, totalPages: 1 } }) });
  });

  await page.goto("/cancelamento");
  await expect(page.getByRole("button", { name: "Solicitar cancelamento" })).toBeVisible();
  await page.getByRole("button", { name: "Solicitar cancelamento" }).click();
  await page.getByRole("button", { name: "Confirmar cancelamento" }).click();

  await expect(page.getByText("Cancelamento confirmado pelo sistema.")).toBeVisible();
  await expect(page.getByTestId("multa-cancelamento")).toContainText("R$ 80,00");
  expect(methods).toEqual(["GET"]);
  expect(cancelMethods).toEqual(["POST"]);
  await page.getByRole("button", { name: "Ver minhas reservas" }).click();
  await expect(page).toHaveURL(/\/historico$/);
  await expect(page.getByText(/Cancelada/)).toBeVisible();
});

test.describe("jornada de reserva e RN05", () => {
  test.use({ timezoneId: "America/Sao_Paulo" });

  test("converte hora local para UTC no quote e na criação da reserva", async ({ page }) => {
    const reservationId = "reservation-rn05-1";
    const pricingRequests = [];
    const createRequests = [];
    await seedRenterJourney(page, reservationId, {
      pickup: { date: "01/10/2030", time: "10:00" },
      dropoff: { date: "01/10/2030", time: "11:00" },
    });
    await page.route("**/api/veiculo/vehicle-public-1", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: { ...vehicle, valorDiaria: 180 } }) });
    });
    await page.route("**/api/reserva/precificacao", async (route) => {
      pricingRequests.push(JSON.parse(route.request().postData() || "{}"));
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: { totalDiarias: 1, dailyRate: 180, servicesTotal: 0, total: 180 } }) });
    });
    await page.route("**/api/reserva", async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      createRequests.push(JSON.parse(route.request().postData() || "{}"));
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ result: { id: reservationId, valorTotal: 180, status: "AGUARDANDO_PAGAMENTO" } }) });
    });
    await page.route(`**/api/reserva/${reservationId}/condutores`, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: [] }) });
    });

    await page.goto("/checkout-reserva");
    await expect(page.getByRole("heading", { name: "Checkout da Reserva" })).toBeVisible();
    expect(pricingRequests[0].dataHoraInicio).toBe("2030-10-01T13:00:00.000Z");
    expect(pricingRequests[0].dataHoraFim).toBe("2030-10-01T14:00:00.000Z");

    await page.getByRole("button", { name: "Confirmar e seguir para pagamento" }).click();
    await expect(page).toHaveURL(/\/condutores-adicionais$/);
    expect(createRequests[0]).toMatchObject({
      idVeiculo: "vehicle-public-1",
      idLocatario: "renter-1",
      dataHoraInicio: "2030-10-01T13:00:00.000Z",
      dataHoraFim: "2030-10-01T14:00:00.000Z",
    });
    expect(createRequests[0]).not.toHaveProperty("status");
    expect(createRequests[0]).not.toHaveProperty("statusPagamento");
    expect(createRequests[0]).not.toHaveProperty("valorTotal");
  });

  test("RN01: veículo adaptado exige declarar deficiência no checkout e envia deficienciaId", async ({ page }) => {
    const reservationId = "reservation-rn01-1";
    const createRequests = [];
    await seedRenterJourney(page, reservationId);
    await page.addInitScript(() => {
      window.localStorage.setItem("mova_auth_session", JSON.stringify({
        token: "renter-token",
        user: { id: "renter-1", cargo: "LOCATARIO" },
      }));
    });
    await page.route("**/api/veiculo/vehicle-public-1", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: { ...vehicle, valorDiaria: 180 } }) });
    });
    await page.route("**/api/deficiencia/all", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: [{ id: "deficiencia-1", descricao: "Mobilidade reduzida" }] }) });
    });
    await page.route("**/api/reserva/precificacao", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: { totalDiarias: 2, dailyRate: 180, servicesTotal: 0, total: 360 } }) });
    });
    await page.route("**/api/reserva", async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      createRequests.push(JSON.parse(route.request().postData() || "{}"));
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ result: { id: reservationId, valorTotal: 360, status: "AGUARDANDO_PAGAMENTO" } }) });
    });
    await page.route(`**/api/reserva/${reservationId}/condutores`, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: [] }) });
    });

    await page.goto("/checkout-reserva");
    const declaracao = page.getByLabel("Deficiência declarada (obrigatório)");
    await expect(declaracao).toBeVisible();
    await page.getByRole("button", { name: "Confirmar e seguir para pagamento" }).click();
    await expect(page.getByRole("alert")).toContainText("informe sua deficiência");
    await expect(declaracao).toBeFocused();
    expect(createRequests).toHaveLength(0);

    await declaracao.selectOption("deficiencia-1");
    await page.getByRole("button", { name: "Confirmar e seguir para pagamento" }).click();
    await expect(page).toHaveURL(/\/condutores-adicionais$/);
    expect(createRequests[0]).toMatchObject({ deficienciaId: "deficiencia-1" });
  });

  test("aceita exatamente 30 dias de duração", async ({ page }) => {
    const reservationId = "reservation-rn05-max";
    const createRequests = [];
    await seedRenterJourney(page, reservationId, {
      pickup: { date: "01/10/2030", time: "10:00" },
      dropoff: { date: "31/10/2030", time: "10:00" },
    });
    await page.route("**/api/veiculo/vehicle-public-1", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: vehicle }) });
    });
    await page.route("**/api/reserva/precificacao", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: { totalDiarias: 30, dailyRate: 180, servicesTotal: 0, total: 5400 } }) });
    });
    await page.route("**/api/reserva", async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      createRequests.push(JSON.parse(route.request().postData() || "{}"));
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ result: { id: reservationId, valorTotal: 5400, status: "AGUARDANDO_PAGAMENTO" } }) });
    });
    await page.route(`**/api/reserva/${reservationId}/condutores`, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: [] }) });
    });

    await page.goto("/checkout-reserva");
    await expect(page.getByRole("button", { name: "Confirmar e seguir para pagamento" })).toBeVisible();
    await page.getByRole("button", { name: "Confirmar e seguir para pagamento" }).click();
    await expect(page).toHaveURL(/\/condutores-adicionais$/);
    expect(createRequests).toHaveLength(1);
  });

  test("preserva virada de dia em hora local", async ({ page }) => {
    const reservationId = "reservation-rn05-midnight";
    const pricingRequests = [];
    await seedRenterJourney(page, reservationId, {
      pickup: { date: "01/10/2030", time: "23:30" },
      dropoff: { date: "02/10/2030", time: "00:30" },
    });
    await page.route("**/api/veiculo/vehicle-public-1", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: vehicle }) });
    });
    await page.route("**/api/reserva/precificacao", async (route) => {
      pricingRequests.push(JSON.parse(route.request().postData() || "{}"));
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: { totalDiarias: 1, dailyRate: 180, servicesTotal: 0, total: 180 } }) });
    });

    await page.goto("/checkout-reserva");
    await expect(page.getByRole("heading", { name: "Checkout da Reserva" })).toBeVisible();
    expect(pricingRequests[0].dataHoraInicio).toBe("2030-10-02T02:30:00.000Z");
    expect(pricingRequests[0].dataHoraFim).toBe("2030-10-02T03:30:00.000Z");
  });

  test("bloqueia duração acima de 30 dias antes do POST de reserva", async ({ page }) => {
    const reservationId = "reservation-rn05-invalid";
    const createRequests = [];
    await seedRenterJourney(page, reservationId, {
      pickup: { date: "01/10/2030", time: "10:00" },
      dropoff: { date: "01/11/2030", time: "10:00" },
    });
    await page.route("**/api/veiculo/vehicle-public-1", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: vehicle }) });
    });
    await page.route("**/api/reserva/precificacao", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: { totalDiarias: 31, dailyRate: 180, servicesTotal: 0, total: 5580 } }) });
    });
    await page.route("**/api/reserva", async (route) => {
      if (route.request().method() === "POST") createRequests.push(route.request().postData());
      await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ message: "não deveria enviar" }) });
    });

    await page.goto("/checkout-reserva");
    await expect(page.getByRole("button", { name: "Confirmar e seguir para pagamento" })).toBeVisible();
    await page.getByRole("button", { name: "Confirmar e seguir para pagamento" }).click();
    await expect(page.getByText("A reserva deve ter entre 1 hora e 30 dias de duração.")).toBeVisible();
    expect(createRequests).toHaveLength(0);
  });
});

test("desbloqueio só confirma após POST autorizado e envia geolocalização real", async ({ page }) => {
  const reservationId = "reservation-unlock-1";
  const reservation = {
    id: reservationId,
    status: "CONFIRMADA",
    statusPagamento: "SUCESSO",
    codigoDesbloqueio: "ABCD-1234",
    dataHoraInicio: "2030-10-01T13:00:00.000Z",
    dataHoraFim: "2030-10-03T13:00:00.000Z",
  };
  let unlockBody;
  await seedRenterJourney(page, reservationId);
  await page.context().grantPermissions(["geolocation"]);
  await page.context().setGeolocation({ latitude: -23.5505, longitude: -46.6333 });
  await page.route(`**/api/reserva/${reservationId}`, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: reservation }) });
  });
  await page.route(`**/api/reserva/${reservationId}/desbloqueio`, async (route) => {
    unlockBody = JSON.parse(route.request().postData() || "{}");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ result: { ...reservation, status: "EM_ANDAMENTO", codigoUsadoEm: "2030-10-01T13:01:00.000Z" } }),
    });
  });

  await page.goto("/desbloqueio");
  await page.getByRole("button", { name: "Desbloquear veículo" }).click();
  await expect(page.getByTestId("titulo-desbloqueado")).toBeVisible();
  expect(unlockBody).toMatchObject({ codigo: "ABCD-1234", latitude: -23.5505, longitude: -46.6333 });
});

test("devolução mostra cobrança e status definidos pelo servidor", async ({ page }) => {
  const reservationId = "reservation-return-1";
  const reservation = {
    id: reservationId,
    status: "EM_ANDAMENTO",
    statusPagamento: "SUCESSO",
    codigoUsadoEm: "2030-10-01T13:01:00.000Z",
    dataHoraFim: "2030-10-03T13:00:00.000Z",
    veiculo: { modeloVeiculo: { marca: "Fiat", modelo: "Argo" } },
  };
  let returnMethod;
  await seedRenterJourney(page, reservationId);
  await page.route(`**/api/reserva/${reservationId}`, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: reservation }) });
  });
  await page.route(`**/api/reserva/${reservationId}/devolucao`, async (route) => {
    returnMethod = route.request().method();
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: { ...reservation, status: "REALIZADA", devolvidoEm: "2030-10-03T15:00:00.000Z", cobrancaAtraso: 37.5 } }) });
  });

  await page.goto("/devolucao");
  await page.getByRole("button", { name: "Confirmar devolução" }).click();
  await expect(page.getByRole("status")).toContainText("Devolução confirmada pelo sistema.");
  await expect(page.getByTestId("cobranca-atraso")).toContainText("R$ 37,50");
  expect(returnMethod).toBe("POST");
});

test("avaliação só publica nota após devolução confirmada", async ({ page }) => {
  const reservationId = "reservation-rating-1";
  const reservation = {
    id: reservationId,
    status: "REALIZADA",
    statusPagamento: "SUCESSO",
    valorTotal: 549.9,
    veiculo: { modeloVeiculo: { marca: "Fiat", modelo: "Argo" } },
  };
  let ratingBody;
  await seedRenterJourney(page, reservationId);
  await page.route(`**/api/reserva/${reservationId}`, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: reservation }) });
  });
  await page.route(`**/api/avaliacao/reserva/${reservationId}`, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: null }) });
  });
  await page.route("**/api/avaliacao", async (route) => {
    ratingBody = JSON.parse(route.request().postData() || "{}");
    await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ result: { id: "rating-1", idReserva: reservationId, nota: 4, comentario: "Boa experiência" } }) });
  });

  await page.goto("/avaliacao");
  await page.getByRole("button", { name: "4 estrelas" }).click();
  await page.getByLabel("Comentário (opcional)").fill("Boa experiência");
  await page.getByRole("button", { name: "Enviar Avaliação" }).click();
  await expect(page.getByRole("status")).toContainText("Você já avaliou esta reserva com nota 4.");
  expect(ratingBody).toEqual({ idReserva: reservationId, nota: 4, comentario: "Boa experiência" });
});

test("compartilhamento público mostra DTO sanitizado sem PII ou GPS", async ({ page }) => {
  await page.route("**/api/compartilhamento/share-token", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ result: {
        veiculo: { marca: "Fiat", modelo: "Argo" },
        viagem: { status: "EM_ANDAMENTO", dataHoraInicio: "2030-10-01T13:00:00.000Z", dataHoraFim: "2030-10-03T13:00:00.000Z" },
        retirada: { nome: "Garagem Centro", endereco: "Rua A, 1" },
        devolucao: { nome: "Garagem Sul", endereco: "Rua B, 2" },
      } }),
    });
  });

  await page.goto("/viagem/compartilhada/share-token");
  await expect(page.getByRole("heading", { name: "Viagem compartilhada" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Fiat Argo" })).toBeVisible();
  await expect(page.getByText(/CPF|latitude|longitude|código de desbloqueio/i)).toHaveCount(0);
});

test("rastreamento não fabrica localização quando API não retorna posição", async ({ page }) => {
  const reservationId = "reservation-tracking-1";
  await seedRenterJourney(page, reservationId);
  await page.route(`**/api/reserva/${reservationId}/localizacao`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ result: { veiculo: { nome: "Fiat Argo", placa: "ABC-1234" }, localizacao: null } }),
    });
  });

  await page.goto(`/reserva/${reservationId}/localizacao`);
  await expect(page.getByRole("heading", { name: "Acompanhar veículo" })).toBeVisible();
  await expect(page.getByText("Localização ainda indisponível para este veículo.")).toBeVisible();
  await expect(page.getByText(/-23\.|-46\.|latitude|longitude/i)).toHaveCount(0);
});

test("Home não carrega chunks do locador", async ({ page }) => {
  const scripts = [];
  page.on("response", (response) => {
    if (response.request().resourceType() === "script") scripts.push(response.url());
  });
  await mockCatalog(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /veículos disponíveis agora/i })).toBeVisible();

  expect(scripts.some((url) => /OwnerDashboard|OwnerReservations|OwnerAppShell|CadastroDeCarros/.test(url))).toBe(false);
});

test("Home mantém reflow sem overflow nas larguras críticas", async ({ page }) => {
  await mockCatalog(page);
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /veículos disponíveis agora/i })).toBeVisible();
    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(hasHorizontalOverflow, `overflow horizontal em ${width}px`).toBe(false);
  }
});

test("Home respeita tema escuro persistido", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("mova:tema-escuro:v2", "true"));
  await mockCatalog(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /veículos disponíveis agora/i })).toBeVisible();
  await expect.poll(() => page.locator("html").getAttribute("data-theme")).toBe("dark");
});

test("RNF08: seletor de idioma troca pt-BR → en → es, ajusta html lang e persiste", async ({ page }) => {
  await mockCatalog(page);
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  await expect(page.getByRole("heading", { level: 1, name: "Veículos disponíveis agora" })).toBeVisible();

  const idioma = page.getByRole("combobox", { name: "Idioma" });
  await idioma.selectOption("en");
  await expect(page.getByRole("heading", { level: 1, name: "Vehicles available now" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByText(/R\$\s?180\.00/).first()).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Vehicles available now" })).toBeVisible();

  await page.getByRole("combobox", { name: "Language" }).selectOption("es");
  await expect(page.getByRole("heading", { level: 1, name: "Vehículos disponibles ahora" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
});

test("carrossel de categorias entra depois do terceiro veículo", async ({ page }) => {
  const vehicles = [1, 2, 3, 4].map((index) => ({ ...vehicle, id: `vehicle-public-${index}`, modelo: `Argo ${index}` }));
  await mockCatalog(page, [], vehicles);
  await page.goto("/");
  await expect(page.locator(".vehicle-card")).toHaveCount(4);
  await expect(page.locator(".public-home__grid > *").nth(3)).toHaveClass(/public-home__category-carousel/);
});

test("diálogo de exclusão prende o foco, fecha com Escape e devolve o foco", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("mova_auth_session", JSON.stringify({ token: "owner-token", user: { id: "owner-1", cargo: "LOCADOR" } }));
  });
  const ownerVehicle = {
    id: "vehicle-1", idLocador: "owner-1", placa: "ABC1D23", status: "DISPONIVEL", garagemId: "garage-1",
    garagem: { id: "garage-1", nome: "Garagem Centro", status: "ATIVA" },
    modeloVeiculo: { marca: "Fiat", modelo: "Argo", ano: 2025, cambio: "Automatico", capacidade: 5, eletrico: false, adaptado: false, categoria: "ECONOMICO", valorDiaria: 180 },
    imagens: [],
  };
  await page.route("**/api/veiculo/meus**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: [ownerVehicle], pagination: { total: 1, page: 1, limit: 100, totalPages: 1 } }) }));
  await page.route("**/api/dashboard/frota**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: { veiculos: { total: 1, disponivel: 1, reservado: 0, manutencao: 0, inativo: 0 }, alertasAtivos: 0, ultimasLocalizacoes: [] } }) }));

  await page.goto("/cadastro-carros");
  const acionador = page.getByRole("button", { name: "Excluir Fiat Argo" });
  await acionador.click();

  const dialog = page.getByRole("alertdialog", { name: "Deseja excluir esse veículo?" });
  await expect(dialog).toBeVisible();
  const cancelar = dialog.getByRole("button", { name: "Cancelar exclusão" });
  const confirmar = dialog.getByRole("button", { name: "Confirmar exclusão" });
  await expect(cancelar).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(confirmar).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(cancelar).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(confirmar).toBeFocused();
  await expect(page.locator("#root")).toHaveAttribute("inert", "");

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(acionador).toBeFocused();
  await expect(page.locator("#root")).not.toHaveAttribute("inert", "");
});
