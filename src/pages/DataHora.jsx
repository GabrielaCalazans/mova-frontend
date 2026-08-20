import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import movaLogo from "../assets/mova_logo.png";
import AuthenticatedLayout from "../layout/AuthenticatedLayout";
import {
    LogoContainer,
    Title,
    Subtitle,
    StyledForm,
    PrimaryButton,
    FieldWrapper,
    InputWithIcon,
    IconBtn,
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

export default function EscolhaDataHora() {
    const navigate = useNavigate();

    const [data, setData] = useState('');
    const [hora, setHora] = useState('');

    const [amPm, setAmPm] = useState('AM');

    // ── Calendário ──────────────────────────────────────
    const [calOpen, setCalOpen] = useState(false);
    const [calDate, setCalDate] = useState(new Date());
    const [selDate, setSelDate] = useState(null);
    const calRef = useRef(null);

    // ── Relógio ──────────────────────────────────────────
    const [clockOpen, setClockOpen] = useState(false);
    const [clockMode, setClockMode] = useState('hour');
    const [clockH, setClockH] = useState(0);
    const [clockM, setClockM] = useState(0);
    const clockRef = useRef(null);

    useEffect(() => {
        document.title = "MOVA - Data e Horário";
    }, []);

    // ════════════════════════════════════════════════════
    //  CALENDÁRIO
    // ════════════════════════════════════════════════════
    const MONTHS = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const prevMonth = () => setCalDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    const nextMonth = () => setCalDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

    const buildDays = () => {
        const y = calDate.getFullYear();
        const m = calDate.getMonth();
        const firstDay = new Date(y, m, 1).getDay();
        const total = new Date(y, m + 1, 0).getDate();
        const today = new Date();
        const cells = [];

        for (let i = 0; i < firstDay; i++) {
            cells.push({ empty: true, key: `e${i}` });
        }

        for (let d = 1; d <= total; d++) {
            const thisD = new Date(y, m, d);
            const past = thisD < new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const isTod = today.getDate() === d && today.getMonth() === m && today.getFullYear() === y;
            const isSel = selDate &&
                selDate.getDate() === d &&
                selDate.getMonth() === m &&
                selDate.getFullYear() === y;

            cells.push({ day: d, disabled: past, today: isTod, selected: isSel, key: `d${d}` });
        }
        return cells;
    };

    const pickDay = (d) => {
        const y = calDate.getFullYear();
        const m = calDate.getMonth();
        const picked = new Date(y, m, d);
        setSelDate(picked);
        setData(`${String(d).padStart(2, '0')}/${String(m + 1).padStart(2, '0')}/${y}`);
        setCalOpen(false);
    };

    // ════════════════════════════════════════════════════
    //  RELÓGIO
    // ════════════════════════════════════════════════════
    const RADIUS = 78;
    const CX = 100, CY = 100;

    const angleFor = (val, total) => ((val / total) * 360 - 90) * (Math.PI / 180);

    const buildNumbers = () => {
        if (clockMode === 'hour') {
            return Array.from({ length: 12 }, (_, i) => {
                const label = i === 0 ? 12 : i;
                const ang = angleFor(i, 12);
                const x = CX + RADIUS * Math.cos(ang);
                const y = CY + RADIUS * Math.sin(ang);
                const sel = clockH % 12 === label % 12;
                return { label, x, y, sel, val: label === 12 ? 0 : label };
            });
        } else {
            return Array.from({ length: 12 }, (_, i) => {
                const label = i * 5;
                const ang = angleFor(i, 12);
                const x = CX + RADIUS * Math.cos(ang);
                const y = CY + RADIUS * Math.sin(ang);
                const sel = clockM === label;
                return { label: String(label).padStart(2, '0'), x, y, sel, val: label };
            });
        }
    };

    const hourAngle = ((clockH % 12) / 12) * 360 + (clockM / 60) * 30 - 90;
    const minAngle = (clockM / 60) * 360 - 90;

    const handEnd = (angle, len) => ({
        x: CX + len * Math.cos(angle * Math.PI / 180),
        y: CY + len * Math.sin(angle * Math.PI / 180),
    });

    const hEnd = handEnd(hourAngle, 55);
    const mEnd = handEnd(minAngle, 70);

    const handleFaceClick = (e) => {
        const svg = e.currentTarget;
        const rect = svg.getBoundingClientRect();
        const scaleX = 200 / rect.width;
        const scaleY = 200 / rect.height;
        const vx = (e.clientX - rect.left) * scaleX - CX;
        const vy = (e.clientY - rect.top) * scaleY - CY;

        let angle = Math.atan2(vy, vx) * 180 / Math.PI + 90;
        if (angle < 0) angle += 360;

        if (clockMode === 'hour') {
            const h = Math.round(angle / 30) % 12;
            setClockH(h);
            setTimeout(() => setClockMode('minute'), 200);
        } else {
            const m = Math.round(angle / 6) % 60;
            setClockM(m < 0 ? m + 60 : m);
        }
    };

    const confirmTime = () => {
        let h = clockH;
        if (amPm === 'PM' && h !== 12) h += 12;
        if (amPm === 'AM' && h === 12) h = 0;
        setHora(`${String(h).padStart(2, '0')}:${String(clockM).padStart(2, '0')}`);
        setClockOpen(false);
    };

    // ════════════════════════════════════════════════════
    //  SUBMIT
    // ════════════════════════════════════════════════════
    const handleSubmit = (e) => {
        e.preventDefault();
        if (data && hora) navigate('/pagamento');
    };

    const days = buildDays();
    const nums = buildNumbers();

    // ════════════════════════════════════════════════════
    //  RENDER
    // ════════════════════════════════════════════════════
    return (
        <AuthenticatedLayout>

            <LogoContainer>
                <img src={movaLogo} alt="Mova Logo" />
            </LogoContainer>

            <Title>Escolha Data e Horário</Title>
            <Subtitle>Selecione a data e o horário para retirada do veículo</Subtitle>

            <StyledForm onSubmit={handleSubmit}>

                {/* ══ CAMPO DATA ══════════════════════════════════ */}
                <FieldWrapper ref={calRef}>
                    <InputWithIcon
                        type="text"
                        placeholder="Digite a data (DD/MM/AAAA)"
                        value={data}
                        readOnly
                        required
                        onClick={() => { setCalOpen(v => !v); setClockOpen(false); }}
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

                    {calOpen && (
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
                                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                                        <span key={i}>{d}</span>
                                    ))}
                                </DayNames>

                                <DayGrid>
                                    {days.map(cell =>
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
                                    )}
                                </DayGrid>
                            </Popup>
                        </>
                    )}
                </FieldWrapper>

                {/* ══ CAMPO HORA ═══════════════════════════════════ */}
                <FieldWrapper ref={clockRef}>
                    <InputWithIcon
                        type="text"
                        placeholder="Digite o horário (HH:MM)"
                        value={hora}
                        readOnly
                        required
                        onClick={() => { setClockOpen(v => !v); setCalOpen(false); }}
                    />
                    <IconBtn>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2"
                            strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="9" />
                            <polyline points="12 7 12 12 15 15" />
                        </svg>
                    </IconBtn>

                    {clockOpen && (
                        <>
                            <PopupOverlay onClick={() => setClockOpen(false)} />
                            <Popup>
                                {/* Display digital */}
                                <ClockDisplay>
                                    <ClockPart
                                        active={clockMode === 'hour'}
                                        onClick={() => setClockMode('hour')}
                                    >
                                        {String(clockH).padStart(2, '0')}
                                    </ClockPart>
                                    <span style={{ color: '#aec5e7' }}>:</span>
                                    <ClockPart
                                        active={clockMode === 'minute'}
                                        onClick={() => setClockMode('minute')}
                                    >
                                        {String(clockM).padStart(2, '0')}
                                    </ClockPart>
                                    {/* AM/PM ao lado do horário */}
                                    <span style={{ fontSize: '1.2rem', marginLeft: '8px', color: '#aec5e7' }}>
                                        {amPm}
                                    </span>
                                </ClockDisplay>

                                {/* Seletor AM/PM */}
                                <AmPmBtns>
                                    <AmPmBtn
                                        type="button"
                                        active={amPm === 'AM'}
                                        onClick={() => setAmPm('AM')}
                                    >
                                        AM (Manhã)
                                    </AmPmBtn>
                                    <AmPmBtn
                                        type="button"
                                        active={amPm === 'PM'}
                                        onClick={() => setAmPm('PM')}
                                    >
                                        PM (Tarde)
                                    </AmPmBtn>
                                </AmPmBtns>

                                {/* Botões de modo */}
                                <ModeBtns>
                                    <ModeBtn
                                        type="button"
                                        active={clockMode === 'hour'}
                                        onClick={() => setClockMode('hour')}
                                    >
                                        Horas
                                    </ModeBtn>
                                    <ModeBtn
                                        type="button"
                                        active={clockMode === 'minute'}
                                        onClick={() => setClockMode('minute')}
                                    >
                                        Minutos
                                    </ModeBtn>
                                </ModeBtns>

                                {/* Mostrador analógico */}
                                <ClockFaceWrap>
                                    <FaceSvg
                                        width="200" height="200"
                                        viewBox="0 0 200 200"
                                        onClick={handleFaceClick}
                                    >
                                        <circle cx={CX} cy={CY} r="95"
                                            fill="#f0f8ff" stroke="#aec5e7" strokeWidth="2" />
                                        <line x1={CX} y1={CY} x2={hEnd.x} y2={hEnd.y}
                                            stroke="#003366" strokeWidth="4" strokeLinecap="round" />
                                        <line x1={CX} y1={CY} x2={mEnd.x} y2={mEnd.y}
                                            stroke="#2b5ba8" strokeWidth="3" strokeLinecap="round" />
                                        <circle cx={CX} cy={CY} r="5" fill="#003366" />

                                        {nums.map((n, i) => (
                                            <g key={i} onClick={(e) => {
                                                e.stopPropagation();
                                                if (clockMode === 'hour') {
                                                    setClockH(n.val);
                                                    setTimeout(() => setClockMode('minute'), 200);
                                                } else {
                                                    setClockM(n.val);
                                                }
                                            }}>
                                                <circle cx={n.x} cy={n.y} r="13"
                                                    fill={n.sel ? '#003366' : 'transparent'} />
                                                <text
                                                    x={n.x} y={n.y}
                                                    textAnchor="middle"
                                                    dominantBaseline="central"
                                                    fontSize="11"
                                                    fontWeight="700"
                                                    fontFamily="inherit"
                                                    fill={n.sel ? '#fff' : '#003366'}
                                                    style={{ cursor: 'pointer', userSelect: 'none' }}
                                                >
                                                    {n.label}
                                                </text>
                                            </g>
                                        ))}
                                    </FaceSvg>
                                </ClockFaceWrap>

                                <ConfirmBtn type="button" onClick={confirmTime}>
                                    Confirmar horário
                                </ConfirmBtn>
                            </Popup>
                        </>
                    )}
                </FieldWrapper>

                <PrimaryButton type="submit" style={{ marginTop: '1rem' }}>
                    Ir para pagamento
                </PrimaryButton>

            </StyledForm>
        </AuthenticatedLayout>
    );
}