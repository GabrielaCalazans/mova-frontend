import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";

const enabled = globalThis.process?.env?.MOVA_HAPPY_PATH_E2E === "1";
const appUrl = globalThis.process?.env?.MOVA_HAPPY_PATH_URL || "http://localhost:5173";
const apiBaseUrl = globalThis.process?.env?.MOVA_API_BASE_URL || "http://localhost:3000/api";
const email = globalThis.process?.env?.MOVA_HAPPY_PATH_EMAIL || "ana.demo@mova.local";
const senha = globalThis.process?.env?.MOVA_DEMO_PASSWORD || "Mova@123";
const shotsDir = globalThis.process?.env?.MOVA_HAPPY_PATH_SHOTS || "test-results/happy-path";

test.use({ baseURL: appUrl, viewport: { width: 1280, height: 900 } });

const dataBR = (d) => [d.getDate(), d.getMonth() + 1, d.getFullYear()].map((p, i) => (i < 2 ? String(p).padStart(2, "0") : p)).join("/");

test.describe("happy path oficial do locatário (ambiente local de demonstração)", () => {
  test.skip(!enabled, "Defina MOVA_HAPPY_PATH_E2E=1 com o ambiente local de demonstração no ar.");
  test.setTimeout(120_000);

  test("Home → catálogo → detalhe → login → reserva → pagamento → QR → desbloqueio → em andamento", async ({ page, context }) => {
    mkdirSync(shotsDir, { recursive: true });
    let passo = 0;
    const captura = async (nome) => {
      passo += 1;
      await page.screenshot({ path: `${shotsDir}/${String(passo).padStart(2, "0")}-${nome}.png`, fullPage: true });
    };

    // Datas futuras que variam a cada execução, para não colidir com reservas anteriores.
    const deslocamento = 7 + (Math.floor(Date.now() / 60_000) % 120);
    const inicio = new Date(Date.now() + deslocamento * 24 * 60 * 60 * 1000);
    const fim = new Date(inicio.getTime() + 2 * 24 * 60 * 60 * 1000);

    // 1. Home pública
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Veículos disponíveis agora" })).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: "veículos disponíveis" })).toBeVisible();
    await captura("home");

    // 2. Catálogo filtrado: Adaptados PCD
    await page.getByRole("button", { name: "Adaptados PCD" }).click();
    await expect(page.getByRole("button", { name: "Adaptados PCD" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("link", { name: /Ver detalhes de Hyundai HB20/ })).toBeVisible();
    await captura("catalogo-pcd");

    // 3. Detalhe do veículo adaptado
    await page.getByRole("link", { name: /Ver detalhes de Hyundai HB20/ }).click();
    await expect(page.getByRole("heading", { level: 1, name: /Hyundai HB20/ })).toBeVisible();
    await expect(page.getByText("Veículo adaptado para PCD")).toBeVisible();
    await captura("detalhe-veiculo");

    // 4. Reservar como visitante → login contextual → volta para a jornada
    await page.getByRole("button", { name: "Reservar este carro" }).first().click();
    await expect(page).toHaveURL(/\/login/);
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha", { exact: true }).fill(senha);
    await captura("login");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).not.toHaveURL(/\/login/);
    if (!/escolha-garagem-retirada/.test(page.url())) {
      // Sem retorno automático para a ação: reabre o detalhe e reserva já autenticado.
      await page.goto("/");
      await page.getByRole("button", { name: "Adaptados PCD" }).click();
      await page.getByRole("link", { name: /Ver detalhes de Hyundai HB20/ }).click();
      await page.getByRole("button", { name: "Reservar este carro" }).first().click();
    }

    // 5. Período e retirada
    await expect(page.getByRole("heading", { name: "Escolha a Garagem para Retirada" })).toBeVisible();
    await page.getByLabel("Data da retirada").fill(dataBR(inicio));
    await page.getByLabel("Horário da retirada").fill("10:00");
    await captura("retirada");
    await page.getByRole("button", { name: "Ir para devolução" }).click();

    // 6. Devolução em outra garagem do mesmo locador
    await expect(page.getByRole("heading", { name: "Escolha a Garagem para Devolução" })).toBeVisible();
    await page.getByRole("button", { name: /Garagem Batel/ }).click();
    await page.getByLabel("Data da devolução").fill(dataBR(fim));
    await page.getByLabel("Horário da devolução").fill("10:00");
    await captura("devolucao");
    await page.getByRole("button", { name: "Escolher serviços" }).click();

    // 7. Serviços opcionais (seguro com cobertura)
    await expect(page.getByRole("heading", { name: "Serviços adicionais" })).toBeVisible();
    await page.getByRole("checkbox", { name: /Seguro adicional/ }).check();
    await captura("servicos");
    await page.getByRole("button", { name: "Continuar para checkout" }).click();

    // 8. Resumo (valor calculado pelo servidor)
    await expect(page.getByRole("heading", { name: "Checkout da Reserva" })).toBeVisible();
    await expect(page.getByText("Valor calculado pelo servidor para este período.")).toBeVisible();
    await captura("resumo");
    await page.getByRole("button", { name: "Confirmar e seguir para pagamento" }).click();

    // 9. Condutor adicional (opcional, até 3)
    await expect(page.getByRole("heading", { name: "Condutores adicionais" })).toBeVisible();
    await page.getByLabel("Nome").fill("Paulo Lima");
    await page.getByLabel("CNH").fill("98765432109");
    await page.getByRole("button", { name: "Adicionar condutor" }).click();
    await expect(page.getByText("Paulo Lima")).toBeVisible();
    await captura("condutor");
    await page.getByRole("button", { name: "Continuar para pagamento" }).click();

    // 10. Pagamento sandbox: recusa e depois aprovação
    await expect(page.getByText("Ambiente de teste: nenhum valor é cobrado de verdade.")).toBeVisible();
    await page.getByLabel("Número do cartão").fill("4111111111110000");
    await page.getByLabel("Nome do titular").fill("Ana Ribeiro");
    await page.getByLabel("Validade (MM/AA)").fill("12/30");
    await page.getByLabel("CVV").fill("123");
    await page.getByRole("button", { name: "Pagar" }).click();
    await expect(page.getByText("Pagamento não aprovado. Confira os dados e tente novamente.")).toBeVisible();
    await captura("pagamento-recusado");
    await page.getByLabel("Número do cartão").fill("4111111111111234");
    await page.getByRole("button", { name: "Pagar" }).click();
    await expect(page.getByText("Pagamento aprovado")).toBeVisible({ timeout: 20_000 });
    await captura("reserva-confirmada");

    const login = await page.request.post(`${apiBaseUrl}/conta/auth/login`, { data: { email, senha } });
    const token = (await login.json()).result?.token;
    const headers = { Authorization: `Bearer ${token}` };
    const reservas = (await (await page.request.get(`${apiBaseUrl}/reserva?limit=50`, { headers })).json()).result ?? [];
    const aberta = reservas.find((r) => r.status === "CONFIRMADA" && new Date(r.dataHoraInicio) <= new Date());
    expect(aberta, "reserva semeada com janela aberta (rode o seed de demonstração)").toBeTruthy();
    const posicao = (await (await page.request.get(`${apiBaseUrl}/reserva/${aberta.id}/localizacao`, { headers })).json()).result?.localizacao;
    expect(posicao).toBeTruthy();
    await context.grantPermissions(["geolocation"], { origin: appUrl });
    await context.setGeolocation({ latitude: Number(posicao.latitude), longitude: Number(posicao.longitude) });

    await page.goto(`/reservas/${aberta.id}`);
    await page.getByRole("button", { name: "Mostrar QR de desbloqueio" }).click();
    await expect(page.getByRole("img", { name: "QR de desbloqueio desta reserva" })).toBeVisible();
    await captura("qr-desbloqueio");

    await page.getByRole("link", { name: "Usar este QR neste dispositivo" }).click();
    await expect(page.getByRole("button", { name: "Desbloquear pelo QR Code" })).toBeVisible();
    await captura("desbloqueio");
    await page.getByRole("button", { name: "Desbloquear pelo QR Code" }).click();
    await expect(page.getByTestId("titulo-desbloqueado")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("status-reserva")).toHaveText(/Em andamento/);
    await captura("em-andamento");

    // 12. Acompanhamento da reserva em andamento
    await page.goto(`/reservas/${aberta.id}`);
    await expect(page.getByText("Em andamento").first()).toBeVisible();
    await captura("reserva-em-andamento");
  });
});
