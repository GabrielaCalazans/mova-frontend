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

// Espelho de RN05 (mova-backend/src/schemas/reserva.schema.ts e
// ReservaService.assertPeriodoValido). NÃO substitui a validação do servidor:
// antecipa a mesma mensagem para o usuário, em vez de deixá-lo descobrir só
// depois do POST. As mensagens são idênticas às do backend de propósito.
export const DURACAO_MINIMA_MS = 60 * 60 * 1000;
export const DURACAO_MAXIMA_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Valida o período escolhido. Devolve a mensagem do primeiro problema
 * encontrado, ou null quando está tudo certo.
 *
 * @param {Date|null} inicio
 * @param {Date|null} fim  quando ausente, valida apenas o início
 * @param {Date} agora     injetável para teste
 */
export function validarPeriodoReserva(inicio, fim, agora = new Date()) {
  if (!(inicio instanceof Date) || Number.isNaN(inicio.getTime())) {
    return "Selecione a data e o horário de retirada.";
  }

  if (inicio.getTime() < agora.getTime()) {
    return "A data/hora de início não pode estar no passado.";
  }

  if (fim === null || fim === undefined) {
    return null;
  }

  if (!(fim instanceof Date) || Number.isNaN(fim.getTime())) {
    return "Selecione a data e o horário de devolução.";
  }

  if (fim.getTime() <= inicio.getTime()) {
    return "A data/hora de término deve ser posterior à de início.";
  }

  const duracao = fim.getTime() - inicio.getTime();
  if (duracao < DURACAO_MINIMA_MS || duracao > DURACAO_MAXIMA_MS) {
    return "A reserva deve ter entre 1 hora e 30 dias de duração.";
  }

  return null;
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