const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDatePart(value) {
  const [day, month, year] = String(value || "").split("/").map((part) => Number(part));

  if ([day, month, year].some((part) => Number.isNaN(part))) {
    return null;
  }

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function parseTimePart(value) {
  const [hours, minutes] = String(value || "").split(":").map((part) => Number(part));

  if ([hours, minutes].some((part) => Number.isNaN(part))) {
    return null;
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return { hours, minutes };
}

export function parseJourneyDateTime(step = {}) {
  const date = parseDatePart(step.date);
  const time = parseTimePart(step.time);

  if (!date || !time) {
    return null;
  }

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    time.hours,
    time.minutes,
    0,
    0,
  );
}

export function calculateReservationDays(pickupDateTime, dropoffDateTime) {
  if (!(pickupDateTime instanceof Date) || Number.isNaN(pickupDateTime.getTime())) {
    throw new Error("Data de retirada inválida.");
  }

  if (!(dropoffDateTime instanceof Date) || Number.isNaN(dropoffDateTime.getTime())) {
    throw new Error("Data de devolução inválida.");
  }

  const diff = dropoffDateTime.getTime() - pickupDateTime.getTime();

  if (diff <= 0) {
    throw new Error("A devolução deve ocorrer após a retirada.");
  }

  return Math.max(1, Math.ceil(diff / MS_PER_DAY));
}

export function formatMoneyBRL(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value) || 0);
}