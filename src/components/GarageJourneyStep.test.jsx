import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { setLocale } from "../i18n";
import GarageJourneyStep from "./GarageJourneyStep";

vi.mock("../components/BottomNav", () => ({ default: () => null }));
vi.mock("../utils/journeyStorage", () => ({
  getJourneyStep: (key) => (key === "veiculo" ? { id: "v1", garagemId: "g1", marca: "Fiat", modelo: "Argo" } : {}),
  updateJourneyStep: vi.fn(),
}));
vi.mock("../services/garagemService", () => ({
  getGaragemById: vi.fn().mockResolvedValue({ id: "g1", nome: "Garagem Centro", endereco: "Av. Pompeia, 150", status: "ATIVA", capacidade: 10, veiculosAlocados: 1 }),
  listGaragens: vi.fn().mockResolvedValue([]),
}));

function renderStep() {
  return render(
    <MemoryRouter>
      <GarageJourneyStep stepKey="retirada" title="Retirada" subtitle="" nextPath="/x" nextButtonLabel="Continuar" documentTitle="MOVA" />
    </MemoryRouter>,
  );
}

describe("GarageJourneyStep — calendário", () => {
  it("rotula navegação e dias com a data completa e fecha com Esc devolvendo o foco", async () => {
    const user = userEvent.setup();
    renderStep();

    const campo = await screen.findByLabelText("Data da retirada");
    await screen.findByText("Garagem Centro");
    await user.click(campo);

    expect(screen.getByRole("button", { name: "Mês anterior" })).toBeInTheDocument();
    const proximo = screen.getByRole("button", { name: "Próximo mês" });
    await user.click(proximo);

    const hoje = new Date();
    const mesSeguinte = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);
    const nomeMes = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(mesSeguinte);
    expect(screen.getByRole("button", { name: `14 de ${nomeMes} de ${mesSeguinte.getFullYear()}` })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("button", { name: "Próximo mês" })).not.toBeInTheDocument();
    expect(campo).toHaveFocus();
  });
});

describe("GarageJourneyStep — RNF08 (idiomas)", () => {
  afterEach(() => setLocale("pt-BR"));

  it("em inglês rotula campos e dias do calendário no idioma ativo", async () => {
    const user = userEvent.setup();
    setLocale("en");
    renderStep();

    const campo = await screen.findByLabelText("Pickup date");
    expect(screen.getByLabelText("Pickup time")).toBeInTheDocument();
    await user.click(campo);
    await user.click(screen.getByRole("button", { name: "Next month" }));

    const hoje = new Date();
    const mesSeguinte = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 14);
    const rotulo = new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(mesSeguinte);
    expect(screen.getByRole("button", { name: rotulo })).toBeInTheDocument();
  });
});
