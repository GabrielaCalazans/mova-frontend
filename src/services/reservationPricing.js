import { apiRequest } from "./apiClient";
import { getAuthSession } from "./authSession";

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
  const session = getAuthSession();
  const data = await apiRequest("/reserva/precificacao", {
    method: "POST",
    authToken: session?.token,
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
