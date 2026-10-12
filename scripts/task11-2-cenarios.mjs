// Task 11.2 — cenários de teclado: diálogos (foco inicial, trap, Esc, retorno), formulários
// (aria-invalid, aria-describedby, live regions) e ativação por Enter/Espaço. Chromium + Playwright,
// teclas via CDP (não passam por leitor de tela). Escritas na API bloqueadas (task11-2-comum.mjs).
// Uso: node scripts/task11-2-cenarios.mjs <dir-saida>
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { abrir, dadosDemo, novoContexto } from "./task11-2-comum.mjs";

const SAIDA = path.resolve(process.argv[2] ?? "test-results/task11-2-cenarios");
await mkdir(path.join(SAIDA, "traces"), { recursive: true });
await mkdir(path.join(SAIDA, "capturas"), { recursive: true });
const demo = await dadosDemo();
const browser = await chromium.launch();
const casos = [];
const registrar = (c) => { casos.push(c); console.log(`${c.resultado.padEnd(12)} ${c.id} ${c.observado.slice(0, 150)}`); };
const SEL_DIALOGO = "[role=dialog],[role=alertdialog]";

async function pagina(perfil, largura = 1280) {
  const context = await novoContexto(browser, { perfil, locale: "pt-BR", sessoes: demo.sessoes, viewport: { width: largura, height: 900 } });
  await context.tracing.start({ screenshots: true, snapshots: true });
  return { context, page: await context.newPage() };
}
async function fechar({ context }, nome) {
  await context.tracing.stop({ path: path.join(SAIDA, "traces", `${nome}.zip`) });
  await context.close();
}
const focoAtual = (page) => page.evaluate(() => { const a = document.activeElement; return !a || a === document.body ? "body" : `${a.tagName.toLowerCase()}${a.id ? `#${a.id}` : ""} "${(a.getAttribute("aria-label") || a.innerText || a.value || "").replace(/\s+/g, " ").trim().slice(0, 40)}"`; });

// Diálogo aberto por teclado: Enter no gatilho, foco inicial, 12 Tab + 12 Shift+Tab, Esc e retorno.
async function dialogo({ id, tela, largura, gatilho, page }) {
  const base = { id, wcag: "2.1.1, 2.1.2, 2.4.3, 4.1.2", tela, viewport: `${largura}px`, esperado: "Enter abre; foco inicial dentro; Tab/Shift+Tab presos; Esc fecha; foco volta ao gatilho com estado atualizado" };
  if (!(await gatilho.count()) || !(await gatilho.first().isVisible())) return registrar({ ...base, elemento: "gatilho não encontrado", observado: "gatilho ausente/invisível nesta largura", resultado: "INCONCLUSIVO", evidencia: `traces/${id}.zip` });
  const g = gatilho.first();
  const nomeGatilho = await g.evaluate((el) => { el.dataset.gatilho = "1"; return (el.getAttribute("aria-label") || el.innerText).trim().slice(0, 40); });
  await g.focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(400);
  const aberto = await page.evaluate((sel) => {
    const d = [...document.querySelectorAll(sel)].at(-1);
    if (!d) return null;
    const rot = d.getAttribute("aria-labelledby");
    return { papel: d.getAttribute("role"), modal: d.getAttribute("aria-modal"), nome: d.getAttribute("aria-label") || (rot && document.getElementById(rot)?.textContent.trim()) || "", focoDentro: d.contains(document.activeElement), rootInert: document.getElementById("root")?.hasAttribute("inert") ?? false };
  }, SEL_DIALOGO);
  if (!aberto) return registrar({ ...base, elemento: `gatilho "${nomeGatilho}"`, observado: "Enter não abriu diálogo", resultado: "FALHA", evidencia: `traces/${id}.zip` });
  const focoInicial = await focoAtual(page);
  await page.screenshot({ path: path.join(SAIDA, "capturas", `${id}-aberto.png`) });
  let fora = 0;
  for (const tecla of [...Array(12).fill("Tab"), ...Array(12).fill("Shift+Tab")]) {
    await page.keyboard.press(tecla);
    if (!(await page.evaluate((sel) => [...document.querySelectorAll(sel)].at(-1)?.contains(document.activeElement) ?? false, SEL_DIALOGO))) fora += 1;
  }
  await page.evaluate(() => { const g = document.querySelector("[data-gatilho]"); window.__exp = "(sem foco)"; g?.addEventListener("focus", () => { window.__exp = g.getAttribute("aria-expanded"); }, { once: true }); });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  const depois = await page.evaluate((sel) => ({ fechado: !document.querySelector(sel), retorno: document.activeElement?.dataset?.gatilho === "1", expandidoNoFoco: window.__exp, expandidoAgora: document.querySelector("[data-gatilho]")?.getAttribute("aria-expanded") }), SEL_DIALOGO);
  const focoFinal = await focoAtual(page);
  const falhas = [];
  if (!aberto.focoDentro) falhas.push("foco inicial fora do diálogo");
  if (fora) falhas.push(`${fora}/24 paradas fora do diálogo`);
  if (!depois.fechado) falhas.push("Esc não fechou");
  if (depois.fechado && !depois.retorno) falhas.push(`foco não voltou ao gatilho (${focoFinal})`);
  if (!aberto.nome) falhas.push("diálogo sem nome acessível");
  if (depois.expandidoNoFoco === "true") falhas.push("gatilho recebe foco ainda com aria-expanded=true");
  registrar({ ...base, elemento: `${aberto.papel} "${aberto.nome}" (gatilho "${nomeGatilho}")`,
    observado: `aria-modal=${aberto.modal}; root inert=${aberto.rootInert}; foco inicial ${focoInicial}; ${fora}/24 fora; Esc ${depois.fechado ? "fechou" : "não fechou"}; foco final ${focoFinal}; aria-expanded no foco=${depois.expandidoNoFoco}, depois=${depois.expandidoAgora}`,
    resultado: falhas.length ? "FALHA" : "PASSA", falhas, evidencia: `traces/${id}.zip; capturas/${id}-aberto.png` });
}

// Formulário enviado vazio/inválido por teclado: estado de erro associado ao campo.
async function formulario({ id, tela, page, enviar, wcag = "3.3.1, 3.3.2, 4.1.2, 4.1.3" }) {
  await enviar();
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    const campos = [...document.querySelectorAll("main input, main select, main textarea")].filter((c) => c.type !== "hidden" && c.offsetParent !== null);
    const invalidos = campos.filter((c) => c.getAttribute("aria-invalid") === "true").map((c) => {
      const ids = (c.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean);
      const desc = ids.map((i) => document.getElementById(i)?.textContent.trim() ?? `(id ${i} inexistente)`).join(" | ");
      const rotulo = c.labels?.[0]?.textContent.trim() || c.getAttribute("aria-label") || c.name;
      return { rotulo, desc };
    });
    const vivos = [...document.querySelectorAll("[role=alert],[role=status],[aria-live]")].map((n) => `${n.getAttribute("role") ?? `aria-live=${n.getAttribute("aria-live")}`}: ${n.textContent.trim().slice(0, 70)}`).filter((s) => !/:\s*$/.test(s));
    return { totalCampos: campos.length, invalidos, vivos };
  });
  const foco = await focoAtual(page);
  await page.screenshot({ path: path.join(SAIDA, "capturas", `${id}.png`), fullPage: true });
  const semDesc = r.invalidos.filter((i) => !i.desc || /inexistente/.test(i.desc));
  const falhas = [];
  if (!r.invalidos.length && !r.vivos.length) falhas.push("nenhum erro identificado (nem aria-invalid nem região viva)");
  if (semDesc.length) falhas.push(`${semDesc.length} campo(s) inválido(s) sem descrição associada`);
  registrar({ id, wcag, tela, viewport: "1280px", elemento: `formulário (${r.totalCampos} campos)`,
    esperado: "erro identificado em texto, campo com aria-invalid e aria-describedby apontando para a mensagem; mensagem anunciável (alert/status)",
    observado: `inválidos: ${r.invalidos.map((i) => `${i.rotulo} → "${i.desc}"`).join("; ") || "nenhum"}; regiões vivas: ${r.vivos.join(" / ") || "nenhuma"}; foco após envio: ${foco}`,
    resultado: falhas.length ? "FALHA" : "PASSA", falhas, evidencia: `traces/; capturas/${id}.png` });
}

// ---------- 1. Diálogos ----------
{
  const s = await pagina("loc");
  await abrir(s.page, "/historico");
  await dialogo({ id: "DLG-01", tela: "/historico (menu da conta)", largura: 1280, page: s.page, gatilho: s.page.locator("button.appbar__account") });
  await abrir(s.page, "/conta");
  await dialogo({ id: "DLG-03", tela: "/conta (Deletar conta)", largura: 1280, page: s.page, gatilho: s.page.getByRole("button", { name: "Deletar conta" }) });
  await abrir(s.page, "/conta");
  await s.page.getByRole("button", { name: "Privacidade (LGPD)" }).click();
  await dialogo({ id: "DLG-04", tela: "/conta (Anonimizar)", largura: 1280, page: s.page, gatilho: s.page.getByRole("button", { name: "Anonimizar minha conta" }) });
  await fechar(s, "dialogos-locatario-1280");
}
{
  const s = await pagina("loc", 375);
  await abrir(s.page, "/historico");
  await dialogo({ id: "DLG-02", tela: "/historico (menu da conta, barra inferior)", largura: 375, page: s.page, gatilho: s.page.locator("button.tabbar__item[aria-haspopup=dialog]") });
  await fechar(s, "dialogos-locatario-375");
}
{
  const s = await pagina("dono");
  await abrir(s.page, "/cadastro-carros");
  await dialogo({ id: "DLG-05", tela: "/cadastro-carros (Excluir veículo)", largura: 1280, page: s.page, gatilho: s.page.locator('button[aria-label^="Excluir "]') });
  await abrir(s.page, "/cadastro-garagens");
  await dialogo({ id: "DLG-06", tela: "/cadastro-garagens (Excluir garagem)", largura: 1280, page: s.page, gatilho: s.page.locator('button[aria-label^="Excluir "]') });
  await abrir(s.page, "/relatorios/avaliacoes-filtro");
  await dialogo({ id: "DLG-07", tela: "/relatorios/avaliacoes-filtro (calendário)", largura: 1280, page: s.page, gatilho: s.page.locator("button.datepick__trigger") });
  await fechar(s, "dialogos-locador");
}
{
  // Confirmação de cancelamento: o botão que abre a confirmação é desmontado; o foco não pode se perder.
  const s = await pagina("loc");
  await abrir(s.page, "/cancelamento", demo.comReserva(demo.porStatus("CONFIRMADA")));
  const pedir = s.page.getByRole("button", { name: "Solicitar cancelamento" });
  if (await pedir.count()) {
    await pedir.focus();
    await s.page.keyboard.press("Enter");
    await s.page.waitForTimeout(300);
    const aposAbrir = await focoAtual(s.page);
    const voltar = s.page.locator(".post-confirm").getByRole("button").first();
    await voltar.focus();
    await s.page.keyboard.press("Enter");
    await s.page.waitForTimeout(300);
    const aposVoltar = await focoAtual(s.page);
    const falhas = [aposAbrir === "body" && "foco perdido (body) ao abrir a confirmação", aposVoltar === "body" && "foco perdido (body) ao voltar"].filter(Boolean);
    registrar({ id: "DLG-08", wcag: "2.4.3", tela: "/cancelamento (confirmação em linha)", viewport: "1280px", elemento: 'botão "Solicitar cancelamento" → região role=dialog', esperado: "foco movido para a confirmação e devolvido ao botão ao voltar", observado: `foco após abrir: ${aposAbrir}; após Voltar: ${aposVoltar}`, resultado: falhas.length ? "FALHA" : "PASSA", falhas, evidencia: "traces/cancelamento.zip" });
  } else registrar({ id: "DLG-08", wcag: "2.4.3", tela: "/cancelamento", viewport: "1280px", elemento: "-", esperado: "-", observado: "reserva não cancelável no seed atual", resultado: "INCONCLUSIVO", evidencia: "" });
  await fechar(s, "cancelamento");
}

// ---------- 2. Formulários ----------
{
  const s = await pagina(null);
  await abrir(s.page, "/login");
  await formulario({ id: "FRM-01", tela: "/login (vazio)", page: s.page, enviar: async () => { await s.page.locator("#email").focus(); await s.page.keyboard.press("Enter"); } });
  // Credencial recusada: resposta 401 simulada (não toca o backend nem o contador de tentativas).
  await s.context.route("**/api/conta/auth/login", (route) => route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ success: false, message: "E-mail ou senha inválidos." }) }));
  await abrir(s.page, "/login");
  await formulario({ id: "FRM-02", tela: "/login (401 simulado)", page: s.page, enviar: async () => { await s.page.locator("#email").fill("teste@exemplo.com"); await s.page.locator("#senha").fill("SenhaErrada1!"); await s.page.locator("#senha").press("Enter"); } });
  await abrir(s.page, "/cadastro");
  await formulario({ id: "FRM-03", tela: "/cadastro etapa 1 (vazio)", page: s.page, enviar: async () => { await s.page.locator("form button[type=submit]").focus(); await s.page.keyboard.press("Enter"); } });
  await abrir(s.page, "/recuperar-senha");
  await formulario({ id: "FRM-04", tela: "/recuperar-senha (vazio)", page: s.page, enviar: async () => { await s.page.locator("form button[type=submit]").focus(); await s.page.keyboard.press("Enter"); } });
  await fechar(s, "formularios-publicos");
}
{
  const s = await pagina("loc");
  await abrir(s.page, "/escolha-garagem-retirada", { ...demo.J_PRE, retirada: { ...demo.J_PRE.retirada, date: "01/01/2020" } });
  await formulario({ id: "FRM-05", tela: "/escolha-garagem-retirada (data passada)", page: s.page, enviar: async () => { const b = s.page.locator("main").getByRole("button", { name: /devolução/i }).last(); await b.focus(); await s.page.keyboard.press("Enter"); } });
  await abrir(s.page, "/desbloqueio", demo.comReserva(demo.porStatus("CONFIRMADA")));
  await formulario({ id: "FRM-06", tela: "/desbloqueio (código vazio)", page: s.page, enviar: async () => { const b = s.page.locator("main form button[type=submit], main button.btn--lg").first(); await b.focus(); await s.page.keyboard.press("Enter"); } });
  await fechar(s, "formularios-locatario");
}

// ---------- 3. Ativação por teclado ----------
async function alternancia({ id, tela, page, alvo, atributo, wcag = "2.1.1, 4.1.2" }) {
  if (!(await alvo.count())) return registrar({ id, wcag, tela, viewport: "1280px", elemento: "-", esperado: "-", observado: "controle não encontrado", resultado: "INCONCLUSIVO", evidencia: "" });
  const el = alvo.first();
  const nome = (await el.evaluate((n) => n.getAttribute("aria-label") || n.innerText)).trim().slice(0, 40);
  await el.focus();
  const v0 = await el.getAttribute(atributo);
  await page.keyboard.press("Space"); await page.waitForTimeout(250);
  const v1 = await el.getAttribute(atributo);
  await page.keyboard.press("Enter"); await page.waitForTimeout(250);
  const v2 = await el.getAttribute(atributo);
  const ok = v1 !== v0 && v2 === v0;
  registrar({ id, wcag, tela, viewport: "1280px", elemento: `"${nome}" [${atributo}]`, esperado: "Espaço alterna o estado; Enter alterna de volta; estado exposto no atributo", observado: `${atributo}: ${v0} → Espaço → ${v1} → Enter → ${v2}`, resultado: ok ? "PASSA" : "FALHA", evidencia: "traces/ativacao.zip" });
}
{
  const s = await pagina("loc");
  const p = s.page;
  await abrir(p, "/");
  const pular = p.locator("a[href='#conteudo-principal']").first();
  await pular.focus(); await p.keyboard.press("Enter"); await p.waitForTimeout(300);
  const destino = await p.evaluate(() => document.activeElement?.id || document.activeElement?.tagName);
  registrar({ id: "KEY-01", wcag: "2.4.1, 2.1.1", tela: "/", viewport: "1280px", elemento: 'link "Pular para o conteúdo"', esperado: "Enter move o foco para o conteúdo principal", observado: `foco em: ${destino}`, resultado: destino === "conteudo-principal" ? "PASSA" : "FALHA", evidencia: "traces/ativacao.zip" });
  const link = p.locator("main a[href^='/carros/']").first();
  const href = await link.getAttribute("href");
  await link.focus(); await p.keyboard.press("Enter"); await p.waitForURL((u) => u.pathname === href, { timeout: 5000 }).catch(() => {});
  registrar({ id: "KEY-02", wcag: "2.1.1", tela: "/", viewport: "1280px", elemento: `link de cartão (${href?.replace(/[0-9a-f-]{36}/, ":id")})`, esperado: "Enter segue o link", observado: `URL: ${new URL(p.url()).pathname.replace(/[0-9a-f-]{36}/, ":id")}`, resultado: new URL(p.url()).pathname === href ? "PASSA" : "FALHA", evidencia: "traces/ativacao.zip" });
  await abrir(p, "/carros/lista");
  await alternancia({ id: "KEY-03", tela: "/carros/lista (chip de categoria)", page: p, alvo: p.locator("main button[aria-pressed]"), atributo: "aria-pressed" });
  await abrir(p, "/conta");
  await alternancia({ id: "KEY-04", tela: "/conta (seção expansível)", page: p, alvo: p.locator("main button[aria-expanded]"), atributo: "aria-expanded" });
  await abrir(p, "/historico");
  const resumo = p.locator("main details > summary").first();
  if (await resumo.count()) {
    const aberto = () => resumo.evaluate((s) => s.parentElement.open);
    await resumo.focus();
    const a0 = await aberto(); await p.keyboard.press("Enter"); await p.waitForTimeout(200);
    const a1 = await aberto(); await p.keyboard.press("Space"); await p.waitForTimeout(200);
    const a2 = await aberto();
    registrar({ id: "KEY-05", wcag: "2.1.1, 4.1.2", tela: "/historico (Ver detalhes da cobertura)", viewport: "1280px", elemento: `summary "${(await resumo.innerText()).trim()}"`, esperado: "Enter abre e Espaço fecha o details (estado expandido exposto)", observado: `details.open: ${a0} → Enter → ${a1} → Espaço → ${a2}`, resultado: a1 !== a0 && a2 === a0 ? "PASSA" : "FALHA", evidencia: "traces/ativacao.zip" });
  } else registrar({ id: "KEY-05", wcag: "2.1.1, 4.1.2", tela: "/historico", viewport: "1280px", elemento: "-", esperado: "-", observado: "summary não encontrado", resultado: "INCONCLUSIVO", evidencia: "" });
  await abrir(p, "/configuracoes");
  const radios = p.locator("main [role=radio]");
  if (await radios.count() > 1) {
    const marcado = p.locator("main [role=radio][aria-checked=true]").first();
    const nomeAtual = (await marcado.innerText()).trim();
    const outro = p.locator("main [role=radio][aria-checked=false]").first();
    const nomeOutro = (await outro.innerText()).trim();
    await outro.focus(); await p.keyboard.press("Space"); await p.waitForTimeout(250);
    const ok = (await p.locator("main [role=radio][aria-checked=true]").first().innerText()).trim() === nomeOutro;
    await p.locator("main [role=radio]", { hasText: nomeAtual }).first().focus(); await p.keyboard.press("Enter"); await p.waitForTimeout(250);
    const restaurado = (await p.locator("main [role=radio][aria-checked=true]").first().innerText()).trim() === nomeAtual;
    registrar({ id: "KEY-06", wcag: "2.1.1, 4.1.2", tela: "/configuracoes (tema)", viewport: "1280px", elemento: `radiogroup de tema ("${nomeOutro}")`, esperado: "Espaço seleciona a opção (aria-checked=true); Enter também", observado: `${ok ? "selecionada por Espaço" : "não mudou com Espaço"}; ${restaurado ? "restaurada por Enter" : "Enter não restaurou"}`, resultado: ok && restaurado ? "PASSA" : "FALHA", evidencia: "traces/ativacao.zip" });
  } else registrar({ id: "KEY-06", wcag: "2.1.1, 4.1.2", tela: "/configuracoes (tema)", viewport: "1280px", elemento: "-", esperado: "-", observado: "opções de tema não encontradas no main", resultado: "INCONCLUSIVO", evidencia: "" });
  // Trocar idioma remonta a árvore: o foco tem de continuar no seletor (3.2.2 / 2.4.3).
  for (const [kid, seletor, onde] of [["KEY-07", "header select", "cabeçalho"], ["KEY-08", "main select", "página"]]) {
    await abrir(p, "/configuracoes");
    const idioma = p.locator(seletor).first();
    if (!(await idioma.count())) { registrar({ id: kid, wcag: "2.1.1, 2.4.3, 3.2.2", tela: `/configuracoes (idioma, ${onde})`, viewport: "1280px", elemento: "-", esperado: "-", observado: "select não encontrado", resultado: "INCONCLUSIVO", evidencia: "" }); continue; }
    await idioma.focus();
    const l0 = await p.evaluate(() => document.documentElement.lang);
    await p.keyboard.press("ArrowDown"); await p.waitForTimeout(500);
    const l1 = await p.evaluate(() => document.documentElement.lang);
    const focoSelect = await p.evaluate(() => document.activeElement?.tagName === "SELECT");
    const foco1 = await focoAtual(p);
    if (focoSelect) { await p.keyboard.press("ArrowUp"); await p.waitForTimeout(500); }
    else { await p.locator(seletor).first().selectOption({ index: 0 }); await p.waitForTimeout(500); }
    const l2 = await p.evaluate(() => document.documentElement.lang);
    registrar({ id: kid, wcag: "2.1.1, 2.4.3, 3.2.2", tela: `/configuracoes (idioma, ${onde})`, viewport: "1280px", elemento: `select de idioma (${onde})`, esperado: "seta muda o idioma, html lang acompanha e o foco permanece no seletor", observado: `html lang: ${l0} → ↓ ${l1} (foco: ${foco1}) → ${l2}`, resultado: l1 !== l0 && focoSelect ? "PASSA" : "FALHA", evidencia: "traces/ativacao.zip" });
  }
  await fechar(s, "ativacao");
}

await browser.close();
await writeFile(path.join(SAIDA, "cenarios.json"), JSON.stringify({ geradoEm: new Date().toISOString(), casos }, null, 2));
const n = (r) => casos.filter((c) => c.resultado === r).length;
console.log(`RESUMO ${casos.length} casos: PASSA ${n("PASSA")}, FALHA ${n("FALHA")}, INCONCLUSIVO ${n("INCONCLUSIVO")}`);
