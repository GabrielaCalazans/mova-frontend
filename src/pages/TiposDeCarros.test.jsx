import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TiposDeCarros from "./TiposDeCarros";

const navigateMock = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", () => ({ useNavigate: () => navigateMock }));
vi.mock("../components/BottomNav", () => ({ default: () => null }));

describe("TiposDeCarros", () => {
  it("oferece Espaçosos e Adaptados PCD no seletor do catálogo", () => {
    render(<TiposDeCarros />);

    fireEvent.click(screen.getByRole("button", { name: "Próximo tipo" }));
    expect(screen.getByRole("heading", { name: "Carro Espaçoso" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Selecionar" }));
    expect(navigateMock).toHaveBeenCalledWith("/carros/lista", { state: { tipo: "espacoso" } });
  });
});
