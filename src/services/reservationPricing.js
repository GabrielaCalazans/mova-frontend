import { apiRequest } from "./apiClient";

// Cotação obtida do servidor. A criação recalcula o mesmo valor no POST final.
export async function getReservationPricing(payload) {
  const {
    idVeiculo,
    idGaragemRetirada,
    idGaragemDevolucao,
    dataHoraInicio,
    dataHoraFim,
    servicosIds,
  } = payload;
  const data = await apiRequest("/reserva/precificacao", {
    method: "POST",
    authToken: undefined,
    body: JSON.stringify({
      idVeiculo,
      idGaragemRetirada,
      idGaragemDevolucao,
      dataHoraInicio,
      dataHoraFim,
      servicosIds,
    }),
  });
  const result = data.result ?? data;
  return {
    dailyRate: result.valorDiaria,
    totalDiarias: result.diarias,
    subtotal: result.valorBase,
    servicesTotal: result.valorServicos,
    total: result.valorTotal,
    servicos: result.servicos,
  };
}
