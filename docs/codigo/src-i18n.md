# Notas de implementação — src/i18n

Texto que ficava em comentários de várias linhas no código. Cada seção indica o arquivo e o trecho que o comentário acompanhava.

## `src/i18n/catalog.test.js`

**`const LOCALES_DIR = join(globalThis.process.cwd(), "src", "i18n", "locales");`**

RNF08: garante que os três idiomas têm exatamente as mesmas chaves e que toda
chave literal usada em t("...") existe no dicionário padrão (pt-BR).

## `src/i18n/index.js`

**`export const LOCALES = {`**

Internacionalização do MOVA (RNF08): pt-BR (padrão), en e es.

Dicionários em ./locales/&lt;idioma>/&lt;namespace>.json; a chave usada no código é
"&lt;namespace>.&lt;caminho>" (ex.: t("common.nav.home")). Falta no idioma ativo →
pt-BR → a própria chave. `t` é uma função de módulo (não um hook): o App
remonta a árvore de rotas quando o idioma muda, então qualquer render já
enxerga o idioma novo — inclusive helpers fora de componentes.
ponytail: remontar perde estado local da tela na troca de idioma (ação rara,
feita em Configurações/cabeçalho); hooks por componente só se isso incomodar.

**`for (const [path, mod] of Object.entries(import.meta.glob("./locales/pt-BR/*.json", { e...`**

pt-BR (padrão e fallback) vai no bundle; en/es viram chunks carregados sob
demanda, para quem usa português não baixar os outros dois dicionários.

**`export function t(key, params = {}) {`**

t("ns.key", { count, ...vars }). Com `count`, procura "&lt;chave>_one"/"_other"
conforme as regras de plural do idioma antes da chave simples.

## `src/i18n/index.test.js`

**`vi.resetModules();`**

Instância nova do módulo: o en/common.json mockado (sem "hint") é o que
loadLocale carrega, como acontece com o chunk sob demanda no app.
