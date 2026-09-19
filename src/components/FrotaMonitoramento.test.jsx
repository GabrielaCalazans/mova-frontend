import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import FrotaMonitoramento, { INTERVALO_FROTA_MS } from "./FrotaMonitoramento";
import { getFrota } from "../services/dashboardService";

vi.mock("../services/dashboardService", () => ({ getFrota: vi.fn() }));

const frota = (overrides = {}) => ({
  veiculos: { total: 2, disponivel: 1, reservado: 1, manutencao: 0, inativo: 0 },
  alertasAtivos: 0,
  ultimasLocalizacoes: [{ idVeiculo: "v1", placa: "ABC-1234", latitude: -23.55, longitude: -46.63, dataHora: "2026-01-01T10:00:00.000Z" }],
  ...overrides,
});

describe("FrotaMonitoramento", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T10:00:00.000Z"));
    vi.clearAllMocks();
  });
  afterEach(() => vi.useRealTimers());

  it("mostra posição e atualiza o status em um único polling", async () => {
    getFrota.mockResolvedValueOnce(frota()).mockResolvedValueOnce(frota({ veiculos: { total: 2, disponivel: 2, reservado: 0, manutencao: 0, inativo: 0 } }));
    render(<FrotaMonitoramento />);
    await act(async () => {});
    expect(screen.getByText(/ABC-1234: -23.55000, -46.63000/)).toBeInTheDocument();
    expect(screen.getByText(/1 disponíveis · 1 reservados/)).toBeInTheDocument();
    await act(async () => { await vi.advanceTimersByTimeAsync(INTERVALO_FROTA_MS); });
    expect(screen.getByText(/2 disponíveis · 0 reservados/)).toBeInTheDocument();
    expect(getFrota).toHaveBeenCalledTimes(2);
  });

  it("mostra ausência e posição desatualizada", async () => {
    getFrota.mockResolvedValueOnce(frota({ ultimasLocalizacoes: [] }));
    render(<FrotaMonitoramento />);
    await act(async () => {});
    expect(screen.getByText(/Nenhuma posição registrada/)).toBeInTheDocument();
    getFrota.mockResolvedValueOnce(frota({ ultimasLocalizacoes: [{ idVeiculo: "v1", placa: "ABC-1234", latitude: 1, longitude: 2, dataHora: "2026-01-01T09:58:00.000Z" }] }));
    await act(async () => { await vi.advanceTimersByTimeAsync(INTERVALO_FROTA_MS); });
    expect(screen.getByText(/posição desatualizada/)).toBeInTheDocument();
  });

  it("mostra erro sem descartar o último estado", async () => {
    getFrota.mockResolvedValueOnce(frota()).mockRejectedValueOnce(new Error("rede indisponível"));
    render(<FrotaMonitoramento />);
    await act(async () => {});
    await act(async () => { await vi.advanceTimersByTimeAsync(INTERVALO_FROTA_MS); });
    expect(screen.getByRole("alert")).toHaveTextContent("rede indisponível");
    expect(screen.getByText(/ABC-1234/)).toBeInTheDocument();
  });

  it("cancela polling ao desmontar e evita sobreposição", async () => {
    let resolver;
    getFrota.mockReturnValue(new Promise((resolve) => { resolver = resolve; }));
    const { unmount } = render(<FrotaMonitoramento />);
    await act(async () => { await vi.advanceTimersByTimeAsync(INTERVALO_FROTA_MS * 2); });
    expect(getFrota).toHaveBeenCalledTimes(1);
    unmount();
    resolver(frota());
    await act(async () => {});
    await act(async () => { await vi.advanceTimersByTimeAsync(INTERVALO_FROTA_MS * 2); });
    expect(getFrota).toHaveBeenCalledTimes(1);
  });
});
