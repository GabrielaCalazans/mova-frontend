import { describe, expect, it } from "vitest";
import { formatCategoria, getVehicleCharacteristics } from "./vehicleDisplay";

describe("vehicleDisplay", () => {
  it("derives characteristics only from persisted vehicle fields", () => {
    expect(
      getVehicleCharacteristics({
        marca: "Luna",
        modelo: "XHigh",
        ano: 2026,
        cambio: "Automatico",
        capacidade: 5,
        categoria: "EXECUTIVO",
        eletrico: true,
        adaptado: true,
        autonomia: "900 km",
        cor: "Preto",
      }),
    ).toEqual(["Automático", "5 lugares", "Executivo", "Elétrico", "Adaptado PCD"]);
  });

  it("does not imply electric or adapted features when boolean fields are false", () => {
    expect(
      getVehicleCharacteristics({
        cambio: "Manual",
        capacidade: 4,
        categoria: "ECONOMICO",
        eletrico: false,
        adaptado: false,
      }),
    ).toEqual(["Manual", "4 lugares", "Econômico"]);
  });

  it("maps backend categories to user-facing labels", () => {
    expect(formatCategoria("ESPACOSO")).toBe("Espaçoso");
    expect(formatCategoria("PCD")).toBe("PCD");
    expect(formatCategoria(null)).toBe("Não informado");
  });
});
