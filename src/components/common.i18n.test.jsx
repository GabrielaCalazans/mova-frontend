import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { setLocale } from "../i18n";
import { rotulo, STATUS_RESERVA_LABELS } from "../services/apiEnums";
import { validateLoginForm } from "../utils/formValidators";
import { validarPeriodoReserva } from "../utils/reservationMath";
import NotFound from "../pages/NotFound";
import JourneySteps from "./reservation/JourneySteps";
import VehicleCard from "./vehicle/VehicleCard";

const vehicle = { marca: "Fiat", modelo: "Argo", capacidade: 5, adaptado: true, valorDiaria: 120, status: "MANUTENCAO" };

afterEach(() => setLocale("pt-BR"));

describe("textos comuns (RNF08)", () => {
  it("inglês: cartão, etapas, 404, enums e validações", () => {
    setLocale("en");
    render(
      <MemoryRouter>
        <JourneySteps current="retirada" />
        <VehicleCard vehicle={vehicle} />
        <NotFound />
      </MemoryRouter>,
    );

    expect(screen.getByRole("navigation", { name: "Booking steps" })).toHaveTextContent("Step 2 of 7 · Pickup");
    expect(screen.getByText("5 seats")).toBeInTheDocument();
    expect(screen.getByText("Accessible (PwD)")).toBeInTheDocument();
    expect(screen.getByText("Under maintenance")).toBeInTheDocument();
    expect(screen.getByText("/day")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Page not found" })).toBeInTheDocument();
    expect(rotulo(STATUS_RESERVA_LABELS, "REALIZADA")).toBe("Completed");
    expect(validateLoginForm({ email: "x", senha: "" })).toEqual({ email: "Enter a valid email.", senha: "Enter your password." });
  });

  it("espanhol: mesmas peças no idioma ativo", () => {
    setLocale("es");
    render(
      <MemoryRouter>
        <JourneySteps current="pagamento" />
        <VehicleCard vehicle={{ ...vehicle, status: "DISPONIVEL", adaptado: false }} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("navigation", { name: "Pasos de la reserva" })).toHaveTextContent("Paso 7 de 7 · Pago");
    expect(screen.getByText("5 plazas")).toBeInTheDocument();
    expect(screen.getByText("Sin adaptación PMR")).toBeInTheDocument();
    expect(STATUS_RESERVA_LABELS.CANCELADA).toBe("Cancelada");
    expect(validarPeriodoReserva(null, null)).toBe("Selecciona la fecha y la hora de recogida.");
  });

  it("pt-BR continua igual", () => {
    render(<MemoryRouter><JourneySteps current="veiculo" /></MemoryRouter>);
    expect(screen.getByRole("navigation", { name: "Etapas da reserva" })).toHaveTextContent("Etapa 1 de 7 · Veículo");
    expect(STATUS_RESERVA_LABELS.REALIZADA).toBe("Concluída");
  });
});
