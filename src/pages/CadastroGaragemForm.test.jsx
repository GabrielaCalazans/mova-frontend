import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CadastroGaragemForm from "./CadastroGaragemForm";
import { updateGaragem } from "../services/garagemService";

const navigateMock = vi.hoisted(() => vi.fn());
let garagem = null;
let garagemId = "garagem-1";

vi.mock("react-router-dom", () => ({
  useLocation: () => ({ state: garagem ? { garagem } : null }),
  useNavigate: () => navigateMock,
  useParams: () => ({ id: garagemId }),
}));
vi.mock("../layout/AuthenticatedLayout", () => ({
  default: ({ children }) => children,
}));
vi.mock("../services/garagemService", () => ({
  createGaragem: vi.fn(),
  updateGaragem: vi.fn(),
}));
vi.mock("../services/authSession", () => ({
  getAuthSession: () => ({ user: { id: "locador-1" } }),
}));

describe("CadastroGaragemForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    garagemId = "garagem-1";
    garagem = {
      id: garagemId,
      nome: "Garagem Centro",
      endereco: "Rua Central, 100",
      capacidade: 10,
      acessibilidade: true,
      status: "INATIVA",
    };
  });

  it("reativa uma garagem inativa pelo status persistido", async () => {
    updateGaragem.mockResolvedValue({ ...garagem, status: "ATIVA" });

    render(<CadastroGaragemForm />);

    expect(screen.getByLabelText("Status")).toHaveValue("INATIVA");
    fireEvent.change(screen.getByLabelText("Status"), {
      target: { value: "ATIVA" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));

    await waitFor(() => expect(updateGaragem).toHaveBeenCalledWith(garagemId, {
      nome: "Garagem Centro",
      endereco: "Rua Central, 100",
      capacidade: 10,
      acessibilidade: true,
      status: "ATIVA",
    }));
    expect(navigateMock).toHaveBeenCalledWith("/cadastro-garagens");
  });
});
