// Task 11.2 — varredura automatizada de acessibilidade, navegação semântica e alvos de toque.
// Ambiente: frontend em MOVA_BASE, backend em MOVA_API_BASE_URL (mova_dev com seed de demonstração).
// Toda escrita na API é BLOQUEADA (só GET e POST /reserva/precificacao passam): nada é gravado no banco.
// O que vem da árvore de acessibilidade do Chromium (CDP) é "semântica inspecionada", não fala de leitor de tela.
// Uso: MOVA_LOCALE=pt-BR|en|es node scripts/task11-2-a11y.mjs <dir-saida> [filtro-de-tela]
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { BASE, abrir, dadosDemo, novoContexto } from "./task11-2-comum.mjs";

const LOCALE = process.env.MOVA_LOCALE ?? "pt-BR";
const SAIDA = path.resolve(process.argv[2] ?? "test-results/task11-2");
const FILTRO = process.argv[3] ?? "";
const LARGURAS = (process.env.MOVA_WIDTHS ?? "320,375,402,768,1024,1440").split(",").map(Number);
const LARGURAS_ESCURO = [375, 1440];
const LARGURAS_SEMANTICA = [375, 1280];
const TAGS_21 = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
const TAGS_22 = ["wcag22aa"]; // inclui target-size (2.5.8), desabilitada por padrão no axe-core
const BOAS_PRATICAS = ["region", "landmark-one-main", "landmark-unique", "landmark-no-duplicate-main", "page-has-heading-one", "heading-order", "empty-heading"];
const HTML_LANG = { "pt-BR": "pt-BR", en: "en", es: "es" }[LOCALE];
const COM_TECLADO = LOCALE === "pt-BR" || process.env.MOVA_TECLADO === "1";

// ---------- dados de apoio (somente leitura) ----------
const demo = await dadosDemo();
const { veiculoPcd, porStatus, J_PRE, comReserva, veiculoLocador, garagemLocador } = demo;

// [id, rota, perfil, jornada]
const TELAS = [
  ["home", "/", null], ["login", "/login", null], ["cadastro", "/cadastro", null], ["recuperar-senha", "/recuperar-senha", null],
  ["tipos", "/carros", null], ["catalogo", "/carros/lista", null], ["detalhe", `/carros/${veiculoPcd.id}`, null], ["404", "/rota-inexistente", null],
  ["historico", "/historico", "loc"], ["reserva", `/reservas/${porStatus("CONFIRMADA")}`, "loc"], ["favoritos", "/carros/favoritos", "loc"],
  ["interesses", "/interesses", "loc"], ["pendencias", "/pendencias-financeiras", "loc"], ["conta", "/conta", "loc"], ["configuracoes", "/configuracoes", "loc"],
  ["suporte", "/suporte", "loc"], ["retirada", "/escolha-garagem-retirada", "loc", J_PRE], ["devolucao-garagem", "/escolha-garagem-devolucao", "loc", J_PRE],
  ["servicos", "/servicos-opcionais", "loc", J_PRE], ["checkout", "/checkout-reserva", "loc", J_PRE], ["condutores", "/condutores-adicionais", "loc", comReserva(porStatus("CONFIRMADA"))],
  ["pagamento", "/pagamento", "loc", comReserva(porStatus("CONFIRMADA"))], ["cancelamento", "/cancelamento", "loc", comReserva(porStatus("CONFIRMADA"))],
  ["desbloqueio", "/desbloqueio", "loc", comReserva(porStatus("CONFIRMADA"))], ["rastreamento", `/reserva/${porStatus("EM_ANDAMENTO")}/localizacao`, "loc"],
  ["devolucao", "/devolucao", "loc", comReserva(porStatus("EM_ANDAMENTO"))], ["avaliacao", "/avaliacao", "loc", comReserva(porStatus("REALIZADA"))],
  ["painel", "/painel", "dono"], ["frota", "/cadastro-carros", "dono"], ["veiculo", `/cadastro-carros/${veiculoLocador}`, "dono"],
  ["garagens", "/cadastro-garagens", "dono"], ["garagem", `/cadastro-garagens/${garagemLocador}`, "dono"], ["capacidade", `/cadastro-garagens/${garagemLocador}/capacidade`, "dono"],
  ["reservas-frota", "/reservas", "dono"], ["monitoramento", "/monitoramento", "dono"], ["relatorios", "/relatorios", "dono"],
  ["relatorio-veiculos", "/relatorios/veiculos", "dono"], ["avaliacoes-filtro", "/relatorios/avaliacoes-filtro", "dono"], ["relatorio-avaliacoes", "/relatorios/avaliacoes", "dono"],
].filter(([id]) => !FILTRO || id.includes(FILTRO));

// ---------- navegador ----------
const browser = await chromium.launch();

// ---------- medições na página ----------
// Alvos de ponteiro (WCAG 2.2 SC 2.5.8 AA e objetivo de projeto 44×44). Executa no navegador.
function medirAlvos() {
  const SEL = 'a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=link],[role=checkbox],[role=radio],[role=switch],[role=tab],[role=menuitem],[role=option],[tabindex]:not([tabindex="-1"])';
  const todos = [...document.querySelectorAll(SEL)].filter((el) => !el.closest("[inert]") && !el.disabled && el.getAttribute("aria-disabled") !== "true");
  const descrever = (el) => {
    const id = el.id ? `#${el.id}` : "";
    const cls = typeof el.className === "string" && el.className.trim() ? `.${el.className.trim().split(/\s+/).slice(0, 2).join(".")}` : "";
    const nome = (el.getAttribute("aria-label") || el.innerText || el.value || el.getAttribute("title") || el.getAttribute("name") || "").replace(/\s+/g, " ").trim().slice(0, 60);
    return { sel: `${el.tagName.toLowerCase()}${id}${cls}`, nome };
  };
  const posFixa = (el) => { for (let n = el; n && n !== document.body; n = n.parentElement) { const p = getComputedStyle(n).position; if (p === "fixed" || p === "sticky") return true; } return false; };
  const oculto = (el, r, cs) => r.bottom + window.scrollY <= 0 || r.right + window.scrollX <= 0 || cs.visibility === "hidden" || cs.display === "none" || r.width === 0 || r.height === 0 || (r.width <= 1 && r.height <= 1) || cs.clipPath === "inset(50%)" || parseFloat(cs.opacity) === 0;
  const uniao = (a, b) => DOMRect.fromRect({ x: Math.min(a.left, b.left), y: Math.min(a.top, b.top), width: Math.max(a.right, b.right) - Math.min(a.left, b.left), height: Math.max(a.bottom, b.bottom) - Math.min(a.top, b.top) });
  const alvos = [];
  for (const el of todos) {
    const cs = getComputedStyle(el);
    let r = el.getBoundingClientRect();
    const base = descrever(el);
    let origem = "elemento";
    // Checkbox/radio escondido visualmente com rótulo visível: o alvo real é o rótulo.
    if (oculto(el, r, cs) && el.labels?.length && ["checkbox", "radio"].includes(el.type)) {
      const lr = [...el.labels].map((l) => l.getBoundingClientRect()).filter((x) => x.width > 1);
      if (lr.length) { r = lr.reduce(uniao); origem = "rótulo"; }
    }
    if (origem === "elemento" && oculto(el, r, cs)) {
      const renderizado = el.checkVisibility?.({ visibilityProperty: true }) ?? cs.display !== "none";
      let noFoco = null;
      if (renderizado && el.tabIndex >= 0) {
        // Visualmente oculto mas focável (ex.: "Pular para o conteúdo"): mede de novo com foco.
        const antes = document.activeElement; const tr = el.style.transition;
        el.style.transition = "none"; el.focus();
        const rf = el.getBoundingClientRect(); const cf = getComputedStyle(el);
        noFoco = { w: Math.round(rf.width), h: Math.round(rf.height), visivel: !oculto(el, rf, cf) };
        el.blur(); el.style.transition = tr; antes?.focus?.();
      }
      alvos.push({ ...base, oculto: renderizado ? "visualmente-oculto" : "nao-renderizado", noFoco, w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10 });
      continue;
    }
    let ef = r;
    if (origem === "elemento" && el.labels?.length && ["checkbox", "radio"].includes(el.type)) {
      for (const l of el.labels) { const lr = l.getBoundingClientRect(); if (lr.width > 1) ef = uniao(ef, lr); }
      if (ef !== r) origem = "elemento+rótulo";
    }
    const pai = el.parentElement;
    const textoPai = (pai?.innerText ?? "").replace(/\s+/g, " ").trim();
    const inline = el.tagName === "A" && cs.display.startsWith("inline") && pai && !/flex|grid/.test(getComputedStyle(pai).display) && textoPai.length > (el.innerText ?? "").trim().length + 3;
    const nativo = ["checkbox", "radio", "date", "time", "file", "range", "color"].includes(el.type) && cs.appearance !== "none";
    alvos.push({ ...base, oculto: false, origem, fixo: posFixa(el), inline, nativo,
      w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10, wEf: Math.round(ef.width * 10) / 10, hEf: Math.round(ef.height * 10) / 10,
      x: ef.left + window.scrollX, y: ef.top + window.scrollY, x2: ef.right + window.scrollX, y2: ef.bottom + window.scrollY, _el: el });
  }
  const vis = alvos.filter((a) => !a.oculto);
  const rotuloDe = (a, b) => Boolean(a._el.labels?.length && [...a._el.labels].some((l) => l === b._el || l.contains(b._el)));
  const aninhado = (a, b) => a._el.contains(b._el) || b._el.contains(a._el) || rotuloDe(a, b) || rotuloDe(b, a);
  const centro = (a) => [(a.x + a.x2) / 2, (a.y + a.y2) / 2];
  const pequeno = (a) => a.wEf < 24 || a.hEf < 24;
  for (const a of vis) {
    const [cx, cy] = centro(a);
    // Como o target-size do axe: vale a maior área não obstruída. Um adorno dentro do campo (ex.: botão
    // "exibir senha") sobrepõe, mas o campo continua com área livre >= 24 px.
    const sobre = vis.filter((b) => b !== a && b.fixo === a.fixo && !aninhado(a, b) && Math.min(a.x2, b.x2) - Math.max(a.x, b.x) > 1 && Math.min(a.y2, b.y2) - Math.max(a.y, b.y) > 1);
    let livreW = a.x2 - a.x; let livreH = a.y2 - a.y;
    for (const b of sobre) {
      const topo = document.elementFromPoint((Math.max(a.x, b.x) + Math.min(a.x2, b.x2)) / 2 - window.scrollX, (Math.max(a.y, b.y) + Math.min(a.y2, b.y2)) / 2 - window.scrollY);
      if (!topo || !b._el.contains(topo)) continue; // b não está por cima de a
      livreW = Math.min(livreW, Math.max(b.x - a.x, a.x2 - b.x2, 0));
      livreH = Math.min(livreH, Math.max(b.y - a.y, a.y2 - b.y2, 0));
    }
    a.areaLivre = sobre.length ? `${Math.round(livreW)}x${Math.round(a.y2 - a.y)} ou ${Math.round(a.x2 - a.x)}x${Math.round(livreH)}` : null;
    const livreOk = !sobre.length || (livreW >= 24 && a.y2 - a.y >= 24) || (livreH >= 24 && a.x2 - a.x >= 24);
    a.sobreposicoes = livreOk ? [] : sobre.map((b) => b.sel);
    a.sobreposicoesToleradas = livreOk && sobre.length ? sobre.map((b) => b.sel) : [];
    if (pequeno(a)) {
      // Exceção de espaçamento: círculo de 24 px de diâmetro centrado no alvo não intersecta outro alvo nem o círculo de outro alvo pequeno.
      const conflitos = vis.filter((b) => b !== a && b.fixo === a.fixo && !aninhado(a, b)).filter((b) => {
        const dx = Math.max(b.x - cx, 0, cx - b.x2); const dy = Math.max(b.y - cy, 0, cy - b.y2);
        if (Math.hypot(dx, dy) < 12) return true;
        if (pequeno(b)) { const [bx, by] = centro(b); return Math.hypot(bx - cx, by - cy) < 24; }
        return false;
      });
      a.espacamentoOk = conflitos.length === 0;
      a.conflitos = conflitos.map((b) => b.sel).slice(0, 4);
    }
  }
  // Acionabilidade: com o alvo centralizado na viewport, o ponto central deve atingir o próprio alvo.
  const scroll0 = [window.scrollX, window.scrollY];
  for (const a of vis) {
    if (a.fixo) { a.coberto = null; continue; }
    a._el.scrollIntoView({ block: "center", inline: "center" });
    const rr = a._el.getBoundingClientRect();
    const hit = document.elementFromPoint(rr.left + rr.width / 2, rr.top + rr.height / 2);
    a.coberto = !hit || a._el.contains(hit) || hit.contains(a._el) || (a._el.labels && [...a._el.labels].some((l) => l.contains(hit))) ? null : descrever(hit).sel;
  }
  window.scrollTo(...scroll0);
  return alvos.map(({ _el, x, y, x2, y2, ...resto }) => resto);
}

// Semântica: título, idioma, imagens, nomes colados e rótulo no nome (executa no navegador).
function inspecionarDom() {
  const visivelSemSr = (el) => { const c = el.cloneNode(true); c.querySelectorAll(".sr-only,[aria-hidden=true]").forEach((n) => n.remove()); return (c.textContent ?? "").replace(/\s+/g, " ").trim(); };
  const imgs = [...document.querySelectorAll("img")].map((img) => ({ src: img.getAttribute("src")?.slice(-40), alt: img.getAttribute("alt"), decorativa: img.getAttribute("alt") === "" || img.getAttribute("aria-hidden") === "true" || img.closest("[aria-hidden=true]") !== null, w: img.getBoundingClientRect().width }));
  const svgs = [...document.querySelectorAll("svg")].filter((s) => !s.closest("[aria-hidden=true]") && s.getAttribute("aria-hidden") !== "true" && s.getAttribute("role") !== "img" && !s.querySelector("title"));
  let k = 0;
  document.querySelectorAll("a[href],button,[role=button],[role=link]").forEach((el) => { el.dataset.a11yN = String(k++); });
  document.querySelectorAll(".sr-only").forEach((s) => { if (s.parentElement && s.parentElement !== document.body) s.parentElement.dataset.a11ySr = "1"; });
  const textosSr = [...document.querySelectorAll("[data-a11y-sr]")].map((el) => (el.textContent ?? "").replace(/\s+/g, " ").trim());
  const controles = [...document.querySelectorAll("[data-a11y-n]")].map((el) => ({ n: el.dataset.a11yN, visivel: visivelSemSr(el), sr: [...el.querySelectorAll(".sr-only")].map((s) => s.textContent.trim()).join(" "), temSr: !!el.querySelector(".sr-only"), ariaLabel: el.getAttribute("aria-label") }));
  return { titulo: document.title, lang: document.documentElement.lang, imgs, svgsSemNome: svgs.length, controles, textosSr };
}

async function arvore(page) {
  const cdp = await page.context().newCDPSession(page);
  const { nodes } = await cdp.send("Accessibility.getFullAXTree");
  const val = (v) => v?.value ?? "";
  const prop = (n, nome) => n.properties?.find((p) => p.name === nome)?.value?.value;
  const vivos = nodes.filter((n) => !n.ignored);
  const papel = (r) => vivos.filter((n) => r.includes(val(n.role))).map((n) => ({ papel: val(n.role), nome: val(n.name).replace(/\s+/g, " ").trim().slice(0, 90), nivel: prop(n, "level"), invalido: prop(n, "invalid"), obrigatorio: prop(n, "required"), expandido: prop(n, "expanded"), pressionado: prop(n, "pressed") }));
  const doc = await cdp.send("DOM.getDocument", { depth: 0 });
  const { nodeIds } = await cdp.send("DOM.querySelectorAll", { nodeId: doc.root.nodeId, selector: "[data-a11y-n]" });
  const nomes = [];
  for (const nodeId of nodeIds) {
    const r = await cdp.send("Accessibility.getPartialAXTree", { nodeId, fetchRelatives: false }).catch(() => null);
    nomes.push(val(r?.nodes?.[0]?.name).replace(/\s+/g, " ").trim());
  }
  // Leitura linear (como o modo de navegação de um leitor de tela monta a linha): concatena os
  // StaticText descendentes, sem separador, e compara com o texto do DOM.
  const porBackend = new Map(nodes.map((n) => [n.backendDOMNodeId, n]));
  const porId = new Map(nodes.map((n) => [n.nodeId, n]));
  const linear = (n) => (n.role?.value === "StaticText" ? (n.ignored ? [] : [val(n.name)]) : (n.childIds ?? []).flatMap((c) => (porId.get(c) ? linear(porId.get(c)) : [])));
  const sr = await cdp.send("DOM.querySelectorAll", { nodeId: doc.root.nodeId, selector: "[data-a11y-sr]" });
  const leituras = [];
  for (const nodeId of sr.nodeIds) {
    const { node } = await cdp.send("DOM.describeNode", { nodeId });
    const ax = porBackend.get(node.backendNodeId);
    leituras.push(ax ? linear(ax).join("") : null);
  }
  await cdp.detach();
  return {
    leituras,
    titulos: papel(["heading"]),
    landmarks: papel(["banner", "navigation", "main", "contentinfo", "complementary", "search", "region", "form"]),
    links: papel(["link"]), botoes: papel(["button", "togglebutton", "PopUpButton", "menuitem", "tab"]),
    campos: papel(["textbox", "searchbox", "combobox", "checkbox", "radio", "switch", "spinbutton", "slider", "listbox", "ComboBoxSelect", "ComboBoxMenuButton", "TextFieldWithComboBox"]),
    alertas: papel(["alert", "status", "log", "alertdialog", "dialog"]),
    nomes,
  };
}

function analisarSemantica(dom, ax) {
  const problemas = [];
  const h = ax.titulos.map((t) => Number(t.nivel));
  if (!h.includes(1)) problemas.push({ wcag: "1.3.1/2.4.6", tipo: "sem-h1", detalhe: "nenhum título de nível 1" });
  h.forEach((n, i) => { if (i && n > h[i - 1] + 1) problemas.push({ wcag: "1.3.1 (boa prática)", tipo: "salto-de-nivel", detalhe: `h${h[i - 1]} → h${n} ("${ax.titulos[i].nome}")` }); });
  ax.titulos.filter((t) => !t.nome).forEach(() => problemas.push({ wcag: "2.4.6", tipo: "titulo-vazio", detalhe: "título sem texto" }));
  const mains = ax.landmarks.filter((l) => l.papel === "main").length;
  if (mains !== 1) problemas.push({ wcag: "1.3.1/2.4.1", tipo: "main", detalhe: `${mains} região main` });
  const navs = ax.landmarks.filter((l) => l.papel === "navigation");
  if (navs.length > 1 && new Set(navs.map((n) => n.nome)).size < navs.length) problemas.push({ wcag: "1.3.1 (boa prática)", tipo: "navegacao-sem-nome-distinto", detalhe: navs.map((n) => n.nome || "(sem nome)").join(" | ") });
  for (const c of [...ax.links, ...ax.botoes, ...ax.campos]) if (!c.nome && c.papel !== "PopUpButton") problemas.push({ wcag: "4.1.2/2.4.4", tipo: "sem-nome", detalhe: `${c.papel} sem nome acessível` });
  dom.controles.forEach((c, i) => {
    const nome = ax.nomes[i] ?? "";
    if (c.temSr && !c.ariaLabel) {
      const esperado = `${c.visivel} ${c.sr}`.replace(/\s+/g, " ").trim();
      if (nome.replace(/\s/g, "") === esperado.replace(/\s/g, "") && nome !== esperado) problemas.push({ wcag: "4.1.2/2.4.4", tipo: "nome-colado", detalhe: `"${nome}" (esperado "${esperado}")` });
    }
    if (c.visivel.length >= 2 && nome && !nome.toLowerCase().replace(/\s/g, "").includes(c.visivel.toLowerCase().replace(/\s/g, ""))) problemas.push({ wcag: "2.5.3", tipo: "rotulo-fora-do-nome", detalhe: `visível "${c.visivel}" × nome "${nome}"` });
  });
  dom.textosSr.forEach((texto, i) => {
    const lido = (ax.leituras[i] ?? "").replace(/\s+/g, " ").trim();
    if (lido && lido !== texto && lido.replace(/\s/g, "") === texto.replace(/\s/g, "")) problemas.push({ wcag: "1.3.1/4.1.2 (leitura linear)", tipo: "texto-colado", detalhe: `"${lido}" (DOM: "${texto}")` });
  });
  dom.imgs.filter((i) => i.alt === null && !i.decorativa).forEach((i) => problemas.push({ wcag: "1.1.1", tipo: "img-sem-alt", detalhe: i.src }));
  dom.imgs.filter((i) => i.alt && /\.(png|jpe?g|webp|svg)$|^https?:/i.test(i.alt)).forEach((i) => problemas.push({ wcag: "1.1.1", tipo: "alt-arquivo", detalhe: i.alt }));
  if (dom.svgsSemNome) problemas.push({ wcag: "1.1.1 (revisão)", tipo: "svg-exposto", detalhe: `${dom.svgsSemNome} svg sem aria-hidden/título` });
  if (dom.lang !== HTML_LANG) problemas.push({ wcag: "3.1.1", tipo: "lang", detalhe: dom.lang });
  if (!dom.titulo) problemas.push({ wcag: "2.4.2", tipo: "titulo-pagina", detalhe: "document.title vazio" });
  return problemas;
}

// Tab/Shift+Tab a partir do início do documento: ordem, foco visível e foco não obscurecido (2.4.11).
async function teclado(page, max = 45) {
  await page.evaluate(() => { window.scrollTo(0, 0); const s = document.createElement("span"); s.tabIndex = -1; document.body.prepend(s); s.focus(); s.remove(); });
  const estado = () => page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    el.dataset.a11yK ??= String((window.__k = (window.__k ?? 0) + 1));
    const cs = getComputedStyle(el);
    const visivel = (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow && cs.boxShadow !== "none");
    const r = el.getBoundingClientRect();
    const pts = [[0.5, 0.5], [0.1, 0.1], [0.9, 0.1], [0.1, 0.9], [0.9, 0.9]].map(([fx, fy]) => [r.left + r.width * fx, r.top + r.height * fy]).filter(([x, y]) => x >= 0 && y >= 0 && x < innerWidth && y < innerHeight);
    let por = null;
    const cobertos = pts.filter(([x, y]) => { const hit = document.elementFromPoint(x, y); const c = hit && !el.contains(hit) && !hit.contains(el) && !(el.labels && [...el.labels].some((l) => l.contains(hit))); if (c) por = `${hit.tagName.toLowerCase()}.${(hit.className?.toString() ?? "").split(/\s+/)[0]}`; return c; }).length;
    const nome = (el.getAttribute("aria-label") || el.innerText || el.value || el.id || "").replace(/\s+/g, " ").trim().slice(0, 50);
    return { k: el.dataset.a11yK, tag: el.tagName.toLowerCase(), nome, focoVisivel: Boolean(visivel), foraDaViewport: pts.length === 0, obscurecido: pts.length ? (cobertos === pts.length ? "total" : cobertos ? "parcial" : "nao") : "fora", cobertoPor: por, rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)] };
  });
  const ida = [];
  for (let i = 0; i < max; i++) {
    await page.keyboard.press("Tab");
    const s = await estado();
    if (!s || (ida.length && s.k === ida[0].k)) break;
    ida.push(s);
  }
  // Se o Tab saiu do documento, volta a partir da última parada (senão a 1ª volta cai nela mesma).
  if (ida.length) await page.evaluate((k) => document.querySelector(`[data-a11y-k="${k}"]`)?.focus(), ida.at(-1).k);
  const volta = [];
  for (let i = 0; i < ida.length - 1; i++) { await page.keyboard.press("Shift+Tab"); const s = await estado(); if (!s) break; volta.push(s); }
  const esperadoVolta = ida.slice(0, -1).reverse().map((s) => s.k);
  return {
    paradas: ida.length, primeiras: ida.slice(0, 5).map((s) => `${s.tag}:${s.nome}`),
    semFocoVisivel: ida.filter((s) => !s.focoVisivel), obscurecidoTotal: [...ida, ...volta].filter((s, i, arr) => s.obscurecido === "total" && arr.findIndex((o) => o.k === s.k && o.obscurecido === "total") === i),
    obscurecidoParcial: ida.filter((s) => s.obscurecido === "parcial").length, foraDaViewport: ida.filter((s) => s.foraDaViewport),
    shiftTabCoerente: JSON.stringify(volta.map((s) => s.k)) === JSON.stringify(esperadoVolta), divergenciasShiftTab: volta.filter((s, i) => s.k !== esperadoVolta[i]).length,
  };
}

const ESPACAMENTO = "* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }";
async function espacamentoTexto(page) {
  await page.addStyleTag({ content: ESPACAMENTO });
  await page.waitForTimeout(150);
  return page.evaluate(() => {
    const cortados = [...document.querySelectorAll("body *")].filter((el) => {
      const cs = getComputedStyle(el);
      if (!el.childNodes.length || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return false;
      if (el.closest(".sr-only") || cs.clipPath === "inset(50%)" || (el.clientWidth <= 1 && el.clientHeight <= 1)) return false;
      const corta = (cs.overflowX === "hidden" || cs.overflowY === "hidden" || cs.overflow === "clip") && cs.textOverflow !== "ellipsis";
      return corta && (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2);
    }).map((el) => `${el.tagName.toLowerCase()}.${(el.className?.toString() ?? "").split(/\s+/)[0]}: ${el.innerText.trim().slice(0, 40)}`);
    return { overflowHorizontal: document.documentElement.scrollWidth - document.documentElement.clientWidth, cortados: cortados.slice(0, 10), totalCortados: cortados.length };
  });
}

function movimento() {
  const dur = (v) => Math.max(...v.split(",").map((s) => parseFloat(s) * (s.trim().endsWith("ms") ? 0.001 : 1)));
  return [...document.querySelectorAll("*")].filter((el) => { const cs = getComputedStyle(el); return (cs.animationName !== "none" && dur(cs.animationDuration) > 0.01 && cs.animationIterationCount !== "1") || dur(cs.transitionDuration) > 0.01; }).map((el) => el.className?.toString().slice(0, 40) || el.tagName).slice(0, 10);
}

// ---------- varredura por tela ----------
await mkdir(SAIDA, { recursive: true });
await mkdir(path.join(SAIDA, "capturas"), { recursive: true });
const resultado = { locale: LOCALE, base: BASE, geradoEm: new Date().toISOString(), larguras: LARGURAS, telas: [] };
const contextos = {};
for (const [id, rota, perfil, jornada] of TELAS) {
  contextos[perfil ?? "vis"] ??= await novoContexto(browser, { perfil, locale: LOCALE, sessoes: demo.sessoes });
  const context = contextos[perfil ?? "vis"];
  const page = context.pages()[0] ?? (await context.newPage());
  if (page.url() === "about:blank") await abrir(page, "/", null);
  const erros = [];
  const onErro = (e) => erros.push(String(e.message ?? e).slice(0, 160));
  page.on("pageerror", onErro);
  context.bloqueadas.length = 0;
  const reg = { id, rota: rota.replace(/[0-9a-f]{8}-[0-9a-f-]{27}/g, ":id"), perfil: perfil ?? "visitante", axe: [], axeEscuro: [], boasPraticas: [], incompletos: 0, overflow: [], alvos: {}, semantica: {}, teclado: {} };
  // Medições com prefers-reduced-motion: reduce (kill-switch do app) para não medir no meio de uma transição.
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  for (const largura of LARGURAS) {
    await page.setViewportSize({ width: largura, height: 900 });
    await abrir(page, rota, jornada);
    for (const [conjunto, tags] of [["2.1", TAGS_21], ["2.2", TAGS_22]]) {
      const axe = await new AxeBuilder({ page }).withTags(tags).analyze();
      for (const v of axe.violations) reg.axe.push({ largura, tema: "claro", conjunto, id: v.id, impacto: v.impact, alvos: v.nodes.map((n) => n.target.join(" ")).slice(0, 4) });
      reg.incompletos += axe.incomplete.length;
    }
    const excesso = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (excesso > 0) reg.overflow.push({ largura, px: excesso });
    reg.alvos[largura] = await page.evaluate(medirAlvos);
    if (largura === 375 || largura === 1440) await page.screenshot({ path: path.join(SAIDA, "capturas", `${LOCALE}-${id}-${largura}.png`) });
    if (largura === 1440) {
      const bp = await new AxeBuilder({ page }).withRules(BOAS_PRATICAS).analyze();
      reg.boasPraticas = bp.violations.map((v) => ({ id: v.id, impacto: v.impact, n: v.nodes.length, alvos: v.nodes.map((x) => x.target.join(" ")).slice(0, 3) }));
    }
  }
  await page.emulateMedia({ colorScheme: "dark" });
  for (const largura of LARGURAS_ESCURO) {
    await page.setViewportSize({ width: largura, height: 900 });
    await abrir(page, rota, jornada);
    const axe = await new AxeBuilder({ page }).withTags([...TAGS_21, ...TAGS_22]).analyze();
    for (const v of axe.violations) reg.axeEscuro.push({ largura, id: v.id, impacto: v.impact, alvos: v.nodes.map((n) => n.target.join(" ")).slice(0, 4) });
  }
  await page.emulateMedia({ colorScheme: "light" });
  reg.espacamento = {};
  for (const largura of LARGURAS_SEMANTICA) {
    await page.setViewportSize({ width: largura, height: 900 });
    await abrir(page, rota, jornada);
    const dom = await page.evaluate(inspecionarDom);
    const ax = await arvore(page);
    reg.semantica[largura] = { titulo: dom.titulo, lang: dom.lang, problemas: analisarSemantica(dom, ax), titulos: ax.titulos, landmarks: ax.landmarks, links: ax.links.length, botoes: ax.botoes.length, campos: ax.campos, alertas: ax.alertas, imagens: dom.imgs.length, imagensDecorativas: dom.imgs.filter((i) => i.decorativa).length, listaLinks: ax.links.map((l) => l.nome), listaBotoes: ax.botoes.map((b) => `${b.nome}${b.pressionado !== undefined ? ` [pressed=${b.pressionado}]` : ""}${b.expandido !== undefined ? ` [expanded=${b.expandido}]` : ""}`) };
    if (COM_TECLADO) reg.teclado[largura] = await teclado(page);
    await abrir(page, rota, jornada);
    reg.espacamento[largura] = await espacamentoTexto(page);
  }
  await page.setViewportSize({ width: 640, height: 450 });
  await abrir(page, rota, jornada);
  reg.zoom200Overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await abrir(page, rota, jornada);
  reg.movimentoComReduce = await page.evaluate(movimento);
  reg.htmlLang = await page.evaluate(() => document.documentElement.lang);
  reg.escritasBloqueadas = [...new Set(context.bloqueadas)];
  reg.errosDePagina = erros;
  page.off("pageerror", onErro);
  resultado.telas.push(reg);
  const alvosVis = Object.values(reg.alvos).flat().filter((a) => !a.oculto);
  console.log(`${LOCALE} ${id}: axe ${reg.axe.length}+${reg.axeEscuro.length}, alvos ${alvosVis.length} (<24 ${alvosVis.filter((a) => a.wEf < 24 || a.hEf < 24).length}), sem. ${Object.values(reg.semantica).flatMap((s) => s.problemas).length}, bloq ${reg.escritasBloqueadas.length}`);
}
for (const c of Object.values(contextos)) await c.close();
await browser.close();
await writeFile(path.join(SAIDA, `a11y-${LOCALE}.json`), JSON.stringify(resultado, null, 2));
console.log(`OK ${resultado.telas.length} telas → ${SAIDA}`);
