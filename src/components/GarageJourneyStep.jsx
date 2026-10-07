import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot } from "@fortawesome/free-solid-svg-icons";
import BottomNav from "../components/BottomNav";
import JourneySteps from "./reservation/JourneySteps";
import VehicleMedia from "./vehicle/VehicleMedia";
import "../styles/vehicle.css";
import "../styles/journey.css";
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
import { parseJourneyDateTime, validarPeriodoReserva } from "../utils/reservationMath";
import { getGaragemById, listGaragens } from "../services/garagemService";
import { formatDate, t } from "../i18n";

function descreverCapacidade(garagem) {
  if (typeof garagem.capacidade !== "number") return "";
  const alocados = garagem.veiculosAlocados ?? 0;
  const livres = Math.max(garagem.capacidade - alocados, 0);
  return t("journey.garage.capacity", { free: livres, total: garagem.capacidade });
}

// Mês e dias da semana no idioma ativo (Intl), nunca listas fixas em pt-BR.
function monthTitle(date) {
  const month = formatDate(date, { month: "long" });
  return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${date.getFullYear()}`;
}

// 04/01/2026 é domingo: a grade começa no domingo.
function weekdayInitials() {
  return Array.from({ length: 7 }, (_, index) => formatDate(new Date(2026, 0, 4 + index), { weekday: "narrow" }));
}

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

function abrirSeletor(event, abrir) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  abrir();
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

  const storedStep = useMemo(() => getJourneyStep(stepKey), [stepKey]);

  const veiculoSelecionado = useMemo(() => getJourneyStep("veiculo"), []);
  const garagemDoVeiculo = veiculoSelecionado?.garagemId || "";
  const veiculoId = veiculoSelecionado?.id || "";
  const retiradaFixa = stepKey === "retirada";

  const [garagens, setGaragens] = useState([]);
  const [carregandoGaragens, setCarregandoGaragens] = useState(true);
  const [erroGaragens, setErroGaragens] = useState("");
  const [selectedGarageId, setSelectedGarageId] = useState(
    retiradaFixa
      ? garagemDoVeiculo
      : storedStep.garageId
        ? String(storedStep.garageId)
        : "",
  );
  const [data, setData] = useState(storedStep.date || "");
  const [hora, setHora] = useState(storedStep.time || "");

  const parsedDate = parseDateDisplay(storedStep.date);
  const parsedTime = normalizeTime(storedStep.time);

  const [amPm, setAmPm] = useState(parsedTime.amPm);
  const [calOpen, setCalOpen] = useState(false);
  const dateInputRef = useRef(null);
  const [calDate, setCalDate] = useState(parsedDate || new Date());
  const [selDate, setSelDate] = useState(parsedDate);
  const [clockOpen, setClockOpen] = useState(false);
  const [clockMode, setClockMode] = useState("hour");
  const [clockH, setClockH] = useState(parsedTime.clockH);
  const [clockM, setClockM] = useState(parsedTime.clockM);
  useEffect(() => {
    let ativo = true;

    // Retirada: uma única garagem — a do veículo. Devolução: as do locador dono.
    const consulta = retiradaFixa
      ? garagemDoVeiculo
        ? getGaragemById(garagemDoVeiculo).then((g) => (g ? [g] : []))
        : Promise.resolve([])
      : listGaragens(veiculoId ? { veiculoId } : {});

    consulta
      .then((lista) => {
        if (!ativo) return;
        setGaragens(lista);
        setErroGaragens("");
      })
      .catch((e) => {
        if (!ativo) return;
        setGaragens([]);
        setErroGaragens(e?.message || t("journey.garage.loadError"));
      })
      .finally(() => {
        if (ativo) setCarregandoGaragens(false);
      });

    return () => {
      ativo = false;
    };
  }, [retiradaFixa, garagemDoVeiculo, veiculoId]);

  const selectedGarage =
    garagens.find((garage) => String(garage.id) === selectedGarageId) ?? null;

  useEffect(() => {
    document.title = documentTitle;
  }, [documentTitle]);

  useEffect(() => {
    updateJourneyStep(stepKey, {
      garageId: selectedGarageId,
      garageName: selectedGarage?.nome ?? "",
      garageAddress: selectedGarage?.endereco ?? "",
      garageInfo: selectedGarage ? descreverCapacidade(selectedGarage) : "",
      date: data,
      time: hora,
    });
  }, [data, hora, selectedGarage, selectedGarageId, stepKey]);

  const visibleGarages = selectedGarage ? [selectedGarage] : garagens;
  const etapaLiberada = retiradaFixa
    ? !carregandoGaragens && !erroGaragens && garagens.length > 0
    : Boolean(selectedGarage);

  const erroPeriodo = useMemo(() => {
    if (!data || !hora) return "";

    const instante = parseJourneyDateTime({ date: data, time: hora });
    if (retiradaFixa) {
      return validarPeriodoReserva(instante, null) ?? "";
    }

    const retiradaSalva = getJourneyStep("retirada");
    const inicio = parseJourneyDateTime({
      date: retiradaSalva.date,
      time: retiradaSalva.time,
    });
    return validarPeriodoReserva(inicio, instante) ?? "";
  }, [data, hora, retiradaFixa]);

  const canContinue = Boolean(etapaLiberada && data && hora && !erroPeriodo);

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
    fecharCalendario();
  };

  // Fecha o popup e devolve o foco ao campo que o abriu.
  function fecharCalendario() {
    setCalOpen(false);
    dateInputRef.current?.focus();
  }

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

  if (!veiculoSelecionado?.id) {
    return <Navigate to="/carros" replace />;
  }

  const days = buildDays();
  const numbers = buildNumbers();

  return (
    <main className="journey-page">
      <JourneySteps current={stepKey} />
      <header className="journey-head">
        <h1>{title}</h1>
        <p className="page-head__lede">
          {retiradaFixa
            ? t("journey.garage.pickupLede")
            : selectedGarage
              ? t("journey.garage.selectedLede")
              : subtitle}
        </p>
      </header>

      <div className="vehicle-strip">
        <VehicleMedia vehicle={veiculoSelecionado} />
        <div>
          <p className="vehicle-strip__label">{t("journey.garage.reserving")}</p>
          <p className="vehicle-strip__name">{[veiculoSelecionado.marca, veiculoSelecionado.modelo].filter(Boolean).join(" ") || veiculoSelecionado.nome || t("journey.garage.selectedVehicle")}</p>
        </div>
      </div>

      <StyledForm
        className="journey-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (canContinue) {
            navigate(nextPath);
          }
        }}
      >
        <section className="journey-section" aria-labelledby={`${stepKey}-garagem-title`}>
          <h2 id={`${stepKey}-garagem-title`}>{t(`journey.garage.garageTitle.${stepKey}`)}</h2>

          {!selectedGarage && carregandoGaragens && (
            <p className="loading-state" role="status"><span className="spinner" aria-hidden="true" />{t("journey.garage.loading")}</p>
          )}

          {!selectedGarage && !carregandoGaragens && erroGaragens && (
            <p className="alert alert--danger" role="status">{erroGaragens}</p>
          )}

          {!selectedGarage && !carregandoGaragens && !erroGaragens && garagens.length === 0 && (
            <p className="alert alert--warning" role="status">
              {retiradaFixa
                ? t("journey.garage.noPickupGarage")
                : t("journey.garage.noReturnGarage")}
            </p>
          )}

          {!selectedGarage && !carregandoGaragens && !erroGaragens && garagens.length > 0 && (
            <ul className="garage-options">
              {visibleGarages.map((garage) => (
                <li key={garage.id}>
                  <button
                    type="button"
                    className="garage-option"
                    onClick={() => setSelectedGarageId(String(garage.id))}
                    aria-pressed={String(garage.id) === selectedGarageId}
                  >
                    <span className="garage-option__icon"><FontAwesomeIcon icon={faLocationDot} aria-hidden="true" /></span>
                    <span>
                      <span className="garage-option__name">{garage.nome}</span>
                      <span className="garage-option__address">{t("journey.garage.address", { address: garage.endereco })}</span>
                      {descreverCapacidade(garage) && <span className="garage-option__info">{descreverCapacidade(garage)}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {selectedGarage && (
            <>
              <div className="garage-option garage-option--selected">
                <span className="garage-option__icon"><FontAwesomeIcon icon={faLocationDot} aria-hidden="true" /></span>
                <span>
                  <span className="garage-option__name">{selectedGarage.nome}</span>
                  <span className="garage-option__address">{t("journey.garage.address", { address: selectedGarage.endereco })}</span>
                  {descreverCapacidade(selectedGarage) && <span className="garage-option__info">{descreverCapacidade(selectedGarage)}</span>}
                </span>
              </div>

              {!retiradaFixa && (
                <button type="button" className="btn btn--quiet journey-edit" onClick={() => setSelectedGarageId("")}>
                  {t("journey.garage.changeGarage")}
                </button>
              )}
            </>
          )}
        </section>

        <section className="journey-section" aria-labelledby={`${stepKey}-quando-title`}>
        <h2 id={`${stepKey}-quando-title`}>{t("journey.garage.dateTime")}</h2>
        <JourneyFieldsGrid className="datetime-grid">
          <JourneyFieldGroup>
            <JourneyFieldLabel htmlFor={`${stepKey}-date`}>{t(`journey.garage.dateLabel.${stepKey}`)}</JourneyFieldLabel>
            <FieldWrapper>
              <InputWithIcon
                id={`${stepKey}-date`}
                ref={dateInputRef}
                type="text"
                placeholder={t("journey.garage.datePlaceholder")}
                value={data}
                required
                disabled={!etapaLiberada}
                inputMode="numeric"
                aria-describedby={`${stepKey}-date-help`}
                onChange={(event) => setData(event.target.value.replace(/[^\d/]/g, "").slice(0, 10))}
                onKeyDown={(event) => event.key === "Escape" ? setCalOpen(false) : abrirSeletor(event, () => {
                  if (etapaLiberada) {
                    setCalOpen(true);
                    setClockOpen(false);
                  }
                })}
                onClick={() => {
                  if (etapaLiberada) {
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

              <span id={`${stepKey}-date-help`} className="sr-only">{t("journey.garage.dateHelp")}</span>

              {calOpen && etapaLiberada && (
                <>
                  <PopupOverlay onClick={() => setCalOpen(false)} />
                  <Popup
                    onKeyDown={(event) => {
                      if (event.key !== "Escape") return;
                      event.preventDefault();
                      fecharCalendario();
                    }}
                  >
                    <CalHeader>
                      <NavBtn type="button" onClick={prevMonth} aria-label={t("journey.garage.prevMonth")}>‹</NavBtn>
                      <CalTitle>
                        {monthTitle(calDate)}
                      </CalTitle>
                      <NavBtn type="button" onClick={nextMonth} aria-label={t("journey.garage.nextMonth")}>›</NavBtn>
                    </CalHeader>

                    <DayNames>
                      {weekdayInitials().map((day, index) => (
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
                            aria-label={formatDate(new Date(calDate.getFullYear(), calDate.getMonth(), cell.day), { dateStyle: "long" })}
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
            <JourneyFieldLabel htmlFor={`${stepKey}-time`}>{t(`journey.garage.timeLabel.${stepKey}`)}</JourneyFieldLabel>
            <FieldWrapper>
              <InputWithIcon
                id={`${stepKey}-time`}
                type="text"
                placeholder={t("journey.garage.timePlaceholder")}
                value={hora}
                required
                disabled={!etapaLiberada}
                inputMode="numeric"
                aria-describedby={`${stepKey}-time-help`}
                onChange={(event) => setHora(event.target.value.replace(/[^\d:]/g, "").slice(0, 5))}
                onKeyDown={(event) => abrirSeletor(event, () => {
                  if (etapaLiberada) {
                    setClockOpen(true);
                    setCalOpen(false);
                  }
                })}
                onClick={() => {
                  if (etapaLiberada) {
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

              <span id={`${stepKey}-time-help`} className="sr-only">{t("journey.garage.timeHelp")}</span>

              {clockOpen && etapaLiberada && (
                <>
                  <PopupOverlay onClick={() => setClockOpen(false)} />
                  <Popup>
                    <ClockDisplay>
                      <ClockPart as="button" type="button" active={clockMode === "hour"} onClick={() => setClockMode("hour")}>
                        {String(clockH).padStart(2, "0")}
                      </ClockPart>
                      <span className="clock-face__sep">:</span>
                      <ClockPart as="button" type="button" active={clockMode === "minute"} onClick={() => setClockMode("minute")}>
                        {String(clockM).padStart(2, "0")}
                      </ClockPart>
                      <span className="clock-face__sep" style={{ fontSize: "1.2rem", marginLeft: "8px" }}>
                        {amPm}
                      </span>
                    </ClockDisplay>

                    <AmPmBtns>
                      <AmPmBtn type="button" active={amPm === "AM"} onClick={() => setAmPm("AM")}>{t("journey.garage.am")}</AmPmBtn>
                      <AmPmBtn type="button" active={amPm === "PM"} onClick={() => setAmPm("PM")}>{t("journey.garage.pm")}</AmPmBtn>
                    </AmPmBtns>

                    <ModeBtns>
                      <ModeBtn type="button" active={clockMode === "hour"} onClick={() => setClockMode("hour")}>{t("journey.garage.hours")}</ModeBtn>
                      <ModeBtn type="button" active={clockMode === "minute"} onClick={() => setClockMode("minute")}>{t("journey.garage.minutes")}</ModeBtn>
                    </ModeBtns>

                    <ClockFaceWrap>
                      <FaceSvg width="200" height="200" viewBox="0 0 200 200" role="application" aria-label={clockMode === "hour" ? t("journey.garage.clockHour") : t("journey.garage.clockMinute")} onClick={handleFaceClick}>
                        <circle className="clock-face__dial" cx={CX} cy={CY} r="95" strokeWidth="2" />
                        <line className="clock-face__hour" x1={CX} y1={CY} x2={hEnd.x} y2={hEnd.y} strokeWidth="4" strokeLinecap="round" />
                        <line className="clock-face__minute" x1={CX} y1={CY} x2={mEnd.x} y2={mEnd.y} strokeWidth="3" strokeLinecap="round" />
                        <circle className="clock-face__pin" cx={CX} cy={CY} r="5" />

                        {numbers.map((number, index) => (
                          <g
                            key={index}
                            tabIndex="0"
                            role="button"
                            aria-label={t(clockMode === "hour" ? "journey.garage.hourMark" : "journey.garage.minuteMark", { n: number.label })}
                            onKeyDown={(event) => {
                              if (event.key !== "Enter" && event.key !== " ") return;
                              event.preventDefault();
                              if (clockMode === "hour") {
                                setClockH(number.val);
                                setTimeout(() => setClockMode("minute"), 200);
                              } else {
                                setClockM(number.val);
                              }
                            }}
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
                            <circle className={`clock-face__mark${number.sel ? " clock-face__mark--selected" : ""}`} cx={number.x} cy={number.y} r="13" />
                            <text
                              className={`clock-face__num${number.sel ? " clock-face__num--selected" : ""}`}
                              x={number.x}
                              y={number.y}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fontSize="11"
                              fontWeight="700"
                              fontFamily="inherit"
                              style={{ cursor: "pointer", userSelect: "none" }}
                            >
                              {number.label}
                            </text>
                          </g>
                        ))}
                      </FaceSvg>
                    </ClockFaceWrap>

                    <ConfirmBtn type="button" onClick={confirmTime}>{t("journey.garage.confirmTime")}</ConfirmBtn>
                  </Popup>
                </>
              )}
            </FieldWrapper>
          </JourneyFieldGroup>
        </JourneyFieldsGrid>

          {erroPeriodo && (
            <p className="alert alert--danger" role="status">
              {erroPeriodo}
            </p>
          )}
        </section>

        <div className="journey-footer">
          <button type="submit" className="btn btn--lg" disabled={!canContinue}>
            {nextButtonLabel}
          </button>
        </div>
      </StyledForm>

      <BottomNav />
    </main>
  );
}
