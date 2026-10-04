import { describe, expect, it } from "vitest";
import {
  calculateReservationDays,
  formatMoneyBRL,
  parseJourneyDateTime,
  validarPeriodoReserva,
} from "./reservationMath";

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
// TASK 03 — casos obrigatórios de data/hora. Espelham RN05 do backend; as
// mensagens são idênticas de propósito. Ver auditoria/DATAS-HORARIOS.md.
describe("validarPeriodoReserva", () => {
  const HORA = 60 * 60 * 1000;
  const DIA = 24 * HORA;
  const agora = new Date("2026-06-10T12:00:00.000Z");
  const emHoras = (h) => new Date(agora.getTime() + h * HORA);

  it("daqui a algumas horas → válido", () => {
    expect(validarPeriodoReserva(emHoras(3), emHoras(8), agora)).toBeNull();
  });

  it("amanhã → válido", () => {
    const inicio = new Date(agora.getTime() + DIA);
    expect(validarPeriodoReserva(inicio, new Date(inicio.getTime() + 2 * DIA), agora)).toBeNull();
  });

  it("exatamente 1 hora → válido (borda inclusiva)", () => {
    const inicio = emHoras(5);
    expect(validarPeriodoReserva(inicio, new Date(inicio.getTime() + HORA), agora)).toBeNull();
  });

  it("menos de 1 hora → recusa com a mensagem do backend", () => {
    const inicio = emHoras(5);
    expect(
      validarPeriodoReserva(inicio, new Date(inicio.getTime() + HORA - 60_000), agora),
    ).toBe("A reserva deve ter entre 1 hora e 30 dias de duração.");
  });

  it("exatamente 30 dias → válido (borda inclusiva)", () => {
    const inicio = emHoras(5);
    expect(validarPeriodoReserva(inicio, new Date(inicio.getTime() + 30 * DIA), agora)).toBeNull();
  });

  it("mais de 30 dias → recusa", () => {
    const inicio = emHoras(5);
    expect(
      validarPeriodoReserva(inicio, new Date(inicio.getTime() + 30 * DIA + 60_000), agora),
    ).toBe("A reserva deve ter entre 1 hora e 30 dias de duração.");
  });

  it("horário final anterior ao inicial → recusa", () => {
    const inicio = emHoras(10);
    expect(validarPeriodoReserva(inicio, emHoras(8), agora)).toBe(
      "A data/hora de término deve ser posterior à de início.",
    );
  });

  it("mesmo horário → recusa", () => {
    const inicio = emHoras(10);
    expect(validarPeriodoReserva(inicio, new Date(inicio.getTime()), agora)).toBe(
      "A data/hora de término deve ser posterior à de início.",
    );
  });

  it("início no passado → recusa", () => {
    expect(validarPeriodoReserva(emHoras(-1), emHoras(5), agora)).toBe(
      "A data/hora de início não pode estar no passado.",
    );
  });

  it("atravessa a virada do dia (23:30 → 00:30) → válido", () => {
    const inicio = new Date(2026, 5, 20, 23, 30, 0, 0);
    const fim = new Date(2026, 5, 21, 0, 30, 0, 0);
    expect(inicio.getDate()).not.toBe(fim.getDate());
    expect(validarPeriodoReserva(inicio, fim, agora)).toBeNull();
  });

  it("só o início, sem fim, valida apenas o passado", () => {
    expect(validarPeriodoReserva(emHoras(2), null, agora)).toBeNull();
    expect(validarPeriodoReserva(emHoras(-2), null, agora)).toBe(
      "A data/hora de início não pode estar no passado.",
    );
  });
});

describe("representação de data/hora (timezone)", () => {
  it("o instante escolhido sobrevive ao ISO e volta na mesma hora local", () => {
    // O usuário escolhe 10/06/2026 10:00 no fuso DELE. O que trafega é o
    // instante em UTC; ao voltar, a hora de parede local tem que ser a mesma.
    const escolhido = parseJourneyDateTime({ date: "10/06/2026", time: "10:00" });
    expect(escolhido.getHours()).toBe(10);
    expect(escolhido.getMinutes()).toBe(0);

    const trafegado = escolhido.toISOString();
    expect(trafegado).toMatch(/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}[.][0-9]{3}Z$/);

    const deVolta = new Date(trafegado);
    expect(deVolta.getTime()).toBe(escolhido.getTime());
    expect(deVolta.getHours()).toBe(10);
    expect(deVolta.getDate()).toBe(10);
  });

  it("o ISO enviado reflete o offset local, não a hora de parede", () => {
    const escolhido = parseJourneyDateTime({ date: "10/06/2026", time: "10:00" });
    const offsetMin = escolhido.getTimezoneOffset(); // ex.: 180 em UTC-3
    const horaUtcEsperada = new Date(escolhido.getTime()).getUTCHours();

    expect(horaUtcEsperada).toBe(((10 + offsetMin / 60) % 24 + 24) % 24);
  });

  it("meia-noite e 23:59 são horários válidos", () => {
    expect(parseJourneyDateTime({ date: "10/06/2026", time: "00:00" }).getHours()).toBe(0);
    expect(parseJourneyDateTime({ date: "10/06/2026", time: "23:59" }).getHours()).toBe(23);
    expect(parseJourneyDateTime({ date: "10/06/2026", time: "24:00" })).toBeNull();
  });

  it("recusa data inexistente no calendário", () => {
    expect(parseJourneyDateTime({ date: "31/02/2026", time: "10:00" })).toBeNull();
    expect(parseJourneyDateTime({ date: "29/02/2026", time: "10:00" })).toBeNull();
    expect(parseJourneyDateTime({ date: "29/02/2028", time: "10:00" })).not.toBeNull();
  });
});
