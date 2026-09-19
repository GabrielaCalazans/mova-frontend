import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ReservasList from "./ReservasList";
import { getReservasDoLocatarioPage } from "../services/reservaService";

vi.mock("../layout/AuthenticatedLayout", () => ({ default: ({ children }) => <div>{children}</div> }));
vi.mock("../services/authSession", () => ({ getAuthSession: () => ({ user: { id: "locatario-1" } }) }));
vi.mock("../services/reservaService", () => ({ getReservasDoLocatarioPage: vi.fn() }));
vi.mock("../utils/journeyStorage", () => ({ updateJourneyStep: vi.fn() }));
vi.mock("react-router-dom", () => ({ useNavigate: () => vi.fn() }));

describe("ReservasList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getReservasDoLocatarioPage.mockResolvedValue({
      reservas: [{
        id: "reserva-1",
        dataHoraInicio: "2026-01-01T10:00:00.000Z",
        dataHoraFim: "2026-01-02T10:00:00.000Z",
        status: "CANCELADA",
        statusPagamento: "SUCESSO",
        valorTotal: 169.9,
        veiculo: { modeloVeiculo: { marca: "Fiat", modelo: "Argo" } },
        servicos: [{ idServico: "seguro-1", nome: "Seguro adicional", valor: 49.9 }],
      }],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
  });

  it("exibe posteriormente o nome e o snapshot de preço do seguro", async () => {
    render(<ReservasList title="Histórico" documentTitle="Histórico" />);
    expect(await screen.findByText("Seguro adicional — R$ 49,90")).toBeInTheDocument();
    expect(screen.getByLabelText("Serviços contratados")).toBeInTheDocument();
  });
});
