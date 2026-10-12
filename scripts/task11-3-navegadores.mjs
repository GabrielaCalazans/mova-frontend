// Task 11.3 — navegadores para o NVDA real: Google Chrome (Playwright, modo --app) e Firefox estável
// (WebDriver BiDi nativo, sem o build do Playwright). Mesma interface nos dois:
//   goto(rota) · run(fn, arg) (fn executa na página, arg/retorno em JSON) · tamanho(w, h) · captura(arquivo) · fechar()
// Estado de teste (locale, sessão, jornada) vai por chaves __aud_* no localStorage, aplicadas antes do app carregar.
// Escritas na API são bloqueadas nos dois navegadores (só GET/OPTIONS, login e precificação passam).
import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export const BASE = process.env.MOVA_BASE ?? "http://localhost:5173";
const PERMITIDAS = /\/api\/(reserva\/precificacao|conta\/auth\/login)$/;

// Executa no início de cada documento: aplica o estado de teste guardado em __aud_*.
function aplicarEstado() {
  const ls = window.localStorage;
  const locale = ls.getItem("__aud_locale");
  if (locale) ls.setItem("mova_locale", locale);
  const sessao = ls.getItem("__aud_sessao");
  if (sessao === "nenhuma") ls.removeItem("mova_auth_session");
  else if (sessao) ls.setItem("mova_auth_session", sessao);
  const jornada = ls.getItem("__aud_jornada");
  if (jornada) window.sessionStorage.setItem("mova_journey_flow", jornada);
}

const embrulhar = (fn) => `async (j) => JSON.stringify((await (${fn.toString()})(JSON.parse(j))) ?? null)`;

export async function abrirChrome(dir, { largura = 1280, altura = 900 } = {}) {
  const perfil = path.join(dir, "perfil-chrome");
  const context = await chromium.launchPersistentContext(perfil, {
    channel: "chrome", headless: false, viewport: null,
    // Sem --enable-automation: a barra "controlado por software de teste" recebia o foco do Tab.
    ignoreDefaultArgs: ["--enable-automation", "--unsafely-disable-devtools-self-xss-warnings", "--disable-field-trial-config", "--edge-skip-compat-layer-relaunch"],
    args: ["--force-renderer-accessibility", `--app=${BASE}/`, `--window-size=${largura},${altura}`, "--window-position=0,0", "--disable-features=Translate,TranslateUI", "--lang=pt-BR"],
  });
  await context.addInitScript(aplicarEstado);
  const bloqueadas = [];
  await context.route("**/api/**", (route) => {
    const req = route.request();
    if (["GET", "OPTIONS"].includes(req.method()) || PERMITIDAS.test(new URL(req.url()).pathname)) return route.continue();
    bloqueadas.push(`${req.method()} ${new URL(req.url()).pathname}`);
    return route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ success: false, message: "[auditoria] escrita bloqueada" }) });
  });
  await context.waitForEvent("page", { timeout: 5000 }).catch(() => {});
  const page = context.pages().find((p) => p.url().startsWith(BASE)) ?? context.pages()[0];
  await page.waitForLoadState("networkidle").catch(() => {});
  return {
    nome: "Chrome", versao: context.browser()?.version() ?? "154", perfil, bloqueadas, page,
    async goto(rota) { await page.goto(`${BASE}${rota}`); await page.waitForLoadState("networkidle", { timeout: 6000 }).catch(() => {}); },
    async run(fn, arg = null) { return JSON.parse(await page.evaluate(`(${embrulhar(fn)})(${JSON.stringify(JSON.stringify(arg))})`)); },
    async tamanho(w, h) { await page.setViewportSize({ width: w, height: h }); },
    async captura(arquivo) { await page.screenshot({ path: arquivo }); },
    async fechar() { await context.close(); },
  };
}

// ---------- Firefox via WebDriver BiDi ----------
const PREFS = {
  "browser.shell.checkDefaultBrowser": false, "browser.aboutwelcome.enabled": false, "browser.translations.enable": false,
  "browser.startup.homepage_override.mstone": "ignore", "datareporting.policy.dataSubmissionEnabled": false,
  "toolkit.telemetry.reportingpolicy.firstRun": false, "browser.tabs.warnOnClose": false, "browser.sessionstore.resume_from_crash": false,
  "app.update.auto": false, "app.update.enabled": false, "browser.newtabpage.enabled": false, "sidebar.revamp": false,
};

export async function abrirFirefox(dir, { largura = 1280, altura = 900, porta = 9333, headless = false } = {}) {
  const perfil = path.join(dir, "perfil-firefox");
  await rm(perfil, { recursive: true, force: true });
  await mkdir(perfil, { recursive: true });
  await writeFile(path.join(perfil, "user.js"), Object.entries(PREFS).map(([k, v]) => `user_pref(${JSON.stringify(k)}, ${JSON.stringify(v)});`).join("\n"));
  const exe = process.env.MOVA_FIREFOX ?? "C:\\Program Files\\Mozilla Firefox\\firefox.exe";
  // -no-remote + perfil próprio: instância separada, não toca no Firefox pessoal aberto.
  const args = ["-no-remote", "-profile", perfil, "--remote-debugging-port", String(porta), headless ? "-headless" : "--kiosk", `${BASE}/`];
  const proc = spawn(exe, args, { stdio: ["ignore", "ignore", "pipe"] });
  await new Promise((ok, falha) => {
    const t = setTimeout(() => falha(new Error("Firefox não abriu o WebDriver BiDi")), 30000);
    proc.stderr.on("data", (d) => { if (/WebDriver BiDi listening/.test(String(d))) { clearTimeout(t); ok(); } });
  });
  const ws = new WebSocket(`ws://127.0.0.1:${porta}/session`);
  await new Promise((ok, falha) => { ws.onopen = ok; ws.onerror = () => falha(new Error("BiDi: falha na conexão")); });
  let seq = 0;
  const pendentes = new Map();
  const ouvintes = [];
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pendentes.has(msg.id)) { const { ok, falha } = pendentes.get(msg.id); pendentes.delete(msg.id); msg.type === "error" ? falha(new Error(`${msg.error}: ${msg.message}`)) : ok(msg.result); }
    else if (msg.type === "event") ouvintes.forEach((f) => f(msg));
  };
  const cmd = (method, params = {}) => new Promise((ok, falha) => { const id = ++seq; pendentes.set(id, { ok, falha }); ws.send(JSON.stringify({ id, method, params })); });

  const sessao = await cmd("session.new", { capabilities: { alwaysMatch: {} } });
  const { contexts } = await cmd("browsingContext.getTree", {});
  const context = contexts[0].context;
  await cmd("script.addPreloadScript", { functionDeclaration: aplicarEstado.toString() });
  // Bloqueio de escrita: intercepta a API e só deixa passar leitura, login e precificação.
  const bloqueadas = [];
  await cmd("session.subscribe", { events: ["network.beforeRequestSent"] });
  await cmd("network.addIntercept", { phases: ["beforeRequestSent"], urlPatterns: [{ type: "pattern", protocol: "http", hostname: "localhost", port: "3000" }] });
  ouvintes.push((ev) => {
    if (ev.method !== "network.beforeRequestSent" || !ev.params.isBlocked) return;
    const { request } = ev.params;
    const caminho = new URL(request.url).pathname;
    if (["GET", "OPTIONS"].includes(request.method) || PERMITIDAS.test(caminho)) cmd("network.continueRequest", { request: request.request }).catch(() => {});
    else { bloqueadas.push(`${request.method} ${caminho}`); cmd("network.failRequest", { request: request.request }).catch(() => {}); }
  });
  await cmd("browsingContext.setViewport", { context, viewport: { width: largura, height: altura } });
  return {
    nome: "Firefox", versao: sessao.capabilities.browserVersion, perfil, bloqueadas,
    async goto(rota) { await cmd("browsingContext.navigate", { context, url: `${BASE}${rota}`, wait: "complete" }); await new Promise((r) => setTimeout(r, 1500)); },
    async run(fn, arg = null) {
      const r = await cmd("script.callFunction", { functionDeclaration: embrulhar(fn), arguments: [{ type: "string", value: JSON.stringify(arg) }], target: { context }, awaitPromise: true, resultOwnership: "none" });
      if (r.type === "exception") throw new Error(`Firefox: ${r.exceptionDetails?.text}`);
      return JSON.parse(r.result.value);
    },
    async tamanho(w, h) { await cmd("browsingContext.setViewport", { context, viewport: { width: w, height: h } }); },
    // Tecla confiável (isTrusted) pelo protocolo, sem leitor de tela; valores WebDriver (ex.: "" = ↓).
    async tecla(valor) { await cmd("input.performActions", { context, actions: [{ type: "key", id: "teclado", actions: [{ type: "keyDown", value: valor }, { type: "keyUp", value: valor }] }] }); },
    async captura(arquivo) { const { data } = await cmd("browsingContext.captureScreenshot", { context }); await writeFile(arquivo, Buffer.from(data, "base64")); },
    async fechar() { await cmd("browser.close").catch(() => {}); ws.close(); proc.kill(); },
  };
}

// Prepara o estado de teste a partir da página atual (mesma origem) e navega.
export async function abrirTela(drv, rota, { locale = "pt-BR", sessao = null, jornada = null } = {}) {
  await drv.run(({ locale, sessao, jornada }) => {
    localStorage.setItem("__aud_locale", locale);
    localStorage.setItem("__aud_sessao", sessao ? JSON.stringify(sessao) : "nenhuma");
    if (jornada) localStorage.setItem("__aud_jornada", JSON.stringify(jornada)); else localStorage.removeItem("__aud_jornada");
    return true;
  }, { locale, sessao, jornada });
  await drv.goto(rota);
}
