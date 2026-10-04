import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CheckoutReserva from "./CheckoutReserva";
import { createReserva } from "../services/reservaService";

const { navigateMock, journey, getAuthSessionMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  journey: {
    veiculo: {
      id: "veiculo-1",
      nome: "Fiat Argo",
      marca: "Fiat",
      modelo: "Argo",
      ano: 2025,
      cambio: "Automatico",
      capacidade: 5,
      categoria: "EXECUTIVO",
      eletrico: true,
      adaptado: true,
      autonomia: "900 km",
      combustivel: "Gasolina",
      caracteristicas: ["Ar-condicionado"],
    },
    retirada: { date: "01/01/2030", time: "10:00", garageId: "garagem-1", garageName: "Garagem A" },
    devolucao: { date: "02/01/2030", time: "10:00", garageId: "garagem-1", garageName: "Garagem A" },
    servicos: { ids: ["seguro-1"], selecionados: [{ id: "seguro-1", nome: "Seguro adicional", descricao: "Proteção simulada", valor: 49.9 }] },
  },
  getAuthSessionMock: vi.fn(() => ({ user: { id: "locatario-1" } })),
}));

vi.mock("react-router-dom", () => ({ useNavigate: () => navigateMock }));
vi.mock("../layout/AuthenticatedLayout", () => ({ default: ({ children }) => <div>{children}</div> }));
vi.mock("../services/authSession", () => ({ getAuthSession: getAuthSessionMock }));
vi.mock("../utils/journeyStorage", () => ({
  getJourneyStep: (step) => journey[step],
  updateJourneyStep: vi.fn(),
}));
vi.mock("../services/veiculoService", () => ({
  getVeiculoById: vi.fn().mockResolvedValue({
    id: "veiculo-1",
    idLocador: "locador-1",
    idModeloVeiculo: "modelo-1",
    modeloVeiculo: {
      id: "modelo-1",
      idLocador: "locador-1",
      marca: "Fiat",
      modelo: "Argo",
      ano: 2025,
      cambio: "Automatico",
      capacidade: 5,
      categoria: "EXECUTIVO",
      eletrico: true,
      adaptado: true,
      valorDiaria: 100,
      criadoEm: "2026-09-20T00:00:00.000Z",
    },
    garagemId: "garagem-1",
    garagem: null,
    placa: "ABC1D23",
    status: "DISPONIVEL",
    criadoEm: "2026-09-20T00:00:00.000Z",
  }),
}));
vi.mock("../services/reservationPricing", () => ({
  getReservationPricing: vi.fn().mockResolvedValue({
    dailyRate: 100,
    totalDiarias: 1,
    servicesTotal: 49.9,
    total: 149.9,
    servicos: [{ idServico: "seguro-1", nome: "Seguro adicional", descricao: "Proteção simulada", valor: 49.9, detalhesCobertura: "Danos ao veículo e furto/roubo no produto simulado." }],
  }),
}));
vi.mock("../services/reservaService", () => ({ createReserva: vi.fn() }));

describe("CheckoutReserva — RF10", () => {
  beforeEach(() => vi.clearAllMocks());

  it("exibe detalhes e valor do seguro no checkout", async () => {
    render(<CheckoutReserva />);
    expect(await screen.findByText("Seguro adicional")).toBeInTheDocument();
    expect(screen.getAllByText("R$ 49,90")).toHaveLength(2);
    expect(screen.getByText("Ver detalhes da cobertura")).toBeInTheDocument();
    expect(screen.getByText("Danos ao veículo e furto/roubo no produto simulado.")).toBeInTheDocument();
    expect(screen.getByText("R$ 149,90")).toBeInTheDocument();
  });

  it("confirma a reserva usando os IDs de serviços do contrato", async () => {
    createReserva.mockResolvedValueOnce({ id: "reserva-1", valorTotal: 149.9, codigoDesbloqueio: null });
    render(<CheckoutReserva />);
    await screen.findByText("Seguro adicional");
    await import("@testing-library/user-event").then(({ default: userEvent }) =>
      userEvent.click(screen.getByRole("button", { name: /confirmar e seguir/i })),
    );
    expect(createReserva).toHaveBeenCalledWith(expect.objectContaining({
      idVeiculo: "veiculo-1",
      idLocatario: "locatario-1",
      servicosIds: ["seguro-1"],
    }));
    expect(navigateMock).toHaveBeenCalledWith("/condutores-adicionais");
  });

  it("shows real characteristics and omits autonomy, fuel and old mocks", async () => {
    render(<CheckoutReserva />);

    expect(await screen.findByText("Executivo")).toBeInTheDocument();
    expect(screen.getByText(/Capacidade: 5 pessoas/)).toBeInTheDocument();
    expect(screen.getByText(/El[eé]trico: Sim/)).toBeInTheDocument();
    expect(screen.getByText(/Acessibilidade: Sim/)).toBeInTheDocument();
    expect(screen.queryByText(/Autonomia/i)).not.toBeInTheDocument();
    expect(screen.queryByText("900 km")).not.toBeInTheDocument();
    expect(screen.queryByText("Gasolina")).not.toBeInTheDocument();
    expect(screen.queryByText("Ar-condicionado")).not.toBeInTheDocument();
  });
});
