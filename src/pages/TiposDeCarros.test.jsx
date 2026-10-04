import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TiposDeCarros from "./TiposDeCarros";

const navigateMock = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", () => ({ useNavigate: () => navigateMock }));
vi.mock("../components/BottomNav", () => ({ default: () => null }));

describe("TiposDeCarros", () => {
  it("mostra todas as categorias, incluindo Espaçosos, Adaptados PCD e Elétricos", () => {
    render(<TiposDeCarros />);

    for (const nome of ["Carro Econômico", "Carro Espaçoso", "Carro Executivo", "Carro Adaptado PCD", "Carro Elétrico"]) {
      expect(screen.getByRole("button", { name: new RegExp(nome) })).toBeInTheDocument();
    }
  });

  it("envia a categoria escolhida para a lista de carros", () => {
    render(<TiposDeCarros />);

    fireEvent.click(screen.getByRole("button", { name: /Carro Espaçoso/ }));
    expect(navigateMock).toHaveBeenCalledWith("/carros/lista", { state: { tipo: "espacoso" } });
  });
});
