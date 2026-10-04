// Task 9 — verificação de acessibilidade no ambiente LOCAL de demonstração
// (frontend + API reais em mova_dev, dados do seed de demonstração).
//
//   node scripts/task9-a11y.mjs [saida.json]
//
// MOVA_BASE (padrão http://localhost:5173), MOVA_DEMO_PASSWORD (senha do seed).
// Para cada tela × tema (claro/escuro) × largura: axe WCAG 2.x A/AA e overflow
// horizontal (reflow). Em 1280 px: sequência de Tab com foco visível. Também
// confere prefers-reduced-motion e zoom de 200 % (1280 px → 640 px CSS).
// Não substitui teste com leitor de tela nem avaliação humana.
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { writeFile } from "node:fs/promises";

const BASE = process.env.MOVA_BASE ?? "http://localhost:5173";
const API = process.env.MOVA_API_BASE_URL ?? "http://localhost:3000/api";
const SENHA = process.env.MOVA_DEMO_PASSWORD ?? "Mova@123";
const SAIDA = process.argv[2] ?? "task9-a11y.json";
const LARGURAS = (process.env.MOVA_WIDTHS ?? "320,375,402,768,1024,1440").split(",").map(Number);
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
// Task 9.1 (RNF08): MOVA_LOCALE=pt-BR|en|es roda a mesma verificação no idioma.
const LOCALE = process.env.MOVA_LOCALE ?? "pt-BR";
const HTML_LANG = { "pt-BR": "pt-BR", en: "en", es: "es" }[LOCALE];

async function login(page, email) {
  await page.goto(`${BASE}/login`);
  await page.locator("input[type=email]").fill(email);
  await page.locator("input[type=password]").first().fill(SENHA);
  await page.locator("form button[type=submit]").click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

// Reaproveita o token da sessão já aberta (o login tem rate limit por IP).
async function idPorApi(page, caminho, filtro) {
  const token = await page.evaluate(() => JSON.parse(window.localStorage.getItem("mova_auth_session") || "{}").token);
  const lista = (await (await page.request.get(`${API}${caminho}`, { headers: { Authorization: `Bearer ${token}` } })).json()).result;
  return (Array.isArray(lista) ? lista : lista.data).find(filtro)?.id;
}

const PERFIS = [
  { nome: "visitante", email: null, telas: async () => ["/", "/login", "/cadastro", "/carros/lista"] },
  {
    nome: "locatario",
    email: "ana.demo@mova.local",
    telas: async (page) => {
      const veiculo = (await (await page.request.get(`${API}/veiculo?pcd=true`)).json()).result[0].id;
      const reserva = await idPorApi(page, "/reserva?limit=50", (r) => r.status === "CONFIRMADA");
      return [`/carros/${veiculo}`, "/historico", `/reservas/${reserva}`, "/carros/favoritos", "/interesses", "/conta", "/configuracoes"];
    },
  },
  {
    nome: "locador",
    email: "locadora.demo@mova.local",
    telas: async (page) => {
      const veiculo = await idPorApi(page, "/veiculo/meus", () => true);
      return ["/painel", "/cadastro-carros", `/cadastro-carros/${veiculo}`, "/cadastro-garagens", "/reservas", "/monitoramento", "/relatorios/veiculos", "/relatorios/avaliacoes"];
    },
  },
];

async function estabilizar(page) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(300);
}

async function sequenciaTab(page, passos = 30) {
  const paradas = [];
  await page.keyboard.press("Tab");
  for (let i = 0; i < passos; i++) {
    paradas.push(await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      const visivel = (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow && cs.boxShadow !== "none");
      const nome = (el.getAttribute("aria-label") || el.innerText || el.getAttribute("name") || el.id || "").trim().slice(0, 50);
      return { tag: el.tagName.toLowerCase(), nome, focoVisivel: Boolean(visivel) };
    }));
    await page.keyboard.press("Tab");
  }
  return paradas.filter(Boolean);
}

const browser = await chromium.launch();
const resultado = { base: BASE, locale: LOCALE, geradoEm: new Date().toISOString(), telas: [], resumo: {} };

for (const perfil of PERFIS) {
  // Um contexto (um login) por perfil; o tema muda por emulação de mídia.
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addInitScript((locale) => window.localStorage.setItem("mova_locale", locale), LOCALE);
  const page = await context.newPage();
  if (perfil.email) await login(page, perfil.email);
  const telas = await perfil.telas(page);
  for (const tema of ["light", "dark"]) {
    await page.emulateMedia({ colorScheme: tema });
    for (const tela of telas) {
      const registro = { perfil: perfil.nome, tema, tela, axe: [], overflow: [], teclado: null, langErrado: [] };
      for (const largura of LARGURAS) {
        await page.setViewportSize({ width: largura, height: 900 });
        await page.goto(`${BASE}${tela}`);
        await estabilizar(page);
        const axe = await new AxeBuilder({ page }).withTags(TAGS).analyze();
        for (const v of axe.violations) registro.axe.push({ largura, id: v.id, impacto: v.impact, alvos: v.nodes.map((n) => n.target.join(" ")).slice(0, 3) });
        const excesso = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        const lang = await page.evaluate(() => document.documentElement.lang);
        if (lang !== HTML_LANG) registro.langErrado.push({ largura, lang });
        if (excesso > 0) registro.overflow.push({ largura, px: excesso });
      }
      if (tema === "light") {
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.goto(`${BASE}${tela}`);
        await estabilizar(page);
        const paradas = await sequenciaTab(page);
        registro.teclado = { paradas: paradas.length, semFocoVisivel: paradas.filter((p) => !p.focoVisivel), primeiras: paradas.slice(0, 6).map((p) => `${p.tag}:${p.nome}`) };
        // Zoom 200 %: 1280 px a 200 % equivale a 640 px CSS.
        await page.setViewportSize({ width: 640, height: 450 });
        await page.goto(`${BASE}${tela}`);
        await estabilizar(page);
        registro.zoom200Overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      }
      resultado.telas.push(registro);
      console.log(`${perfil.nome} ${tema} ${tela}: axe ${registro.axe.length}, overflow ${registro.overflow.length}${registro.teclado ? `, tab ${registro.teclado.paradas} (sem foco visível ${registro.teclado.semFocoVisivel.length})` : ""}`);
    }
  }
  await context.close();
}

// prefers-reduced-motion: nenhuma animação/transição longa deve continuar ativa.
{
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  const longas = [];
  for (const tela of ["/", "/login"]) {
    await page.goto(`${BASE}${tela}`);
    await estabilizar(page);
    longas.push(...(await page.evaluate(() => [...document.querySelectorAll("*")].filter((el) => {
      const cs = getComputedStyle(el);
      const dur = (v) => Math.max(...v.split(",").map((s) => parseFloat(s) * (s.trim().endsWith("ms") ? 0.001 : 1)));
      return (cs.animationName !== "none" && dur(cs.animationDuration) > 0.01) || dur(cs.transitionDuration) > 0.01;
    }).map((el) => el.className?.toString().slice(0, 40) || el.tagName))).map((c) => `${tela} ${c}`));
  }
  resultado.reducedMotion = { elementosComMovimento: longas };
  await context.close();
}

await browser.close();
const t = resultado.telas;
resultado.resumo = {
  verificacoes: t.length * LARGURAS.length,
  violacoesAxe: t.reduce((n, r) => n + r.axe.length, 0),
  overflow: t.reduce((n, r) => n + r.overflow.length, 0),
  focoInvisivel: t.reduce((n, r) => n + (r.teclado?.semFocoVisivel.length ?? 0), 0),
  zoom200Overflow: t.filter((r) => r.zoom200Overflow > 0).length,
  reducedMotion: resultado.reducedMotion.elementosComMovimento.length,
  htmlLangErrado: t.reduce((n, r) => n + r.langErrado.length, 0),
};
await writeFile(SAIDA, JSON.stringify(resultado, null, 2));
console.log("RESUMO", JSON.stringify(resultado.resumo));
