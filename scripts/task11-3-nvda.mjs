// Task 11.3 — avaliação automatizada com o NVDA REAL (fala capturada do log de entrada/saída do próprio NVDA).
// Para cada tecla confirma: (1) navegador de teste em primeiro plano, (2) NVDA registrou a tecla ("Input:"),
// (3) NVDA produziu fala ("Speaking"), (4) a fala corresponde ao elemento esperado e (5) o comportamento
// esperado ocorreu (conferido no DOM). O "esperado" vem do DOM da página; o "observado" vem só do log do NVDA.
// Uso: MOVA_NVDA_NAV=chrome|firefox MOVA_NVDA_LOCALE=pt-BR|en|es MOVA_NVDA_PLANO=paginas|pendencias|idiomas|estreito
//      [MOVA_NVDA_NIVEL=10 para registrar eventos do NVDA] node scripts/task11-3-nvda.mjs <dir-saida> [ids de tela]
import { spawn } from "node:child_process";
import { appendFile, cp, mkdir, open, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { abrirChrome, abrirFirefox, abrirTela } from "./task11-3-navegadores.mjs";
import { dadosDemo } from "./task11-2-comum.mjs";

const NAV = process.env.MOVA_NVDA_NAV ?? "chrome";
const LOCALE = process.env.MOVA_NVDA_LOCALE ?? "pt-BR";
const PLANO = process.env.MOVA_NVDA_PLANO ?? "paginas";
const SAIDA = path.resolve(process.argv[2] ?? "test-results/task11-3");
const FILTRO = process.argv[3]?.split(",");
const NVDA_EXE = "C:\\Program Files\\NVDA\\nvda.exe";
const ESPERA = Number(process.env.MOVA_NVDA_ESPERA ?? 950);
const NIVEL_LOG = process.env.MOVA_NVDA_NIVEL ?? "12"; // 12 = entrada/saída; 10 = debug com eventos (ponto B)
const ROTULO = `${NAV}-${LOCALE}-${PLANO}${NIVEL_LOG === "10" ? "-eventos" : ""}`;
const LOG = path.join(SAIDA, `nvda-${ROTULO}.log`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ms = (h) => { const [a, b, c] = h.split(":"); return ((+a * 60 + +b) * 60 + parseFloat(c)) * 1000; };

// ---------- NVDA: cópia da configuração do usuário, log próprio, restauração no fim ----------
function powershell(comando) {
  return new Promise((ok) => { const p = spawn("powershell", ["-NoProfile", "-Command", comando], { stdio: "ignore" }); p.on("exit", ok); });
}
async function nvdaIniciar() {
  const cfg = path.join(SAIDA, `nvda-config-${ROTULO}`);
  await cp(path.join(process.env.APPDATA, "nvda"), cfg, { recursive: true, force: true });
  let extra = "[virtualBuffers]\n\tautoSayAllOnPageLoad = False\n";
  if (NIVEL_LOG === "10") extra += "[debugLog]\n\tevents = True\n";
  await appendFile(path.join(cfg, "nvda.ini"), extra);
  await powershell(`Start-Process '${NVDA_EXE}' -ArgumentList '-q'; $i=0; while ((Get-Process nvda -ErrorAction SilentlyContinue) -and $i -lt 30) { Start-Sleep -Milliseconds 500; $i++ }`);
  await powershell(`Start-Process '${NVDA_EXE}' -ArgumentList '-c "${cfg}" -f "${LOG}" -l ${NIVEL_LOG}'`);
  for (let i = 0; i < 40; i++) { await sleep(500); if (existsSync(LOG) && /NVDA initialized/.test(await readFile(LOG, "utf8"))) return; }
  throw new Error("NVDA não inicializou com o log de teste");
}
async function nvdaRestaurar() {
  await powershell(`Start-Process '${NVDA_EXE}' -ArgumentList '-q'; $i=0; while ((Get-Process nvda -ErrorAction SilentlyContinue) -and $i -lt 30) { Start-Sleep -Milliseconds 500; $i++ }; Start-Process '${NVDA_EXE}'`);
}

// Leitura incremental do log do NVDA: entradas "NÍVEL - origem (HH:MM:SS.mmm) - thread:" + mensagem.
let offset = 0;
async function lerLog() {
  const fh = await open(LOG, "r");
  const { size } = await fh.stat();
  const buf = Buffer.alloc(Math.max(0, size - offset));
  await fh.read(buf, 0, buf.length, offset);
  await fh.close();
  const texto = buf.toString("utf8");
  const corte = texto.lastIndexOf("\n");
  if (corte < 0) return [];
  offset += Buffer.byteLength(texto.slice(0, corte + 1));
  const entradas = [];
  let atual = null;
  for (const linha of texto.slice(0, corte).split(/\r?\n/)) {
    const m = linha.match(/^(IO|INFO|DEBUG|DEBUGWARNING|WARNING|ERROR|CRITICAL) - (.+?) \((\d\d:\d\d:\d\d\.\d{3})\) - /);
    if (m) { atual = { nivel: m[1], origem: m[2], hora: m[3], msg: "" }; entradas.push(atual); }
    else if (atual) atual.msg += (atual.msg ? "\n" : "") + linha;
  }
  return entradas;
}
const tokens = (msg) => { const t = []; const re = /LangChangeCommand \('([a-zA-Z_]+)'\)|'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g; let x; while ((x = re.exec(msg.split("\n")[0]))) t.push(x[1] ? `⟨${x[1]}⟩` : (x[2] ?? x[3]).replace(/\\'/g, "'")); return t; };
const falaDe = (entradas) => entradas.filter((e) => e.msg.startsWith("Speaking")).map((e) => tokens(e.msg).filter((x) => x !== "⟨en_GB⟩").join(", ")).filter(Boolean);

// ---------- teclas reais (servidor PowerShell persistente) ----------
let teclas;
function iniciarTeclas(perfil) {
  const p = spawn("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", path.resolve("scripts/task11-3-teclas.ps1"), "-Perfis", perfil], { stdio: ["pipe", "pipe", "inherit"] });
  const rl = readline.createInterface({ input: p.stdout });
  const fila = [];
  rl.on("line", (l) => fila.shift()?.(l));
  const pronto = new Promise((ok) => fila.push(ok));
  const pedir = (cmd) => new Promise((ok) => { fila.push(ok); p.stdin.write(`${cmd}\n`); });
  return { pedir, pronto, fechar: () => { p.stdin.write("SAIR\n"); p.kill(); } };
}

// ---------- funções executadas na página (o "esperado" é derivado do DOM) ----------
function inventario() {
  const visivel = (el) => { for (let n = el; n && n.nodeType === 1; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.display === "none" || cs.visibility === "hidden" || n.getAttribute("aria-hidden") === "true" || n.hasAttribute("inert")) return false; } return true; };
  const txt = (el) => (el.textContent || "").replace(/\s+/g, " ").trim();
  const nome = (el) => {
    const lb = el.getAttribute("aria-labelledby");
    if (lb) return lb.split(/\s+/).map((i) => document.getElementById(i)).filter(Boolean).map(txt).join(" ").trim();
    if (el.getAttribute("aria-label")) return el.getAttribute("aria-label").trim();
    if (el.labels?.length) return txt(el.labels[0]);
    if (el.tagName === "INPUT" && ["submit", "button", "reset"].includes(el.type)) return el.value;
    return txt(el) || el.getAttribute("title") || el.getAttribute("placeholder") || "";
  };
  const papelLm = (el) => {
    const r = el.getAttribute("role"); if (r) return r;
    const t = el.tagName.toLowerCase(); const dentro = el.parentElement?.closest("article,aside,main,nav,section");
    const nomeado = el.hasAttribute("aria-label") || el.hasAttribute("aria-labelledby");
    return { header: dentro ? null : "banner", footer: dentro ? null : "contentinfo", nav: "navigation", main: "main", aside: "complementary", search: "search", section: nomeado ? "region" : null, form: nomeado ? "form" : null }[t] ?? null;
  };
  const sel = (s) => [...document.querySelectorAll(s)].filter(visivel);
  return {
    titulo: document.title, lang: document.documentElement.lang,
    titulos: sel("h1,h2,h3,h4,h5,h6,[role=heading]").map((h) => ({ nivel: Number(h.getAttribute("aria-level") || h.tagName.slice(1)), nome: txt(h) })),
    landmarks: sel("header,footer,nav,main,aside,search,section,form,[role=banner],[role=navigation],[role=main],[role=complementary],[role=contentinfo],[role=search],[role=region],[role=form]").map((el) => ({ papel: papelLm(el), nome: el.getAttribute("aria-label") || (el.getAttribute("aria-labelledby") ? nome(el) : "") })).filter((l) => ["banner", "navigation", "main", "complementary", "contentinfo", "search", "region", "form"].includes(l.papel)),
    links: sel("a[href]").map((a) => ({ nome: nome(a) })),
    campos: sel("input:not([type=hidden]),select,textarea,button,summary,[role=button],[role=checkbox],[role=radio],[role=switch],[role=combobox],[role=textbox]").map((c) => ({ nome: nome(c), tag: c.tagName.toLowerCase(), tipo: c.getAttribute("role") || c.type || "", obrigatorio: c.required || c.getAttribute("aria-required") === "true" })),
    botoes: sel("button:not([role]),button[role=button],summary,[role=button],input[type=submit],input[type=button]").map((b) => ({ nome: nome(b) })),
  };
}
function focoInfo() {
  const el = document.activeElement;
  if (!el || el === document.body) return { tag: "body", nome: "" };
  const txt = (e) => (e.textContent || "").replace(/\s+/g, " ").trim();
  const lb = el.getAttribute("aria-labelledby");
  const nome = lb ? lb.split(/\s+/).map((i) => document.getElementById(i)).filter(Boolean).map(txt).join(" ") : el.getAttribute("aria-label") || (el.labels?.length ? txt(el.labels[0]) : "") || txt(el) || el.value || "";
  const r = el.getBoundingClientRect();
  const pts = [[0.5, 0.5], [0.1, 0.1], [0.9, 0.1], [0.1, 0.9], [0.9, 0.9]].map(([x, y]) => [r.left + r.width * x, r.top + r.height * y]).filter(([x, y]) => x >= 0 && y >= 0 && x < innerWidth && y < innerHeight);
  const cobertos = pts.filter(([x, y]) => { const h = document.elementFromPoint(x, y); return h && !el.contains(h) && !h.contains(el); }).length;
  return { tag: el.tagName.toLowerCase(), id: el.id, nome: nome.trim().slice(0, 80), expandido: el.getAttribute("aria-expanded"), pressionado: el.getAttribute("aria-pressed"), marcado: el.getAttribute("aria-checked") ?? (el.type === "checkbox" || el.type === "radio" ? String(el.checked) : null), invalido: el.getAttribute("aria-invalid"), noDialogo: !!el.closest("[role=dialog],[role=alertdialog]"), encoberto: pts.length ? (cobertos === pts.length ? "total" : cobertos ? "parcial" : "nao") : "fora" };
}
function focar(seletor) {
  const el = document.querySelector(seletor); if (!el) return false;
  document.querySelectorAll("[data-aud-gatilho]").forEach((g) => g.removeAttribute("data-aud-gatilho"));
  el.setAttribute("data-aud-gatilho", "1"); el.scrollIntoView({ block: "center" }); el.focus();
  return document.activeElement === el;
}
function dialogoInfo() {
  const d = [...document.querySelectorAll("[role=dialog],[role=alertdialog]")].at(-1);
  return d ? { aberto: true, papel: d.getAttribute("role"), modal: d.getAttribute("aria-modal"), texto: (d.textContent || "").replace(/\s+/g, " ").trim().slice(0, 300), rootInert: document.getElementById("root")?.hasAttribute("inert") ?? false } : { aberto: false };
}
function erros() {
  return {
    alertas: [...document.querySelectorAll("[role=alert]")].map((a) => (a.textContent || "").trim()).filter(Boolean),
    status: [...document.querySelectorAll("[role=status]")].map((a) => (a.textContent || "").trim()).filter(Boolean),
    invalidos: [...document.querySelectorAll("[aria-invalid=true]")].map((c) => ({ campo: c.labels?.[0]?.textContent.trim() || c.getAttribute("aria-label") || c.name, descricao: (c.getAttribute("aria-describedby") || "").split(/\s+/).map((i) => document.getElementById(i)?.textContent.trim()).filter(Boolean).join(" | ") })),
  };
}
function preencher({ seletor, valor }) {
  const el = document.querySelector(seletor); if (!el) return false;
  Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value").set.call(el, valor);
  el.dispatchEvent(new Event("input", { bubbles: true })); return true;
}

// ---------- registro de passos ----------
const norm = (s) => String(s ?? "").toLowerCase().replace(/\s+/g, " ").trim();
const resultado = { navegador: NAV, locale: LOCALE, plano: PLANO, nivelLog: NIVEL_LOG, inicio: new Date().toISOString(), paginas: [] };
let drv, paginaAtual, abortado = false;

async function passo(tecla, { tipo = "acao", espera = ESPERA, esperado = [], esperadoAlgum = [], proibido = [], verificar, nvda = false, rotulo, silencioso = false, capturar = false } = {}) {
  if (abortado) return null;
  const resp = await teclas.pedir(`TECLA ${tecla}${nvda ? " nvda" : ""}`);
  const [cmd, t, , ...resto] = resp.split(" ");
  const p = { n: paginaAtual.passos.length + 1, rotulo: rotulo ?? tecla, tecla, tipo, hora: t, primeiroPlano: resto.join(" "), esperado: [...esperado, ...(esperadoAlgum.length ? [`um de: ${esperadoAlgum.join(" / ")}`] : [])] };
  paginaAtual.passos.push(p);
  if (cmd !== "TECLA") { p.classe = "NÃO EXECUTADO"; p.motivo = `foco fora do navegador de teste: ${resp}`; abortado = true; console.log(`ABORTADO ${resp}`); return p; }
  await sleep(espera);
  const ent = (await lerLog()).filter((e) => ms(e.hora) >= ms(t) - 30);
  p.recebido = ent.filter((e) => e.msg.startsWith("Input:")).map((e) => e.msg.replace("Input: ", ""));
  p.falaBruta = ent.filter((e) => e.msg.startsWith("Speaking")).map((e) => `${e.hora} ${e.msg.split("\n")[0].replace(/^Speaking /, "")}`);
  p.fala = falaDe(ent);
  if (NIVEL_LOG === "10") p.eventos = ent.filter((e) => /event|focus|stateChange/i.test(`${e.origem} ${e.msg}`) && !e.msg.startsWith("Speaking")).map((e) => `${e.hora} ${e.origem}: ${e.msg.split("\n")[0].slice(0, 200)}`).slice(0, 60);
  if (verificar) { try { p.dom = await verificar(); } catch (e) { p.dom = { ok: false, erro: e.message }; } }
  // Captura vinculada ao passo: o arquivo e a hora local ficam no registro, ao lado da fala do log.
  if (capturar) { p.captura = `${ROTULO}-${paginaAtual.id}-passo${p.n}.png`; p.capturaHora = new Date().toTimeString().slice(0, 8); await drv.captura(path.join(SAIDA, p.captura)).catch(() => { p.captura = null; }); }
  const fala = norm(p.fala.join(" | "));
  const semEsp = (s) => norm(s).replace(/\s/g, "");
  if (!p.recebido.length) { p.classe = "INCONCLUSIVO"; p.motivo = "NVDA não registrou a tecla"; }
  else if (!p.fala.length && (esperado.length || esperadoAlgum.length)) { p.classe = "INCONCLUSIVO"; p.motivo = "sem fala registrada"; }
  else {
    const faltam = esperado.filter((e) => !fala.includes(norm(e)));
    const colados = faltam.filter((e) => norm(e).includes(" ") && fala.replace(/\s/g, "").includes(semEsp(e)));
    const algumOk = !esperadoAlgum.length || esperadoAlgum.some((e) => fala.includes(norm(e)));
    const proib = proibido.filter((e) => fala.includes(norm(e)));
    if (colados.length) { p.classe = "FALHA"; p.motivo = `texto colado na fala: ${colados.join("; ")}`; }
    else if (proib.length) { p.classe = "FALHA"; p.motivo = `anúncio indevido: ${proib.join("; ")}`; }
    else if (p.dom && p.dom.ok === false) { p.classe = "FALHA"; p.motivo = `comportamento: ${p.dom.detalhe ?? p.dom.erro ?? ""}`; }
    else if (faltam.length || !algumOk) { p.classe = "INCONCLUSIVO"; p.motivo = `fala não contém: ${[...faltam, ...(algumOk ? [] : [esperadoAlgum.join(" / ")])].join("; ")}`; }
    else p.classe = tipo === "auxiliar" ? "AUXILIAR" : "PASSA";
  }
  if (!silencioso) imprimir(p);
  return p;
}
const imprimir = (p) => console.log(`${p.classe.padEnd(13)} ${paginaAtual.id} ${p.rotulo}: ${(p.fala ?? []).join(" ‖ ").slice(0, 140)}${p.motivo ? ` [${p.motivo}]` : ""}`);
const naoExecutado = (rotulo, motivo) => { paginaAtual.passos.push({ n: paginaAtual.passos.length + 1, rotulo, classe: "NÃO EXECUTADO", motivo }); console.log(`NÃO EXECUTADO ${paginaAtual.id} ${rotulo}: ${motivo}`); };

// Abre a tela, registra a fala da carga e leva o cursor virtual ao topo.
async function carregar(tela, { semTopo = false } = {}) {
  await abrirTela(drv, tela.rota, { locale: LOCALE, sessao: tela.sessao ?? null, jornada: tela.jornada ?? null });
  if (tela.largura) await drv.tamanho(tela.largura, 900);
  await sleep(2600);
  const fala = falaDe(await lerLog());
  paginaAtual.carga ??= fala;
  const ativada = await teclas.pedir("ATIVAR");
  paginaAtual.janela ??= ativada;
  // O Windows pode pôr o navegador em primeiro plano sem que o foco do NVDA saia da janela anterior (R3: o NVDA
  // leu o terminal). Confirma pelo próprio NVDA: NVDA+T tem de ler o título da página antes de qualquer medição.
  const titulo = await drv.run(() => document.title);
  for (let i = 0; i < 3 && !abortado; i++) {
    const p = await passo("nvda+t", { tipo: "auxiliar", rotulo: "confirma o foco do NVDA no navegador (NVDA+T)", silencioso: true });
    if (p && norm((p.fala ?? []).join(" ")).includes(norm(titulo).slice(0, 30))) {
      if (!semTopo) await passo("control+home", { tipo: "auxiliar", rotulo: "topo do documento (Ctrl+Home)" });
      return true;
    }
    // Reabrir a página foi o que devolveu o foco do NVDA ao navegador nas rodadas anteriores (2ª tela em diante).
    await teclas.pedir("ATIVAR");
    await abrirTela(drv, tela.rota, { locale: LOCALE, sessao: tela.sessao ?? null, jornada: tela.jornada ?? null });
    await sleep(2600);
    await lerLog();
  }
  return false;
}

// ---------- bateria padrão por página ----------
const N = { h: 8, d: 6, k: 6, f: 6, b: 6, tab: 10, shiftTab: 3 };
const PALAVRA = { banner: "banner landmark", navigation: "navigation landmark", main: "main landmark", complementary: "complementary landmark", contentinfo: "content info landmark", search: "search landmark", region: "region", form: "form" };
// No Firefox o NVDA fala o nome de um link em trechos (texto visível + texto .sr-only), que o log separa por vírgula.
const contem = (fala, nome) => !nome || fala.includes(norm(nome).slice(0, 60)) || fala.replace(/,\s+/g, " ").includes(norm(nome).slice(0, 60));
const colado = (fala, nome) => !!nome && norm(nome).includes(" ") && !contem(fala, nome) && fala.replace(/\s/g, "").includes(norm(nome).slice(0, 60).replace(/\s/g, ""));
const COMBINA = {
  H: (it, f) => contem(f, it.nome) && f.includes(`level ${it.nivel}`),
  D: (it, f) => f.includes(PALAVRA[it.papel] ?? it.papel) && contem(f, it.nome),
  K: (it, f) => contem(f, it.nome) && f.includes("link"),
  F: (it, f) => contem(f, it.nome) && (!it.obrigatorio || f.includes("required")),
  B: (it, f) => contem(f, it.nome) && f.includes("button"),
};
const DESCREVE = { H: (it) => `h${it.nivel} "${it.nome.slice(0, 40)}"`, D: (it) => `${it.papel}${it.nome ? ` "${it.nome}"` : ""}`, K: (it) => `"${it.nome.slice(0, 40)}"`, F: (it) => `${it.tipo || it.tag} "${it.nome.slice(0, 40)}"${it.obrigatorio ? " (obrigatório)" : ""}`, B: (it) => `"${it.nome.slice(0, 40)}"` };
// Navegação rápida com alinhamento: cada fala consome, em ordem, os itens esperados que ela anuncia
// (o NVDA anuncia regiões aninhadas junto do landmark pai; o item sob o cursor após Ctrl+Home já foi lido).
async function navegarSequencia(tecla, tipo, itens, max) {
  const topo = await passo("control+home", { tipo: "auxiliar", rotulo: "topo" });
  let j = 0;
  if (topo && itens.length && COMBINA[tipo](itens[0], norm(topo.fala.join(" | ")))) { j = 1; topo.nota = `cursor já sobre ${DESCREVE[tipo](itens[0])} (lido no Ctrl+Home)`; }
  for (let n = 0; n < max && j < itens.length && !abortado; n++) {
    const p = await passo(tecla, { tipo, silencioso: true, rotulo: `${tipo} → esperado ${DESCREVE[tipo](itens[j])}` });
    if (!p || p.classe === "NÃO EXECUTADO") continue;
    p.esperado = [DESCREVE[tipo](itens[j])];
    if (!p.recebido?.length || !p.fala.length) { p.classe = "INCONCLUSIVO"; p.motivo = p.recebido?.length ? "sem fala registrada" : "NVDA não registrou a tecla"; continue; }
    const f = norm(p.fala.join(" | "));
    const consumidos = [];
    while (j < itens.length && COMBINA[tipo](itens[j], f)) consumidos.push(itens[j++]);
    if (consumidos.length) { p.classe = "PASSA"; p.motivo = undefined; p.esperado = consumidos.map(DESCREVE[tipo]); continue; }
    const cola = itens.slice(j).find((it) => colado(f, it.nome));
    if (cola) { p.classe = "FALHA"; p.motivo = `texto colado na fala: "${cola.nome}"`; j = itens.indexOf(cola) + 1; }
    else if (/no next/.test(f)) { p.classe = "INCONCLUSIVO"; p.motivo = `NVDA não alcançou: ${itens.slice(j).map(DESCREVE[tipo]).join("; ").slice(0, 160)}`; j = itens.length; }
    else { p.classe = "INCONCLUSIVO"; p.motivo = "anunciou elemento fora da sequência esperada (revisar)"; }
  }
  for (const p of paginaAtual.passos.filter((x) => x.tipo === tipo && !x.impresso)) { p.impresso = true; imprimir(p); }
}
function ancorarTopo() { window.scrollTo(0, 0); let s = document.getElementById("__aud_ancora"); if (!s) { s = document.createElement("span"); s.id = "__aud_ancora"; s.tabIndex = -1; document.body.prepend(s); } s.focus(); return document.activeElement === s; }
async function bateria() {
  const inv = await drv.run(inventario);
  paginaAtual.inventario = { titulo: inv.titulo, lang: inv.lang, titulos: inv.titulos, landmarks: inv.landmarks, links: inv.links.length, campos: inv.campos.length, botoes: inv.botoes.length };
  await passo("nvda+t", { tipo: "titulo", rotulo: "NVDA+T (título da janela)", esperado: [inv.titulo] });
  await navegarSequencia("h", "H", inv.titulos, N.h);
  const niveis = [...new Set(inv.titulos.map((h) => h.nivel))].sort();
  for (const nivel of [...niveis, ...(niveis.includes(6) ? [] : [6])]) {
    await passo("control+home", { tipo: "auxiliar", rotulo: "topo" });
    const alvo = inv.titulos.find((h) => h.nivel === nivel);
    await passo(String(nivel), { tipo: "nivel", rotulo: `${nivel} → ${alvo ? `"${alvo.nome.slice(0, 40)}"` : "nenhum título desse nível"}`, esperado: alvo ? [alvo.nome.slice(0, 60), `level ${nivel}`] : [`no next heading at level ${nivel}`] });
  }
  await navegarSequencia("d", "D", inv.landmarks, N.d);
  await navegarSequencia("k", "K", inv.links, N.k);
  await navegarSequencia("f", "F", inv.campos, N.f);
  await navegarSequencia("b", "B", inv.botoes, N.b);
  // Tab/Shift+Tab a partir de uma âncora no topo (tela recarregada): o esperado é o elemento focado (DOM).
  await carregar(paginaAtual.tela, { semTopo: true });
  await drv.run(ancorarTopo);
  await sleep(600); await lerLog();
  const conferirFoco = (p) => {
    const f = p?.dom?.foco;
    if (!p) return;
    if (!f || f.tag === "body") { if (p.classe === "PASSA" || p.classe === "FALHA") { p.classe = "PASSA"; p.motivo = "foco fora do documento (interface do navegador): fim do ciclo"; } imprimir(p); return; }
    if (f.nome) p.esperado = [`${f.tag} "${f.nome}"`];
    const fala = norm((p.fala ?? []).join(" | "));
    if (p.classe === "PASSA" && f.nome && !contem(fala, f.nome.slice(0, 40))) { p.classe = colado(fala, f.nome) ? "FALHA" : "INCONCLUSIVO"; p.motivo = `foco em ${f.tag} "${f.nome}" não aparece na fala`; }
    if (p.classe === "PASSA" && !p.fala.length) { p.classe = "INCONCLUSIVO"; p.motivo = "sem fala registrada"; }
    imprimir(p);
  };
  for (let i = 0; i < N.tab && !abortado; i++) conferirFoco(await passo("tab", { tipo: "Tab", silencioso: true, rotulo: `Tab ${i + 1}`, verificar: async () => { const f = await drv.run(focoInfo); return { ok: f.encoberto !== "total", detalhe: f.tag === "body" ? "foco saiu do documento (interface do navegador) — fim do ciclo de Tab" : f.encoberto === "total" ? `foco inteiramente encoberto: ${f.tag} "${f.nome}"` : "", foco: f }; } }));
  for (let i = 0; i < N.shiftTab && !abortado; i++) conferirFoco(await passo("shift+tab", { tipo: "Shift+Tab", silencioso: true, rotulo: `Shift+Tab ${i + 1}`, verificar: async () => ({ ok: true, foco: await drv.run(focoInfo) }) }));
}

// ---------- ações específicas: navega até o alvo como um usuário de NVDA e ativa ----------
// teclas de navegação do NVDA: b (botão), r (rádio), x (caixa de seleção), c (caixa de combinação)
async function irAte(tecla, regex, max, rotulo) {
  const re = new RegExp(regex, "i");
  await passo("control+home", { tipo: "auxiliar", rotulo: "topo" });
  for (let i = 0; i < max && !abortado; i++) {
    const p = await passo(tecla, { tipo: "auxiliar", rotulo: `${rotulo}: ${tecla.toUpperCase()} até /${regex}/` });
    if (p && (p.fala ?? []).flatMap((f) => f.split(", ")).some((t) => re.test(t.trim()))) return true;
  }
  naoExecutado(rotulo, `NVDA não chegou a /${regex}/ com ${max} × ${tecla.toUpperCase()}`);
  return false;
}
function estados({ seletor, attr }) {
  const txt = (e) => (e.getAttribute("aria-label") || e.textContent || "").replace(/\s+/g, " ").trim();
  return [...document.querySelectorAll(seletor)].map((e) => ({ nome: txt(e), valor: attr === "open" ? String(e.parentElement?.open ?? e.open) : attr === "checked" ? String(e.checked) : e.getAttribute(attr) }));
}
async function ativar({ nav, alvo, seletor, attr, tecla, rotulo, max = 15, alvoDom }) {
  const antes = await drv.run(estados, { seletor, attr });
  if (!(await irAte(nav, alvo, max, rotulo))) return;
  await passo(tecla, { tipo: "ativacao", rotulo: `${rotulo}: ${tecla}`, espera: 1300, verificar: async () => {
    const depois = await drv.run(estados, { seletor, attr });
    const re = new RegExp(alvoDom ?? alvo, "i");
    const i = antes.findIndex((e) => re.test(e.nome));
    const mudou = antes.map((e, k) => (depois[k]?.valor !== e.valor ? `${e.nome}: ${e.valor} → ${depois[k]?.valor}` : null)).filter(Boolean);
    return { ok: i >= 0 && depois[i]?.valor !== antes[i].valor, detalhe: i < 0 ? `alvo não identificado no DOM; mudanças: ${mudou.join("; ") || "nenhuma"}` : `${antes[i].nome}: ${attr} ${antes[i].valor} → ${depois[i]?.valor}`, mudancas: mudou };
  } });
}
// Marca o gatilho (pelo nome) e registra o aria-expanded dele no instante em que recebe o foco de volta.
function gatilhoDoDialogo(regex) {
  const re = new RegExp(regex, "i");
  const g = [...document.querySelectorAll("button")].find((b) => b.offsetParent && re.test((b.getAttribute("aria-label") || b.textContent || "").trim()));
  window.__aud = { expandidoNoFoco: "(não recebeu foco)", focoNoGatilho: null, gatilho: g ? (g.getAttribute("aria-label") || g.textContent).trim() : null };
  if (!g) return false;
  g.addEventListener("focus", () => { window.__aud.expandidoNoFoco = g.getAttribute("aria-expanded"); }, { once: true });
  setTimeout(() => { window.__aud.focoNoGatilho = document.activeElement === g; }, 900);
  return true;
}
async function dialogo({ alvo, rotulo, max = 20 }) {
  if (!(await irAte("b", alvo, max, rotulo))) return;
  await passo("enter", { tipo: "dialogo", rotulo: `${rotulo}: Enter abre (foco inicial)`, espera: 1300, capturar: true, esperadoAlgum: ["dialog"], verificar: async () => { const d = await drv.run(dialogoInfo); const f = await drv.run(focoInfo); return { ok: d.aberto && f.noDialogo, detalhe: `aberto=${d.aberto}; foco no diálogo=${f.noDialogo} (${f.tag} "${f.nome}")`, dialogo: d, foco: f }; } });
  for (let i = 0; i < 3; i++) await passo("tab", { tipo: "dialogo", rotulo: `${rotulo}: Tab ${i + 1} (retenção)`, verificar: async () => { const f = await drv.run(focoInfo); return { ok: f.noDialogo, detalhe: `foco ${f.noDialogo ? "dentro" : "FORA"}: ${f.tag} "${f.nome}"`, foco: f }; } });
  await passo("shift+tab", { tipo: "dialogo", rotulo: `${rotulo}: Shift+Tab (retenção)`, verificar: async () => { const f = await drv.run(focoInfo); return { ok: f.noDialogo, detalhe: `foco ${f.noDialogo ? "dentro" : "FORA"}`, foco: f }; } });
  await drv.run(gatilhoDoDialogo, alvo);
  await passo("escape", { tipo: "dialogo", rotulo: `${rotulo}: Esc fecha e devolve o foco ao gatilho`, espera: 1500, proibido: ["expanded"], verificar: async () => {
    const d = await drv.run(dialogoInfo); const f = await drv.run(focoInfo); const g = await drv.run(() => window.__aud ?? null);
    return { ok: !d.aberto && f.tag !== "body" && g?.focoNoGatilho !== false, detalhe: `fechado=${!d.aberto}; foco ${f.tag} "${f.nome}"; aria-expanded do gatilho no foco=${g?.expandidoNoFoco ?? "-"}, agora=${f.expandido ?? "-"}`, foco: f, gatilho: g };
  } });
  // Ponto B: NVDA+Tab relê o objeto em foco (estado atual), sem depender do que foi falado no retorno do foco.
  await passo("nvda+tab", { tipo: "dialogo", rotulo: `${rotulo}: NVDA+Tab ~1 s depois (estado atual do gatilho)`, proibido: ["expanded"], verificar: async () => { const f = await drv.run(focoInfo); return { ok: f.tag !== "body", detalhe: `foco ${f.tag} "${f.nome}"; aria-expanded=${f.expandido ?? "-"}`, foco: f }; } });
}
// Ponto D: com o diálogo modal aberto, o modo de navegação do NVDA alcança conteúdo fora dele?
async function foraDoModal({ alvo, rotulo, max = 20 }) {
  if (!(await irAte("b", alvo, max, rotulo))) return;
  await passo("enter", { tipo: "auxiliar", rotulo: `${rotulo}: Enter abre`, espera: 1300 });
  const d = await drv.run(dialogoInfo);
  paginaAtual.modal = { rotulo, dialogo: d };
  await passo("control+home", { tipo: "modal", rotulo: `${rotulo}: Ctrl+Home` });
  for (let i = 0; i < 3; i++) await passo("down", { tipo: "modal", rotulo: `${rotulo}: ↓ ${i + 1}` });
  await passo("h", { tipo: "modal", rotulo: `${rotulo}: H` });
  await passo("k", { tipo: "modal", rotulo: `${rotulo}: K` });
  const textoDialogo = norm(d.texto ?? "");
  for (const p of paginaAtual.passos.filter((x) => x.tipo === "modal" && x.rotulo.startsWith(rotulo))) {
    const pedacos = (p.fala ?? []).flatMap((f) => f.split(", ")).map(norm).filter((x) => x.length > 3 && !x.startsWith("⟨") && !/^(button|link|heading|level \d|dialog|alert dialog|clickable|blank|out of .*|.* landmark|no next .*|top|bottom|section|grouping|list|with \d+ items?|visited|same page|collapsed|expanded|opens dialog|unavailable)$/.test(x));
    const fora = pedacos.filter((x) => !textoDialogo.includes(x));
    p.foraDoDialogo = fora;
    p.classe = !p.recebido?.length ? "INCONCLUSIVO" : !p.fala?.length ? "INCONCLUSIVO" : fora.length ? "FALHA" : "PASSA";
    p.motivo = !p.fala?.length ? "sem fala (modo de foco?)" : fora.length ? `leu conteúdo fora do diálogo: ${fora.join(" | ").slice(0, 140)}` : "só conteúdo do diálogo";
  }
}

// ---------- telas ----------
const demo = await dadosDemo();
const LOC = demo.sessoes.loc, DONO = demo.sessoes.dono;
const conf = demo.porStatus("CONFIRMADA");
const SUBMIT_LOGIN = "^entrar|sign in|iniciar sesi";
const CONTINUAR = "^continuar|^continue";
async function enviarVazio(alvo, rotulo) {
  if (!(await irAte("b", alvo, 10, rotulo))) return;
  await passo("enter", { tipo: "erro", rotulo: `${rotulo}: Enter com campos vazios`, espera: 2000, capturar: true, esperadoAlgum: ["alert"], verificar: async () => { const e = await drv.run(erros); const f = await drv.run(focoInfo); return { ok: e.invalidos.length > 0 && e.invalidos.every((i) => i.descricao), detalhe: `inválidos: ${e.invalidos.map((i) => `${i.campo} → ${i.descricao}`).join("; ")}; foco ${f.tag} "${f.nome}"`, erros: e, foco: f }; } });
  await passo("control+home", { tipo: "auxiliar", rotulo: "topo" });
  await passo("f", { tipo: "erro", rotulo: `${rotulo}: F → 1º campo (inválido?)`, esperadoAlgum: ["invalid"] });
  await passo("f", { tipo: "erro", rotulo: `${rotulo}: F → 2º campo (inválido?)`, esperadoAlgum: ["invalid"] });
}
const CHIP = "^(Econômicos|Economy|Económicos)";
const TELAS = [
  { id: "home", nome: "Home", rota: "/", acoes: () => ativar({ nav: "b", alvo: CHIP, seletor: "main button[aria-pressed]", attr: "aria-pressed", tecla: "space", rotulo: "chip de categoria" }) },
  { id: "login", nome: "Login", rota: "/login", acoes: async () => {
    await enviarVazio(SUBMIT_LOGIN, "Login");
    await carregar(paginaAtual.tela);
    await drv.run(preencher, { seletor: "#email", valor: "nao.cadastrado@exemplo.com" });
    await drv.run(preencher, { seletor: "#senha", valor: "SenhaErrada1!" });
    if (!(await irAte("b", SUBMIT_LOGIN, 10, "Login com credenciais inexistentes"))) return;
    await passo("enter", { tipo: "erro", rotulo: "Login: Enter com credenciais inexistentes (401 real)", espera: 2600, capturar: true, esperadoAlgum: ["inválid", "invalid"], verificar: async () => { const e = await drv.run(erros); return { ok: e.alertas.length > 0, detalhe: `alertas: ${e.alertas.join(" | ")}`, erros: e }; } });
  } },
  { id: "cadastro", nome: "Cadastro", rota: "/cadastro", acoes: () => enviarVazio(CONTINUAR, "Cadastro") },
  { id: "catalogo", nome: "Catálogo", rota: "/carros/lista", acoes: () => ativar({ nav: "b", alvo: CHIP, seletor: "main button[aria-pressed]", attr: "aria-pressed", tecla: "enter", rotulo: "chip (Enter)" }) },
  { id: "detalhe", nome: "Detalhes do veículo", rota: `/carros/${demo.veiculoPcd.id}` },
  { id: "retirada", nome: "Retirada", rota: "/escolha-garagem-retirada", sessao: LOC, jornada: demo.J_PRE },
  { id: "devolucao", nome: "Devolução (garagem)", rota: "/escolha-garagem-devolucao", sessao: LOC, jornada: demo.J_PRE },
  { id: "servicos", nome: "Serviços", rota: "/servicos-opcionais", sessao: LOC, jornada: demo.J_PRE, acoes: () => ativar({ nav: "x", alvo: "check box", alvoDom: ".", seletor: "main input[type=checkbox]", attr: "checked", tecla: "space", rotulo: "serviço opcional" }) },
  { id: "checkout", nome: "Checkout", rota: "/checkout-reserva", sessao: LOC, jornada: demo.J_PRE },
  { id: "pagamento", nome: "Pagamento", rota: "/pagamento", sessao: LOC, jornada: demo.comReserva(conf) },
  { id: "reservas", nome: "Reservas (histórico)", rota: "/historico", sessao: LOC, acoes: async () => {
    await ativar({ nav: "b", alvo: "ver detalhes da cobertura|view coverage|ver detalles de la cobertura", seletor: "main details > summary", attr: "open", tecla: "enter", rotulo: "Ver detalhes da cobertura" });
    await carregar(paginaAtual.tela);
    await dialogo({ alvo: "^(conta|account|cuenta)\\b", rotulo: "Menu da conta" });
    await carregar(paginaAtual.tela);
    await foraDoModal({ alvo: "^(conta|account|cuenta)\\b", rotulo: "Menu da conta (modo de navegação)" });
  } },
  { id: "reserva", nome: "Detalhe da reserva", rota: `/reservas/${conf}`, sessao: LOC },
  { id: "cancelamento", nome: "Cancelamento", rota: "/cancelamento", sessao: LOC, jornada: demo.comReserva(conf), acoes: async () => {
    if (!(await irAte("b", "solicitar cancelamento|request cancellation|solicitar cancelación", 10, "Solicitar cancelamento"))) return;
    await passo("enter", { tipo: "ativacao", rotulo: "Solicitar cancelamento (Enter) → foco em Voltar", espera: 1300, esperadoAlgum: ["voltar", "back", "volver"], verificar: async () => { const f = await drv.run(focoInfo); return { ok: /voltar|back|volver/i.test(f.nome), detalhe: `foco ${f.tag} "${f.nome}"`, foco: f }; } });
    await passo("enter", { tipo: "ativacao", rotulo: "Voltar (Enter) → foco volta ao botão", espera: 1300, esperadoAlgum: ["cancel"], verificar: async () => { const f = await drv.run(focoInfo); return { ok: /cancel/i.test(f.nome), detalhe: `foco ${f.tag} "${f.nome}"`, foco: f }; } });
  } },
  { id: "conta", nome: "Conta", rota: "/conta", sessao: LOC, acoes: async () => {
    await ativar({ nav: "b", alvo: "^(alterar nome|change name|cambiar nombre)", seletor: "main button[aria-expanded]", attr: "aria-expanded", tecla: "enter", rotulo: "seção expansível" });
    await carregar(paginaAtual.tela);
    await dialogo({ alvo: "deletar conta|delete account|eliminar cuenta", rotulo: "Deletar conta (alertdialog)", max: 25 });
    await carregar(paginaAtual.tela);
    await foraDoModal({ alvo: "deletar conta|delete account|eliminar cuenta", rotulo: "Deletar conta (modo de navegação)", max: 25 });
  } },
  { id: "configuracoes", nome: "Configurações (tema e idioma)", rota: "/configuracoes", sessao: LOC, acoes: async () => {
    await ativar({ nav: "r", alvo: "^(claro|light)\\b", seletor: "main [role=radio]", attr: "aria-checked", tecla: "space", rotulo: "opção de tema" });
    await carregar(paginaAtual.tela);
    if (!(await drv.run(focar, "header select"))) return naoExecutado("seletor de idioma", "select não encontrado");
    await sleep(900); await lerLog();
    const idioma = () => async () => { const f = await drv.run(focoInfo); const l = await drv.run(() => document.documentElement.lang); return { ok: f.tag === "select", detalhe: `html lang=${l}; foco ${f.tag}`, foco: f, lang: l }; };
    await passo("down", { tipo: "idioma", rotulo: "Idioma ↓ (troca e mantém o foco)", espera: 1900, esperadoAlgum: ["combo box"], verificar: idioma() });
    await passo("up", { tipo: "idioma", rotulo: "Idioma ↑ (volta)", espera: 1900, esperadoAlgum: ["combo box"], verificar: idioma() });
  } },
  { id: "garagens", nome: "Garagens", rota: "/cadastro-garagens", sessao: DONO, acoes: () => dialogo({ alvo: "^(excluir|delete|eliminar) ", rotulo: "Excluir garagem (alertdialog)" }) },
  { id: "veiculos", nome: "Veículos (frota)", rota: "/cadastro-carros", sessao: DONO, acoes: async () => { await dialogo({ alvo: "^(excluir|delete|eliminar) ", rotulo: "Excluir veículo (alertdialog)" }); await carregar(paginaAtual.tela); await foraDoModal({ alvo: "^(excluir|delete|eliminar) ", rotulo: "Excluir veículo (modo de navegação)" }); } },
  { id: "veiculo-edicao", nome: "Veículo (edição)", rota: `/cadastro-carros/${demo.veiculoLocador}`, sessao: DONO },
  { id: "relatorios", nome: "Relatórios (veículos)", rota: "/relatorios/veiculos", sessao: DONO },
  { id: "relatorio-filtro", nome: "Relatórios (filtro de avaliações)", rota: "/relatorios/avaliacoes-filtro", sessao: DONO, acoes: () => dialogo({ alvo: "^(data|date|fecha)\\b", rotulo: "Calendário do filtro" }) },
];
const PLANOS = {
  paginas: TELAS,
  idiomas: TELAS.filter((t) => ["home", "login", "configuracoes"].includes(t.id)),
  estreito: TELAS.filter((t) => ["home", "cadastro", "retirada", "reservas"].includes(t.id)).map((t) => ({ ...t, largura: 375 })),
  pendencias: TELAS.filter((t) => ["reservas", "conta", "cadastro", "login"].includes(t.id)).map((t) => ({ ...t, semBateria: true })),
  // WCAG 2.4.2: NVDA+T nas telas que não definiam título próprio (ou o repetiam). Títulos esperados em pt-BR.
  titulos: [
    ["conta", "/conta", LOC, null, "MOVA - Minha conta"],
    ["suporte", "/suporte", LOC, null, "MOVA - Suporte"],
    ["pendencias", "/pendencias-financeiras", LOC, null, "MOVA - Pendências financeiras"],
    ["rastreamento", `/reserva/${conf}/localizacao`, LOC, null, "MOVA - Acompanhar veículo"],
    ["monitoramento", "/monitoramento", DONO, null, "MOVA - Monitoramento"],
    ["404", "/pagina-inexistente", null, null, "MOVA - Página não encontrada"],
    ["devolucao-garagem", "/escolha-garagem-devolucao", LOC, demo.J_PRE, "MOVA - Garagem de devolução"],
  ].map(([id, rota, sessao, jornada, titulo]) => ({ id, nome: `Título (${id})`, rota, sessao, jornada, semBateria: true,
    acoes: () => passo("nvda+t", { tipo: "titulo", rotulo: "NVDA+T (título da janela)", esperado: [titulo] }) })),
};

// ---------- execução ----------
await mkdir(SAIDA, { recursive: true });
await nvdaIniciar();
offset = 0; await lerLog();
drv = NAV === "firefox" ? await abrirFirefox(SAIDA) : await abrirChrome(SAIDA);
const logInicial = await readFile(LOG, "utf8");
Object.assign(resultado, { navegadorVersao: drv.versao, nvda: logInicial.match(/Starting NVDA version (\S+)/)?.[1], sintese: [...logInicial.matchAll(/Loaded synthDriver (\S+)/g)].at(-1)?.[1] });
teclas = iniciarTeclas(drv.perfil);
resultado.teclas = await teclas.pronto;
try {
  // Aquecimento (não registrado): na 1ª tela da rodada o foco do NVDA ficava na janela anterior (terminal).
  paginaAtual = { id: "aquecimento", passos: [] };
  await carregar({ rota: "/" });
  for (const tela of PLANOS[PLANO].filter((t) => !FILTRO || FILTRO.includes(t.id))) {
    if (abortado) break;
    paginaAtual = { id: tela.id, nome: tela.nome, rota: tela.rota.replace(/[0-9a-f]{8}-[0-9a-f-]{27}/g, ":id"), largura: tela.largura ?? 1280, tela, passos: [] };
    resultado.paginas.push(paginaAtual);
    console.log(`== ${tela.nome} (${tela.rota})`);
    if (!(await carregar(tela))) { naoExecutado("tela inteira", "o NVDA não estava com o foco no navegador (NVDA+T não leu o título da página)"); continue; }
    await drv.captura(path.join(SAIDA, `${ROTULO}-${tela.id}.png`)).catch(() => {});
    if (!tela.semBateria) await bateria();
    if (tela.acoes && !abortado && (await carregar(tela))) await tela.acoes();
  }
} finally {
  teclas.fechar();
  resultado.fim = new Date().toISOString();
  resultado.abortado = abortado;
  resultado.escritasBloqueadas = drv.bloqueadas;
  await drv.fechar().catch(() => {});
  await nvdaRestaurar();
  for (const p of resultado.paginas) delete p.tela;
  await writeFile(path.join(SAIDA, `nvda-${ROTULO}.json`), JSON.stringify(resultado, null, 2));
  const todos = resultado.paginas.flatMap((p) => p.passos).filter((p) => p.classe !== "AUXILIAR");
  console.log(`FIM ${ROTULO}: ${todos.length} passos`, todos.reduce((a, p) => ({ ...a, [p.classe]: (a[p.classe] ?? 0) + 1 }), {}), abortado ? "(ABORTADO: foco saiu do navegador)" : "");
}
