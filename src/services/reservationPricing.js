const DEFAULT_RESERVATION_PRICING = {
  dailyRate: 250,
  feeRate: 0.12,
  fixedFees: 19.9,
};

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function roundCurrency(value) {
  return Math.round(value * 100) / 100;
}

export async function getReservationPricing({ days, vehicle } = {}) {
  const safeDays = Math.max(1, Number(days) || 1);
  const dailyRate = toNumber(
    vehicle?.valorDiaria ?? vehicle?.precoDiaria ?? vehicle?.dailyRate,
    DEFAULT_RESERVATION_PRICING.dailyRate,
  );

  const subtotal = dailyRate * safeDays;
  const fees = roundCurrency(subtotal * DEFAULT_RESERVATION_PRICING.feeRate + DEFAULT_RESERVATION_PRICING.fixedFees);
  const total = roundCurrency(subtotal + fees);

  return {
    dailyRate,
    fees,
    total,
  };
}

export { DEFAULT_RESERVATION_PRICING };