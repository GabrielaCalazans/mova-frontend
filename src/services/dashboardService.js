import { apiRequest } from "./apiClient";
import { getAuthSession } from "./authSession";

const token = () => getAuthSession()?.token;
const get = async (path) => (await apiRequest(path, { authToken: token() })).result;

export const getFinanceiro = () => get("/dashboard/financeiro");
export const getUtilizacao = () => get("/dashboard/utilizacao");
export const getFrota = () => get("/dashboard/frota");
export const getAvaliacaoDashboard = (filters = {}) => {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, value);
  });
  return get(`/avaliacao/relatorio${query.size ? `?${query}` : ""}`);
};
