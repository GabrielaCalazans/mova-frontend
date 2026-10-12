// Task 11.3 — sem leitor de tela: no Firefox, quais paradas de Tab caem em elementos não interativos
// (contêineres roláveis que o Firefox torna focáveis)? Tab real via WebDriver BiDi, Firefox headless.
// Uso: node scripts/task11-3-sonda-rolaveis.mjs <pasta-saida>
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { abrirFirefox, abrirTela } from "./task11-3-navegadores.mjs";
import { dadosDemo } from "./task11-2-comum.mjs";

const SAIDA = process.argv[2] ?? ".";
const demo = await dadosDemo();
const LOC = demo.sessoes.loc, DONO = demo.sessoes.dono;
const TELAS = [
  ["home", "/", null], ["catalogo", "/carros", null], ["reservas", "/historico", LOC], ["conta", "/conta", LOC],
  ["painel", "/painel", DONO], ["frota", "/cadastro-carros", DONO], ["garagens", "/cadastro-garagens", DONO],
  ["reservas-frota", "/reservas", DONO], ["relatorios", "/relatorios/veiculos", DONO],
];
const INTERATIVO = "a[href],button,input,select,textarea,summary,[tabindex],[contenteditable=true],iframe,audio[controls],video[controls]";
const ff = await abrirFirefox(path.join(SAIDA, "perfil"), { headless: true, porta: 9340 });
const resultado = { navegador: `Firefox ${ff.versao}`, telas: [] };

for (const largura of [1280, 375]) {
  await ff.tamanho(largura, 900);
  for (const [id, rota, sessao] of TELAS) {
    await abrirTela(ff, rota, { sessao });
    await ff.run(() => { document.activeElement?.blur(); window.getSelection()?.removeAllRanges(); });
    const paradas = [];
    for (let i = 0; i < 45; i++) {
      await ff.tecla("");
      const p = await ff.run((sel) => {
        const a = document.activeElement;
        if (!a || a === document.body) return null;
        const cs = getComputedStyle(a);
        return { tag: a.tagName.toLowerCase(), classe: String(a.className || "").split(" ")[0], role: a.getAttribute("role"), interativo: a.matches(sel), overflow: `${cs.overflowX}/${cs.overflowY}`, rolagem: `${a.scrollWidth}x${a.scrollHeight} em ${a.clientWidth}x${a.clientHeight}` };
      }, INTERATIVO);
      if (!p) break;
      if (!p.interativo) paradas.push({ tab: i + 1, ...p });
    }
    resultado.telas.push({ id, largura, naoInterativas: paradas });
    console.log(largura, id, paradas.length ? JSON.stringify(paradas) : "ok");
  }
}
await ff.fechar();
await writeFile(path.join(SAIDA, "sonda-rolaveis.json"), JSON.stringify(resultado, null, 2));
