import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import Login from "./Login";
import CadastroLocador from "./CadastroLocador";
import ResetPassword from "./ResetPassword";
import { setLocale } from "../i18n";

vi.mock("../services/authSession", () => ({
  consumeAuthFeedback: () => null,
  getAuthSession: () => null,
}));

vi.mock("../services/authService", () => ({
  loginUser: vi.fn(),
  registerLocador: vi.fn(),
  resetPassword: vi.fn(),
}));

const renderAt = (ui, path = "/") => render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>);

describe("telas de autenticação - idiomas (RNF08)", () => {
  afterEach(() => setLocale("pt-BR"));

  it("mantém o login em pt-BR por padrão", () => {
    renderAt(<Login />);
    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
    expect(document.title).toBe("MOVA - Login");
  });

  it("traduz o login para inglês", () => {
    setLocale("en");
    renderAt(<Login />);
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Forgot my password" })).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(document.title).toBe("MOVA - Sign in");
  });

  it("traduz cadastro de locador e redefinição de senha para espanhol", () => {
    setLocale("es");
    renderAt(<CadastroLocador />);
    expect(screen.getByRole("button", { name: "Registrar arrendador" })).toBeInTheDocument();
    expect(screen.getByLabelText("Repite la contraseña")).toBeInTheDocument();
    expect(document.title).toBe("MOVA - Registro de arrendador");
  });

  it("traduz o aviso de link inválido para espanhol", () => {
    setLocale("es");
    renderAt(<ResetPassword />, "/redefinir-senha");
    expect(screen.getByRole("alert")).toHaveTextContent("Enlace de recuperación no válido o caducado.");
  });
});
