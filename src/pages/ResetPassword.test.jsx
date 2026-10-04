import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import ResetPassword from "./ResetPassword";
import { resetPassword } from "../services/authService";

vi.mock("../services/authService", () => ({
  resetPassword: vi.fn(),
}));

describe("ResetPassword", () => {
  beforeEach(() => vi.clearAllMocks());

  it("usa token da URL, redefine senha e mostra sucesso", async () => {
    resetPassword.mockResolvedValue({ message: "Senha redefinida com sucesso." });
    const token = "A".repeat(43);
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={[`/redefinir-senha?token=${token}`]}>
        <ResetPassword />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText("Nova senha"), "NovaSenha#123");
    await user.type(screen.getByLabelText("Confirmar nova senha"), "NovaSenha#123");
    await user.click(screen.getByRole("button", { name: /redefinir senha/i }));

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Senha redefinida"));
    expect(resetPassword).toHaveBeenCalledWith({ token, novaSenha: "NovaSenha#123" });
  });

  it("bloqueia confirmação divergente e token ausente", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/redefinir-senha"]}>
        <ResetPassword />
      </MemoryRouter>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(/recuperação|inválido/i);
    expect(screen.getByRole("button", { name: /redefinir senha/i })).toBeDisabled();
    expect(resetPassword).not.toHaveBeenCalled();
    expect(user).toBeDefined();
  });
});
