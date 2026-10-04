import { apiRequest } from "./apiClient";
import { getAuthSession } from "./authSession";
const auth = () => ({ authToken: getAuthSession()?.token });
export async function listarCobrancasPendentes() { const data = await apiRequest("/cobranca/pendentes", auth()); return data.result ?? data; }
export async function pagarCobranca(id, dados = { metodoPagamento: "PIX" }) { const data = await apiRequest(`/cobranca/${id}/pagamento`, { method: "POST", body: JSON.stringify(dados), ...auth() }); return data.result ?? data; }
