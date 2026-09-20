import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PendenciasFinanceiras from "./PendenciasFinanceiras";
import { listarCobrancasPendentes, pagarCobranca } from "../services/cobrancaService";

vi.mock("../services/cobrancaService", () => ({
  listarCobrancasPendentes: vi.fn(),
  pagarCobranca: vi.fn(),
}));

const pendencia = (overrides = {}) => ({
  id: "cobranca-1",
  idReserva: "reserva-1",
  tipo: "ATRASO_DEVOLUCAO",
  valor: 42.5,
  statusPagamento: "AGUARDANDO_PAGAMENTO",
  ...overrides,
});

describe("PendenciasFinanceiras", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listarCobrancasPendentes.mockResolvedValue([]);
    pagarCobranca.mockResolvedValue({ cobranca: pendencia({ statusPagamento: "SUCESSO" }) });
  });

  it("mostra loading enquanto consulta a API", async () => {
    listarCobrancasPendentes.mockReturnValue(new Promise(() => {}));
    render(<PendenciasFinanceiras />);
    expect(screen.getByText("Carregando pendências...")).toBeInTheDocument();
  });

  it("mostra estado vazio", async () => {
    render(<PendenciasFinanceiras />);
    expect(await screen.findByText("Você não possui pendências financeiras.")).toBeInTheDocument();
  });

  it("mostra uma pendência com valor, tipo e ação de pagamento", async () => {
    listarCobrancasPendentes.mockResolvedValue([pendencia()]);
    render(<PendenciasFinanceiras />);

    expect(await screen.findByText("ATRASO_DEVOLUCAO — R$ 42,50")).toBeInTheDocument();
    expect(screen.getByText("Status: AGUARDANDO_PAGAMENTO")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pagar via Pix (sandbox)" })).toBeInTheDocument();
  });

  it("mostra múltiplas pendências", async () => {
    listarCobrancasPendentes.mockResolvedValue([
      pendencia(),
      pendencia({ id: "cobranca-2", tipo: "CANCELAMENTO", valor: 80 }),
    ]);
    render(<PendenciasFinanceiras />);

    expect(await screen.findByText("ATRASO_DEVOLUCAO — R$ 42,50")).toBeInTheDocument();
    expect(screen.getByText("CANCELAMENTO — R$ 80,00")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Pagar via Pix (sandbox)" })).toHaveLength(2);
  });

  it("paga via PIX e atualiza a lista após quitação", async () => {
    listarCobrancasPendentes
      .mockResolvedValueOnce([pendencia()])
      .mockResolvedValueOnce([]);
    render(<PendenciasFinanceiras />);

    await userEvent.click(await screen.findByRole("button", { name: "Pagar via Pix (sandbox)" }));
    expect(pagarCobranca).toHaveBeenCalledWith("cobranca-1", { metodoPagamento: "PIX" });
    await waitFor(() => expect(listarCobrancasPendentes).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("Você não possui pendências financeiras.")).toBeInTheDocument();
  });

  it("mantém cobrança visível e mostra recusa do pagamento", async () => {
    listarCobrancasPendentes.mockResolvedValue([pendencia()]);
    pagarCobranca.mockRejectedValue(new Error("Pagamento recusado pelo sandbox."));
    render(<PendenciasFinanceiras />);

    await userEvent.click(await screen.findByRole("button", { name: "Pagar via Pix (sandbox)" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Pagamento recusado pelo sandbox.");
    expect(screen.getByText("ATRASO_DEVOLUCAO — R$ 42,50")).toBeInTheDocument();
    expect(listarCobrancasPendentes).toHaveBeenCalledTimes(1);
  });

  it("mostra erro de API sem exibir lista como vazia", async () => {
    listarCobrancasPendentes.mockRejectedValue(new Error("Falha de API."));
    render(<PendenciasFinanceiras />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Falha de API.");
    expect(screen.queryByText("Você não possui pendências financeiras.")).not.toBeInTheDocument();
  });
});
