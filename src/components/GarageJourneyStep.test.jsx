import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { setLocale } from "../i18n";
import GarageJourneyStep from "./GarageJourneyStep";
import { listGaragens } from "../services/garagemService";

vi.mock("../components/BottomNav", () => ({ default: () => null }));
vi.mock("../utils/journeyStorage", () => ({
  getJourneyStep: (key) => (key === "veiculo" ? { id: "v1", garagemId: "g1", marca: "Fiat", modelo: "Argo" } : {}),
  updateJourneyStep: vi.fn(),
}));
vi.mock("../services/garagemService", () => ({
  getGaragemById: vi.fn().mockResolvedValue({ id: "g1", nome: "Garagem Centro", endereco: "Av. Pompeia, 150", status: "ATIVA", capacidade: 10, veiculosAlocados: 1 }),
  listGaragens: vi.fn().mockResolvedValue([]),
}));

function renderStep(stepKey = "retirada") {
  return render(
    <MemoryRouter>
      <GarageJourneyStep stepKey={stepKey} title="Etapa" subtitle="" nextPath="/x" nextButtonLabel="Continuar" documentTitle="MOVA" />
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

// Task 11.2 (WCAG 1.1.1): os ícones de calendário e relógio ao lado dos campos são decorativos;
// sem aria-hidden o Chromium os expunha como imagens sem nome na árvore de acessibilidade.
describe("GarageJourneyStep — ícones decorativos", () => {
  it("não expõe svg sem nome a tecnologias assistivas", async () => {
    const { container } = renderStep();
    await screen.findByText("Garagem Centro");
    const expostos = [...container.querySelectorAll("svg")].filter((svg) => !svg.closest("[aria-hidden=true]") && !svg.getAttribute("aria-label") && !svg.querySelector("title"));
    expect(expostos).toHaveLength(0);
  });
});

// Task 11.3.1 (validação manual com o NVDA): os blocos do cartão são spans display:block, e o Chrome juntava
// nome, endereço e vagas sem separação ("Garagem JuvevêEndereço: …Curitiba3 de 6 vagas livres").
describe("GarageJourneyStep — nome acessível dos cartões de garagem", () => {
  it("separa nome, endereço e vagas no nome do botão", async () => {
    listGaragens.mockResolvedValueOnce([
      { id: "g2", nome: "Garagem Juvevê", endereco: "Rua Mateus Leme, 2000 - Juvevê, Curitiba", capacidade: 6, veiculosAlocados: 3 },
    ]);
    renderStep("devolucao");

    expect(await screen.findByRole("button", { name: "Garagem Juvevê. Endereço: Rua Mateus Leme, 2000 - Juvevê, Curitiba. 3 de 6 vagas livres" })).toBeInTheDocument();
  });
});

// Task 11.3.1: os botões de hora e minuto do relógio eram anunciados só como "00".
describe("GarageJourneyStep — nome dos botões de hora e minuto", () => {
  it("indica qual parte do horário cada botão representa", async () => {
    const user = userEvent.setup();
    renderStep();

    await screen.findByText("Garagem Centro");
    await user.click(screen.getByLabelText("Horário da retirada"));

    expect(screen.getByRole("button", { name: "Hora 00" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Minutos 00" })).toBeInTheDocument();
  });
});
