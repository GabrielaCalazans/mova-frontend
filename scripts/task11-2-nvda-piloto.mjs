// Task 11.2 — piloto NVDA com captura da fala REAL do NVDA.
// Pré-requisitos (fora deste script): NVDA iniciado com log de entrada/saída (-l 12 -f <log>),
// frontend em MOVA_BASE e backend em MOVA_API_BASE_URL (mova_dev, seed de demonstração).
// O Chrome é aberto VISÍVEL; as teclas vão pelo sistema (task11-2-nvda-keys.ps1), não pelo CDP,
// para que o NVDA as intercepte. Nenhum formulário é enviado ao backend.
// Uso: MOVA_NVDA_LOG=<log do NVDA> node scripts/task11-2-nvda-piloto.mjs <dir-saida>
import { chromium } from "@playwright/test";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.MOVA_BASE ?? "http://localhost:5173";
const API = process.env.MOVA_API_BASE_URL ?? "http://localhost:3000/api";
const SENHA = process.env.MOVA_DEMO_PASSWORD ?? "Mova@123";
const LOG_NVDA = process.env.MOVA_NVDA_LOG;
const SAIDA = path.resolve(process.argv[2] ?? "test-results/nvda-piloto");
const PERFIL = path.join(SAIDA, "chrome-profile");
const ATRASO = process.env.MOVA_NVDA_DELAY ?? "1100";

const hora = (d = new Date()) => `${d.toTimeString().slice(0, 8)}.${String(d.getMilliseconds()).padStart(3, "0")}`;
const ms = (h) => { const [a, b, c] = h.split(":"); return ((+a * 60 + +b) * 60 + parseFloat(c)) * 1000; };

// [id, objetivo, tela (null = continua na mesma), locale, sessão, preparo, teclas]
const PASSOS = [
  ["N01", "Títulos com H e por nível (1, 2)", "/", "pt-BR", false, null, "h,h,h,1,2"],
  ["N02", "Landmarks com D", null, null, false, null, "d,d,d,d"],
  ["N03", "Links com K", null, null, false, null, "k,k,k"],
  ["N04", "Botões com B", null, null, false, null, "b,b,b"],
  ["N05", "Tab / Shift+Tab a partir do topo (skip link)", "/", "pt-BR", false, null, "tab,tab,tab,shift+tab"],
  ["N07", "Login: campos com F, botão com B, Enter no envio vazio", "/login", "pt-BR", false, null, "f,f,b,enter"],
  ["N08", "Login após erro: Tab/Shift+Tab pelos campos", null, null, false, null, "shift+tab,shift+tab,tab"],
  ["N09", "Catálogo: Espaço em chip com aria-pressed", "/carros/lista", "pt-BR", false, "chip", "space,space"],
  ["N10", "Idioma en: títulos", "/", "en", false, null, "h,h"],
  ["N11", "Idioma es: títulos", "/", "es", false, null, "h,h"],
  ["N12", "Diálogo do menu da conta: Enter, Tab, Shift+Tab, Esc e retorno de foco", "/historico", "pt-BR", true, "menu", "enter,tab,tab,shift+tab,escape"],
  ["N13", "Cadastro: Enter em Continuar vazio, erros por campo", "/cadastro", "pt-BR", false, "submit", "enter,tab,tab"],
  // Por último: na tentativa 2 o NVDA ficou ~80 s sem processar nada depois de abrir a lista.
  ["N06", "Lista de Elementos (NVDA+F7): links, títulos e landmarks", "/", "pt-BR", false, null, "nvda+f7,pausa,alt+h,pausa,alt+d,pausa,escape"],
];
// MOVA_NVDA_PASSOS="N07,N08" reexecuta só esses passos (na ordem acima).
const FILTRO = process.env.MOVA_NVDA_PASSOS?.split(",");
const EXECUTAR = FILTRO ? PASSOS.filter(([id]) => FILTRO.includes(id)) : PASSOS;

async function sessaoLocatario() {
  const r = await fetch(`${API}/conta/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "ana.demo@mova.local", senha: SENHA }) });
  const { token } = (await r.json()).result;
  const me = await (await fetch(`${API}/conta/auth/me`, { headers: { Authorization: `Bearer ${token}` } })).json();
  return { token, user: me.result.conta };
}

function teclas(lista, ativar) {
  const args = ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", path.resolve("scripts/task11-2-nvda-keys.ps1"), "-UserDataDir", PERFIL, "-Keys", lista || ",", "-DelayMs", ATRASO];
  if (ativar) args.push("-Ativar");
  if (lista.includes("nvda+")) args.push("-PermitirNvda");
  const r = spawnSync("powershell", args, { encoding: "utf8" });
  const linhas = r.stdout.split(/\r?\n/).filter(Boolean);
  if (r.status !== 0) throw new Error(`teclas abortadas (exit ${r.status}): ${linhas.join(" | ")} ${r.stderr}`);
  return linhas.filter((l) => l.startsWith("TECLA")).map((l) => { const [, h, t] = l.split(" "); return { hora: h, tecla: t }; });
}

// Log do NVDA: cabeçalho "IO - <logger> (HH:MM:SS.mmm) - <thread>:" seguido da mensagem.
function lerLogNvda(texto) {
  const entradas = [];
  let atual = null;
  for (const linha of texto.split(/\r?\n/)) {
    const m = linha.match(/^(IO|INFO|DEBUG|DEBUGWARNING|WARNING|ERROR|CRITICAL) - (\S+) \((\d\d:\d\d:\d\d\.\d{3})\)/);
    if (m) { atual = { nivel: m[1], origem: m[2], hora: m[3], msg: "" }; entradas.push(atual); }
    else if (atual) atual.msg += (atual.msg ? "\n" : "") + linha;
  }
  return entradas;
}

await mkdir(SAIDA, { recursive: true });
const sessao = await sessaoLocatario();
// --app: janela sem barra de endereço. Na tentativa 1 (janela comum) o foco do sistema ficou na
// barra de endereço e as teclas foram digitadas na URL em vez de chegar ao modo de navegação do NVDA.
const context = await chromium.launchPersistentContext(PERFIL, {
  channel: "chrome", headless: false, viewport: null,
  args: ["--force-renderer-accessibility", `--app=${BASE}/`, "--window-size=1280,900", "--window-position=0,0",
    // Perfil novo oferecia traduzir a página (balão do Google Tradutor) ao abrir o site.
    "--disable-features=Translate,TranslateUI", "--lang=pt-BR"],
});
await context.waitForEvent("page", { timeout: 5000 }).catch(() => {});
const page = context.pages().find((p) => p.url().startsWith(BASE)) ?? context.pages()[0];
const registro = { base: BASE, inicio: hora(), passos: [] };

await page.waitForLoadState("networkidle").catch(() => {});
await page.waitForTimeout(1500);
teclas("", true); // traz a janela do piloto para o primeiro plano

for (const [id, objetivo, tela, locale, autenticado, preparo, lista] of EXECUTAR) {
  const passo = { id, objetivo, tela, locale, inicio: hora() };
  if (tela) {
    await page.evaluate(({ locale, sessao }) => {
      window.localStorage.setItem("mova_locale", locale);
      if (sessao) window.localStorage.setItem("mova_auth_session", JSON.stringify(sessao));
      else window.localStorage.removeItem("mova_auth_session");
    }, { locale, sessao: autenticado ? sessao : null });
    await page.goto(`${BASE}${tela}`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2500);
  }
  if (preparo === "chip") await page.locator("button[aria-pressed]").first().focus();
  if (preparo === "menu") await page.locator("button[aria-haspopup=dialog]:visible").first().focus();
  if (preparo === "submit") await page.locator("form button[type=submit]").first().focus();
  if (preparo) await page.waitForTimeout(1500);
  passo.teclas = teclas(lista, false);
  await page.waitForTimeout(1500);
  passo.fim = hora();
  passo.focoFinal = await page.evaluate(() => { const el = document.activeElement; return el ? `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""} "${(el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 60)}"` : null; });
  await page.screenshot({ path: path.join(SAIDA, `${id}.png`) });
  registro.passos.push(passo);
  console.log(`${id} ok (${passo.teclas.length} teclas)`);
}
registro.fim = hora();
await context.close();

if (LOG_NVDA) {
  const entradas = lerLogNvda(await readFile(LOG_NVDA, "utf8"));
  const fala = entradas.filter((e) => e.nivel === "IO" && e.msg.startsWith("Speaking"));
  const entrada = entradas.filter((e) => e.nivel === "IO" && e.msg.startsWith("Input:"));
  const falasEntre = (de, ate) => fala.filter((e) => ms(e.hora) >= de && ms(e.hora) < ate).map((e) => `${e.hora} ${e.msg.replace(/^Speaking /, "")}`);
  for (const [i, passo] of registro.passos.entries()) {
    const fimPasso = ms(registro.passos[i + 1]?.inicio ?? registro.fim);
    // Fala do carregamento/preparo (antes da 1ª tecla): título da página, foco programático.
    passo.falaAntesDasTeclas = falasEntre(ms(passo.inicio), passo.teclas[0] ? ms(passo.teclas[0].hora) : fimPasso);
    passo.teclas.forEach((t, j) => {
      const de = ms(t.hora);
      const ate = j + 1 < passo.teclas.length ? ms(passo.teclas[j + 1].hora) : fimPasso;
      t.nvdaRecebeu = entrada.filter((e) => ms(e.hora) >= de && ms(e.hora) < ate).map((e) => e.msg.replace("Input: ", ""));
      t.fala = falasEntre(de, ate);
    });
    // Eco de caractere numa tecla de navegação rápida = a tecla foi digitada num campo editável,
    // não interpretada pelo modo de navegação: o passo não serve como evidência.
    const eco = passo.teclas.filter((t) => /^[a-z0-9]$/.test(t.tecla) && t.fala.some((f) => f.includes("CharacterModeCommand(True)")));
    // Tecla sem "Input:" no log = o NVDA não a recebeu (travado ou hook ausente).
    const semRecepcao = passo.teclas.filter((t) => !t.nvdaRecebeu.length);
    passo.valido = !eco.length && !semRecepcao.length;
    if (eco.length) passo.motivoInvalido = `eco de caractere em ${eco.map((t) => t.tecla).join(",")}`;
    else if (semRecepcao.length) passo.motivoInvalido = `NVDA não registrou ${semRecepcao.map((t) => t.tecla).join(",")}`;
  }
  registro.totalFalasNoLog = fala.length;
}
await writeFile(path.join(SAIDA, "nvda-piloto.json"), JSON.stringify(registro, null, 2));
console.log(`piloto concluído: ${registro.passos.length} passos → ${SAIDA}`);
