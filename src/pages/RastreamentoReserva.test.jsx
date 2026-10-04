import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import RastreamentoReserva, { INTERVALO_RASTREAMENTO_MS } from "./RastreamentoReserva";
import { getRastreamentoReserva } from "../services/reservaService";

vi.mock("../services/reservaService", () => ({ getRastreamentoReserva: vi.fn() }));
vi.mock("../components/BottomNav", () => ({ default: () => null }));

const resposta = (overrides = {}) => ({
  reservaId: "reserva-1",
  veiculo: { id: "veiculo-1", placa: "ABC1D23", nome: "Fiat Argo" },
  localizacao: { latitude: -23.55, longitude: -46.63, dataHora: "2026-09-20T12:00:00.000Z" },
  ...overrides,
});

function renderizar() {
  return render(
    <MemoryRouter initialEntries={["/reserva/reserva-1/localizacao"]}>
      <Routes><Route path="/reserva/:id/localizacao" element={<RastreamentoReserva />} /></Routes>
    </MemoryRouter>,
  );
}

describe("RastreamentoReserva", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });
  afterEach(() => vi.useRealTimers());

  it("mostra loading, coordenadas reais e atualização periódica", async () => {
    getRastreamentoReserva.mockResolvedValueOnce(resposta()).mockResolvedValueOnce(
      resposta({ localizacao: { latitude: -23.56, longitude: -46.64, dataHora: "2026-09-20T12:00:15.000Z" } }),
    );
    renderizar();
    expect(screen.getByText(/Carregando localização/)).toBeInTheDocument();
    await act(async () => {});
    expect(screen.getByText(/-23.55000, -46.63000/)).toBeInTheDocument();
    await act(async () => { await vi.advanceTimersByTimeAsync(INTERVALO_RASTREAMENTO_MS); });
    expect(getRastreamentoReserva).toHaveBeenCalledTimes(2);
    expect(screen.getByText(/-23.56000, -46.64000/)).toBeInTheDocument();
  });

  it("mostra posição indisponível sem coordenada fictícia", async () => {
    getRastreamentoReserva.mockResolvedValue(resposta({ localizacao: null }));
    renderizar();
    await act(async () => {});
    expect(screen.getByText(/Localização ainda indisponível/)).toBeInTheDocument();
    expect(screen.queryByText(/0\.00000/)).not.toBeInTheDocument();
  });

  it("mostra erro e cancela polling no unmount", async () => {
    getRastreamentoReserva.mockRejectedValue(new Error("rede indisponível"));
    const { unmount } = renderizar();
    await act(async () => {});
    expect(screen.getByRole("alert")).toHaveTextContent("rede indisponível");
    unmount();
    await act(async () => { await vi.advanceTimersByTimeAsync(INTERVALO_RASTREAMENTO_MS * 2); });
    expect(getRastreamentoReserva).toHaveBeenCalledTimes(1);
  });

  it("para polling quando API informa reserva não elegível", async () => {
    const erro = Object.assign(new Error("Rastreamento indisponível para esta reserva"), { status: 409 });
    getRastreamentoReserva.mockRejectedValue(erro);
    renderizar();
    await act(async () => {});
    await act(async () => { await vi.advanceTimersByTimeAsync(INTERVALO_RASTREAMENTO_MS * 2); });
    expect(getRastreamentoReserva).toHaveBeenCalledTimes(1);
  });
});
