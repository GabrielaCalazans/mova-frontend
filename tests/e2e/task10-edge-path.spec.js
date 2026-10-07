import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

const env = globalThis.process?.env ?? {};
const enabled = env.MOVA_REAL_API_E2E === "1" && env.MOVA_REAL_API_DB_OVERRIDE === "1";
const apiBaseUrl = env.MOVA_API_BASE_URL || "http://localhost:3000/api";
const ownerEmail = env.MOVA_REAL_API_OWNER_EMAIL || "";
const ownerPassword = env.MOVA_REAL_API_OWNER_PASSWORD || "";
const renterEmail = env.MOVA_REAL_API_RENTER_EMAIL || "";
const renterPassword = env.MOVA_REAL_API_RENTER_PASSWORD || "";

// Executa SQL só se a conexão efetiva for mova_test.
function sqlMovaTest(sql) {
  const container = env.MOVA_REAL_API_DB_CONTAINER || "mova-postgres";
  const output = execFileSync(
    "docker",
    ["exec", container, "psql", "-U", "mova", "-d", "mova_test", "-v", "ON_ERROR_STOP=1", "-tAc", `SELECT current_database(); ${sql}`],
    { encoding: "utf8" },
  );
  if (!output.startsWith("mova_test")) throw new Error(`SQL bloqueado fora de mova_test: ${output.trim()}`);
  return output;
}

const uuid = (id) => {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("UUID inválido no override");
  return id;
};

let seq = Date.now() % 1_000_000;
const pad = (n, size) => String(n).padStart(size, "0");
function cpfComDv(base9) {
  const dv = (base, peso) => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) soma += Number(base[i]) * (peso - i);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  const d1 = dv(base9, 10);
  return `${base9}${d1}${dv(base9 + d1, 11)}`;
}
function cnhComDv(base9) {
  let soma = 0;
  for (let i = 0, p = 9; i < 9; i++, p--) soma += Number(base9[i]) * p;
  let dsc = 0;
  let dv1 = soma % 11;
  if (dv1 >= 10) { dv1 = 0; dsc = 2; }
  soma = 0;
  for (let i = 0, p = 1; i < 9; i++, p++) soma += Number(base9[i]) * p;
  let dv2 = soma % 11;
  if (dv2 >= 10) dv2 = 0;
  dv2 -= dsc;
  if (dv2 < 0) dv2 += 11;
  return `${base9}${dv1}${dv2}`;
}
const novoCpf = () => cpfComDv(pad(300000000 + ++seq, 9));
function novaCnh() {
  for (;;) {
    const cnh = cnhComDv(pad(400000000 + ++seq, 9));
    if (cnh.length === 11) return cnh;
  }
}

async function apiLogin(page, email, senha) {
  const res = await page.request.post(`${apiBaseUrl}/conta/auth/login`, { data: { email, senha } });
  if (!res.ok()) return null;
  const token = (await res.json()).result?.token;
  return { Authorization: `Bearer ${token}` };
}

async function uiLogin(page, email, senha) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

// Reserva do locatário de teste num veículo DISPONIVEL do locador de teste.
async function reservarNoVeiculoDoLocador(page) {
  const renter = await apiLogin(page, renterEmail, renterPassword);
  const owner = await apiLogin(page, ownerEmail, ownerPassword);
  expect(renter && owner).toBeTruthy();
  const me = (await (await page.request.get(`${apiBaseUrl}/conta/auth/me`, { headers: renter })).json()).result.conta;
  const frota = (await (await page.request.get(`${apiBaseUrl}/veiculo/meus`, { headers: owner })).json()).result || [];
  const candidatos = frota.filter((v) => v.status === "DISPONIVEL" && (v.garagem?.id || v.garagemId));
  for (const dias of [20, 40, 60]) {
    const inicio = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);
    const periodo = { dataHoraInicio: inicio.toISOString(), dataHoraFim: new Date(inicio.getTime() + 2 * 60 * 60 * 1000).toISOString() };
    for (const veiculo of candidatos) {
      const res = await page.request.post(`${apiBaseUrl}/reserva`, {
        headers: renter,
        data: { idVeiculo: veiculo.id, idLocatario: me.id, ...periodo },
      });
      if (res.status() === 201) return { renter, owner, renterId: me.id, periodo, reserva: (await res.json()).result };
    }
  }
  throw new Error("Nenhum veículo livre do locador de teste para o edge path.");
}

test.describe("Task 10 — edge path (API local real)", () => {
  test.skip(!enabled, "Defina MOVA_REAL_API_E2E=1 e MOVA_REAL_API_DB_OVERRIDE=1.");
  test.describe.configure({ mode: "serial" });

  test("cadastro atômico: uma chamada cria conta e perfil; CPF repetido não deixa conta órfã", async ({ page }) => {
    const chamadas = [];
    page.on("request", (req) => {
      if (req.method() === "POST" && /\/api\/(conta\/auth\/register|locatario\/?$)/.test(req.url())) chamadas.push(new URL(req.url()).pathname);
    });
    const cpf = novoCpf();

    async function cadastrar(email, cpfUsado) {
      await page.goto("/cadastro");
      await page.getByLabel("E-mail").fill(email);
      await page.getByLabel("Senha").fill("Mova@Task10");
      await page.getByRole("button", { name: "Continuar" }).click();
      await page.getByLabel(/^Nome/).fill("Pessoa Task Dez");
      await page.getByLabel(/^E-mail/).fill(email);
      await page.getByLabel(/^Celular/).fill("41999990000");
      await page.getByLabel(/^CPF/).fill(cpfUsado);
      await page.getByLabel(/^CNH/).fill(novaCnh());
      await page.getByLabel(/^RG/).fill(pad(500000000 + ++seq, 9));
      await page.getByLabel(/^Data de Nascimento/).fill("1990-05-15");
      await page.getByLabel(/^Endereço Residencial/).fill("Rua da Task, 10");
      await page.getByLabel(/^CEP/).fill("80000000");
      await page.getByLabel("Concordo com os termos de uso").check();
      await page.getByLabel("Concordo com os termos de privacidade").check();
      await page.getByRole("button", { name: "Finalizar Cadastro" }).click();
    }

    const email = `task10.${seq}@e2e.local`;
    await cadastrar(email, cpf);
    await expect(page.getByRole("dialog").or(page.getByText(/sucesso/i)).first()).toBeVisible();
    expect(chamadas).toEqual(["/api/conta/auth/register"]);
    const headers = await apiLogin(page, email, "Mova@Task10");
    const conta = (await (await page.request.get(`${apiBaseUrl}/conta/auth/me`, { headers })).json()).result.conta;
    expect(conta.locatario?.cpf).toBe(cpf);

    const emailDuplicado = `task10.dup.${seq}@e2e.local`;
    await cadastrar(emailDuplicado, cpf);
    await expect(page.getByRole("status").filter({ hasText: /CPF ou CNH/ })).toBeVisible();
    expect(await apiLogin(page, emailDuplicado, "Mova@Task10")).toBeNull();
  });

  test("reserva aguardando pagamento expira em 15 min, aparece como Expirada e libera o veículo", async ({ page }) => {
    const { renter, renterId, periodo, reserva } = await reservarNoVeiculoDoLocador(page);
    sqlMovaTest(`UPDATE "Reserva" SET "criadaEm" = NOW() - INTERVAL '16 minutes' WHERE id = '${uuid(reserva.id)}';`);

    await uiLogin(page, renterEmail, renterPassword);
    await page.goto(`/reservas/${reserva.id}`);
    await expect(page.getByText("Expirada", { exact: true })).toBeVisible();
    await expect(page.getByText(/pagamento não foi concluído em 15 minutos/)).toBeVisible();

    // Nova tentativa: o mesmo período e veículo estão livres e o pagamento confirma.
    const nova = await page.request.post(`${apiBaseUrl}/reserva`, {
      headers: renter,
      data: { idVeiculo: reserva.idVeiculo, idLocatario: renterId, ...periodo },
    });
    expect(nova.status()).toBe(201);
    const novaId = (await nova.json()).result.id;
    const pago = await page.request.post(`${apiBaseUrl}/reserva/${novaId}/pagamento`, { headers: renter, data: { metodoPagamento: "PIX" } });
    expect(pago.status()).toBe(202);
    // Libera o período para as próximas execuções.
    await page.request.post(`${apiBaseUrl}/reserva/${novaId}/cancelar`, { headers: renter });
  });

  test("locador não coloca em manutenção veículo com reserva paga (409) e cancela sem multar o locatário", async ({ page }) => {
    const { renter, owner, reserva } = await reservarNoVeiculoDoLocador(page);
    const pago = await page.request.post(`${apiBaseUrl}/reserva/${reserva.id}/pagamento`, { headers: renter, data: { metodoPagamento: "PIX" } });
    expect(pago.status()).toBe(202);

    await uiLogin(page, ownerEmail, ownerPassword);
    await page.goto(`/cadastro-carros/${reserva.idVeiculo}`);
    const status = page.getByLabel("Status");
    await expect(status).toHaveValue("DISPONIVEL");
    await status.selectOption("MANUTENCAO");
    await page.getByRole("button", { name: "Editar" }).click();
    await expect(page.getByRole("status").filter({ hasText: /reservas confirmadas futuras/ })).toBeVisible();
    await expect(status).toHaveValue("DISPONIVEL");

    const veiculo = (await (await page.request.get(`${apiBaseUrl}/veiculo/meus`, { headers: owner })).json()).result.find((v) => v.id === reserva.idVeiculo);
    expect(veiculo.status).toBe("DISPONIVEL");

    // O locador resolve a reserva: cancelamento sem multa e estorno integral.
    const cancelada = await page.request.post(`${apiBaseUrl}/reserva/${reserva.id}/cancelar`, { headers: owner });
    expect(cancelada.status()).toBe(200);
    expect((await cancelada.json()).result.multaCancelamento).toBe(0);
    const financeiro = (await (await page.request.get(`${apiBaseUrl}/reserva/${reserva.id}/pagamento`, { headers: renter })).json()).result;
    expect(financeiro.valorElegivelEstorno).toBe(financeiro.valorPago);
    expect(financeiro.statusEstorno).toBe("CONCLUIDO");
  });

  // Task 10.1 — Bug A: veículo indisponível depois da reserva não paga.
  test("pagamento de reserva com veículo em manutenção é recusado sem cobrança nem código", async ({ page }) => {
    const { renter, owner, reserva } = await reservarNoVeiculoDoLocador(page);
    const manutencao = await page.request.put(`${apiBaseUrl}/veiculo/${reserva.idVeiculo}`, { headers: owner, data: { status: "MANUTENCAO" } });
    expect(manutencao.status()).toBe(200);

    await uiLogin(page, renterEmail, renterPassword);
    await page.goto(`/reservas/${reserva.id}`);
    await page.getByRole("button", { name: "Pagar reserva" }).click();
    await page.getByLabel(/Método de pagamento/i).selectOption("PIX");
    await page.getByRole("button", { name: /^Pagar$/ }).click();
    await expect(page.getByText(/veículo desta reserva está indisponível/i)).toBeVisible();
    await expect(page.getByText(/Pagamento aprovado/i)).toHaveCount(0);

    const depois = (await (await page.request.get(`${apiBaseUrl}/reserva/${reserva.id}`, { headers: renter })).json()).result;
    expect(depois.status).toBe("AGUARDANDO_PAGAMENTO");
    expect(depois.statusPagamento).not.toBe("SUCESSO");
    expect(depois.codigoDesbloqueio).toBeNull();

    await page.request.put(`${apiBaseUrl}/veiculo/${reserva.idVeiculo}`, { headers: owner, data: { status: "DISPONIVEL" } });
    await page.request.post(`${apiBaseUrl}/reserva/${reserva.id}/cancelar`, { headers: renter });
  });

  // Task 10.1 — Bug B: garagem ainda necessária a uma reserva paga.
  test("locador não coloca em manutenção a garagem de retirada de uma reserva paga (409)", async ({ page }) => {
    const { renter, owner, reserva } = await reservarNoVeiculoDoLocador(page);
    expect((await page.request.post(`${apiBaseUrl}/reserva/${reserva.id}/pagamento`, { headers: renter, data: { metodoPagamento: "PIX" } })).status()).toBe(202);
    const garagemId = reserva.idGaragemRetirada;

    await uiLogin(page, ownerEmail, ownerPassword);
    await page.goto(`/cadastro-garagens/${garagemId}`);
    const status = page.getByLabel("Status");
    await expect(status).toHaveValue("ATIVA");
    await status.selectOption("MANUTENCAO");
    await page.getByRole("button", { name: "Editar" }).click();
    await expect(page.getByRole("status").filter({ hasText: /reservas confirmadas que ainda dependem/ })).toBeVisible();
    await expect(status).toHaveValue("ATIVA");

    const intacta = (await (await page.request.get(`${apiBaseUrl}/reserva/${reserva.id}`, { headers: renter })).json()).result;
    expect(intacta).toMatchObject({ status: "CONFIRMADA", idGaragemRetirada: garagemId });
    const garagens = (await (await page.request.get(`${apiBaseUrl}/garagem?limit=100`, { headers: owner })).json()).result || [];
    expect(garagens.find((g) => g.id === garagemId)?.status).toBe("ATIVA");

    await page.request.post(`${apiBaseUrl}/reserva/${reserva.id}/cancelar`, { headers: owner });
  });
});
