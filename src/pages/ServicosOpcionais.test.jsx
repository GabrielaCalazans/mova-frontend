import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ServicosOpcionais from "./ServicosOpcionais";
import { listServicos } from "../services/servicoService";

const navigate = vi.fn();
const updateJourneyStep = vi.fn();
vi.mock("react-router-dom", () => ({ useNavigate: () => navigate }));
vi.mock("../layout/AuthenticatedLayout", () => ({ default: ({ children }) => <div>{children}</div> }));
vi.mock("../services/servicoService", () => ({ listServicos: vi.fn() }));
vi.mock("../utils/journeyStorage", () => ({ getJourneyStep: () => ({ ids: [], selecionados: [] }), updateJourneyStep: (...args) => updateJourneyStep(...args) }));

const catalogo = [
  { id: "servico-1", nome: "Seguro", descricao: "Proteção", valor: 25 },
  { id: "servico-2", nome: "Cadeirinha", descricao: "Para crianças", valor: 15 },
];

describe("ServicosOpcionais", () => {
  beforeEach(() => { vi.clearAllMocks(); listServicos.mockResolvedValue(catalogo); });

  it("busca o catálogo, seleciona serviços e persiste apenas seus IDs", async () => {
    render(<ServicosOpcionais />);
    expect(await screen.findByText("Seguro")).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText(/Seguro/));
    await userEvent.click(screen.getByLabelText(/Cadeirinha/));
    expect(screen.getByTestId("estimativa-servicos")).toHaveTextContent("R$ 40,00");
    await userEvent.click(screen.getByRole("button", { name: "Continuar para checkout" }));
    expect(updateJourneyStep).toHaveBeenCalledWith("servicos", expect.objectContaining({ ids: ["servico-1", "servico-2"] }));
    expect(navigate).toHaveBeenCalledWith("/checkout-reserva");
  });

  it("permite continuar sem serviços", async () => {
    render(<ServicosOpcionais />);
    await screen.findByText("Seguro");
    await userEvent.click(screen.getByRole("button", { name: "Continuar para checkout" }));
    expect(updateJourneyStep).toHaveBeenCalledWith("servicos", expect.objectContaining({ ids: [] }));
  });
});
