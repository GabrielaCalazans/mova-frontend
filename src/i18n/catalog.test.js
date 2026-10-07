import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const LOCALES_DIR = join(globalThis.process.cwd(), "src", "i18n", "locales");
const SRC = join(globalThis.process.cwd(), "src");

function chaves(obj, prefixo = "") {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" && !Array.isArray(v) ? chaves(v, `${prefixo}${k}.`) : [`${prefixo}${k}`],
  );
}

function dicionario(locale) {
  const dir = join(LOCALES_DIR, locale);
  return readdirSync(dir).flatMap((arquivo) =>
    chaves(JSON.parse(readFileSync(join(dir, arquivo), "utf8")), `${arquivo.replace(/\.json$/, "")}.`),
  );
}

function arquivosFonte(dir) {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return nome === "i18n" ? [] : arquivosFonte(caminho);
    return /\.(jsx?|mjs)$/.test(nome) && !/\.test\./.test(nome) ? [caminho] : [];
  });
}

describe("dicionários i18n", () => {
  const pt = new Set(dicionario("pt-BR"));

  it.each(["en", "es"])("%s tem as mesmas chaves que pt-BR", (locale) => {
    const outro = new Set(dicionario(locale));
    expect([...pt].filter((k) => !outro.has(k))).toEqual([]);
    expect([...outro].filter((k) => !pt.has(k))).toEqual([]);
  });

  it("toda chave literal usada em t() existe em pt-BR", () => {
    const usadas = new Set();
    for (const arquivo of arquivosFonte(SRC)) {
      for (const [, chave] of readFileSync(arquivo, "utf8").matchAll(/\bt\(\s*"([a-zA-Z]+\.[\w.]+)"/g)) usadas.add(chave);
    }
    expect(usadas.size).toBeGreaterThan(500);
    // Chaves com plural existem como <chave>_one/_other.
    const faltando = [...usadas].filter((k) => !pt.has(k) && !pt.has(`${k}_one`) && !pt.has(`${k}_other`));
    expect(faltando).toEqual([]);
  });
});
