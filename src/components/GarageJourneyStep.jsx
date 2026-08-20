import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import garagemImg from "../assets/garagem.png";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import "../styles/carselect.css";
import "../styles/home.css";
import {
  StyledForm,
  JourneySectionHint,
  JourneyFieldGroup,
  JourneyFieldLabel,
  JourneyFieldsGrid,
  InputWithIcon,
  IconBtn,
  FieldWrapper,
  Popup,
  PopupOverlay,
  CalHeader,
  CalTitle,
  NavBtn,
  DayNames,
  DayGrid,
  DayCell,
  ClockDisplay,
  ClockPart,
  ModeBtns,
  ModeBtn,
  ClockFaceWrap,
  FaceSvg,
  ConfirmBtn,
  AmPmBtns,
  AmPmBtn,
} from "../styles/authStyle";
import { getJourneyStep, updateJourneyStep } from "../utils/journeyStorage";

const GARAGES = [
  { id: 1, nome: "Garagem Norte", endereco: "Rua Principal, 12", info: "Capacidade: 30 Carros" },
  { id: 2, nome: "Garagem Centro", endereco: "Av. Pompeia, 150", info: "Capacidade: 30 Carros" },
  { id: 3, nome: "Garagem Sul", endereco: "Rua Jabuti, 172", info: "Capacidade: 30 Carros" },
  { id: 4, nome: "Garagem Leste", endereco: "Rua Piraporinha, 12", info: "Capacidade: 30 Carros" },
];

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function padDatePart(value) {
  return String(value).padStart(2, "0");
}

function parseDateDisplay(value) {
  if (!value) {
    return null;
  }

  const parts = value.split("/").map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    return null;
  }

  const [day, month, year] = parts;
  return new Date(year, month - 1, day);
}

function normalizeTime(value) {
  if (!value) {
    return { clockH: 0, clockM: 0, amPm: "AM" };
  }

  const [hoursPart, minutesPart] = value.split(":").map((part) => Number(part));
  if (
    Number.isNaN(hoursPart) ||
    Number.isNaN(minutesPart)
  ) {
    return { clockH: 0, clockM: 0, amPm: "AM" };
  }

  const amPm = hoursPart >= 12 ? "PM" : "AM";
  let displayHour = hoursPart % 12;

  if (hoursPart === 0 || displayHour === 0) {
    displayHour = 12;
  }

  return {
    clockH: displayHour === 12 ? 0 : displayHour,
    clockM: minutesPart,
    amPm,
  };
}

function buildStepLabel(stepKey) {
  return stepKey === "retirada" ? "Retirada" : "Devolução";
}

export default function GarageJourneyStep({
  stepKey,
  title,
  subtitle,
  nextPath,
  nextButtonLabel,
  documentTitle,
}) {
  const navigate = useNavigate();
  const stepLabel = buildStepLabel(stepKey);

  const storedStep = useMemo(() => getJourneyStep(stepKey), [stepKey]);

  const [selectedGarageId, setSelectedGarageId] = useState(storedStep.garageId ? String(storedStep.garageId) : "");
  const [data, setData] = useState(storedStep.date || "");
  const [hora, setHora] = useState(storedStep.time || "");

  const parsedDate = parseDateDisplay(storedStep.date);
  const parsedTime = normalizeTime(storedStep.time);

  const [amPm, setAmPm] = useState(parsedTime.amPm);
  const [calOpen, setCalOpen] = useState(false);
  const [calDate, setCalDate] = useState(parsedDate || new Date());
  const [selDate, setSelDate] = useState(parsedDate);
  const [clockOpen, setClockOpen] = useState(false);
  const [clockMode, setClockMode] = useState("hour");
  const [clockH, setClockH] = useState(parsedTime.clockH);
  const [clockM, setClockM] = useState(parsedTime.clockM);
  const selectedGarage = GARAGES.find((garage) => String(garage.id) === selectedGarageId) ?? null;

  useEffect(() => {
    document.title = documentTitle;
  }, [documentTitle]);

  useEffect(() => {
    updateJourneyStep(stepKey, {
      garageId: selectedGarageId,
      garageName: selectedGarage?.nome ?? "",
      garageAddress: selectedGarage?.endereco ?? "",
      garageInfo: selectedGarage?.info ?? "",
      date: data,
      time: hora,
    });
  }, [data, hora, selectedGarage, selectedGarageId, stepKey]);

  const visibleGarages = selectedGarage ? [selectedGarage] : GARAGES;
  const canContinue = Boolean(selectedGarage && data && hora);

  const prevMonth = () => setCalDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
  const nextMonth = () => setCalDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));

  const buildDays = () => {
    const year = calDate.getFullYear();
    const month = calDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const cells = [];

    for (let index = 0; index < firstDay; index += 1) {
      cells.push({ empty: true, key: `e${index}` });
    }

    for (let day = 1; day <= totalDays; day += 1) {
      const currentDate = new Date(year, month, day);
      const isPast = currentDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
      const isSelected =
        selDate &&
        selDate.getDate() === day &&
        selDate.getMonth() === month &&
        selDate.getFullYear() === year;

      cells.push({ day, disabled: isPast, today: isToday, selected: isSelected, key: `d${day}` });
    }

    return cells;
  };

  const pickDay = (day) => {
    const year = calDate.getFullYear();
    const month = calDate.getMonth();
    const picked = new Date(year, month, day);

    setSelDate(picked);
    setData(`${padDatePart(day)}/${padDatePart(month + 1)}/${year}`);
    setCalOpen(false);
  };

  const RADIUS = 78;
  const CX = 100;
  const CY = 100;

  const angleFor = (value, total) => ((value / total) * 360 - 90) * (Math.PI / 180);

  const buildNumbers = () => {
    if (clockMode === "hour") {
      return Array.from({ length: 12 }, (_, index) => {
        const label = index === 0 ? 12 : index;
        const angle = angleFor(index, 12);
        const x = CX + RADIUS * Math.cos(angle);
        const y = CY + RADIUS * Math.sin(angle);
        const selected = clockH % 12 === label % 12;

        return { label, x, y, sel: selected, val: label === 12 ? 0 : label };
      });
    }

    return Array.from({ length: 12 }, (_, index) => {
      const label = index * 5;
      const angle = angleFor(index, 12);
      const x = CX + RADIUS * Math.cos(angle);
      const y = CY + RADIUS * Math.sin(angle);
      const selected = clockM === label;

      return { label: String(label).padStart(2, "0"), x, y, sel: selected, val: label };
    });
  };

  const hourAngle = ((clockH % 12) / 12) * 360 + (clockM / 60) * 30 - 90;
  const minuteAngle = (clockM / 60) * 360 - 90;

  const handEnd = (angle, length) => ({
    x: CX + length * Math.cos(angle * Math.PI / 180),
    y: CY + length * Math.sin(angle * Math.PI / 180),
  });

  const hEnd = handEnd(hourAngle, 55);
  const mEnd = handEnd(minuteAngle, 70);

  const confirmTime = () => {
    let hour = clockH;

    if (amPm === "PM" && hour !== 12) {
      hour += 12;
    }

    if (amPm === "AM" && hour === 12) {
      hour = 0;
    }

    setHora(`${String(hour).padStart(2, "0")}:${String(clockM).padStart(2, "0")}`);
    setClockOpen(false);
  };

  const handleFaceClick = (event) => {
    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const scaleX = 200 / rect.width;
    const scaleY = 200 / rect.height;
    const x = (event.clientX - rect.left) * scaleX - CX;
    const y = (event.clientY - rect.top) * scaleY - CY;

    let angle = Math.atan2(y, x) * 180 / Math.PI + 90;
    if (angle < 0) {
      angle += 360;
    }

    if (clockMode === "hour") {
      const hour = Math.round(angle / 30) % 12;
      setClockH(hour);
      setTimeout(() => setClockMode("minute"), 200);
    } else {
      const minute = Math.round(angle / 6) % 60;
      setClockM(minute < 0 ? minute + 60 : minute);
    }
  };

  const days = buildDays();
  const numbers = buildNumbers();

  return (
    <main className="carro-page">
      <div className="carro-header">
        <TopBar showLogo iconColor="white" />
        <h1>{title}</h1>
      </div>

      <div className="carro-content">
        <StyledForm
          onSubmit={(event) => {
            event.preventDefault();
            if (canContinue) {
              navigate(nextPath);
            }
          }}
        >
          <JourneySectionHint style={{ textAlign: "center", display: "block", marginBottom: "0.75rem" }}>
            {selectedGarage
              ? "A garagem selecionada permanece em destaque até você trocar a opção."
              : subtitle}
          </JourneySectionHint>

          {!selectedGarage && (
            <div className="garage-list">
              {visibleGarages.map((garage) => (
                <button
                  type="button"
                  key={garage.id}
                  className="garage-card"
                  onClick={() => setSelectedGarageId(String(garage.id))}
                  aria-pressed={String(garage.id) === selectedGarageId}
                >
                  <img src={garagemImg} alt="Garagem" className="garage-card__image" />
                  <div className="garage-card__info">
                    <h3>{garage.nome}</h3>
                    <p>Endereço: {garage.endereco}</p>
                    {garage.info && <p>{garage.info}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}

          {selectedGarage && (
            <>
              <div className="garage-list">
                <div className="garage-card garage-card--selected" style={{ cursor: "default" }}>
                  <img src={garagemImg} alt="Garagem selecionada" className="garage-card__image" />
                  <div className="garage-card__info">
                    <h3>{selectedGarage.nome}</h3>
                    <p>Endereço: {selectedGarage.endereco}</p>
                    {selectedGarage.info && <p>{selectedGarage.info}</p>}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: "center", marginTop: "0.6rem" }}>
                <button type="button" className="garage-change-link" onClick={() => setSelectedGarageId("")}>
                  Trocar garagem
                </button>
              </div>
            </>
          )}

        <JourneyFieldsGrid>
          <JourneyFieldGroup>
            <JourneyFieldLabel htmlFor={`${stepKey}-date`}>Data da {stepLabel.toLowerCase()}</JourneyFieldLabel>
            <FieldWrapper>
              <InputWithIcon
                id={`${stepKey}-date`}
                type="text"
                placeholder="Digite a data (DD/MM/AAAA)"
                value={data}
                readOnly
                required
                disabled={!selectedGarage}
                onClick={() => {
                  if (selectedGarage) {
                    setCalOpen((value) => !value);
                    setClockOpen(false);
                  }
                }}
              />
              <IconBtn>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </IconBtn>

              {calOpen && selectedGarage && (
                <>
                  <PopupOverlay onClick={() => setCalOpen(false)} />
                  <Popup>
                    <CalHeader>
                      <NavBtn type="button" onClick={prevMonth}>‹</NavBtn>
                      <CalTitle>
                        {MONTHS[calDate.getMonth()]} {calDate.getFullYear()}
                      </CalTitle>
                      <NavBtn type="button" onClick={nextMonth}>›</NavBtn>
                    </CalHeader>

                    <DayNames>
                      {["D", "S", "T", "Q", "Q", "S", "S"].map((day, index) => (
                        <span key={index}>{day}</span>
                      ))}
                    </DayNames>

                    <DayGrid>
                      {days.map((cell) => (
                        cell.empty ? (
                          <DayCell key={cell.key} as="div" empty />
                        ) : (
                          <DayCell
                            key={cell.key}
                            type="button"
                            disabled={cell.disabled}
                            today={cell.today}
                            selected={cell.selected}
                            onClick={() => !cell.disabled && pickDay(cell.day)}
                          >
                            {cell.day}
                          </DayCell>
                        )
                      ))}
                    </DayGrid>
                  </Popup>
                </>
              )}
            </FieldWrapper>
          </JourneyFieldGroup>

          <JourneyFieldGroup>
            <JourneyFieldLabel htmlFor={`${stepKey}-time`}>Horário da {stepLabel.toLowerCase()}</JourneyFieldLabel>
            <FieldWrapper>
              <InputWithIcon
                id={`${stepKey}-time`}
                type="text"
                placeholder="Digite o horário (HH:MM)"
                value={hora}
                readOnly
                required
                disabled={!selectedGarage}
                onClick={() => {
                  if (selectedGarage) {
                    setClockOpen((value) => !value);
                    setCalOpen(false);
                  }
                }}
              />
              <IconBtn>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <polyline points="12 7 12 12 15 15" />
                </svg>
              </IconBtn>

              {clockOpen && selectedGarage && (
                <>
                  <PopupOverlay onClick={() => setClockOpen(false)} />
                  <Popup>
                    <ClockDisplay>
                      <ClockPart active={clockMode === "hour"} onClick={() => setClockMode("hour")}>
                        {String(clockH).padStart(2, "0")}
                      </ClockPart>
                      <span style={{ color: "#aec5e7" }}>:</span>
                      <ClockPart active={clockMode === "minute"} onClick={() => setClockMode("minute")}>
                        {String(clockM).padStart(2, "0")}
                      </ClockPart>
                      <span style={{ fontSize: "1.2rem", marginLeft: "8px", color: "#aec5e7" }}>
                        {amPm}
                      </span>
                    </ClockDisplay>

                    <AmPmBtns>
                      <AmPmBtn type="button" active={amPm === "AM"} onClick={() => setAmPm("AM")}>AM (Manhã)</AmPmBtn>
                      <AmPmBtn type="button" active={amPm === "PM"} onClick={() => setAmPm("PM")}>PM (Tarde)</AmPmBtn>
                    </AmPmBtns>

                    <ModeBtns>
                      <ModeBtn type="button" active={clockMode === "hour"} onClick={() => setClockMode("hour")}>Horas</ModeBtn>
                      <ModeBtn type="button" active={clockMode === "minute"} onClick={() => setClockMode("minute")}>Minutos</ModeBtn>
                    </ModeBtns>

                    <ClockFaceWrap>
                      <FaceSvg width="200" height="200" viewBox="0 0 200 200" onClick={handleFaceClick}>
                        <circle cx={CX} cy={CY} r="95" fill="#f0f8ff" stroke="#aec5e7" strokeWidth="2" />
                        <line x1={CX} y1={CY} x2={hEnd.x} y2={hEnd.y} stroke="#003366" strokeWidth="4" strokeLinecap="round" />
                        <line x1={CX} y1={CY} x2={mEnd.x} y2={mEnd.y} stroke="#2b5ba8" strokeWidth="3" strokeLinecap="round" />
                        <circle cx={CX} cy={CY} r="5" fill="#003366" />

                        {numbers.map((number, index) => (
                          <g
                            key={index}
                            onClick={(event) => {
                              event.stopPropagation();
                              if (clockMode === "hour") {
                                setClockH(number.val);
                                setTimeout(() => setClockMode("minute"), 200);
                              } else {
                                setClockM(number.val);
                              }
                            }}
                          >
                            <circle cx={number.x} cy={number.y} r="13" fill={number.sel ? "#003366" : "transparent"} />
                            <text
                              x={number.x}
                              y={number.y}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fontSize="11"
                              fontWeight="700"
                              fontFamily="inherit"
                              fill={number.sel ? "#fff" : "#003366"}
                              style={{ cursor: "pointer", userSelect: "none" }}
                            >
                              {number.label}
                            </text>
                          </g>
                        ))}
                      </FaceSvg>
                    </ClockFaceWrap>

                    <ConfirmBtn type="button" onClick={confirmTime}>Confirmar horário</ConfirmBtn>
                  </Popup>
                </>
              )}
            </FieldWrapper>
          </JourneyFieldGroup>
        </JourneyFieldsGrid>

        <button type="submit" className="carro-button" disabled={!canContinue} style={{ marginTop: "1rem" }}>
          {nextButtonLabel}
        </button>
      </StyledForm>
      </div>

      <BottomNav />
    </main>
  );
}
