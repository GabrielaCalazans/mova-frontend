import { describe, expect, it } from "vitest";
import { calculateReservationDays, formatMoneyBRL, parseJourneyDateTime } from "./reservationMath";

describe("reservationMath", () => {
  it("calcula diarias com arredondamento consistente", () => {
    const pickup = new Date(2026, 5, 10, 10, 0, 0, 0);
    const dropoff = new Date(2026, 5, 12, 9, 0, 0, 0);

    expect(calculateReservationDays(pickup, dropoff)).toBe(2);
  });

  it("rejeita periodos invalidos", () => {
    const pickup = new Date(2026, 5, 10, 10, 0, 0, 0);
    const dropoff = new Date(2026, 5, 10, 10, 0, 0, 0);

    expect(() => calculateReservationDays(pickup, dropoff)).toThrow(/devolução deve ocorrer após a retirada/i);
  });

  it("faz parse de data e hora do journey", () => {
    const parsed = parseJourneyDateTime({ date: "10/06/2026", time: "10:30" });

    expect(parsed).toBeInstanceOf(Date);
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(5);
    expect(parsed.getDate()).toBe(10);
  });

  it("formata moeda em pt-BR", () => {
    expect(formatMoneyBRL(549.9).replace(/\u00a0/g, " ")).toBe("R$ 549,90");
  });
});