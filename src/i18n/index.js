import { useSyncExternalStore } from "react";

// Internacionalização do MOVA (RNF08): pt-BR (padrão), en e es.
//
// Dicionários em ./locales/<idioma>/<namespace>.json; a chave usada no código é
// "<namespace>.<caminho>" (ex.: t("common.nav.home")). Falta no idioma ativo →
// pt-BR → a própria chave. `t` é uma função de módulo (não um hook): o App
// remonta a árvore de rotas quando o idioma muda, então qualquer render já
// enxerga o idioma novo — inclusive helpers fora de componentes.
// ponytail: remontar perde estado local da tela na troca de idioma (ação rara,
// feita em Configurações/cabeçalho); hooks por componente só se isso incomodar.

export const LOCALES = {
  "pt-BR": { intl: "pt-BR", html: "pt-BR", label: "Português (Brasil)" },
  en: { intl: "en-US", html: "en", label: "English" },
  es: { intl: "es-ES", html: "es", label: "Español" },
};
export const DEFAULT_LOCALE = "pt-BR";
const STORAGE_KEY = "mova_locale";

const messages = {};
function register(path, mod) {
  const [, locale, namespace] = path.match(/\.\/locales\/([^/]+)\/([^/]+)\.json$/);
  (messages[locale] ??= {})[namespace] = mod.default ?? mod;
}
// pt-BR (padrão e fallback) vai no bundle; en/es viram chunks carregados sob
// demanda, para quem usa português não baixar os outros dois dicionários.
for (const [path, mod] of Object.entries(import.meta.glob("./locales/pt-BR/*.json", { eager: true }))) register(path, mod);
const lazyLocales = import.meta.glob(["./locales/en/*.json", "./locales/es/*.json"]);
const loaded = new Set([DEFAULT_LOCALE]);

export async function loadLocale(locale) {
  if (!LOCALES[locale] || loaded.has(locale)) return;
  const entries = Object.entries(lazyLocales).filter(([path]) => path.startsWith(`./locales/${locale}/`));
  await Promise.all(entries.map(async ([path, load]) => register(path, await load())));
  loaded.add(locale);
}

// Troca de idioma pela interface: carrega o dicionário e então troca.
export async function changeLocale(locale) {
  await loadLocale(locale);
  setLocale(locale);
}

function readStoredLocale() {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value && LOCALES[value] ? value : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

let current = typeof window === "undefined" ? DEFAULT_LOCALE : readStoredLocale();
const listeners = new Set();

function applyHtmlLang() {
  if (typeof document !== "undefined") document.documentElement.lang = LOCALES[current].html;
}
applyHtmlLang();

export function getLocale() {
  return current;
}

export function setLocale(locale) {
  const next = LOCALES[locale] ? locale : DEFAULT_LOCALE;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Sem storage (modo privado): o idioma vale só nesta aba.
  }
  if (next === current) return;
  current = next;
  applyHtmlLang();
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useLocale() {
  return useSyncExternalStore(subscribe, getLocale, () => DEFAULT_LOCALE);
}

function lookup(locale, key) {
  const [namespace, ...rest] = key.split(".");
  let node = messages[locale]?.[namespace];
  for (const part of rest) node = node?.[part];
  return typeof node === "string" || Array.isArray(node) ? node : undefined;
}

const interpolate = (text, params) =>
  text.replace(/\{(\w+)\}/g, (match, name) => (params[name] ?? match).toString());

// t("ns.key", { count, ...vars }). Com `count`, procura "<chave>_one"/"_other"
// conforme as regras de plural do idioma antes da chave simples.
export function t(key, params = {}) {
  let text;
  if (params.count !== undefined) {
    const form = new Intl.PluralRules(LOCALES[current].intl).select(Number(params.count));
    text = lookup(current, `${key}_${form}`) ?? lookup(DEFAULT_LOCALE, `${key}_${form}`) ?? lookup(current, `${key}_other`) ?? lookup(DEFAULT_LOCALE, `${key}_other`);
  }
  text ??= lookup(current, key) ?? lookup(DEFAULT_LOCALE, key);
  if (text === undefined) return key;
  return typeof text === "string" ? interpolate(text, params) : text;
}

export function intlLocale() {
  return LOCALES[current].intl;
}

// Moeda do produto é sempre BRL; só a formatação acompanha o idioma.
export function formatCurrency(value) {
  // narrowSymbol: "R$" também em es-ES (o padrão do ICU ali é o código "BRL").
  return new Intl.NumberFormat(intlLocale(), { style: "currency", currency: "BRL", currencyDisplay: "narrowSymbol" }).format(Number(value) || 0);
}

export function formatNumber(value, options) {
  return new Intl.NumberFormat(intlLocale(), options).format(Number(value) || 0);
}

// Aceita Date, ISO ou timestamp. Valor inválido → "" (o chamador decide o texto).
export function formatDate(value, options = { dateStyle: "short" }) {
  if (value === null || value === undefined || value === "") return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(intlLocale(), options).format(date);
}
