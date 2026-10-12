// Task 11.2 — apoio comum às varreduras (dados da demo, contexto com bloqueio de escrita, navegação).
export const BASE = process.env.MOVA_BASE ?? "http://localhost:5173";
export const API = process.env.MOVA_API_BASE_URL ?? "http://localhost:3000/api";
const SENHA = process.env.MOVA_DEMO_PASSWORD ?? "Mova@123";

export async function api(caminho, token) {
  const r = await fetch(`${API}${caminho}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  return (await r.json()).result;
}
async function sessao(email) {
  const r = await fetch(`${API}/conta/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, senha: SENHA }) });
  const { token } = (await r.json()).result;
  return { token, user: (await api("/conta/auth/me", token)).conta };
}
const lista = (r) => (Array.isArray(r) ? r : r?.data ?? []);
const dataBR = (d) => [d.getDate(), d.getMonth() + 1, d.getFullYear()].map((p, i) => (i < 2 ? String(p).padStart(2, "0") : p)).join("/");

// Somente leitura: duas sessões (2 logins) e IDs do seed de demonstração.
export async function dadosDemo() {
  const LOCATARIO = await sessao("ana.demo@mova.local");
  const LOCADOR = await sessao("locadora.demo@mova.local");
  const veiculoPcd = lista(await api("/veiculo?pcd=true"))[0];
  const reservas = lista(await api("/reserva?limit=50", LOCATARIO.token));
  const porStatus = (s) => reservas.find((r) => r.status === s)?.id;
  const m = veiculoPcd.modeloVeiculo;
  const etapa = (dias) => ({ garageId: veiculoPcd.garagemId, garageName: veiculoPcd.garagem?.nome ?? "", garageAddress: "", garageInfo: "", date: dataBR(new Date(Date.now() + dias * 864e5)), time: "10:00" });
  const J_PRE = {
    veiculo: { id: veiculoPcd.id, marca: m.marca, modelo: m.modelo, categoria: m.categoria, capacidade: m.capacidade, cambio: m.cambio, ano: m.ano, adaptado: m.adaptado, eletrico: m.eletrico, garagemId: veiculoPcd.garagemId, garagemName: veiculoPcd.garagem?.nome ?? "", status: veiculoPcd.status },
    retirada: etapa(40), devolucao: etapa(42), servicos: { ids: [] },
  };
  return {
    sessoes: { loc: LOCATARIO, dono: LOCADOR }, veiculoPcd, porStatus, J_PRE,
    comReserva: (id) => ({ ...J_PRE, reserva: { id, codigoDesbloqueio: "" } }),
    veiculoLocador: lista(await api("/veiculo/meus", LOCADOR.token))[0].id,
    garagemLocador: lista(await api("/garagem?limit=50", LOCADOR.token))[0].id,
  };
}

// Toda escrita na API é bloqueada (só GET e POST /reserva/precificacao passam): nada é gravado no banco.
export async function novoContexto(browser, { perfil, locale, sessoes, ...extra }) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale, timezoneId: "America/Sao_Paulo", ...extra });
  await context.addInitScript(({ locale, s }) => {
    window.localStorage.setItem("mova_locale", locale);
    if (s) window.localStorage.setItem("mova_auth_session", JSON.stringify(s));
    else window.localStorage.removeItem("mova_auth_session");
    const j = window.localStorage.getItem("__auditoria_jornada");
    if (j) window.sessionStorage.setItem("mova_journey_flow", j);
  }, { locale, s: perfil ? sessoes[perfil] : null });
  context.bloqueadas = [];
  await context.route("**/api/**", (route) => {
    const req = route.request();
    if (req.method() === "GET" || req.method() === "OPTIONS" || (req.method() === "POST" && /\/reserva\/precificacao$/.test(new URL(req.url()).pathname))) return route.continue();
    context.bloqueadas.push(`${req.method()} ${new URL(req.url()).pathname}`);
    return route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ success: false, message: "[auditoria] escrita bloqueada" }) });
  });
  return context;
}

export async function abrir(page, rota, jornada) {
  if (!page.url().startsWith(BASE)) await page.goto(`${BASE}/`);
  await page.evaluate((j) => { if (j) window.localStorage.setItem("__auditoria_jornada", JSON.stringify(j)); else window.localStorage.removeItem("__auditoria_jornada"); }, jornada ?? null);
  await page.goto(`${BASE}${rota}`);
  await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(350);
}
