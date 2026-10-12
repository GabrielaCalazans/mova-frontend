// Task 11.3 — reprodução sem leitor de tela: trocar o idioma com ↓ no seletor do cabeçalho mantém o foco?
// Firefox (WebDriver BiDi, tecla confiável) e Chromium (Playwright), headless. Mede o tempo até o remonte
// (mudança de html lang) e onde o foco está 3 s depois.
// Uso: node scripts/task11-3-repro-idioma.mjs <pasta-saida>
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { BASE, abrirFirefox } from "./task11-3-navegadores.mjs";

const SAIDA = process.argv[2] ?? ".";
const amostrar = async (run) => run(async () => {
  const sel = document.querySelector(".langselect__control");
  sel.focus();
  const t0 = performance.now();
  const linha = [];
  const ver = () => { const a = document.activeElement; return `${Math.round(performance.now() - t0)}ms lang=${document.documentElement.lang} foco=${a.tagName.toLowerCase()}${a.id ? "#" + a.id : ""}${a.className ? "." + String(a.className).split(" ")[0] : ""}`; };
  window.__amostras = linha;
  const timer = setInterval(() => linha.push(ver()), 100);
  setTimeout(() => clearInterval(timer), 4800);
  return { inicio: ver(), focado: document.activeElement === sel };
});
const resultado = {};

for (let i = 0; i < 3; i++) {
  const ff = await abrirFirefox(path.join(SAIDA, `ff${i}`), { headless: true, porta: 9334 + i });
  await ff.goto(`/?_=${i}`);
  await ff.run(() => { localStorage.removeItem("mova_locale"); });
  await ff.goto("/");
  const ini = await amostrar(ff.run.bind(ff));
  await ff.tecla("");
  await new Promise((r) => setTimeout(r, 3500));
  const amostras = await ff.run(() => window.__amostras ?? []);
  (resultado.firefox ??= []).push({ versao: ff.versao, ini, final: amostras.at(-1), primeiraTroca: amostras.find((a) => !a.includes("lang=pt-BR")), amostras });
  await ff.fechar();
}

const browser = await chromium.launch();
for (let i = 0; i < 6; i++) {
  const page = await browser.newPage();
  // Rodadas 3–5: dicionário do idioma atrasado 2,5 s (rede lenta), como no Firefox sob o NVDA (troca > 1 s).
  if (i >= 3) await page.route("**/i18n/locales/en/**", (r) => setTimeout(() => r.continue(), 2500));
  await page.goto(`${BASE}/`);
  await page.evaluate(() => localStorage.removeItem("mova_locale"));
  await page.goto(`${BASE}/`);
  await page.waitForLoadState("networkidle").catch(() => {});
  const run = async (fn) => page.evaluate(fn);
  const ini = await amostrar(run);
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(i >= 3 ? 5000 : 3500);
  const amostras = await page.evaluate(() => window.__amostras ?? []);
  (resultado[i >= 3 ? "chromium-lento" : "chromium"] ??= []).push({ versao: browser.version(), ini, final: amostras.at(-1), primeiraTroca: amostras.find((a) => !a.includes("lang=pt-BR")), amostras });
  await page.close();
}
await browser.close();

await writeFile(path.join(SAIDA, "repro-idioma.json"), JSON.stringify(resultado, null, 2));
for (const [nav, rs] of Object.entries(resultado)) for (const r of rs) console.log(nav, r.versao, "| início:", r.ini.inicio, "| 1ª troca:", r.primeiraTroca, "| final:", r.final);
