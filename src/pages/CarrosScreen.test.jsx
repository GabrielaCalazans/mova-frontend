import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CarrosScreen from "./CarrosScreen";
import { listVeiculos } from "../services/veiculoService";

const navigateMock = vi.hoisted(() => vi.fn());
let tipoFiltro = null;

vi.mock("react-router-dom", () => ({
  useLocation: () => ({ state: tipoFiltro ? { tipo: tipoFiltro } : null }),
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
  beforeEach(() => {
    vi.clearAllMocks();
    tipoFiltro = null;
  });

  it("envia categoria oficial ao catálogo para tipo econômico", async () => {
    tipoFiltro = "economico";
    listVeiculos.mockResolvedValue([]);

    render(<CarrosScreen />);

    await screen.findByText(/Nenhum veículo cadastrado/);
    expect(listVeiculos).toHaveBeenCalledWith({ categoria: "ECONOMICO" });
  });

  it("envia categoria ESPACOSO ao catálogo", async () => {
    tipoFiltro = "espacoso";
    listVeiculos.mockResolvedValue([]);

    render(<CarrosScreen />);

    await screen.findByText(/Nenhum veículo cadastrado/);
    expect(listVeiculos).toHaveBeenCalledWith({ categoria: "ESPACOSO" });
  });

  it("envia adaptado=true ao catálogo para Adaptados PCD", async () => {
    tipoFiltro = "adaptado";
    listVeiculos.mockResolvedValue([]);

    render(<CarrosScreen />);

    await screen.findByText(/Nenhum veículo cadastrado/);
    expect(listVeiculos).toHaveBeenCalledWith({ adaptado: true });
  });

  it("exibe filtros semânticos e permite selecionar/remover/limpar", async () => {
    listVeiculos.mockResolvedValue([]);
    render(<CarrosScreen />);

    expect(screen.getByRole("group", { name: "Filtros de categoria" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Econômicos" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Espaçosos" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Executivos" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Adaptados PCD" })).toBeInTheDocument();

    await screen.findByText(/Nenhum veículo cadastrado/);
    fireEvent.click(screen.getByRole("button", { name: "Espaçosos" }));
    await waitFor(() => expect(listVeiculos).toHaveBeenLastCalledWith({ categoria: "ESPACOSO" }));

    fireEvent.click(screen.getByRole("button", { name: "Espaçosos" }));
    await waitFor(() => expect(listVeiculos).toHaveBeenLastCalledWith({}));

    fireEvent.click(screen.getByRole("button", { name: "Executivos" }));
    await waitFor(() => expect(listVeiculos).toHaveBeenLastCalledWith({ categoria: "EXECUTIVO" }));
    fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    await waitFor(() => expect(listVeiculos).toHaveBeenLastCalledWith({}));
  });

  it("envia filtro elétrico ao catálogo antes de receber a página", async () => {
    tipoFiltro = "eletrico";
    listVeiculos.mockResolvedValue([]);

    render(<CarrosScreen />);

    await screen.findByText(/Nenhum veículo cadastrado/);
    expect(listVeiculos).toHaveBeenCalledWith({ eletrico: true });
  });

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

  it("shows real characteristics and omits fake autonomy", async () => {
    listVeiculos.mockResolvedValue([
      {
        ...veiculo("veiculo-real", null),
        marca: "Fiat",
        modelo: "Argo",
        ano: 2025,
        cambio: "Automatico",
        capacidade: 5,
        categoria: "EXECUTIVO",
        eletrico: true,
        adaptado: true,
        autonomia: "900 km",
        cor: "Preto",
      },
    ]);

    render(<CarrosScreen />);

    expect(await screen.findByText("5 lugares")).toBeInTheDocument();
    expect(screen.getByText("Automático")).toBeInTheDocument();
    expect(screen.getByText("Executivo")).toBeInTheDocument();
    expect(screen.getByText("Elétrico")).toBeInTheDocument();
    expect(screen.getByText("Adaptado PCD")).toBeInTheDocument();
    expect(screen.queryByText(/Autonomia/i)).not.toBeInTheDocument();
    expect(screen.queryByText("455km")).not.toBeInTheDocument();
    expect(screen.queryByText("900 km")).not.toBeInTheDocument();
    expect(screen.queryByText("Preto")).not.toBeInTheDocument();
  });
});
