// Espelho dos enums do backend (prisma/schema.prisma). Fonte única de verdade
// no frontend: nenhum componente deve escrever um literal de enum solto.
//
// Regra: o CÓDIGO é o que trafega na API; o RÓTULO é só para exibição.
// Ver auditoria/CONTRATO-FRONTEND-BACKEND.md.
import { t } from "../i18n";

// Mapas de rótulo com getters: cada leitura traduz no idioma ativo (RNF08),
// mantendo o formato { CODIGO: "Rótulo" } que as telas já usam.
function labels(group, codes) {
  return Object.defineProperties(
    {},
    Object.fromEntries(codes.map((code) => [code, { enumerable: true, get: () => t(`enums.${group}.${code}`) }])),
  );
}

/** enum StatusReserva — schema.prisma */
export const STATUS_RESERVA = {
  AGUARDANDO_PAGAMENTO: "AGUARDANDO_PAGAMENTO",
  CONFIRMADA: "CONFIRMADA",
  EM_ANDAMENTO: "EM_ANDAMENTO",
  REALIZADA: "REALIZADA",
  CANCELADA: "CANCELADA",
};

export const STATUS_RESERVA_LABELS = labels("statusReserva", Object.values(STATUS_RESERVA));

/** enum StatusPagamento — schema.prisma. Somente leitura: o cliente nunca envia. */
export const STATUS_PAGAMENTO = {
  AGUARDANDO_PAGAMENTO: "AGUARDANDO_PAGAMENTO",
  PROCESSANDO: "PROCESSANDO",
  SUCESSO: "SUCESSO",
  FALHA: "FALHA",
};

export const STATUS_PAGAMENTO_LABELS = labels("statusPagamento", Object.values(STATUS_PAGAMENTO));

/**
 * enum MetodoPagamento — schema.prisma.
 * O backend NÃO possui boleto; não ofereça essa opção sem antes adicionar o
 * valor ao enum do banco (migration).
 */
export const METODO_PAGAMENTO = {
  CARTAO_CREDITO: "CARTAO_CREDITO",
  CARTAO_DEBITO: "CARTAO_DEBITO",
  PIX: "PIX",
  CARTEIRA_DIGITAL: "CARTEIRA_DIGITAL",
};

export const METODO_PAGAMENTO_LABELS = labels("metodoPagamento", Object.values(METODO_PAGAMENTO));

/** enum StatusVeiculo — schema.prisma */
export const STATUS_VEICULO = {
  DISPONIVEL: "DISPONIVEL",
  RESERVADO: "RESERVADO",
  MANUTENCAO: "MANUTENCAO",
  INATIVO: "INATIVO",
};

/** enum StatusGaragem — schema.prisma */
export const STATUS_GARAGEM = {
  ATIVA: "ATIVA",
  INATIVA: "INATIVA",
  MANUTENCAO: "MANUTENCAO",
};

/** enum Cargo — schema.prisma */
export const CARGO = {
  LOCATARIO: "LOCATARIO",
  LOCADOR: "LOCADOR",
  ADMIN: "ADMIN",
};

export const STATUS_VEICULO_LABELS = labels("statusVeiculo", Object.values(STATUS_VEICULO));

export const STATUS_GARAGEM_LABELS = labels("statusGaragem", Object.values(STATUS_GARAGEM));

/** StatusEstorno — derivado em mova-backend/src/services/pagamento-estorno.ts */
export const STATUS_ESTORNO_LABELS = labels("statusEstorno", ["NAO_SOLICITADO", "SOLICITADO", "CONCLUIDO", "FALHOU"]);

/** enum TipoCobranca — schema.prisma */
export const TIPO_COBRANCA_LABELS = labels("tipoCobranca", ["CANCELAMENTO", "ATRASO_DEVOLUCAO", "PAGAMENTO_RESERVA"]);

/** enum StatusNotificacao — schema.prisma */
export const STATUS_NOTIFICACAO_LABELS = labels("statusNotificacao", ["PENDENTE", "ENVIADA", "FALHA"]);

/**
 * Rótulo de exibição. Código desconhecido (enum novo no backend) vira texto
 * legível em vez de aparecer cru: "NOVO_STATUS" → "Novo status".
 */
export function rotulo(mapa, codigo) {
  if (!codigo) return "";
  if (mapa[codigo]) return mapa[codigo];
  const texto = String(codigo).toLowerCase().split("_").join(" ");
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
