import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";
import BottomNav from "../components/BottomNav";
import "../styles/carselect.css";
import "../styles/auth.css";
import "../styles/relatorios.css";

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

export default function RelatoriosFiltro() {
  const navigate = useNavigate();

  const [dataSelecionada, setDataSelecionada] = useState(null);
  const [calOpen, setCalOpen] = useState(false);
  const [calRef, setCalRef] = useState(new Date());
  const [garagem, setGaragem] = useState("");
  const [veiculo, setVeiculo] = useState("");
  const [status, setStatus] = useState("Confirmada");

  useEffect(() => {
    document.title = "MOVA - Filtro de Relatórios";
  }, []);

  const cells = buildMonthCells(calRef);
  const selectedHoliday = cells.find(
    (cell) => !cell.empty && cell.day === dataSelecionada?.getDate() &&
      calRef.getMonth() === dataSelecionada?.getMonth() &&
      calRef.getFullYear() === dataSelecionada?.getFullYear()
  )?.holidayLabel;

  function pickDay(day) {
    setDataSelecionada(new Date(calRef.getFullYear(), calRef.getMonth(), day));
  }

  function handleAplicar(event) {
    event.preventDefault();
    navigate("/relatorios/veiculos", {
      state: {
        data: dataSelecionada
          ? `${pad(dataSelecionada.getDate())}/${pad(dataSelecionada.getMonth() + 1)}/${dataSelecionada.getFullYear()}`
          : "",
        garagem,
        veiculo,
        status,
      },
    });
  }

  return (
    <main className="carro-page">
      <div className="carro-header">
        <h1>Relatórios | Veículos</h1>
      </div>

      <div className="carro-content">
        <h2 className="filtro-title">Filtro</h2>

        <form onSubmit={handleAplicar}>
          <div className="filtro-card">
            <p className="filtro-card__label">Selecione a Data</p>
            <p className="filtro-date-trigger">
              Insira a Data
              <span className="filtro-date-divider" aria-hidden="true" />
              <Calendar size={20} />
            </p>
            <button
              type="button"
              className="filtro-date-input"
              onClick={() => setCalOpen(true)}
            >
              {dataSelecionada
                ? `${pad(dataSelecionada.getDate())}/${pad(dataSelecionada.getMonth() + 1)}/${dataSelecionada.getFullYear()}`
                : "Clique para selecionar a data dd/mm/aaaa"}
            </button>
          </div>

          <div className="filtro-card">
            <div className="auth-field">
              <label htmlFor="garagem">Garagem*</label>
              <input
                id="garagem"
                type="text"
                placeholder="Garagem"
                value={garagem}
                onChange={(e) => setGaragem(e.target.value)}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="veiculo">Veículo*</label>
              <input
                id="veiculo"
                type="text"
                placeholder="Veículo"
                value={veiculo}
                onChange={(e) => setVeiculo(e.target.value)}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="status">Status de Reserva*</label>
              <select
                id="status"
                className="filtro-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="Confirmada">Confirmada</option>
                <option value="Pendente">Pendente</option>
                <option value="Cancelada">Cancelada</option>
                <option value="Concluída">Concluída</option>
              </select>
            </div>
          </div>

          <button type="submit" className="carro-button">
            Aplicar
          </button>
        </form>
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
          <BottomNav />
    </main>
  );
}
