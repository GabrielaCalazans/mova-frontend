import { useState } from "react";
import { Calendar } from "lucide-react";

const MESES = [
  "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
  "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO",
];

const DIAS_SEMANA = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];

const DATAS_COMEMORATIVAS = {
  "01-01": "Ano Novo",
  "10-08": "Dia dos Pais",
  "07-09": "Independência do Brasil",
  "12-10": "Dia das Crianças / Nossa Sra. Aparecida",
  "02-11": "Finados",
  "15-11": "Proclamação da República",
  "25-12": "Natal",
};

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
      holidayLabel: DATAS_COMEMORATIVAS[`${pad(day)}-${pad(month + 1)}`],
    });
  }
  return cells;
}

export function formatarDataBR(data) {
  if (!data) return "";
  return `${pad(data.getDate())}/${pad(data.getMonth() + 1)}/${data.getFullYear()}`;
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
      <div className="filtro-card">
        <p className="filtro-card__label">Selecione a Data</p>
        <p className="filtro-date-trigger">
          Insira a Data
          <span className="filtro-date-divider" aria-hidden="true" />
          <Calendar size={20} />
        </p>
        <button type="button" className="filtro-date-input" onClick={() => setCalOpen(true)}>
          {dataSelecionada ? formatarDataBR(dataSelecionada) : "Clique para selecionar a data dd/mm/aaaa"}
        </button>
      </div>

      {calOpen && (
        <div className="filtro-cal-overlay" onClick={() => setCalOpen(false)}>
          <div className="filtro-cal-popup" onClick={(event) => event.stopPropagation()}>
            <p className="filtro-cal-popup__title">Seleção de Data</p>
            <div className="filtro-cal-popup__month">
              <button
                type="button"
                className="filtro-cal-nav"
                onClick={() => setCalRef((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
                aria-label="Mês anterior"
              >
                ‹
              </button>
              <h3>
                {MESES[calRef.getMonth()]} {calRef.getFullYear()}
              </h3>
              <button
                type="button"
                className="filtro-cal-nav"
                onClick={() => setCalRef((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
                aria-label="Próximo mês"
              >
                ›
              </button>
            </div>

            <div className="filtro-cal-daynames">
              {DIAS_SEMANA.map((dia) => (
                <span key={dia}>{dia}</span>
              ))}
            </div>

            <div className="filtro-cal-grid">
              {cells.map((cell) => {
                if (cell.empty) {
                  return <button key={cell.key} className="filtro-cal-day" disabled />;
                }

                const isSelected =
                  dataSelecionada &&
                  dataSelecionada.getDate() === cell.day &&
                  dataSelecionada.getMonth() === calRef.getMonth() &&
                  dataSelecionada.getFullYear() === calRef.getFullYear();

                return (
                  <button
                    key={cell.key}
                    type="button"
                    className={`filtro-cal-day${cell.weekend ? " filtro-cal-day--weekend" : ""}${isSelected ? " filtro-cal-day--selected" : ""}`}
                    onClick={() => pickDay(cell.day)}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>

            {selectedHoliday && (
              <p className="filtro-cal-holiday">
                {dataSelecionada.getDate()} - {selectedHoliday.toUpperCase()}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
