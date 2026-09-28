import { expect, test } from "@playwright/test";
import path from "node:path";

const enabled = globalThis.process?.env?.MOVA_REAL_MEDIA_E2E === "1";
const apiBaseUrl = globalThis.process?.env?.MOVA_API_BASE_URL || "http://127.0.0.1:3000/api";
const password = "StrongPass#123";

function cnpjValido() {
  const base = String(Date.now()).slice(-8).padStart(8, "0") + "0001";
  const calcula = (valor) => {
    const pesos = valor.length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = [...valor].reduce((total, digito, index) => total + Number(digito) * pesos[index], 0);
    const resto = soma % 11;
    return resto < 2 ? "0" : String(11 - resto);
  };
  return base + calcula(base) + calcula(base + calcula(base));
}

async function criarCenario(page) {
  const sufixo = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const email = `aistor.e2e.${sufixo}@test.local`;
  const register = await page.request.post(`${apiBaseUrl}/conta/auth/register`, {
    data: {
      nome: "Locador AIStor E2E",
      email,
      senha: password,
      cep: "12345-678",
      endereco: "Rua AIStor, 100",
      cargo: "LOCADOR",
    },
  });
  expect(register.status()).toBe(201);
  const conta = (await register.json()).result.conta;

  const login = await page.request.post(`${apiBaseUrl}/conta/auth/login`, {
    data: { email, senha: password },
  });
  expect(login.ok()).toBe(true);
  const token = (await login.json()).result.token;
  const headers = { Authorization: `Bearer ${token}` };

  const locador = await page.request.post(`${apiBaseUrl}/locador`, {
    headers,
    data: { id: conta.id, empresa: `MOVA AIStor ${sufixo}`, cnpj: cnpjValido() },
  });
  expect(locador.status()).toBe(201);

  const garagem = await page.request.post(`${apiBaseUrl}/garagem`, {
    headers,
    data: {
      idLocador: conta.id,
      nome: `Garagem AIStor ${sufixo}`,
      endereco: "Avenida AIStor, 200",
      capacidade: 10,
      acessibilidade: true,
    },
  });
  expect(garagem.status()).toBe(201);
  const garagemId = (await garagem.json()).result.id;

  const vehicle = await page.request.post(`${apiBaseUrl}/veiculo`, {
    headers,
    data: {
      idLocador: conta.id,
      garagemId,
      valorDiaria: 125.25,
      placa: `AIT${String(Date.now()).slice(-4)}E`,
      marca: "MOVA",
      modelo: "AIStor",
      ano: 2022,
      cambio: "Manual",
      capacidade: 5,
      eletrico: false,
      adaptado: false,
    },
  });
  expect(vehicle.status()).toBe(201);

  return { email, token, vehicleId: (await vehicle.json()).result.id };
}

test.describe("mídia real no browser com API e MinIO AIStor", () => {
  test.skip(!enabled, "Defina MOVA_REAL_MEDIA_E2E=1 para executar contra API e AIStor locais.");

  test("locador envia imagem pelo formulário e o catálogo recebe URL real", async ({ page }) => {
    const cenario = await criarCenario(page);
    let imagemId;
    const apiResponses = [];
    page.on("response", (response) => {
      if (response.url().includes(":9000/")) apiResponses.push(response);
    });

    try {
      await page.goto("/login");
      await page.getByLabel("E-mail").fill(cenario.email);
      await page.getByLabel("Senha").fill(password);
      await page.getByRole("button", { name: "Entrar" }).click();
      await expect(page).not.toHaveURL(/\/login$/);

      await page.goto(`/cadastro-carros/${cenario.vehicleId}`);
      await expect(page.locator("#imagens-veiculo")).toBeVisible();
      await page.locator("#imagens-veiculo").setInputFiles(path.resolve("src/assets/adaptive-icon.png"));
      await expect(page.getByRole("status")).toContainText("1 imagem");
      await page.getByRole("button", { name: "Editar", exact: true }).click();
      await page.waitForURL("**/cadastro-carros");

      const cardImage = page.locator(".frota-card__image").first();
      await expect(cardImage).toHaveAttribute("src", /localhost:9000\/mova-media-public\/vehicles\//);
      expect(apiResponses.some((response) => response.status() === 200)).toBe(true);

      const list = await page.request.get(`${apiBaseUrl}/veiculo/${cenario.vehicleId}/imagens`, {
        headers: { Authorization: `Bearer ${cenario.token}` },
      });
      expect(list.status()).toBe(200);
      const imagens = (await list.json()).result;
      expect(imagens).toHaveLength(1);
      imagemId = imagens[0].id;
    } finally {
      if (imagemId) {
        await page.request.delete(`${apiBaseUrl}/veiculo/${cenario.vehicleId}/imagens/${imagemId}`, {
          headers: { Authorization: `Bearer ${cenario.token}` },
        });
      }
    }
  });
});
