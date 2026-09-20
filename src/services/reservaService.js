import { apiRequest, apiRequestPaginado } from "./apiClient";
import { getAuthSession } from "./authSession";

function authHeaders() {
  const session = getAuthSession();
  return { authToken: session?.token };
}

/**
 * Cria uma reserva. Endpoint: POST /api/reserva
 *
 * Campos aceitos (createReservaSchema):
 *   idVeiculo*, idLocatario*, dataHoraInicio*, dataHoraFim*,
 *   deficienciaId?, idGaragemRetirada?, idGaragemDevolucao?, servicosIds?,
 *   metodoPagamento?
 *
 * NÃO aceita status, statusPagamento nem valorTotal: são do domínio. Toda
 * reserva nasce AGUARDANDO_PAGAMENTO e o backend calcula o valor a partir da
 * valorDiaria do modelo do veículo.
 * Ver auditoria/CONTRATO-FRONTEND-BACKEND.md e auditoria/PAGAMENTO.md.
 */
export async function createReserva(payload) {
  const data = await apiRequest("/reserva", {
    method: "POST",
    body: JSON.stringify(payload),
    ...authHeaders(),
  });
  return data.result ?? data;
}

/**
 * Atualiza uma reserva. Endpoint: PUT /api/reserva/:id
 *
 * Campos aceitos (updateReservaSchema): idGaragemDevolucao?, dataHoraInicio?,
 * dataHoraFim?, metodoPagamento? — ao menos um.
 *
 * NÃO aceita status, statusPagamento nem valorTotal. O pagamento só é
 * confirmado pelo webhook assinado do gateway; é nesse momento que o backend
 * gera o codigoDesbloqueio (formato XXXX-XXXX).
 */
export async function updateReserva(id, payload) {
  if (!id) throw new Error("ID da reserva não informado.");
  const data = await apiRequest(`/reserva/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    ...authHeaders(),
  });
  return data.result ?? data;
}

/**
 * Inicia o pagamento de uma reserva. Endpoint: POST /api/reserva/:id/pagamento
 *
 * Body aceito (iniciarPagamentoSchema): metodoPagamento* + cartao? (numero,
 * nome, validade, cvv) — dados de TESTE do sandbox.
 *
 * O cliente NÃO envia valor nem resultado: o backend calcula o valor a partir
 * da reserva e decide o desfecho a partir dos dados de teste. A resposta é 202
 * (aceito), não "pago": o pagamento só é confirmado quando o webhook ASSINADO
 * do gateway chega. Ver auditoria/PAGAMENTO.md.
 *
 * Retorno: { reserva, valorCobrado, provider }.
 */
export async function iniciarPagamento(id, { metodoPagamento, cartao } = {}) {
  if (!id) throw new Error("ID da reserva não informado.");
  const data = await apiRequest(`/reserva/${id}/pagamento`, {
    method: "POST",
    body: JSON.stringify({
      metodoPagamento,
      ...(cartao ? { cartao } : {}),
    }),
    ...authHeaders(),
  });
  return data.result ?? data;
}

/**
 * Desbloqueia o veículo. Endpoint: POST /reserva/:id/desbloqueio
 * Body: { codigo: "XXXX-XXXX", latitude?, longitude? }.
 *
 * O desbloqueio só existe quando ESTA chamada responde 200: a resposta traz a
 * reserva já em EM_ANDAMENTO, com codigoUsadoEm preenchido. Toda recusa (código
 * errado 400, fora da janela/uso único 409, geofence 403) vem daqui com a
 * mensagem do backend. Ver auditoria/DESBLOQUEIO.md.
 *
 * latitude/longitude são opcionais no contrato, mas obrigatórias quando o
 * veículo tem localização conhecida (RN03 — geofence): ou ambas, ou nenhuma.
 */
export async function desbloquearReserva(id, codigo, coord) {
  if (!id) throw new Error("ID da reserva não informado.");
  const data = await apiRequest(`/reserva/${id}/desbloqueio`, {
    method: "POST",
    body: JSON.stringify({ codigo, ...coordBody(coord) }),
    ...authHeaders(),
  });
  return data.result ?? data;
}

/**
 * Desbloqueia pelo token do QR Code. Endpoint: POST /reserva/:id/desbloqueio/qr
 *
 * O QR é equivalente ao código textual — mesma validação de janela, uso único,
 * reserva, veículo e usuário no backend.
 */
export async function desbloquearReservaPorQr(id, qr, coord) {
  if (!id) throw new Error("ID da reserva não informado.");
  const data = await apiRequest(`/reserva/${id}/desbloqueio/qr`, {
    method: "POST",
    body: JSON.stringify({ qr, ...coordBody(coord) }),
    ...authHeaders(),
  });
  return data.result ?? data;
}

/** Endpoint: GET /reserva/:id/desbloqueio/qr — retorna { qr } (token assinado). */
export async function getQrDesbloqueio(id) {
  if (!id) throw new Error("ID da reserva não informado.");
  const data = await apiRequest(`/reserva/${id}/desbloqueio/qr`, authHeaders());
  return (data.result ?? data)?.qr ?? "";
}

// Só envia as coordenadas quando as DUAS existem — o schema do backend recusa
// latitude sem longitude (e vice-versa).
function coordBody(coord) {
  const { latitude, longitude } = coord ?? {};
  return typeof latitude === "number" && typeof longitude === "number"
    ? { latitude, longitude }
    : {};
}

/** Endpoint: GET /reserva/:id */
export async function getReservaById(id) {
  if (!id) throw new Error("ID da reserva não informado.");
  const data = await apiRequest(`/reserva/${id}`, authHeaders());
  return data.result ?? data;
}

/** Endpoint: GET /reserva/:id/localizacao — última posição autorizada pela reserva. */
export async function getRastreamentoReserva(id) {
  if (!id) throw new Error("ID da reserva não informado.");
  const data = await apiRequest(`/reserva/${id}/localizacao`, authHeaders());
  return data.result ?? data;
}

/** Registra a devolução. O servidor define o instante e a cobrança de atraso. */
export async function devolverReserva(id) {
  if (!id) throw new Error("ID da reserva não informado.");
  const data = await apiRequest(`/reserva/${id}/devolucao`, {
    method: "POST",
    ...authHeaders(),
  });
  return data.result ?? data;
}

/** Solicita o cancelamento; multa e status são definidos pelo backend. */
export async function cancelarReserva(id) {
  if (!id) throw new Error("ID da reserva não informado.");
  const data = await apiRequest(`/reserva/${id}/cancelar`, {
    method: "POST",
    ...authHeaders(),
  });
  return data.result ?? data;
}

/** Endpoint: GET /reserva/locatario/:id_locatario */
export async function listReservasDoLocatario(idLocatario) {
  if (!idLocatario) throw new Error("ID do locatário não informado.");
  // Lista vazia agora responde 200 com result: [] (o backend deixou de
  // devolver 404). Segue a paginação para não truncar o histórico em 10.
  return apiRequestPaginado(`/reserva/locatario/${idLocatario}`, authHeaders());
}

/**
 * Lê uma página do histórico, preservando a metadata entregue pelo backend.
 * A tela usa este método para não baixar nem esconder reservas além da página.
 */
export async function getReservasDoLocatarioPage(idLocatario, { page = 1, limit = 10 } = {}) {
  if (!idLocatario) throw new Error("ID do locatário não informado.");
  const data = await apiRequest(
    `/reserva/locatario/${idLocatario}?page=${page}&limit=${limit}`,
    authHeaders(),
  );
  return {
    reservas: data.result ?? [],
    pagination: data.pagination ?? { page, limit, total: 0, totalPages: 0 },
  };
}
