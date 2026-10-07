# Notas de implementação — src/test

Texto que ficava em comentários de várias linhas no código. Cada seção indica o arquivo e o trecho que o comentário acompanhava.

## `src/test/networkIsolation.test.js`

**`describe("isolamento de rede dos testes unitários", () => {`**

Proteção de regressão (Task 8.1): a suíte unitária nunca fala com a API
real, esteja o backend local ligado ou não.

## `src/test/setupTests.js`

**`await Promise.all([loadLocale("en"), loadLocale("es")]);`**

Dicionários en/es são chunks sob demanda no app; nos testes ficam carregados
para que setLocale("en"|"es") funcione de forma síncrona.

**`const blockedRequests = [];`**

Isolamento de rede da suíte unitária (Task 8.1).
1) vite.config.js força VITE_API_BASE_URL para um host `.invalid`
(RFC 6761: nunca resolve), então nenhuma URL montada pelo apiClient
aponta para o backend local, mesmo com ele no ar.
2) Esta guarda substitui fetch/XMLHttpRequest por versões que falham na
hora e registram a tentativa. Um teste que precise de resposta deve
mockar o service ou atribuir o próprio globalThis.fetch.
