// Espelho dos enums do backend (prisma/schema.prisma). Fonte única de verdade
// no frontend: nenhum componente deve escrever um literal de enum solto.
//
// Regra: o CÓDIGO é o que trafega na API; o RÓTULO é só para exibição.
// Ver auditoria/CONTRATO-FRONTEND-BACKEND.md.

/** enum StatusReserva — schema.prisma */
export const STATUS_RESERVA = {
  AGUARDANDO_PAGAMENTO: "AGUARDANDO_PAGAMENTO",
  CONFIRMADA: "CONFIRMADA",
  EM_ANDAMENTO: "EM_ANDAMENTO",
  REALIZADA: "REALIZADA",
  CANCELADA: "CANCELADA",
};

export const STATUS_RESERVA_LABELS = {
  [STATUS_RESERVA.AGUARDANDO_PAGAMENTO]: "Aguardando pagamento",
  [STATUS_RESERVA.CONFIRMADA]: "Confirmada",
  [STATUS_RESERVA.EM_ANDAMENTO]: "Em andamento",
  [STATUS_RESERVA.REALIZADA]: "Concluída",
  [STATUS_RESERVA.CANCELADA]: "Cancelada",
};

/** enum StatusPagamento — schema.prisma. Somente leitura: o cliente nunca envia. */
export const STATUS_PAGAMENTO = {
  AGUARDANDO_PAGAMENTO: "AGUARDANDO_PAGAMENTO",
  PROCESSANDO: "PROCESSANDO",
  SUCESSO: "SUCESSO",
  FALHA: "FALHA",
};

export const STATUS_PAGAMENTO_LABELS = {
  [STATUS_PAGAMENTO.AGUARDANDO_PAGAMENTO]: "Aguardando pagamento",
  [STATUS_PAGAMENTO.PROCESSANDO]: "Processando",
  [STATUS_PAGAMENTO.SUCESSO]: "Pago",
  [STATUS_PAGAMENTO.FALHA]: "Falhou",
};

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

export const METODO_PAGAMENTO_LABELS = {
  [METODO_PAGAMENTO.CARTAO_CREDITO]: "Cartão de Crédito",
  [METODO_PAGAMENTO.CARTAO_DEBITO]: "Cartão de Débito",
  [METODO_PAGAMENTO.PIX]: "Pix",
  [METODO_PAGAMENTO.CARTEIRA_DIGITAL]: "Carteira Digital",
};

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

/** Rótulo de exibição com fallback para o próprio código, se vier algo novo. */
export function rotulo(mapa, codigo) {
  if (!codigo) return "";
  return mapa[codigo] ?? codigo;
}
