import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import HistoricoAlteracoes from "./HistoricoAlteracoes";
import { listHistoricoVeiculo } from "../../services/auditoriaService";
import { setLocale } from "../../i18n";

vi.mock("../../services/auditoriaService", () => ({ listHistoricoVeiculo: vi.fn() }));

const registros = [
  { id: "a2", acao: "MUDANCA_GARAGEM", cargoAtor: "LOCADOR", criadoEm: "2026-10-04T12:00:00.000Z", antes: { garagemId: "g1" }, depois: { garagemId: "g2" } },
  { id: "a1", acao: "ALTERACAO_STATUS", cargoAtor: "ADMIN", criadoEm: "2026-10-03T12:00:00.000Z", antes: { status: "DISPONIVEL" }, depois: { status: "MANUTENCAO" } },
  { id: "a0", acao: "CRIACAO", cargoAtor: "LOCADOR", criadoEm: "2026-10-01T12:00:00.000Z", antes: null, depois: { placa: "MOV1A23" } },
];
const garagens = [{ id: "g1", nome: "Garagem Centro" }, { id: "g2", nome: "Garagem Batel" }];

describe("HistoricoAlteracoes (RN09)", () => {
  afterEach(() => setLocale("pt-BR"));

  it("lista operação, autor e campos alterados, somente leitura", async () => {
    listHistoricoVeiculo.mockResolvedValue(registros);
    render(<HistoricoAlteracoes idVeiculo="v1" garagens={garagens} />);

    expect(await screen.findByText("Mudança de garagem")).toBeInTheDocument();
    expect(screen.getByText(/Garagem: Garagem Centro → Garagem Batel/)).toBeInTheDocument();
    expect(screen.getByText(/pela administração/)).toBeInTheDocument();
    expect(screen.getByText("Cadastro")).toBeInTheDocument();
    expect(listHistoricoVeiculo).toHaveBeenCalledWith("v1");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("estado vazio e de erro", async () => {
    listHistoricoVeiculo.mockResolvedValueOnce([]);
    const { unmount } = render(<HistoricoAlteracoes idVeiculo="v1" />);
    expect(await screen.findByText("Nenhuma alteração registrada.")).toBeInTheDocument();
    unmount();
    listHistoricoVeiculo.mockRejectedValueOnce(new Error("x"));
    render(<HistoricoAlteracoes idVeiculo="v1" />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar o histórico.");
  });

  it("traduz para inglês", async () => {
    setLocale("en");
    listHistoricoVeiculo.mockResolvedValue(registros);
    render(<HistoricoAlteracoes idVeiculo="v1" garagens={garagens} />);
    expect(await screen.findByRole("heading", { name: "Change history" })).toBeInTheDocument();
    expect(screen.getByText("Garage change")).toBeInTheDocument();
  });
});
