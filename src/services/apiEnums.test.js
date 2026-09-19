import { describe, expect, it } from "vitest";
import {
  METODO_PAGAMENTO,
  METODO_PAGAMENTO_LABELS,
  STATUS_RESERVA,
  STATUS_RESERVA_LABELS,
  rotulo,
} from "./apiEnums";

// Estes testes travam o contrato de enums contra o backend
// (prisma/schema.prisma). Se alguém reintroduzir um literal divergente,
// a suíte quebra aqui em vez de quebrar em produção.
describe("apiEnums — paridade com o backend", () => {
  it("StatusReserva usa REALIZADA (e não CONCLUIDA)", () => {
    expect(STATUS_RESERVA.REALIZADA).toBe("REALIZADA");
    expect(Object.values(STATUS_RESERVA)).not.toContain("CONCLUIDA");
  });

  it("StatusReserva tem exatamente os 5 valores do schema", () => {
    expect(Object.values(STATUS_RESERVA).sort()).toEqual(
      [
        "AGUARDANDO_PAGAMENTO",
        "CANCELADA",
        "CONFIRMADA",
        "EM_ANDAMENTO",
        "REALIZADA",
      ].sort(),
    );
  });

  it("MetodoPagamento tem exatamente os 4 valores do schema e nenhum boleto", () => {
    expect(Object.values(METODO_PAGAMENTO).sort()).toEqual(
      ["CARTAO_CREDITO", "CARTAO_DEBITO", "CARTEIRA_DIGITAL", "PIX"].sort(),
    );
    const todos = JSON.stringify(METODO_PAGAMENTO).toUpperCase();
    expect(todos).not.toContain("BOLETO");
  });

  it("todo código de enum tem rótulo de exibição", () => {
    for (const codigo of Object.values(STATUS_RESERVA)) {
      expect(STATUS_RESERVA_LABELS[codigo]).toBeTruthy();
    }
    for (const codigo of Object.values(METODO_PAGAMENTO)) {
      expect(METODO_PAGAMENTO_LABELS[codigo]).toBeTruthy();
    }
  });

  it("rotulo() cai no próprio código quando o backend manda algo novo", () => {
    expect(rotulo(STATUS_RESERVA_LABELS, "REALIZADA")).toBe("Concluída");
    expect(rotulo(STATUS_RESERVA_LABELS, "VALOR_NOVO")).toBe("VALOR_NOVO");
    expect(rotulo(STATUS_RESERVA_LABELS, "")).toBe("");
  });
});
