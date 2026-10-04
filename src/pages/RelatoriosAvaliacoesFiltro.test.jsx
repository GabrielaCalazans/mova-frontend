import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useSearchParams } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import RelatoriosAvaliacoesFiltro from "./RelatoriosAvaliacoesFiltro";

vi.mock("../components/BottomNav", () => ({ default: () => null }));

function Destino() {
  const [params] = useSearchParams();
  return <output data-testid="query">{params.toString()}</output>;
}

describe("RelatoriosAvaliacoesFiltro", () => {
  it("navega com query string consumível pela tela de avaliações", () => {
    render(
      <MemoryRouter initialEntries={["/relatorios/avaliacoes-filtro"]}>
        <Routes>
          <Route path="/relatorios/avaliacoes-filtro" element={<RelatoriosAvaliacoesFiltro />} />
          <Route path="/relatorios/avaliacoes" element={<Destino />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Veículo"), { target: { value: "v1" } });
    fireEvent.change(screen.getByLabelText("Avaliação"), { target: { value: "4" } });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));

    expect(screen.getByTestId("query")).toHaveTextContent("idVeiculo=v1");
    expect(screen.getByTestId("query")).toHaveTextContent("notaMin=4");
  });
});
