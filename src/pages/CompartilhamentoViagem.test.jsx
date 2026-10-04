import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CompartilhamentoViagem from "./CompartilhamentoViagem";
import { getCompartilhamentoPublico } from "../services/compartilhamentoService";

vi.mock("react-router-dom", () => ({ useParams: () => ({ token: "token-publico" }) }));
vi.mock("../services/compartilhamentoService", () => ({ getCompartilhamentoPublico: vi.fn() }));

describe("CompartilhamentoViagem", () => {
  beforeEach(() => vi.resetAllMocks());

  it("mostra loading e depois os dados públicos da viagem", async () => {
    getCompartilhamentoPublico.mockResolvedValue({
      viagem: {
        dataHoraInicio: "2026-10-10T10:00:00.000Z",
        dataHoraFim: "2026-10-12T10:00:00.000Z",
        status: "CONFIRMADA",
      },
      veiculo: { marca: "MOVA", modelo: "Tour" },
      retirada: { nome: "Garagem A", endereco: "Rua A, 10" },
      devolucao: { nome: "Garagem B", endereco: "Rua B, 20" },
    });

    render(<CompartilhamentoViagem />);
    expect(screen.getByText("Carregando viagem…")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "MOVA Tour" })).toBeInTheDocument();
    expect(screen.getByText(/Confirmada/)).toBeInTheDocument();
    expect(screen.getByText(/Garagem A/)).toBeInTheDocument();
    expect(screen.getByText(/Garagem B/)).toBeInTheDocument();
    expect(screen.queryByText(/R\$|CPF|pagamento|latitude|longitude|desbloqueio/i)).not.toBeInTheDocument();
  });

  it("mostra erro de link inválido ou revogado", async () => {
    getCompartilhamentoPublico.mockRejectedValue(new Error("Compartilhamento não encontrado."));

    render(<CompartilhamentoViagem />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Compartilhamento não encontrado.");
  });
});
