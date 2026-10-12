// Task 11.2 — consolida a saída de task11-2-a11y.mjs (a11y-<locale>.json) e task11-2-cenarios.mjs
// (cenarios.json) em CSV (separador ";", UTF-8 com BOM) e num resumo JSON para os relatórios.
// Uso: node scripts/task11-2-relatorio.mjs <dir-varredura> <dir-cenarios> <dir-saida>
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const [DIR_A11Y, DIR_CEN, SAIDA] = process.argv.slice(2).map((p) => path.resolve(p));
const LOCALES = ["pt-BR", "en", "es"];
const varreduras = {};
for (const l of LOCALES) varreduras[l] = JSON.parse(await readFile(path.join(DIR_A11Y, `a11y-${l}.json`), "utf8"));
const cenarios = JSON.parse(await readFile(path.join(DIR_CEN, "cenarios.json"), "utf8")).casos;

const csv = (linhas) => "﻿" + linhas.map((l) => l.map((c) => { const s = String(c ?? ""); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(";")).join("\r\n") + "\r\n";

// Classificação 2.5.8 (AA) e objetivo de projeto 44×44 (≈ 2.5.5 AAA), sempre pela área efetiva.
function classificar(a) {
  if (a.oculto === "nao-renderizado") return { c258: "fora do escopo (não renderizado)", c44: "-", exc: "" };
  if (a.oculto === "visualmente-oculto") {
    const f = a.noFoco;
    return { c258: f?.visivel ? (Math.min(f.w, f.h) >= 24 ? "PASSA (visível só no foco)" : "REVISÃO MANUAL (visível só no foco)") : "REVISÃO MANUAL (oculto e focável)", c44: f?.visivel && Math.min(f.w, f.h) >= 44 ? "atinge 44" : "abaixo de 44", exc: "alvo de teclado (skip link)" };
  }
  const m = Math.min(a.wEf, a.hEf);
  const c44 = m >= 44 ? "atinge 44" : "abaixo de 44";
  if (m >= 24) return { c258: "PASSA (≥ 24)", c44, exc: "" };
  if (a.inline) return { c258: "PASSA por exceção (inline)", c44, exc: "Inline" };
  if (a.espacamentoOk) return { c258: "PASSA por exceção (espaçamento)", c44, exc: "Spacing" };
  if (a.nativo) return { c258: "REVISÃO MANUAL (controle nativo)", c44, exc: "User agent control?" };
  return { c258: "REVISÃO MANUAL (< 24 sem exceção automática)", c44, exc: "Equivalent/Essential?" };
}

const alvosCsv = [["locale", "tela", "rota", "largura_viewport", "elemento", "nome", "largura_px", "altura_px", "largura_efetiva_px", "altura_efetiva_px", "origem_area", "posicao_fixa", "classe_2_5_8_AA", "objetivo_44", "excecao", "sobreposicoes", "coberto_por", "conflitos_espacamento"]];
const resumoAlvos = {};
const telasCsv = [["locale", "tela", "rota", "perfil", "axe_claro", "axe_escuro", "boas_praticas", "overflow_larguras", "zoom200_overflow", "problemas_semanticos", "tab_paradas_1280", "sem_foco_visivel", "foco_encoberto_total", "foco_encoberto_parcial", "shift_tab_coerente", "espacamento_cortados", "espacamento_overflow", "movimento_com_reduce", "html_lang", "escritas_bloqueadas", "erros_de_pagina"]];
const problemas = [];
for (const l of LOCALES) {
  for (const t of varreduras[l].telas) {
    for (const [largura, alvos] of Object.entries(t.alvos)) {
      const r = (resumoAlvos[`${l}|${largura}`] ??= { locale: l, largura: Number(largura), total: 0, ge44: 0, de24a44: 0, excInline: 0, excEspacamento: 0, revisao: 0, ocultosFocaveis: 0, naoRenderizados: 0, sobreposicao: 0, coberto: 0 });
      for (const a of alvos) {
        const k = classificar(a);
        if (a.oculto === "nao-renderizado") { r.naoRenderizados += 1; continue; }
        r.total += 1;
        if (a.oculto === "visualmente-oculto") r.ocultosFocaveis += 1;
        else if (Math.min(a.wEf, a.hEf) >= 44) r.ge44 += 1;
        else if (Math.min(a.wEf, a.hEf) >= 24) r.de24a44 += 1;
        else if (k.exc === "Inline") r.excInline += 1;
        else if (k.exc === "Spacing") r.excEspacamento += 1;
        if (k.c258.startsWith("REVISÃO")) r.revisao += 1;
        if (a.sobreposicoes?.length) r.sobreposicao += 1;
        if (a.coberto) r.coberto += 1;
        const relevante = a.oculto || Math.min(a.wEf, a.hEf) < 44 || a.sobreposicoes?.length || a.coberto;
        if (relevante) alvosCsv.push([l, t.id, t.rota, largura, a.sel, a.nome, a.w, a.h, a.wEf ?? "", a.hEf ?? "", a.origem ?? a.oculto, a.fixo ? "sim" : "não", k.c258, k.c44, k.exc, (a.sobreposicoes ?? []).join(" | "), a.coberto ?? "", (a.conflitos ?? []).join(" | ")]);
      }
    }
    const sem = Object.entries(t.semantica).flatMap(([w, s]) => s.problemas.map((p) => ({ ...p, largura: w })));
    const tec = t.teclado["1280"] ?? {};
    const tec375 = t.teclado["375"] ?? {};
    telasCsv.push([l, t.id, t.rota, t.perfil, t.axe.length, t.axeEscuro.length, t.boasPraticas.map((b) => `${b.id}(${b.n})`).join(" "), t.overflow.map((o) => `${o.largura}:${o.px}`).join(" "), t.zoom200Overflow,
      sem.map((p) => p.tipo).join(" "), tec.paradas ?? "", (tec.semFocoVisivel?.length ?? 0) + (tec375.semFocoVisivel?.length ?? 0), [...(tec.obscurecidoTotal ?? []), ...(tec375.obscurecidoTotal ?? []).map((o) => ({ ...o, w: 375 }))].map((o) => `${o.w ?? 1280}:${o.nome}→${o.cobertoPor}`).join(" | "),
      (tec.obscurecidoParcial ?? 0) + (tec375.obscurecidoParcial ?? 0), tec.paradas ? `${tec.shiftTabCoerente}/${tec375.shiftTabCoerente}` : "", Object.values(t.espacamento ?? {}).reduce((n, e) => n + e.totalCortados, 0), Object.values(t.espacamento ?? {}).map((e) => e.overflowHorizontal).join("/"),
      t.movimentoComReduce.length, t.htmlLang, t.escritasBloqueadas.join(" "), t.errosDePagina.length]);
    for (const v of [...t.axe, ...t.axeEscuro.map((v) => ({ ...v, tema: "escuro" }))]) problemas.push({ locale: l, tela: t.id, tipo: `axe:${v.id}`, detalhe: `${v.tema} ${v.largura}px ${v.impacto} ${v.alvos.join(", ")}` });
    for (const p of sem) problemas.push({ locale: l, tela: t.id, tipo: p.tipo, wcag: p.wcag, detalhe: `${p.largura}px ${p.detalhe}` });
    for (const [w, k] of Object.entries(t.teclado)) {
      for (const o of k.obscurecidoTotal) problemas.push({ locale: l, tela: t.id, tipo: "foco-encoberto-total", wcag: "2.4.11", detalhe: `${w}px "${o.nome}" por ${o.cobertoPor}` });
      for (const o of k.semFocoVisivel) problemas.push({ locale: l, tela: t.id, tipo: "sem-foco-visivel", wcag: "2.4.7", detalhe: `${w}px ${o.tag} "${o.nome}"` });
      if (!k.shiftTabCoerente) problemas.push({ locale: l, tela: t.id, tipo: "shift-tab-divergente", wcag: "2.4.3", detalhe: `${w}px ${k.divergenciasShiftTab} divergências` });
    }
    for (const [w, e] of Object.entries(t.espacamento ?? {})) if (e.totalCortados || e.overflowHorizontal > 0) problemas.push({ locale: l, tela: t.id, tipo: "espacamento-texto", wcag: "1.4.12", detalhe: `${w}px overflow ${e.overflowHorizontal}; cortados: ${e.cortados.join(" | ")}` });
    if (t.zoom200Overflow > 0) problemas.push({ locale: l, tela: t.id, tipo: "zoom200", wcag: "1.4.4/1.4.10", detalhe: `${t.zoom200Overflow}px` });
    for (const o of t.overflow) problemas.push({ locale: l, tela: t.id, tipo: "reflow", wcag: "1.4.10", detalhe: `${o.largura}px +${o.px}` });
    if (t.movimentoComReduce.length) problemas.push({ locale: l, tela: t.id, tipo: "movimento", wcag: "2.3.3", detalhe: t.movimentoComReduce.join(", ") });
    if (t.errosDePagina.length) problemas.push({ locale: l, tela: t.id, tipo: "erro-de-pagina", detalhe: t.errosDePagina.join(" | ") });
  }
}

const resumo = {
  geradoEm: new Date().toISOString(),
  telasPorLocale: Object.fromEntries(LOCALES.map((l) => [l, varreduras[l].telas.length])),
  execucoesAxe: Object.fromEntries(LOCALES.map((l) => [l, varreduras[l].telas.length * (varreduras[l].larguras.length * 2 + 2)])),
  violacoesAxe: Object.fromEntries(LOCALES.map((l) => [l, varreduras[l].telas.reduce((n, t) => n + t.axe.length + t.axeEscuro.length, 0)])),
  incompletosAxe: Object.fromEntries(LOCALES.map((l) => [l, varreduras[l].telas.reduce((n, t) => n + t.incompletos, 0)])),
  alvos: Object.values(resumoAlvos),
  problemasPorTipo: problemas.reduce((acc, p) => { const k = `${p.tipo}|${p.locale}`; acc[k] = (acc[k] ?? 0) + 1; return acc; }, {}),
  problemas,
  cenarios: { total: cenarios.length, passa: cenarios.filter((c) => c.resultado === "PASSA").length, falha: cenarios.filter((c) => c.resultado === "FALHA").length, inconclusivo: cenarios.filter((c) => c.resultado === "INCONCLUSIVO").length },
};

// Matriz: uma linha por verificação × tela × idioma, mais os cenários de teclado.
const matriz = [["ID", "Tipo", "Critério WCAG", "Página", "Viewport", "Elemento", "Esperado", "Observado", "Resultado", "Evidência"]];
let n = 0;
const id = (p) => `${p}-${String(++n).padStart(4, "0")}`;
for (const l of LOCALES) {
  const arq = `evidencias/automatizado/final/a11y-${l}.json`;
  for (const t of varreduras[l].telas) {
    const pag = `${t.rota} (${l})`;
    const larg = varreduras[l].larguras.join("/");
    const ax21 = t.axe.filter((v) => v.conjunto === "2.1").length + t.axeEscuro.filter((v) => v.id !== "target-size").length;
    const ax22 = t.axe.filter((v) => v.conjunto === "2.2").length + t.axeEscuro.filter((v) => v.id === "target-size").length;
    matriz.push([id("AX"), "AUTOMATIZADO", "WCAG 2.0/2.1 A e AA (axe-core)", pag, `${larg} claro; 375/1440 escuro`, "página inteira", "0 violações", `${ax21} violações`, ax21 ? "FALHA" : "PASSA", arq]);
    matriz.push([id("AX"), "AUTOMATIZADO", "WCAG 2.2 AA (axe-core, inclui 2.5.8 target-size)", pag, `${larg} claro; 375/1440 escuro`, "página inteira", "0 violações", `${ax22} violações`, ax22 ? "FALHA" : "PASSA", arq]);
    matriz.push([id("RF"), "AUTOMATIZADO", "1.4.10 Reflow", pag, larg, "documento", "sem rolagem horizontal", t.overflow.length ? t.overflow.map((o) => `${o.largura}px:+${o.px}`).join(" ") : "sem overflow", t.overflow.length ? "FALHA" : "PASSA", arq]);
    matriz.push([id("ZM"), "AUTOMATIZADO", "1.4.4 Redimensionar texto (200 %)", pag, "640×450 (1280 a 200 %)", "documento", "sem rolagem horizontal", `${t.zoom200Overflow}px`, t.zoom200Overflow > 0 ? "FALHA" : "PASSA", arq]);
    const esp = Object.entries(t.espacamento ?? {});
    const espFalha = esp.some(([, e]) => e.overflowHorizontal > 0);
    const espRevisao = esp.some(([, e]) => e.totalCortados > 0);
    matriz.push([id("TS"), "AUTOMATIZADO", "1.4.12 Espaçamento de texto", pag, "375/1280", "texto", "sem perda de conteúdo", esp.map(([w, e]) => `${w}px: overflow ${e.overflowHorizontal}, cortados ${e.totalCortados}`).join("; "), espFalha ? "FALHA" : espRevisao ? "INCONCLUSIVO" : "PASSA", arq]);
    matriz.push([id("RM"), "AUTOMATIZADO", "2.3.3 Animação por interação (reduced motion)", pag, "1280", "documento", "nenhuma animação/transição > 10 ms", `${t.movimentoComReduce.length} elementos`, t.movimentoComReduce.length ? "FALHA" : "PASSA", arq]);
    matriz.push([id("LG"), "AUTOMATIZADO", "3.1.1 Idioma da página", pag, "1280", "html[lang]", l, t.htmlLang, t.htmlLang === l ? "PASSA" : "FALHA", arq]);
    for (const [w, s] of Object.entries(t.semantica)) {
      const porTipo = (tipos) => s.problemas.filter((p) => tipos.includes(p.tipo));
      const h = porTipo(["sem-h1", "salto-de-nivel", "titulo-vazio"]);
      matriz.push([id("HD"), "SEMÂNTICA INSPECIONADA", "1.3.1, 2.4.6 Títulos", pag, `${w}px`, `${s.titulos.length} títulos`, "h1 presente; sem salto de nível; sem título vazio", h.length ? h.map((p) => p.detalhe).join("; ") : s.titulos.map((x) => `h${x.nivel}`).join(" "), h.some((p) => p.tipo !== "salto-de-nivel") ? "FALHA" : h.length ? "OBSERVAÇÃO" : "PASSA", arq]);
      const lm = porTipo(["main", "navegacao-sem-nome-distinto"]);
      matriz.push([id("LM"), "SEMÂNTICA INSPECIONADA", "1.3.1, 2.4.1 Landmarks", pag, `${w}px`, s.landmarks.map((x) => x.papel).join(" "), "uma região main; navegações com nomes distintos", lm.length ? lm.map((p) => p.detalhe).join("; ") : "ok", lm.some((p) => p.tipo === "main") ? "FALHA" : lm.length ? "OBSERVAÇÃO" : "PASSA", arq]);
      const nm = porTipo(["sem-nome", "rotulo-fora-do-nome", "nome-colado", "texto-colado"]);
      matriz.push([id("NM"), "SEMÂNTICA INSPECIONADA", "4.1.2, 2.4.4, 2.5.3 Nomes acessíveis", pag, `${w}px`, `${s.links} links, ${s.botoes} botões, ${s.campos.length} campos`, "todo controle com nome; rótulo visível contido no nome; leitura linear sem palavras coladas", nm.length ? nm.map((p) => `${p.tipo}: ${p.detalhe}`).join("; ") : "ok", nm.length ? "FALHA" : "PASSA", arq]);
      const im = porTipo(["img-sem-alt", "alt-arquivo", "svg-exposto"]);
      matriz.push([id("IM"), "SEMÂNTICA INSPECIONADA", "1.1.1 Conteúdo não textual", pag, `${w}px`, `${s.imagens} img (${s.imagensDecorativas} decorativas)`, "img com alt; decorativas ocultas", im.length ? im.map((p) => `${p.tipo}: ${p.detalhe}`).join("; ") : "ok", im.some((p) => p.tipo !== "svg-exposto") ? "FALHA" : im.length ? "INCONCLUSIVO" : "PASSA", arq]);
    }
    for (const [w, k] of Object.entries(t.teclado)) {
      matriz.push([id("KB"), "AUTOMATIZADO", "2.4.3 Ordem do foco (Tab/Shift+Tab)", pag, `${w}px`, `${k.paradas} paradas`, "Shift+Tab percorre a ordem inversa do Tab", k.shiftTabCoerente ? "coerente" : `${k.divergenciasShiftTab} divergências`, k.shiftTabCoerente ? "PASSA" : "FALHA", arq]);
      matriz.push([id("FV"), "AUTOMATIZADO", "2.4.7 Foco visível", pag, `${w}px`, `${k.paradas} paradas`, "outline ou box-shadow em toda parada", `${k.semFocoVisivel.length} sem indicador`, k.semFocoVisivel.length ? "FALHA" : "PASSA", arq]);
      matriz.push([id("FO"), "AUTOMATIZADO", "2.4.11 Foco não obscurecido (mínimo)", pag, `${w}px`, `${k.paradas} paradas`, "nenhum elemento focado inteiramente encoberto", k.obscurecidoTotal.length ? k.obscurecidoTotal.map((o) => `"${o.nome}" por ${o.cobertoPor}`).join("; ") : `0 total; ${k.obscurecidoParcial} parcial`, k.obscurecidoTotal.length ? "FALHA" : "PASSA", arq]);
    }
    for (const [w, alvos] of Object.entries(t.alvos)) {
      const vis = alvos.filter((a) => !a.oculto);
      const k = vis.map(classificar);
      const rev = k.filter((c) => c.c258.startsWith("REVISÃO")).length;
      matriz.push([id("TG"), "AUTOMATIZADO", "2.5.8 Tamanho do alvo (mínimo) AA", pag, `${w}px`, `${vis.length} alvos`, "≥ 24×24 px CSS ou exceção", `${k.filter((c) => c.c258 === "PASSA (≥ 24)").length} ≥ 24; ${k.filter((c) => /exceção/.test(c.c258)).length} por exceção; ${rev} para revisão`, rev ? "INCONCLUSIVO" : "PASSA", "ALVOS-TOQUE.csv"]);
      matriz.push([id("T4"), "AUTOMATIZADO", "Objetivo de projeto 44×44 (referência 2.5.5 AAA)", pag, `${w}px`, `${vis.length} alvos`, "≥ 44×44 px CSS", `${vis.filter((a) => Math.min(a.wEf, a.hEf) >= 44).length} atingem; ${vis.filter((a) => Math.min(a.wEf, a.hEf) < 44).length} abaixo`, vis.some((a) => Math.min(a.wEf, a.hEf) < 44) ? "OBSERVAÇÃO" : "PASSA", "ALVOS-TOQUE.csv"]);
      const sob = vis.filter((a) => a.sobreposicoes?.length || a.coberto);
      matriz.push([id("OV"), "AUTOMATIZADO", "2.5.8 / acionabilidade (sobreposição e cobertura)", pag, `${w}px`, `${vis.length} alvos`, "nenhum alvo sobreposto ou encoberto no centro", sob.length ? sob.map((a) => `${a.sel}: ${[...(a.sobreposicoes ?? []), a.coberto].filter(Boolean).join(",")}`).join("; ") : "ok", sob.length ? "INCONCLUSIVO" : "PASSA", "ALVOS-TOQUE.csv"]);
    }
  }
}
for (const c of cenarios) matriz.push([c.id, "AUTOMATIZADO (cenário)", c.wcag, `${c.tela} (pt-BR)`, c.viewport, c.elemento, c.esperado, c.observado, c.resultado, `evidencias/automatizado/cenarios-final/${c.evidencia}`]);

await writeFile(path.join(SAIDA, "ALVOS-TOQUE.csv"), csv(alvosCsv));
await writeFile(path.join(SAIDA, "MATRIZ-AUTOMATIZADA.csv"), csv(matriz));
await writeFile(path.join(SAIDA, "TELAS.csv"), csv(telasCsv));
await writeFile(path.join(SAIDA, "resumo.json"), JSON.stringify(resumo, null, 2));
const cont = (r) => matriz.filter((m) => m[8] === r).length;
console.log(`matriz ${matriz.length - 1} linhas (PASSA ${cont("PASSA")}, FALHA ${cont("FALHA")}, INCONCLUSIVO ${cont("INCONCLUSIVO")}, OBSERVAÇÃO ${cont("OBSERVAÇÃO")}); alvos csv ${alvosCsv.length - 1}; problemas ${problemas.length}`);
