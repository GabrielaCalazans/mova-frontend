import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

const enabled = globalThis.process?.env?.MOVA_REAL_API_E2E === "1";
const apiBaseUrl = globalThis.process?.env?.MOVA_API_BASE_URL || "http://localhost:3000/api";
const ownerEmail = globalThis.process?.env?.MOVA_REAL_API_OWNER_EMAIL || "";
const ownerPassword = globalThis.process?.env?.MOVA_REAL_API_OWNER_PASSWORD || "";
const secondOwnerEmail = globalThis.process?.env?.MOVA_REAL_API_SECOND_OWNER_EMAIL || "";
const secondOwnerPassword = globalThis.process?.env?.MOVA_REAL_API_SECOND_OWNER_PASSWORD || "";
const renterEmail = globalThis.process?.env?.MOVA_REAL_API_RENTER_EMAIL || "";
const renterPassword = globalThis.process?.env?.MOVA_REAL_API_RENTER_PASSWORD || "";
const secondRenterEmail = globalThis.process?.env?.MOVA_REAL_API_SECOND_RENTER_EMAIL || "";
const secondRenterPassword = globalThis.process?.env?.MOVA_REAL_API_SECOND_RENTER_PASSWORD || "";
const qrBrowserEnabled = globalThis.process?.env?.MOVA_REAL_API_QR_BROWSER_E2E === "1";
const dbOverrideEnabled = globalThis.process?.env?.MOVA_REAL_API_DB_OVERRIDE === "1";

function moveReservationWindowIntoTestPeriod(reservationId) {
  if (!dbOverrideEnabled) {
    throw new Error("MOVA_REAL_API_DB_OVERRIDE=1 é obrigatório para alterar a janela controlada do teste.");
  }
  if (!/^[0-9a-f-]{36}$/i.test(reservationId)) {
    throw new Error("ID de reserva inválido para o override controlado.");
  }

  const container = globalThis.process?.env?.MOVA_REAL_API_DB_CONTAINER || "mova-postgres";
  const database = globalThis.process?.env?.MOVA_REAL_API_DB_NAME || "mova_test";
  if (database !== "mova_test") {
    throw new Error(`Override bloqueado fora de mova_test (recebido: ${database}).`);
  }

  const sql = [
    "SELECT current_database();",
    `UPDATE "Reserva" SET "dataHoraInicio" = CURRENT_TIMESTAMP - INTERVAL '1 minute', "dataHoraFim" = CURRENT_TIMESTAMP + INTERVAL '1 hour' WHERE id = '${reservationId}';`,
  ].join(" ");
  const output = execFileSync(
    "docker",
    [
      "exec",
      container,
      "psql",
      "-U",
      "mova",
      "-d",
      database,
      "-v",
      "ON_ERROR_STOP=1",
      "-tAc",
      sql,
    ],
    { encoding: "utf8" },
  );

  if (!output.includes("mova_test") || !/UPDATE\s+1/.test(output)) {
    throw new Error(`Override controlado não confirmou mova_test/UPDATE 1: ${output.trim()}`);
  }
}

async function createRealCardTestReservation(page, email, password, options = {}) {
  const {
    ownerEmail: seedOwnerEmail = "",
    ownerPassword: seedOwnerPassword = "",
    seedLocation = false,
  } = options;
  const loginResponse = await page.request.post(`${apiBaseUrl}/conta/auth/login`, {
    data: { email, senha: password },
  });
  expect(loginResponse.ok()).toBe(true);
  const loginPayload = await loginResponse.json();
  const token = loginPayload.result?.token;
  expect(token).toBeTruthy();
  const headers = { Authorization: `Bearer ${token}` };

  const meResponse = await page.request.get(`${apiBaseUrl}/conta/auth/me`, { headers });
  expect(meResponse.ok()).toBe(true);
  const account = (await meResponse.json()).result?.conta;
  const renterId = account?.locatario?.id || account?.id;
  expect(renterId).toBeTruthy();

  let ownerHeaders = null;
  let catalogItems = [];
  if (seedOwnerEmail && seedOwnerPassword) {
    const ownerLoginResponse = await page.request.post(`${apiBaseUrl}/conta/auth/login`, {
      data: { email: seedOwnerEmail, senha: seedOwnerPassword },
    });
    expect(ownerLoginResponse.ok()).toBe(true);
    const ownerToken = (await ownerLoginResponse.json()).result?.token;
    expect(ownerToken).toBeTruthy();
    ownerHeaders = { Authorization: `Bearer ${ownerToken}` };

    const ownerFleetResponse = await page.request.get(`${apiBaseUrl}/veiculo/meus`, {
      headers: ownerHeaders,
    });
    expect(ownerFleetResponse.ok()).toBe(true);
    catalogItems = (await ownerFleetResponse.json()).result || [];
  } else {
    const catalogResponse = await page.request.get(`${apiBaseUrl}/veiculo?limit=50`);
    expect(catalogResponse.ok()).toBe(true);
    catalogItems = (await catalogResponse.json()).result || [];
  }
  const candidates = catalogItems.filter(
    (item) => item.status === "DISPONIVEL" && (item.garagem?.id || item.garagemId),
  );
  expect(candidates.length).toBeGreaterThan(0);
  let reservation = null;
  const offsetsInHours = [8, 48, 24 * 25];
  for (const offsetInHours of offsetsInHours) {
    const start = new Date(Date.now() + offsetInHours * 60 * 60 * 1000).toISOString();
    const end = new Date(Date.now() + (offsetInHours + 1) * 60 * 60 * 1000).toISOString();
    for (const vehicle of candidates) {
      const garageId = vehicle.garagem?.id || vehicle.garagemId;
      const createResponse = await page.request.post(`${apiBaseUrl}/reserva`, {
        headers,
        data: {
          idVeiculo: vehicle.id,
          idLocatario: renterId,
          idGaragemRetirada: garageId,
          idGaragemDevolucao: garageId,
          dataHoraInicio: start,
          dataHoraFim: end,
          metodoPagamento: "CARTAO_CREDITO",
          servicosIds: [],
        },
      });
      if (createResponse.status() === 201) {
        reservation = (await createResponse.json()).result;
        break;
      }
      if (createResponse.status() !== 409) {
        throw new Error(`Criação da reserva real falhou com HTTP ${createResponse.status()}.`);
      }
    }
    if (reservation) break;
  }
  if (!reservation?.id) {
    throw new Error("Nenhum veículo publicável ficou livre nas janelas futuras controladas do E2E.");
  }
  expect(reservation.statusPagamento).toBe("AGUARDANDO_PAGAMENTO");

  if (seedLocation) {
    expect(ownerHeaders).toBeTruthy();
    const locationResponse = await page.request.post(`${apiBaseUrl}/localizacao`, {
      headers: ownerHeaders,
      data: {
        idVeiculo: reservation.idVeiculo,
        latitude: -23.5505,
        longitude: -46.6333,
      },
    });
    expect(locationResponse.status()).toBe(201);
  }

  return { account, headers, reservation, renterId, token, ownerHeaders };
}

test.describe("integração browser com API local real", () => {
  test.skip(!enabled, "Defina MOVA_REAL_API_E2E=1 para executar contra a API local.");

  test("Home e detalhe consomem catálogo real sem fixture de rede", async ({ page }) => {
    const apiResponses = [];
    page.on("response", (response) => {
      if (response.url().includes("/api/veiculo")) apiResponses.push(response);
    });

    const catalogResponse = await page.request.get(`${apiBaseUrl}/veiculo?limit=1`);
    expect(catalogResponse.ok()).toBe(true);
    const catalogPayload = await catalogResponse.json();
    const firstVehicle = catalogPayload.result?.[0];
    expect(firstVehicle?.id).toBeTruthy();

    await page.goto("/");
    await expect(page.getByRole("heading", { name: /veículos disponíveis agora/i })).toBeVisible();
    await expect(page.locator(".vehicle-card").first()).toBeVisible();
    // Task 8: a contagem do catálogo fica na barra de resultado (role=status).
    await expect(page.getByRole("status").filter({ hasText: /veículos? disponíve/i })).toBeVisible();
    expect(apiResponses.some((response) => response.status() === 200)).toBe(true);

    await page.goto(`/carros/${firstVehicle.id}`);
    await expect(page.getByRole("heading", { name: "Informações essenciais" })).toBeVisible();
    await expect(page.getByRole("button", { name: /reservar este carro/i })).toBeVisible();
  });

  test("login de locador e painel consultam a API real", async ({ page }) => {
    test.skip(!ownerEmail || !ownerPassword, "Defina credenciais seed somente no ambiente do E2E real.");

    await page.goto("/login");
    await page.getByLabel("E-mail").fill(ownerEmail);
    await page.getByLabel("Senha").fill(ownerPassword);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/painel$/);
    await expect(page.getByRole("heading", { name: /painel do locador/i })).toBeVisible();
    // Task 8: métricas numa faixa única (dl); "Veículos" é o termo da métrica.
    await expect(page.getByText("Veículos", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: /alertas da frota/i })).toBeVisible();
  });

  test("locador não enxerga frota ou detalhe de outro locador", async ({ page }) => {
    test.skip(
      !ownerEmail || !ownerPassword || !secondOwnerEmail || !secondOwnerPassword,
      "Defina dois locadores seed somente no ambiente do E2E real.",
    );

    const firstLoginResponse = await page.request.post(`${apiBaseUrl}/conta/auth/login`, {
      data: { email: ownerEmail, senha: ownerPassword },
    });
    expect(firstLoginResponse.ok()).toBe(true);
    const firstToken = (await firstLoginResponse.json()).result?.token;
    expect(firstToken).toBeTruthy();
    const firstHeaders = { Authorization: `Bearer ${firstToken}` };

    const secondLoginResponse = await page.request.post(`${apiBaseUrl}/conta/auth/login`, {
      data: { email: secondOwnerEmail, senha: secondOwnerPassword },
    });
    expect(secondLoginResponse.ok()).toBe(true);
    const secondToken = (await secondLoginResponse.json()).result?.token;
    expect(secondToken).toBeTruthy();
    const secondHeaders = { Authorization: `Bearer ${secondToken}` };

    const firstMeResponse = await page.request.get(`${apiBaseUrl}/conta/auth/me`, { headers: firstHeaders });
    const secondMeResponse = await page.request.get(`${apiBaseUrl}/conta/auth/me`, { headers: secondHeaders });
    expect(firstMeResponse.ok()).toBe(true);
    expect(secondMeResponse.ok()).toBe(true);
    const firstAccount = (await firstMeResponse.json()).result?.conta;
    const secondAccount = (await secondMeResponse.json()).result?.conta;
    const secondOwnerId = secondAccount?.locador?.id || secondAccount?.id;
    expect(secondOwnerId).toBeTruthy();

    const firstFleetResponse = await page.request.get(`${apiBaseUrl}/veiculo/meus`, { headers: firstHeaders });
    const secondFleetResponse = await page.request.get(`${apiBaseUrl}/veiculo/meus`, { headers: secondHeaders });
    expect(firstFleetResponse.status()).toBe(200);
    expect(secondFleetResponse.status()).toBe(200);
    const firstFleet = (await firstFleetResponse.json()).result || [];
    const secondFleet = (await secondFleetResponse.json()).result || [];
    expect(firstFleet.length).toBeGreaterThan(0);
    expect(secondFleet.length).toBeGreaterThan(0);

    const firstIds = new Set(firstFleet.map((vehicle) => vehicle.id));
    const secondIds = new Set(secondFleet.map((vehicle) => vehicle.id));
    expect([...firstIds].filter((id) => secondIds.has(id))).toHaveLength(0);

    const crossOwnerDetail = await page.request.get(`${apiBaseUrl}/veiculo/${secondFleet[0].id}`, {
      headers: firstHeaders,
    });
    expect(crossOwnerDetail.status()).toBe(403);

    const spoofedList = await page.request.get(`${apiBaseUrl}/veiculo?idLocador=${secondOwnerId}`, {
      headers: firstHeaders,
    });
    expect(spoofedList.status()).toBe(200);
    const spoofedIds = new Set(((await spoofedList.json()).result || []).map((vehicle) => vehicle.id));
    expect([...spoofedIds].every((id) => firstIds.has(id))).toBe(true);
    expect([...spoofedIds].some((id) => secondIds.has(id))).toBe(false);
    expect(firstAccount?.locador?.id || firstAccount?.id).not.toBe(secondOwnerId);
  });

  test("B9 bloqueia transferência real enquanto a reserva fixa a garagem", async ({ page }) => {
    test.skip(
      !ownerEmail || !ownerPassword || !renterEmail || !renterPassword,
      "Defina credenciais seed de locador e locatário somente no ambiente do E2E real.",
    );

    const ownerLogin = await page.request.post(`${apiBaseUrl}/conta/auth/login`, {
      data: { email: ownerEmail, senha: ownerPassword },
    });
    expect(ownerLogin.ok()).toBe(true);
    const ownerToken = (await ownerLogin.json()).result?.token;
    expect(ownerToken).toBeTruthy();
    const ownerHeaders = { Authorization: `Bearer ${ownerToken}` };

    const ownerMeResponse = await page.request.get(`${apiBaseUrl}/conta/auth/me`, { headers: ownerHeaders });
    expect(ownerMeResponse.ok()).toBe(true);
    const ownerAccount = (await ownerMeResponse.json()).result?.conta;
    const ownerId = ownerAccount?.locador?.id || ownerAccount?.id;
    expect(ownerId).toBeTruthy();

    const renterLogin = await page.request.post(`${apiBaseUrl}/conta/auth/login`, {
      data: { email: renterEmail, senha: renterPassword },
    });
    expect(renterLogin.ok()).toBe(true);
    const renterPayload = await renterLogin.json();
    const renterToken = renterPayload.result?.token;
    expect(renterToken).toBeTruthy();
    const renterHeaders = { Authorization: `Bearer ${renterToken}` };
    const renterMeResponse = await page.request.get(`${apiBaseUrl}/conta/auth/me`, { headers: renterHeaders });
    expect(renterMeResponse.ok()).toBe(true);
    const renterAccount = (await renterMeResponse.json()).result?.conta;
    const renterId = renterAccount?.locatario?.id || renterAccount?.id;
    expect(renterId).toBeTruthy();

    let originalGarage = null;
    let destination = null;
    let vehicle = null;
    let reservationId = "";
    try {
      const originalGarageResponse = await page.request.post(`${apiBaseUrl}/garagem`, {
        headers: ownerHeaders,
        data: {
          idLocador: ownerId,
          nome: `E2E B9 origem ${Date.now()}`,
          endereco: "Rua de teste, 6",
          capacidade: 10,
          acessibilidade: true,
        },
      });
      expect(originalGarageResponse.status()).toBe(201);
      originalGarage = (await originalGarageResponse.json()).result;
      expect(originalGarage?.id).toBeTruthy();

      const vehicleResponse = await page.request.post(`${apiBaseUrl}/veiculo`, {
        headers: ownerHeaders,
        data: {
          idLocador: ownerId,
          garagemId: originalGarage.id,
          placa: `B9${String(Date.now()).slice(-5)}`,
          marca: "MOVA",
          modelo: "B9 E2E",
          ano: 2025,
          cambio: "Manual",
          capacidade: 5,
          valorDiaria: 150,
          eletrico: false,
          adaptado: false,
          status: "DISPONIVEL",
        },
      });
      expect(vehicleResponse.status()).toBe(201);
      vehicle = (await vehicleResponse.json()).result;
      expect(vehicle?.id).toBeTruthy();

      const destinationResponse = await page.request.post(`${apiBaseUrl}/garagem`, {
        headers: ownerHeaders,
        data: {
          idLocador: ownerId,
          nome: `E2E B9 destino ${Date.now()}`,
          endereco: "Rua de teste, 7",
          capacidade: 10,
          acessibilidade: true,
        },
      });
      expect(destinationResponse.status()).toBe(201);
      destination = (await destinationResponse.json()).result;
      expect(destination?.id).toBeTruthy();

      const originalGarageId = originalGarage.id;
      const start = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
      const end = new Date(Date.now() + 13 * 60 * 60 * 1000).toISOString();
      const reservationResponse = await page.request.post(`${apiBaseUrl}/reserva`, {
        headers: renterHeaders,
        data: {
          idVeiculo: vehicle.id,
          idLocatario: renterId,
          idGaragemRetirada: originalGarageId,
          idGaragemDevolucao: originalGarageId,
          dataHoraInicio: start,
          dataHoraFim: end,
          metodoPagamento: "PIX",
          servicosIds: [],
        },
      });
      expect(reservationResponse.status()).toBe(201);
      reservationId = (await reservationResponse.json()).result?.id;
      expect(reservationId).toBeTruthy();

      const transferResponse = await page.request.put(`${apiBaseUrl}/veiculo/${vehicle.id}`, {
        headers: ownerHeaders,
        data: { garagemId: destination.id },
      });
      expect(transferResponse.status()).toBe(409);
      const transferError = await transferResponse.json();
      expect(transferError.code).toBe("VEHICLE_HAS_ACTIVE_RESERVATION");
      expect(transferResponse.headers()["x-request-id"]).toBeTruthy();

      const unchangedResponse = await page.request.get(`${apiBaseUrl}/veiculo/${vehicle.id}`, { headers: ownerHeaders });
      expect(unchangedResponse.status()).toBe(200);
      expect((await unchangedResponse.json()).result?.garagemId).toBe(originalGarageId);
    } finally {
      if (reservationId) {
        const cancelResponse = await page.request.post(`${apiBaseUrl}/reserva/${reservationId}/cancelar`, {
          headers: renterHeaders,
        });
        expect([200, 409]).toContain(cancelResponse.status());
      }
      if (vehicle?.id && originalGarage?.id) {
        const detachResponse = await page.request.put(`${apiBaseUrl}/veiculo/${vehicle.id}`, {
          headers: ownerHeaders,
          data: { garagemId: null, status: "INATIVO" },
        });
        expect([200, 404]).toContain(detachResponse.status());
        const deleteVehicleResponse = await page.request.delete(`${apiBaseUrl}/veiculo/${vehicle.id}`, {
          headers: ownerHeaders,
        });
        expect([204, 404]).toContain(deleteVehicleResponse.status());
      }
      for (const garagem of [destination, originalGarage]) {
        if (!garagem?.id) continue;
        const deleteGarageResponse = await page.request.delete(`${apiBaseUrl}/garagem/${garagem.id}`, {
          headers: ownerHeaders,
        });
        expect([204, 409]).toContain(deleteGarageResponse.status());
      }
    }
  });

  test("locatário cria reserva, paga no sandbox e não vaza reserva para outra conta", async ({ page }) => {
    test.skip(
      !renterEmail || !renterPassword || !secondRenterEmail || !secondRenterPassword,
      "Defina duas credenciais seed somente no ambiente do E2E real.",
    );

    const loginResponse = await page.request.post(`${apiBaseUrl}/conta/auth/login`, {
      data: { email: renterEmail, senha: renterPassword },
    });
    expect(loginResponse.ok()).toBe(true);
    const loginPayload = await loginResponse.json();
    const renterToken = loginPayload.result?.token;
    expect(renterToken).toBeTruthy();
    const renterHeaders = { Authorization: `Bearer ${renterToken}` };

    const meResponse = await page.request.get(`${apiBaseUrl}/conta/auth/me`, { headers: renterHeaders });
    expect(meResponse.ok()).toBe(true);
    const mePayload = await meResponse.json();
    const renterAccount = mePayload.result?.conta;
    const renterId = renterAccount?.locatario?.id || renterAccount?.id;
    expect(renterId).toBeTruthy();

    const catalogResponse = await page.request.get(`${apiBaseUrl}/veiculo?limit=50`);
    expect(catalogResponse.ok()).toBe(true);
    const catalogPayload = await catalogResponse.json();
    const vehicle = catalogPayload.result?.find(
      (item) => item.status === "DISPONIVEL" && (item.garagem?.id || item.garagemId),
    );
    expect(vehicle?.id).toBeTruthy();
    const garageId = vehicle.garagem?.id || vehicle.garagemId;
    const servicesResponse = await page.request.get(`${apiBaseUrl}/servico`);
    expect(servicesResponse.ok()).toBe(true);
    const servicesPayload = await servicesResponse.json();
    const optionalServiceId = servicesPayload.result?.[0]?.id;
    expect(optionalServiceId).toBeTruthy();
    const selectedServiceIds = [optionalServiceId];

    const start = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
    const end = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString();
    const reservationPayload = {
      idVeiculo: vehicle.id,
      idLocatario: renterId,
      idGaragemRetirada: garageId,
      idGaragemDevolucao: garageId,
      dataHoraInicio: start,
      dataHoraFim: end,
      metodoPagamento: "PIX",
      servicosIds: selectedServiceIds,
    };

    const quoteResponse = await page.request.post(`${apiBaseUrl}/reserva/precificacao`, {
      headers: renterHeaders,
      data: {
        idVeiculo: vehicle.id,
        idGaragemRetirada: garageId,
        idGaragemDevolucao: garageId,
        dataHoraInicio: start,
        dataHoraFim: end,
        servicosIds: selectedServiceIds,
      },
    });
      expect(quoteResponse.status()).toBe(200);
      const quotePayload = await quoteResponse.json();
      expect(quotePayload.result?.valorTotal).toBeGreaterThan(0);
      expect(quotePayload.result?.valorServicos).toBeGreaterThan(0);

    let reservationId = "";
    try {
      const createResponse = await page.request.post(`${apiBaseUrl}/reserva`, {
        headers: renterHeaders,
        data: reservationPayload,
      });
      expect(createResponse.status()).toBe(201);
      const createPayload = await createResponse.json();
      const reservation = createPayload.result;
      reservationId = reservation.id;
      expect(reservation.status).toBe("AGUARDANDO_PAGAMENTO");
      expect(reservation.statusPagamento).toBe("AGUARDANDO_PAGAMENTO");
      expect(reservation.valorTotal).toBe(quotePayload.result.valorTotal);
      expect(reservation.servicos?.some((item) => item.idServico === optionalServiceId || item.servicoOpcional?.id === optionalServiceId)).toBe(true);

      await page.addInitScript(({ token, user, id }) => {
        window.localStorage.setItem("mova_auth_session", JSON.stringify({ token, user }));
        window.sessionStorage.setItem("mova_journey_flow", JSON.stringify({
          reserva: { id },
          servicos: { ids: [] },
        }));
      }, {
        token: renterToken,
        user: {
          id: renterId,
          accountId: renterId,
          profileId: renterId,
          email: renterAccount.email,
          name: renterAccount.nome,
          cargo: "LOCATARIO",
          profileType: "locatario",
        },
        id: reservationId,
      });

      await page.goto("/pagamento");
      await expect(page.getByRole("heading", { name: "Pagamento" })).toBeVisible();
      const formattedTotal = Number(quotePayload.result.valorTotal).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
      });
      await expect(page.locator('[data-testid="valor-reserva"]')).toContainText(formattedTotal);
      await page.getByLabel(/m[eé]todo de pagamento/i).selectOption("PIX");
      await page.getByRole("button", { name: "Pagar" }).click();
      await expect(page.getByText("Pagamento aprovado")).toBeVisible({ timeout: 10000 });

      const confirmedResponse = await page.request.get(`${apiBaseUrl}/reserva/${reservationId}`, { headers: renterHeaders });
      expect(confirmedResponse.status()).toBe(200);
      const confirmedPayload = await confirmedResponse.json();
      expect(confirmedPayload.result.status).toBe("CONFIRMADA");
      expect(confirmedPayload.result.statusPagamento).toBe("SUCESSO");

      const replayResponse = await page.request.post(`${apiBaseUrl}/reserva/${reservationId}/pagamento`, {
        headers: renterHeaders,
        data: { metodoPagamento: "PIX" },
      });
      expect(replayResponse.status()).toBe(409);

      const secondLoginResponse = await page.request.post(`${apiBaseUrl}/conta/auth/login`, {
        data: { email: secondRenterEmail, senha: secondRenterPassword },
      });
      expect(secondLoginResponse.ok()).toBe(true);
      const secondLoginPayload = await secondLoginResponse.json();
      const secondToken = secondLoginPayload.result?.token;
      expect(secondToken).toBeTruthy();
      const secondReadResponse = await page.request.get(`${apiBaseUrl}/reserva/${reservationId}`, {
        headers: { Authorization: `Bearer ${secondToken}` },
      });
      expect(secondReadResponse.status()).toBe(403);
    } finally {
      if (reservationId) {
        const cancelResponse = await page.request.post(`${apiBaseUrl}/reserva/${reservationId}/cancelar`, {
          headers: renterHeaders,
        });
        expect([200, 409]).toContain(cancelResponse.status());
      }
    }
  });

  test("checkout real calcula cotação e cria reserva pelo fluxo visual", async ({ page }) => {
    test.skip(!renterEmail || !renterPassword, "Defina credenciais seed somente no ambiente do E2E real.");

    const loginResponse = await page.request.post(`${apiBaseUrl}/conta/auth/login`, {
      data: { email: renterEmail, senha: renterPassword },
    });
    expect(loginResponse.ok()).toBe(true);
    const loginPayload = await loginResponse.json();
    const renterToken = loginPayload.result?.token;
    expect(renterToken).toBeTruthy();
    const renterHeaders = { Authorization: `Bearer ${renterToken}` };
    const meResponse = await page.request.get(`${apiBaseUrl}/conta/auth/me`, { headers: renterHeaders });
    expect(meResponse.ok()).toBe(true);
    const renterAccount = (await meResponse.json()).result?.conta;
    const renterId = renterAccount?.locatario?.id || renterAccount?.id;
    expect(renterId).toBeTruthy();

    const catalogResponse = await page.request.get(`${apiBaseUrl}/veiculo?limit=50`);
    expect(catalogResponse.ok()).toBe(true);
    const catalogPayload = await catalogResponse.json();
    const vehicle = catalogPayload.result?.find(
      (item) => item.status === "DISPONIVEL" && (item.garagem?.id || item.garagemId),
    );
    expect(vehicle?.id).toBeTruthy();
    const garageId = vehicle.garagem?.id || vehicle.garagemId;
    const servicesResponse = await page.request.get(`${apiBaseUrl}/servico`);
    expect(servicesResponse.ok()).toBe(true);
    const optionalServiceId = (await servicesResponse.json()).result?.[0]?.id;
    expect(optionalServiceId).toBeTruthy();

    const browserTimes = await page.evaluate(() => {
      const base = Date.now();
      const start = new Date(base + 6 * 60 * 60 * 1000);
      const end = new Date(base + 7 * 60 * 60 * 1000);
      const journeyDateTime = (value) => ({
        date: [value.getDate(), value.getMonth() + 1, value.getFullYear()]
          .map((part, index) => (index < 2 ? String(part).padStart(2, "0") : String(part)))
          .join("/"),
        time: [value.getHours(), value.getMinutes()]
          .map((part) => String(part).padStart(2, "0"))
          .join(":"),
      });
      return { pickup: journeyDateTime(start), dropoff: journeyDateTime(end) };
    });
    const apiResponses = [];
    page.on("response", (response) => {
      if (response.url().includes("/api/reserva")) {
        apiResponses.push({ method: response.request().method(), url: response.url(), status: response.status() });
      }
    });

    let reservationId = "";
    try {
      await page.addInitScript(({ token, user, journey }) => {
        window.localStorage.setItem("mova_auth_session", JSON.stringify({ token, user }));
        window.sessionStorage.setItem("mova_journey_flow", JSON.stringify(journey));
      }, {
        token: renterToken,
        user: {
          id: renterId,
          accountId: renterId,
          profileId: renterId,
          email: renterAccount.email,
          name: renterAccount.nome,
          cargo: "LOCATARIO",
          profileType: "locatario",
        },
        journey: {
          veiculo: {
            id: vehicle.id,
            marca: vehicle.modeloVeiculo?.marca || vehicle.marca,
            modelo: vehicle.modeloVeiculo?.modelo || vehicle.modelo,
            garagemId: garageId,
          },
          retirada: { garageId, garageName: vehicle.garagem?.nome || "Garagem seed", ...browserTimes.pickup },
          devolucao: { garageId, garageName: vehicle.garagem?.nome || "Garagem seed", ...browserTimes.dropoff },
          pagamento: { metodoPagamento: "PIX" },
          reserva: { id: "", codigoDesbloqueio: "" },
          servicos: { ids: [optionalServiceId] },
        },
      });

      await page.goto("/checkout-reserva");
      await expect(page.getByRole("heading", { name: "Checkout da Reserva" })).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole("button", { name: "Confirmar e seguir para pagamento" })).toBeVisible();
      expect(apiResponses.some((item) => item.url.includes("/precificacao") && item.method === "POST" && item.status === 200)).toBe(true);
      await page.getByRole("button", { name: "Confirmar e seguir para pagamento" }).click();
      await expect(page).toHaveURL(/\/condutores-adicionais$/);
      expect(apiResponses.some((item) => item.url.endsWith("/api/reserva") && item.method === "POST" && item.status === 201)).toBe(true);
      reservationId = (await page.evaluate(() => JSON.parse(window.sessionStorage.getItem("mova_journey_flow") || "{}").reserva?.id)) || "";
      expect(reservationId).toMatch(/^[0-9a-f-]{36}$/i);
      await expect(page.getByRole("heading", { name: "Condutores adicionais" })).toBeVisible();
    } finally {
      if (reservationId) {
        const cancelResponse = await page.request.post(`${apiBaseUrl}/reserva/${reservationId}/cancelar`, {
          headers: renterHeaders,
        });
        expect(cancelResponse.status()).toBe(200);
      }
    }
  });

  test("sandbox real exibe recusa sem confirmar a reserva", async ({ page }) => {
    test.skip(!renterEmail || !renterPassword, "Defina credenciais seed somente no ambiente do E2E real.");

    const { account, headers, reservation, renterId, token } = await createRealCardTestReservation(
      page,
      renterEmail,
      renterPassword,
    );
    const reservationId = reservation.id;

    try {
      await page.addInitScript(({ sessionToken, user, id }) => {
        window.localStorage.setItem("mova_auth_session", JSON.stringify({ token: sessionToken, user }));
        window.sessionStorage.setItem("mova_journey_flow", JSON.stringify({
          reserva: { id },
          servicos: { ids: [] },
        }));
      }, {
        sessionToken: token,
        user: {
          id: renterId,
          accountId: renterId,
          profileId: renterId,
          email: account.email,
          name: account.nome,
          cargo: "LOCATARIO",
          profileType: "locatario",
        },
        id: reservationId,
      });

      await page.goto("/pagamento");
      await expect(page.getByRole("heading", { name: "Pagamento" })).toBeVisible();
      await page.getByLabel(/número do cartão/i).fill("4111111111110000");
      await page.getByLabel(/nome do titular/i).fill("TESTE SANDBOX");
      await page.getByLabel("Validade (MM/AA)").fill("12/30");
      await page.getByLabel("CVV").fill("123");

      const paymentResponsePromise = page.waitForResponse(
        (response) =>
          response.url().endsWith(`/api/reserva/${reservationId}/pagamento`) &&
          response.request().method() === "POST",
      );
      await page.getByRole("button", { name: "Pagar" }).click();
      const paymentResponse = await paymentResponsePromise;
      expect(paymentResponse.status()).toBe(202);
      await expect(page.getByText("Pagamento não aprovado.", { exact: false })).toBeVisible();

      const persistedResponse = await page.request.get(`${apiBaseUrl}/reserva/${reservationId}`, { headers });
      expect(persistedResponse.status()).toBe(200);
      const persisted = (await persistedResponse.json()).result;
      expect(persisted.statusPagamento).toBe("FALHA");
      expect(persisted.codigoDesbloqueio).toBeFalsy();
      expect(persisted.status).toBe("AGUARDANDO_PAGAMENTO");
    } finally {
      const cancelResponse = await page.request.post(`${apiBaseUrl}/reserva/${reservationId}/cancelar`, {
        headers,
      });
      expect([200, 409]).toContain(cancelResponse.status());
    }
  });

  test("sandbox real mantém pagamento pendente sem gerar código", async ({ page }) => {
    test.skip(!renterEmail || !renterPassword, "Defina credenciais seed somente no ambiente do E2E real.");

    const { headers, reservation } = await createRealCardTestReservation(page, renterEmail, renterPassword);
    const reservationId = reservation.id;

    try {
      const paymentResponse = await page.request.post(`${apiBaseUrl}/reserva/${reservationId}/pagamento`, {
        headers,
        data: {
          metodoPagamento: "CARTAO_CREDITO",
          cartao: {
            numero: "4111111111110001",
            nome: "TESTE SANDBOX",
            validade: "12/30",
            cvv: "123",
          },
        },
      });
      expect(paymentResponse.status()).toBe(202);
      const paymentPayload = await paymentResponse.json();
      expect(paymentPayload.result?.reserva?.statusPagamento).toBe("PROCESSANDO");

      const persistedResponse = await page.request.get(`${apiBaseUrl}/reserva/${reservationId}`, { headers });
      expect(persistedResponse.status()).toBe(200);
      const persisted = (await persistedResponse.json()).result;
      expect(persisted.statusPagamento).toBe("PROCESSANDO");
      expect(persisted.codigoDesbloqueio).toBeFalsy();
      expect(persisted.status).toBe("AGUARDANDO_PAGAMENTO");
    } finally {
      const cancelResponse = await page.request.post(`${apiBaseUrl}/reserva/${reservationId}/cancelar`, {
        headers,
      });
      expect([200, 409]).toContain(cancelResponse.status());
    }
  });

  test("QR real só é emitido após pagamento e token adulterado não desbloqueia", async ({ page }) => {
    test.skip(!renterEmail || !renterPassword, "Defina credenciais seed somente no ambiente do E2E real.");

    const { headers, reservation } = await createRealCardTestReservation(page, renterEmail, renterPassword);
    const reservationId = reservation.id;

    try {
      const paymentResponse = await page.request.post(`${apiBaseUrl}/reserva/${reservationId}/pagamento`, {
        headers,
        data: { metodoPagamento: "PIX" },
      });
      expect(paymentResponse.status()).toBe(202);
      const paymentPayload = await paymentResponse.json();
      expect(paymentPayload.result?.reserva?.statusPagamento).toBe("SUCESSO");

      const qrResponse = await page.request.get(`${apiBaseUrl}/reserva/${reservationId}/desbloqueio/qr`, {
        headers,
      });
      expect(qrResponse.status()).toBe(200);
      const qrToken = (await qrResponse.json()).result?.qr;
      expect(typeof qrToken).toBe("string");
      expect(qrToken.length).toBeGreaterThan(20);

      const tamperedQrResponse = await page.request.post(
        `${apiBaseUrl}/reserva/${reservationId}/desbloqueio/qr`,
        { headers, data: { qr: `${qrToken}tampered` } },
      );
      expect(tamperedQrResponse.status()).toBe(400);

      const persistedResponse = await page.request.get(`${apiBaseUrl}/reserva/${reservationId}`, { headers });
      expect(persistedResponse.status()).toBe(200);
      const persisted = (await persistedResponse.json()).result;
      expect(persisted.status).toBe("CONFIRMADA");
      expect(persisted.statusPagamento).toBe("SUCESSO");
      expect(persisted.codigoUsadoEm).toBeFalsy();
    } finally {
      const cancelResponse = await page.request.post(`${apiBaseUrl}/reserva/${reservationId}/cancelar`, {
        headers,
      });
      expect([200, 409]).toContain(cancelResponse.status());
    }
  });

  test("QR real desbloqueia no navegador dentro da janela e confirma EM_ANDAMENTO", async ({ page }) => {
    test.skip(
      !qrBrowserEnabled || !dbOverrideEnabled || !renterEmail || !renterPassword,
      "Defina MOVA_REAL_API_QR_BROWSER_E2E=1, MOVA_REAL_API_DB_OVERRIDE=1 e credenciais de locatário.",
    );

    const { account, headers, reservation, renterId, token } = await createRealCardTestReservation(
      page,
      renterEmail,
      renterPassword,
      {
        ownerEmail,
        ownerPassword,
        seedLocation: true,
      },
    );
    const reservationId = reservation.id;
    try {
      // A API de produção exige início futuro na criação e não permite editar
      // uma reserva paga. O override abaixo é exclusivamente de teste e aborta
      // fora do banco mova_test; o desbloqueio continua passando pelo HTTP real.
      moveReservationWindowIntoTestPeriod(reservationId);

      const paymentResponse = await page.request.post(`${apiBaseUrl}/reserva/${reservationId}/pagamento`, {
        headers,
        data: { metodoPagamento: "PIX" },
      });
      expect(paymentResponse.status()).toBe(202);
      expect((await paymentResponse.json()).result?.reserva?.statusPagamento).toBe("SUCESSO");

      const qrResponse = await page.request.get(`${apiBaseUrl}/reserva/${reservationId}/desbloqueio/qr`, {
        headers,
      });
      expect(qrResponse.status()).toBe(200);
      const qrToken = (await qrResponse.json()).result?.qr;
      expect(typeof qrToken).toBe("string");

      const locationResponse = await page.request.get(`${apiBaseUrl}/reserva/${reservationId}/localizacao`, {
        headers,
      });
      expect(locationResponse.status()).toBe(200);
      const knownLocation = (await locationResponse.json()).result?.localizacao;
      const geolocation = knownLocation
        ? { latitude: knownLocation.latitude, longitude: knownLocation.longitude }
        : { latitude: 0, longitude: 0 };

      await page.context().grantPermissions(["geolocation"]);
      await page.context().setGeolocation(geolocation);
      await page.addInitScript(({ sessionToken, user, id }) => {
        window.localStorage.setItem("mova_auth_session", JSON.stringify({ token: sessionToken, user }));
        window.sessionStorage.setItem("mova_journey_flow", JSON.stringify({
          reserva: { id, codigoDesbloqueio: "" },
        }));
      }, {
        sessionToken: token,
        user: {
          id: renterId,
          accountId: renterId,
          profileId: renterId,
          email: account.email,
          name: account.nome,
          cargo: "LOCATARIO",
          profileType: "locatario",
        },
        id: reservationId,
      });

      await page.goto(`/desbloqueio?qr=${encodeURIComponent(qrToken)}`);
      await expect(page.getByRole("button", { name: "Desbloquear pelo QR Code" })).toBeVisible();
      const unlockResponsePromise = page.waitForResponse(
        (response) =>
          response.url().endsWith(`/api/reserva/${reservationId}/desbloqueio/qr`) &&
          response.request().method() === "POST",
      );
      await page.getByRole("button", { name: "Desbloquear pelo QR Code" }).click();
      const unlockResponse = await unlockResponsePromise;
      expect(unlockResponse.status()).toBe(200);
      await expect(page.getByTestId("titulo-desbloqueado")).toBeVisible();
      await expect(page.getByTestId("status-reserva")).toHaveText(/Em andamento/);
    } finally {
      const currentResponse = await page.request.get(`${apiBaseUrl}/reserva/${reservationId}`, { headers });
      if (currentResponse.ok()) {
        const current = (await currentResponse.json()).result;
        if (current.status === "EM_ANDAMENTO") {
          const devolucaoResponse = await page.request.post(`${apiBaseUrl}/reserva/${reservationId}/devolucao`, {
            headers,
          });
          expect(devolucaoResponse.status()).toBe(200);
        } else if (["AGUARDANDO_PAGAMENTO", "CONFIRMADA"].includes(current.status)) {
          const cancelResponse = await page.request.post(`${apiBaseUrl}/reserva/${reservationId}/cancelar`, {
            headers,
          });
          expect([200, 409]).toContain(cancelResponse.status());
        }
      }
    }
  });
});
