import { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate, t } from "../i18n";

// Nomes das datas em journey.datePicker.holidays.<dd-mm> (traduzidos no render).
const DATAS_COMEMORATIVAS = new Set(["01-01", "10-08", "07-09", "12-10", "02-11", "15-11", "25-12"]);

function pad(value) {
  return String(value).padStart(2, "0");
}

function buildMonthCells(refDate) {
  const year = refDate.getFullYear();
  const month = refDate.getMonth();
  const totalDays = new Date(year, month + 1, 0).getDate();
  // getDay(): 0=Dom...6=Sab. Convertendo para semana começando na segunda.
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;

  const cells = [];
  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push({ key: `empty-${i}`, empty: true });
  }
  for (let day = 1; day <= totalDays; day += 1) {
    const date = new Date(year, month, day);
    const weekday = (date.getDay() + 6) % 7;
    cells.push({
      key: `day-${day}`,
      day,
      weekend: weekday === 5 || weekday === 6,
      holidayLabel: DATAS_COMEMORATIVAS.has(`${pad(day)}-${pad(month + 1)}`)
        ? t(`journey.datePicker.holidays.${pad(day)}-${pad(month + 1)}`)
        : undefined,
    });
  }
  return cells;
}

// pt-BR continua dd/mm/aaaa; en-US vira mm/dd/aaaa.
function formatarData(data) {
  return formatDate(data, { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * Card "Selecione a Data" + popup de calendario, reutilizado em todos os
 * filtros de relatorio (Veiculos, Avaliacoes, etc.).
 */
export default function FiltroDataPicker({ dataSelecionada, onChange }) {
  const [calOpen, setCalOpen] = useState(false);
  const [calRef, setCalRef] = useState(new Date());

  const cells = buildMonthCells(calRef);
  const selectedHoliday = cells.find(
    (cell) => !cell.empty && cell.day === dataSelecionada?.getDate() &&
      calRef.getMonth() === dataSelecionada?.getMonth() &&
      calRef.getFullYear() === dataSelecionada?.getFullYear()
  )?.holidayLabel;

  function pickDay(day) {
    onChange(new Date(calRef.getFullYear(), calRef.getMonth(), day));
  }

  return (
    <>
      <div className="field datepick">
        <span className="field__label" id="filtro-data-label">{t("journey.datePicker.label")}</span>
        <button type="button" className="datepick__trigger" aria-labelledby="filtro-data-label filtro-data-valor" aria-haspopup="dialog" onClick={() => setCalOpen(true)}>
          <span id="filtro-data-valor" className={dataSelecionada ? undefined : "datepick__placeholder"}>
            {dataSelecionada ? formatarData(dataSelecionada) : t("journey.datePicker.placeholder")}
          </span>
          <Calendar aria-hidden="true" />
        </button>
      </div>

      {calOpen && (
        <div className="datepick__overlay" onClick={() => setCalOpen(false)} onKeyDown={(event) => event.key === "Escape" && setCalOpen(false)}>
          <div className="datepick__panel" role="dialog" aria-modal="true" aria-labelledby="filtro-cal-titulo" onClick={(event) => event.stopPropagation()}>
            <p className="datepick__title" id="filtro-cal-titulo">{t("journey.datePicker.title")}</p>
            <div className="datepick__month">
              <button
                type="button"
                className="icon-btn icon-btn--outlined"
                onClick={() => setCalRef((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
                aria-label={t("journey.datePicker.prevMonth")}
              >
                <ChevronLeft className="icon" aria-hidden="true" />
              </button>
              <h3 aria-live="polite">
                {formatDate(calRef, { month: "long" })} {calRef.getFullYear()}
              </h3>
              <button
                type="button"
                className="icon-btn icon-btn--outlined"
                onClick={() => setCalRef((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
                aria-label={t("journey.datePicker.nextMonth")}
              >
                <ChevronRight className="icon" aria-hidden="true" />
              </button>
            </div>

            <div className="datepick__days" aria-hidden="true">
              {t("journey.datePicker.weekdays").map((dia) => (
                <span key={dia}>{dia}</span>
              ))}
            </div>

            <div className="datepick__grid">
              {cells.map((cell) => {
                if (cell.empty) {
                  return <button key={cell.key} type="button" className="datepick__day" disabled aria-hidden="true" tabIndex={-1} />;
                }

                const isSelected = Boolean(
                  dataSelecionada &&
                  dataSelecionada.getDate() === cell.day &&
                  dataSelecionada.getMonth() === calRef.getMonth() &&
                  dataSelecionada.getFullYear() === calRef.getFullYear()
                );

                return (
                  <button
                    key={cell.key}
                    type="button"
                    className={`datepick__day${cell.weekend ? " datepick__day--weekend" : ""}`}
                    aria-pressed={isSelected}
                    aria-label={`${formatDate(new Date(calRef.getFullYear(), calRef.getMonth(), cell.day), { day: "numeric", month: "long" })}${cell.holidayLabel ? `, ${cell.holidayLabel}` : ""}`}
                    onClick={() => pickDay(cell.day)}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>

            {selectedHoliday && (
              <p className="datepick__holiday">
                {dataSelecionada.getDate()} - {selectedHoliday}
              </p>
            )}
            <div className="datepick__close">
              <button type="button" className="btn" onClick={() => setCalOpen(false)}>{t("journey.datePicker.done")}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
