import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Configuracoes from "./Configuracoes";
import { ThemeProvider } from "../context/ThemeContext";
import { definirPreferencia, listarPreferencias } from "../services/notificacaoService";

vi.mock("../layout/AuthenticatedLayout", () => ({ default: ({ title, children }) => <main><h1>{title}</h1>{children}</main> }));
vi.mock("../hooks/useAuthSession", () => ({ useAuthSession: () => ({ token: "t", user: { id: "renter-1", cargo: "LOCATARIO" } }) }));
vi.mock("../services/notificacaoService", () => ({ listarPreferencias: vi.fn(), definirPreferencia: vi.fn() }));

function renderTela() {
  return render(<ThemeProvider><MemoryRouter><Configuracoes /></MemoryRouter></ThemeProvider>);
}

describe("Configuracoes — Task 8.1", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listarPreferencias.mockResolvedValue([{ canal: "EMAIL", tipo: "RESERVA", habilitado: false }]);
    definirPreferencia.mockResolvedValue({});
  });

  it("não oferece controles sem efeito real", async () => {
    renderTela();
    await screen.findByRole("switch", { name: /e-mails sobre minhas reservas/i });
    for (const nome of [/fonte/i, /idioma/i, /push/i, /vibrar/i, /v2e/i, /limpar cache/i]) {
      expect(screen.queryByRole("switch", { name: nome })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: nome })).not.toBeInTheDocument();
      expect(screen.queryByRole("spinbutton", { name: nome })).not.toBeInTheDocument();
    }
    expect(screen.getByRole("link", { name: /alterar senha em minha conta/i })).toHaveAttribute("href", "/conta");
  });

  it("reflete e grava a preferência real de e-mail no backend", async () => {
    const user = userEvent.setup();
    renderTela();
    const reservas = await screen.findByRole("switch", { name: /e-mails sobre minhas reservas/i });
    const disponibilidade = screen.getByRole("switch", { name: /avisos de disponibilidade/i });
    expect(reservas).not.toBeChecked();
    expect(disponibilidade).toBeChecked(); // sem registro = opt-in padrão do backend

    await user.click(reservas);
    expect(definirPreferencia).toHaveBeenCalledWith({ canal: "EMAIL", tipo: "RESERVA", habilitado: true });
    expect(reservas).toBeChecked();
  });

  it("desfaz a troca quando o backend recusa", async () => {
    const user = userEvent.setup();
    definirPreferencia.mockRejectedValue(new Error("Falha ao salvar"));
    renderTela();
    const disponibilidade = await screen.findByRole("switch", { name: /avisos de disponibilidade/i });
    await user.click(disponibilidade);
    expect(await screen.findByRole("alert")).toHaveTextContent("Falha ao salvar");
    expect(disponibilidade).toBeChecked();
  });

  it("desabilita os switches quando a leitura das preferências falha", async () => {
    listarPreferencias.mockRejectedValue(new Error("Falha ao carregar"));
    renderTela();

    expect(await screen.findByRole("alert")).toHaveTextContent("Falha ao carregar");
    expect(screen.getByRole("switch", { name: /e-mails sobre minhas reservas/i })).toBeDisabled();
    expect(screen.getByRole("switch", { name: /avisos de disponibilidade/i })).toBeDisabled();
  });

  it("desabilita o switch enquanto a gravação está em andamento", async () => {
    const user = userEvent.setup();
    let concluir;
    definirPreferencia.mockReturnValue(new Promise((resolve) => { concluir = resolve; }));
    renderTela();
    const reservas = await screen.findByRole("switch", { name: /e-mails sobre minhas reservas/i });

    await user.click(reservas);
    expect(reservas).toBeDisabled();
    expect(screen.getByRole("switch", { name: /avisos de disponibilidade/i })).toBeEnabled();

    concluir({});
    await waitFor(() => expect(reservas).toBeEnabled());
  });
});
