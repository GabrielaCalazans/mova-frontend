import { describe, expect, it } from "vitest";
import { getReservationPricing } from "./reservationPricing";

describe("reservationPricing", () => {
  it("retorna resumo mockado com valores derivados do veículo", async () => {
    const pricing = await getReservationPricing({
      days: 3,
      vehicle: { precoDiaria: 280 },
    });

    expect(pricing.dailyRate).toBe(280);
    expect(pricing.fees).toBeGreaterThan(0);
    expect(pricing.total).toBeGreaterThan(pricing.fees);
  });
});