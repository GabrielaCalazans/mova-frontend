import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CarrosScreen from "./CarrosScreen";
import { listVeiculos } from "../services/veiculoService";

const navigateMock = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", () => ({
  useLocation: () => ({ state: null }),
  useNavigate: () => navigateMock,
}));
vi.mock("../components/BottomNav", () => ({ default: () => null }));
vi.mock("../services/veiculoService", () => ({ listVeiculos: vi.fn() }));
vi.mock("../utils/journeyStorage", () => ({ updateJourneyStep: vi.fn() }));

const veiculo = (id, garagem, status = "DISPONIVEL") => ({
  id,
  idLocador: "locador-1",
  idModeloVeiculo: "modelo-1",
  garagemId: garagem?.id ?? null,
  garagem,
  marca: "Fiat",
  modelo: "Argo",
  ano: 2025,
  cambio: "Manual",
  valorDiaria: 180.5,
  status,
});

describe("CarrosScreen", () => {
  beforeEach(() => vi.clearAllMocks());

  it("permite selecao de veiculo DISPONIVEL em garagem ATIVA", async () => {
    listVeiculos.mockResolvedValue([
      veiculo("veiculo-ativo", {
        id: "garagem-ativa",
        nome: "Garagem ativa",
        status: "ATIVA",
      }),
    ]);

    render(<CarrosScreen />);

    const button = await screen.findByRole("button", { name: "Selecionar" });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(navigateMock).toHaveBeenCalledWith("/escolha-garagem-retirada");
  });

  it.each(["INATIVA", "MANUTENCAO"])(
    "bloqueia selecao quando garagem esta %s",
    async (status) => {
      listVeiculos.mockResolvedValue([
        veiculo("veiculo-indisponivel", {
          id: "garagem-indisponivel",
          nome: "Garagem indisponivel",
          status,
        }),
      ]);

      render(<CarrosScreen />);

      expect(await screen.findByText(/Local: Garagem indisponivel/)).toBeInTheDocument();
      expect(screen.getByText(/Local indispon/)).toBeInTheDocument();
      const button = screen.getByRole("button", { name: /Indispon/ });
      expect(button).toBeDisabled();

      button.disabled = false;
      fireEvent.click(button);
      expect(navigateMock).not.toHaveBeenCalled();
    },
  );

  it.each([undefined, "DESCONHECIDO"])(
    "falha fechada quando garagem tem status ausente ou desconhecido (%s)",
    async (status) => {
      listVeiculos.mockResolvedValue([
        veiculo("veiculo-status-desconhecido", {
          id: "garagem-status-desconhecido",
          nome: "Garagem sem status",
          status,
        }),
      ]);

      render(<CarrosScreen />);

      expect(await screen.findByText(/Local indispon/)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Indispon/ })).toBeDisabled();
    },
  );

  it("mantem selecao para veiculo DISPONIVEL sem garagem", async () => {
    listVeiculos.mockResolvedValue([veiculo("veiculo-sem-garagem", null)]);

    render(<CarrosScreen />);

    expect(await screen.findByText(/Local: Local n/)).toBeInTheDocument();
    const button = screen.getByRole("button", { name: "Selecionar" });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(navigateMock).toHaveBeenCalledWith("/escolha-garagem-retirada");
  });

  it("mantem veiculo nao DISPONIVEL bloqueado mesmo com garagem ATIVA", async () => {
    listVeiculos.mockResolvedValue([
      veiculo(
        "veiculo-reservado",
        { id: "garagem-ativa", nome: "Garagem ativa", status: "ATIVA" },
        "RESERVADO",
      ),
    ]);

    render(<CarrosScreen />);

    expect(await screen.findByRole("button", { name: /Indispon/ })).toBeDisabled();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("mostra a garagem real de cada veículo, inclusive para o mesmo modelo", async () => {
    listVeiculos.mockResolvedValue([
      veiculo("veiculo-1", { id: "garagem-1", nome: "Garagem Norte", status: "ATIVA" }),
      veiculo("veiculo-2", { id: "garagem-2", nome: "Garagem Sul", status: "ATIVA" }),
    ]);

    render(<CarrosScreen />);

    const specWithText = (text) => (_, element) => (
      element?.matches("p.carro-list-card__specs") && element.textContent?.includes(text)
    );
    expect(await screen.findByText(specWithText("Local: Garagem Norte"))).toBeInTheDocument();
    expect(screen.getByText(specWithText("Local: Garagem Sul"))).toBeInTheDocument();
    expect(listVeiculos).toHaveBeenCalledTimes(1);
  });

  it("não inventa uma garagem para veículo não alocado", async () => {
    listVeiculos.mockResolvedValue([veiculo("veiculo-sem-garagem", null)]);

    render(<CarrosScreen />);

    expect(await screen.findByText((_, element) => (
      element?.matches("p.carro-list-card__specs") && element.textContent?.includes("Local: Local não informado")
    ))).toBeInTheDocument();
  });
});
