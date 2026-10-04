import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CadastroDeGaragens from "./CadastroDeGaragens";
import { deleteGaragem, listGaragens } from "../services/garagemService";

vi.mock("react-router-dom", () => ({ useNavigate: () => vi.fn() }));
vi.mock("../components/BottomNav", () => ({ default: () => null }));
vi.mock("../services/garagemService", () => ({
  listGaragens: vi.fn(),
  deleteGaragem: vi.fn(),
}));
vi.mock("../services/authSession", () => ({
  getAuthSession: () => ({ token: "token-locador", user: { id: "locador-1" } }),
}));

describe("CadastroDeGaragens — exclusão", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listGaragens.mockResolvedValue([
      { id: "g1", nome: "Garagem Centro", endereco: "Av. Pompeia, 150", capacidade: 10, veiculosAlocados: 2, status: "ATIVA" },
    ]);
  });

  it("explica a desativação (INATIVA) e fecha com Esc devolvendo o foco", async () => {
    const user = userEvent.setup();
    render(<CadastroDeGaragens />);

    const trigger = await screen.findByRole("button", { name: "Excluir Garagem Centro" });
    await user.click(trigger);

    const dialog = screen.getByRole("alertdialog", { name: "Deseja excluir essa garagem?" });
    expect(dialog).toHaveAccessibleDescription(/será desativada \(status Inativa\) e deixará de aparecer no catálogo público/);
    expect(dialog).not.toHaveTextContent(/não pode ser desfeita/);
    expect(screen.getByRole("button", { name: "Cancelar exclusão" })).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("confirma e chama a exclusão lógica", async () => {
    const user = userEvent.setup();
    deleteGaragem.mockResolvedValue(undefined);
    render(<CadastroDeGaragens />);

    await user.click(await screen.findByRole("button", { name: "Excluir Garagem Centro" }));
    await user.click(screen.getByRole("button", { name: "Confirmar exclusão" }));

    await waitFor(() => expect(deleteGaragem).toHaveBeenCalledWith("g1"));
  });
});
