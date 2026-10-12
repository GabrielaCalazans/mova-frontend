// Task 11.3 (NVDA + Firefox): o Firefox torna focável todo contêiner rolável, mesmo quando ele já tem
// links/botões focáveis. A faixa de navegação do locador (1 px de transbordo vertical) e a faixa de
// categorias viravam uma parada de Tab extra, sem papel nem nome. Os itens internos continuam no Tab.
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../services/veiculoService", () => ({ listVeiculos: vi.fn(() => Promise.resolve([])) }));
vi.mock("../BottomNav", () => ({ default: () => null }));
vi.mock("./PublicAppShell", () => ({ default: ({ children }) => <>{children}</> }));
vi.mock("../../utils/journeyStorage", () => ({ updateJourneyStep: vi.fn() }));

import { ThemeProvider } from "../../context/ThemeContext";
import OwnerAppShell from "./OwnerAppShell";
import Home from "../../pages/Home";
import CarrosScreen from "../../pages/CarrosScreen";

const naRota = (ui) => render(<ThemeProvider><MemoryRouter>{ui}</MemoryRouter></ThemeProvider>);

describe("contêineres roláveis fora da ordem de Tab", () => {
  it("navegação do locador: só os links são paradas de Tab", () => {
    naRota(<OwnerAppShell><p>conteúdo</p></OwnerAppShell>);
    expect(document.querySelector(".owner-nav__inner")).toHaveAttribute("tabindex", "-1");
    expect(screen.getByRole("link", { name: /Frota/ })).not.toHaveAttribute("tabindex");
  });

  it.each([["Home", () => <Home />], ["CarrosScreen", () => <CarrosScreen />]])("%s: faixa de categorias sem parada própria", async (_nome, tela) => {
    naRota(tela());
    const faixa = await waitFor(() => document.querySelector(".category-strip__list") ?? Promise.reject(new Error("faixa não renderizada")));
    expect(faixa).toHaveAttribute("tabindex", "-1");
    expect(faixa.querySelector("button")).not.toHaveAttribute("tabindex");
  });
});
