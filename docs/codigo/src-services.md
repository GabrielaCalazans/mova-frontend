# Notas de implementação — src/services

Texto que ficava em comentários de várias linhas no código. Cada seção indica o arquivo e o trecho que o comentário acompanhava.

## `src/services/apiClient.js`

**`import { clearAuthSession, saveAuthFeedback } from "./authSession";`**

Erro de API com o status HTTP preservado. Antes o cliente lançava um Error
genérico e quem chamava só conseguia distinguir 401 de 500 por regex na
mensagem. Ver auditoria/CONTRATO-FRONTEND-BACKEND.md.

**`if (Array.isArray(payload.errors) && payload.errors.length > 0) {`**

Erros de validacao (Zod) vem como { message: "Invalid Data Format",
errors: [{ path: [...], message: "..." }, ...] }. O "message" sozinho
e generico; o detalhe util (qual campo, qual regra falhou) esta em
"errors". Priorizamos montar uma mensagem legivel a partir dele.

**`const message = response.status >= 500`**

Task 11: erro interno do servidor nunca vira texto técnico na tela
("Internal Server Error"); o requestId continua no console para suporte.

**`export async function apiRequestPaginado(`**

Consome uma listagem paginada do backend seguindo o pagination.totalPages.

Todas as listagens da API respondem
{ result: [...], pagination: { total, page, limit, totalPages } }
com limit padrao 10. Antes o frontend lia so "result" e silenciosamente
mostrava no maximo 10 itens. Aqui a metadata e de fato interpretada.

@param {string} path caminho, podendo ja conter query string
@param {object} options repassado ao apiRequest (authToken, etc.)
@param {{limit?: number, maxPaginas?: number}} opcoes limit maximo da API e 100
@returns {Promise&lt;Array>} todos os itens, de todas as paginas

## `src/services/apiClient.test.js`

**`function respostaJson(body, status = 200, responseHeaders = {}) {`**

O apiClient não tinha nenhuma cobertura: buildUrl, o parser de erro e o
header Authorization nunca eram exercitados. Estes testes cobrem o contrato
de erro e o consumo de paginação.

## `src/services/apiEnums.js`

**`import { t } from "../i18n";`**

Espelho dos enums do backend (prisma/schema.prisma). Fonte única de verdade
no frontend: nenhum componente deve escrever um literal de enum solto.

Regra: o CÓDIGO é o que trafega na API; o RÓTULO é só para exibição.
Ver auditoria/CONTRATO-FRONTEND-BACKEND.md.

**`function labels(group, codes) {`**

Mapas de rótulo com getters: cada leitura traduz no idioma ativo (RNF08),
mantendo o formato { CODIGO: "Rótulo" } que as telas já usam.

**`export const PRAZO_PAGAMENTO_MINUTOS = 15;`**

Task 10 (D10-02/D10-03): espelho do prazo de pagamento do backend
(mova-backend/src/shared/prazo-pagamento.ts). Só para exibição: quem expira
a reserva e a tentativa é sempre o backend.

**`export const METODO_PAGAMENTO = {`**

enum MetodoPagamento — schema.prisma.
O backend NÃO possui boleto; não ofereça essa opção sem antes adicionar o
valor ao enum do banco (migration).

**`export function rotulo(mapa, codigo) {`**

Rótulo de exibição. Código desconhecido (enum novo no backend) vira texto
legível em vez de aparecer cru: "NOVO_STATUS" → "Novo status".

## `src/services/apiEnums.test.js`

**`describe("apiEnums — paridade com o backend", () => {`**

Estes testes travam o contrato de enums contra o backend
(prisma/schema.prisma). Se alguém reintroduzir um literal divergente,
a suíte quebra aqui em vez de quebrar em produção.

## `src/services/authService.js`

**`function buildLocatarioUpdatePayload(values) {`**

@typedef {Object} LocatarioUpdatePayload
@property {string} cnh
@property {string} cpf

**`function buildLocatarioUpdatePayload(values) {`**

@typedef {Object} LocadorUpdatePayload
@property {string} empresa
@property {string} cnpj

**`function buildLocatarioUpdatePayload(values) {`**

@param {Object} values
@returns {LocatarioUpdatePayload}

**`function buildLocadorUpdatePayload(values) {`**

@param {Object} values
@returns {LocadorUpdatePayload}

**`export async function registerLocatario(values) {`**

Task 10 (M-05): cadastro em UMA operação. O backend cria Conta + perfil na
mesma transação; se o perfil falhar, nenhuma Conta fica para trás.

**`email: undefined,`**

O backend não altera e-mail pelo perfil; não enviar evita sugerir
que a troca aconteceu (JSON.stringify omite undefined).

## `src/services/avaliacaoService.js`

**`export async function createAvaliacao(payload) {`**

Cria uma avaliação para uma reserva concluída. Endpoint: POST /avaliacao
Campos esperados (createAvaliacaoSchema): idReserva, nota (1 a 5,
aceita casas decimais), comentario? (até 255 caracteres).

## `src/services/deficienciaService.js`

**`export async function listDeficiencias() {`**

Lista as deficiências cadastradas no sistema (endpoint público).
Endpoint: GET /deficiencia/all
Usado para popular o select opcional de deficiência no cadastro de locatário.

**`console.error("[deficienciaService] Falha ao buscar /deficiencia/all:", error?.message ...`**

Loga o motivo real (rede, CORS, backend fora do ar, etc.) em vez de
esconder o erro — o campo continua opcional e não bloqueia o cadastro,
mas agora dá pra saber PORQUE a lista veio vazia.

## `src/services/garagemService.js`

**`export async function listGaragens(filters = {}) {`**

Lista garagens (somente locador dono / admin). Endpoint: GET /garagem
Suporta filtros: idLocador, nome, acessibilidade, capacidadeMin,
capacidadeMax, comVagasDisponiveis.

**`export async function createGaragem(payload) {`**

Cria uma garagem. Endpoint: POST /garagem
Campos esperados (createGaragemSchema): idLocador, nome, endereco,
capacidade (int > 0), acessibilidade? (bool).

## `src/services/lgpdService.js`

**`export async function exportarMeusDados() {`**

Autoatendimento do titular (mova-backend/src/routes/lgpd/lgpd.ts): qualquer
conta autenticada acessa apenas os próprios dados.

## `src/services/notificacaoService.js`

**`export async function listarPreferencias() {`**

Preferências de notificação (canal × tipo). Endpoint: GET /notificacao/preferencias.
Só retorna as preferências gravadas; ausência = habilitado (opt-in padrão do backend).

## `src/services/reservaService.js`

**`export async function createReserva(payload) {`**

Cria uma reserva. Endpoint: POST /api/reserva

Campos aceitos (createReservaSchema):
idVeiculo\*, idLocatario\*, dataHoraInicio\*, dataHoraFim\*,
deficienciaId?, idGaragemRetirada?, idGaragemDevolucao?, servicosIds?,
metodoPagamento?

NÃO aceita status, statusPagamento nem valorTotal: são do domínio. Toda
reserva nasce AGUARDANDO_PAGAMENTO e o backend calcula o valor a partir da
valorDiaria do modelo do veículo.
Ver auditoria/CONTRATO-FRONTEND-BACKEND.md e auditoria/PAGAMENTO.md.

**`export async function updateReserva(id, payload) {`**

Atualiza uma reserva. Endpoint: PUT /api/reserva/:id

Campos aceitos (updateReservaSchema): idGaragemDevolucao?, dataHoraInicio?,
dataHoraFim?, metodoPagamento? — ao menos um.

NÃO aceita status, statusPagamento nem valorTotal. O pagamento só é
confirmado pelo webhook assinado do gateway; é nesse momento que o backend
gera o codigoDesbloqueio (formato XXXX-XXXX).

**`export async function iniciarPagamento(id, { metodoPagamento, cartao } = {}) {`**

Inicia o pagamento de uma reserva. Endpoint: POST /api/reserva/:id/pagamento

Body aceito (iniciarPagamentoSchema): metodoPagamento\* + cartao? (numero,
nome, validade, cvv) — dados de TESTE do sandbox.

O cliente NÃO envia valor nem resultado: o backend calcula o valor a partir
da reserva e decide o desfecho a partir dos dados de teste. A resposta é 202
(aceito), não "pago": o pagamento só é confirmado quando o webhook ASSINADO
do gateway chega. Ver auditoria/PAGAMENTO.md.

Retorno: { reserva, valorCobrado, provider }.

**`export async function desbloquearReserva(id, codigo, coord) {`**

Desbloqueia o veículo. Endpoint: POST /reserva/:id/desbloqueio
Body: { codigo: "XXXX-XXXX", latitude?, longitude? }.

O desbloqueio só existe quando ESTA chamada responde 200: a resposta traz a
reserva já em EM_ANDAMENTO, com codigoUsadoEm preenchido. Toda recusa (código
errado 400, fora da janela/uso único 409, geofence 403) vem daqui com a
mensagem do backend. Ver auditoria/DESBLOQUEIO.md.

latitude/longitude são opcionais no contrato, mas obrigatórias quando o
veículo tem localização conhecida (RN03 — geofence): ou ambas, ou nenhuma.

**`export async function desbloquearReservaPorQr(id, qr, coord) {`**

Desbloqueia pelo token do QR Code. Endpoint: POST /reserva/:id/desbloqueio/qr

O QR é equivalente ao código textual — mesma validação de janela, uso único,
reserva, veículo e usuário no backend.

**`function coordBody(coord) {`**

Só envia as coordenadas quando as DUAS existem — o schema do backend recusa
latitude sem longitude (e vice-versa).

**`` return apiRequestPaginado(`/reserva/locatario/${idLocatario}`, authHeaders()); ``**

Lista vazia agora responde 200 com result: [] (o backend deixou de
devolver 404). Segue a paginação para não truncar o histórico em 10.

**`export async function getReservasDoLocatarioPage(idLocatario, { page = 1, limit = 10 } ...`**

Lê uma página do histórico, preservando a metadata entregue pelo backend.
A tela usa este método para não baixar nem esconder reservas além da página.

## `src/services/veiculoService.js`

**`export function normalizeVeiculo(veiculo) {`**

Normaliza um veículo do novo modelo da API, onde os dados descritivos
ficam em modeloVeiculo (objeto aninhado), mantendo compatibilidade com
o restante do front-end que acessa marca, modelo, ano, etc. no nível raiz.

Novo formato: { id, idLocador, idModeloVeiculo, modeloVeiculo: { marca, modelo, ano, cambio,
capacidade, eletrico, adaptado, ... }, garagemId, placa, status, criadoEm }

@param {Object} veiculo - Objeto bruto retornado pela API
@returns {Object} Objeto normalizado com todos os campos no nível raiz

**`valorDiaria: mv.valorDiaria ?? veiculo.valorDiaria,`**

Preco da diaria: vive no modelo e e a base do calculo do valor da
reserva no backend. Ver auditoria/PAGAMENTO.md.

**`export async function listVeiculos(filters = {}) {`**

Lista veículos autenticados (com token do locatário/admin).
Endpoint: GET /veiculo/
Os mesmos filtros de searchVeiculos se aplicam, além de idLocador e garagemId.

**`export async function listFrota() {`**

Lista frota privada do locador autenticado, incluindo todos os status.
O backend deriva o proprietário do JWT; não enviar idLocador do cliente.
Endpoint: GET /veiculo/meus

**`export async function createVeiculo(payload) {`**

Cria um veículo novo (uso do locador). Endpoint: POST /veiculo
Campos esperados (createVeiculoSchema no backend): idLocador, placa, marca,
modelo, ano, cambio, capacidade, valorDiaria, status?, eletrico, adaptado,
categoria?.

**`export async function updateVeiculo(id, payload) {`**

Atualiza veículo e, opcionalmente, seu bloco de catálogo de forma
coordenada. Endpoint: PUT /veiculo/:id
Contrato: { placa?, status?, garagemId?, modelo?: { marca?, modelo?, ano?,
cambio?, capacidade?, valorDiaria?, eletrico?, adaptado?, categoria? } }.

**`export async function deleteVeiculo(id) {`**

Remove um veículo. Endpoint: DELETE /veiculo/:id

**`export async function getVeiculoById(id) {`**

Busca os detalhes completos de um veículo pelo id.
Endpoint: GET /veiculo/:id
