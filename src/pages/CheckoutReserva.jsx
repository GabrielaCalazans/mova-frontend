import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightToBracket, faArrowRightFromBracket, faCalendarDay } from "@fortawesome/free-solid-svg-icons";
import JourneySteps from "../components/reservation/JourneySteps";
import VehicleMedia from "../components/vehicle/VehicleMedia";
import { getJourneyStep, updateJourneyStep } from "../utils/journeyStorage";
import { formatCambio, formatCategoria } from "../utils/vehicleDisplay";
import {
  parseJourneyDateTime,
  validarPeriodoReserva,
} from "../utils/reservationMath";
import { formatCurrency, t } from "../i18n";
import { getVeiculoById } from "../services/veiculoService";
import { getReservationPricing } from "../services/reservationPricing";
import { createReserva } from "../services/reservaService";
import { getAuthSession, saveAuthSession } from "../services/authSession";
import { listDeficiencias } from "../services/deficienciaService";
import "../styles/vehicle.css";
import "../styles/journey.css";

function resolveModeloVeiculo(vehicle) {
  return vehicle?.modeloVeiculo ?? {};
}

function resolveVehicleField(vehicle, fallbackVehicle, field) {
  const modeloVeiculo = resolveModeloVeiculo(vehicle);
  return (
    vehicle?.[field] ??
    modeloVeiculo?.[field] ??
    fallbackVehicle?.[field] ??
    t("journey.checkout.notInformed")
  );
}

function resolveVehicleName(vehicle) {
  return (
    vehicle?.nome ||
    [vehicle?.modeloVeiculo?.marca, vehicle?.modeloVeiculo?.modelo]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    [vehicle?.marca, vehicle?.modelo].filter(Boolean).join(" ").trim() ||
    vehicle?.modelo ||
    t("journey.checkout.selectedVehicle")
  );
}

function yesNo(value) {
  if (value === undefined || value === null || value === "") return t("journey.checkout.notInformed");
  return value ? t("journey.checkout.yes") : t("journey.checkout.no");
}

function Leg({ icon, label, garage, address, date, time }) {
  return (
    <li className="itinerary__leg">
      <span className="itinerary__icon"><FontAwesomeIcon icon={icon} aria-hidden="true" /></span>
      <div className="itinerary__body">
        <p className="itinerary__label">{label}</p>
        <p className="itinerary__garage">{garage || t("journey.checkout.garageMissing")}</p>
        {address && address !== garage ? <p className="itinerary__address">{address}</p> : null}
        <p className="itinerary__when">
          <FontAwesomeIcon icon={faCalendarDay} aria-hidden="true" />
          <span className="tabular">{date || t("journey.checkout.dateMissing")}</span>
          <span aria-hidden="true">·</span>
          <span className="tabular">{time || t("journey.checkout.timeMissing")}</span>
        </p>
      </div>
    </li>
  );
}

export default function CheckoutReserva() {
  const navigate = useNavigate();
  const [journey] = useState(() => ({
    veiculo: getJourneyStep("veiculo"),
    retirada: getJourneyStep("retirada"),
    devolucao: getJourneyStep("devolucao"),
    servicos: getJourneyStep("servicos"),
  }));
  const [dateTimes] = useState(() => ({
    pickup: parseJourneyDateTime(journey.retirada),
    dropoff: parseJourneyDateTime(journey.devolucao),
  }));

  const { veiculo: veiculoSalvo, retirada, devolucao, servicos } = journey;
  const { pickup: pickupDateTime, dropoff: dropoffDateTime } = dateTimes;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [vehicle, setVehicle] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [confirmando, setConfirmando] = useState(false);
  const [confirmError, setConfirmError] = useState("");
  // RN01: deficiência pode ser declarada no cadastro OU na reserva.
  const [deficiencias, setDeficiencias] = useState([]);
  const [deficienciaDeclarada, setDeficienciaDeclarada] = useState("");
  const deficienciaPerfil = getAuthSession()?.user?.deficienciaId;
  const exigeDeclaracao = Boolean(
    vehicle &&
      ((vehicle.adaptado ?? veiculoSalvo?.adaptado) ||
        resolveVehicleField(vehicle, veiculoSalvo, "categoria") === "PCD") &&
      !deficienciaPerfil,
  );

  useEffect(() => {
    if (!exigeDeclaracao) return;
    let active = true;
    listDeficiencias().then((lista) => {
      if (active) setDeficiencias(lista);
    });
    return () => {
      active = false;
    };
  }, [exigeDeclaracao]);

  async function handleConfirmar() {
    setConfirmError("");

    const idLocatario = getAuthSession()?.user?.id;
    if (!idLocatario) {
      setConfirmError(t("journey.checkout.invalidSession"));
      return;
    }
    if (!veiculoSalvo?.id) {
      setConfirmError(t("journey.checkout.selectVehicle"));
      return;
    }
    const erroPeriodo = validarPeriodoReserva(pickupDateTime, dropoffDateTime);
    if (erroPeriodo) {
      setConfirmError(erroPeriodo);
      return;
    }
    if (!devolucao?.garageId) {
      setConfirmError(t("journey.checkout.selectReturnGarage"));
      return;
    }
    if (exigeDeclaracao && !deficienciaDeclarada) {
      setConfirmError(t("journey.checkout.pcdRequired"));
      document.getElementById("checkout-deficiencia")?.focus();
      return;
    }

    setConfirmando(true);
    try {
      const sessionUser = getAuthSession()?.user;
      const servicosIds = servicos?.ids ?? [];

      const reserva = await createReserva({
        idVeiculo: veiculoSalvo.id,
        idLocatario,
        dataHoraInicio: pickupDateTime.toISOString(),
        dataHoraFim: dropoffDateTime.toISOString(),
        // Garagens reais escolhidas na jornada (UUIDs vindos de GET /api/garagem).
        ...(retirada?.garageId ? { idGaragemRetirada: retirada.garageId } : {}),
        ...(devolucao?.garageId ? { idGaragemDevolucao: devolucao.garageId } : {}),
        ...(sessionUser?.deficienciaId || deficienciaDeclarada
          ? { deficienciaId: sessionUser?.deficienciaId || deficienciaDeclarada }
          : {}),
        ...(servicosIds.length > 0 ? { servicosIds } : {}),
      });

      // O backend associa a deficiência declarada ao perfil na mesma transação.
      if (deficienciaDeclarada && sessionUser) {
        saveAuthSession({ ...getAuthSession(), user: { ...sessionUser, deficienciaId: deficienciaDeclarada } });
      }

      updateJourneyStep("reserva", {
        id: reserva.id,
        valorTotal: reserva.valorTotal,
        codigoDesbloqueio: reserva.codigoDesbloqueio || "",
      });
      navigate("/condutores-adicionais");
    } catch (caughtError) {
      setConfirmError(caughtError?.message || t("journey.checkout.confirmError"));
    } finally {
      setConfirmando(false);
    }
  }

  useEffect(() => {
    document.title = t("journey.checkout.documentTitle");
  }, []);

  useEffect(() => {
    let active = true;

    async function loadCheckoutData() {
      setLoading(true);
      setError("");

      try {
        if (!veiculoSalvo?.id) {
          throw new Error(t("journey.checkout.selectVehicle"));
        }

        const sessionUser = getAuthSession()?.user;
        if (!sessionUser?.id) throw new Error(t("journey.checkout.invalidSession"));
        if (!pickupDateTime) throw new Error(t("validation.period.pickupRequired"));
        if (!dropoffDateTime) throw new Error(t("validation.period.returnRequired"));
        const [vehicleDetails, pricingDetails] = await Promise.all([
          getVeiculoById(veiculoSalvo.id),
          getReservationPricing({
            idVeiculo: veiculoSalvo.id,
            idLocatario: sessionUser.id,
            dataHoraInicio: pickupDateTime.toISOString(),
            dataHoraFim: dropoffDateTime.toISOString(),
            ...(retirada?.garageId ? { idGaragemRetirada: retirada.garageId } : {}),
            ...(devolucao?.garageId ? { idGaragemDevolucao: devolucao.garageId } : {}),
            ...(sessionUser.deficienciaId ? { deficienciaId: sessionUser.deficienciaId } : {}),
            ...(servicos?.ids?.length ? { servicosIds: servicos.ids } : {}),
          }),
        ]);

        if (!active) {
          return;
        }

        setVehicle(vehicleDetails);
        setPricing(pricingDetails);
      } catch (caughtError) {
        if (!active) {
          return;
        }

        setError(
          caughtError?.message ||
            t("journey.checkout.loadError"),
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadCheckoutData();

    return () => {
      active = false;
    };
  }, [
    devolucao?.garageId,
    dropoffDateTime,
    pickupDateTime,
    retirada?.garageId,
    servicos?.ids,
    veiculoSalvo,
  ]);

  const head = (
    <>
      <JourneySteps current="resumo" />
      <header className="journey-head">
        <h1>{t("journey.checkout.title")}</h1>
        <p className="page-head__lede">{t("journey.checkout.lede")}</p>
      </header>
    </>
  );

  let content;
  if (loading) {
    content = <p className="loading-state" role="status"><span className="spinner" aria-hidden="true" />{t("journey.checkout.loading")}</p>;
  } else if (error) {
    content = (
      <div className="state-block state-block--error" role="alert">
        <h2 className="state-block__title">{t("journey.checkout.errorTitle")}</h2>
        <p className="state-block__text">{error}</p>
        <div className="journey-actions">
          <button type="button" className="btn btn--secondary" onClick={() => navigate("/escolha-garagem-devolucao")}>
            {t("journey.checkout.backToReturn")}
          </button>
          <button type="button" className="btn" onClick={() => navigate("/carros")}>
            {t("journey.checkout.otherVehicle")}
          </button>
        </div>
      </div>
    );
  } else {
    const vehicleName = resolveVehicleName(vehicle);
    const totalDiarias = pricing?.totalDiarias ?? 1;
    const diariaValue = pricing?.dailyRate ?? 0;
    const servicesValue = pricing?.servicesTotal ?? 0;
    const totalValue = pricing?.total ?? 0;
    const servicosContratados = (servicos?.selecionados ?? []).map((servico) => ({
      ...servico,
      ...(pricing?.servicos?.find((item) => item.idServico === servico.id) ?? {}),
      valor: pricing?.servicos?.find((item) => item.idServico === servico.id)?.valor ?? servico.valor,
    }));
    const vehicleCategory = formatCategoria(resolveVehicleField(vehicle, veiculoSalvo, "categoria"));
    const vehicleTransmission = formatCambio(resolveVehicleField(vehicle, veiculoSalvo, "cambio"));
    const vehicleCapacity = resolveVehicleField(vehicle, veiculoSalvo, "capacidade");
    const vehicleEletrico = vehicle?.eletrico ?? veiculoSalvo?.eletrico;
    const vehicleAdaptado = vehicle?.adaptado ?? veiculoSalvo?.adaptado;
    const placa = vehicle?.placa ?? veiculoSalvo?.placa;

    content = (
      <div className="journey-layout">
        <div className="journey-layout__main">
          <section className="journey-section" aria-labelledby="checkout-veiculo">
            <h2 id="checkout-veiculo">{t("journey.checkout.whatTitle")}</h2>
            <div className="summary-vehicle">
              <VehicleMedia vehicle={vehicle ?? veiculoSalvo} className="summary-vehicle__media" />
              <div className="summary-vehicle__body">
                <p className="summary-vehicle__name">{vehicleName}</p>
                <p className="summary-vehicle__meta">{vehicleCategory}</p>
                <ul className="summary-vehicle__facts">
                  <li>{t("journey.checkout.transmission", { value: vehicleTransmission })}</li>
                  <li>{t("journey.checkout.capacity", { value: vehicleCapacity })}</li>
                  <li>{t("journey.checkout.electric", { value: yesNo(vehicleEletrico) })}</li>
                  <li>{t("journey.checkout.accessibility", { value: yesNo(vehicleAdaptado) })}</li>
                  {placa ? <li>{t("journey.checkout.plate")} <span className="tabular">{placa}</span></li> : null}
                </ul>
              </div>
            </div>
          </section>

          {exigeDeclaracao && (
            <section className="journey-section" aria-labelledby="checkout-pcd">
              <h2 id="checkout-pcd">{t("journey.checkout.accessibilityTitle")}</h2>
              <p className="journey-muted" id="checkout-deficiencia-ajuda">
                {t("journey.checkout.pcdHelp")}
              </p>
              <label className="field__label" htmlFor="checkout-deficiencia">{t("journey.checkout.pcdLabel")}</label>
              <select
                id="checkout-deficiencia"
                className="field__control"
                required
                aria-describedby="checkout-deficiencia-ajuda"
                value={deficienciaDeclarada}
                onChange={(event) => setDeficienciaDeclarada(event.target.value)}
              >
                <option value="">{t("journey.checkout.selectOption")}</option>
                {deficiencias.map((item) => (
                  <option key={item.id} value={item.id}>{item.descricao}</option>
                ))}
              </select>
            </section>
          )}

          <section className="journey-section" aria-labelledby="checkout-quando">
            <h2 id="checkout-quando">{t("journey.checkout.whenWhere")}</h2>
            <ol className="itinerary">
              <Leg icon={faArrowRightFromBracket} label={t("journey.checkout.pickup")} garage={retirada.garageName} address={retirada.garageAddress} date={retirada.date} time={retirada.time} />
              <Leg icon={faArrowRightToBracket} label={t("journey.checkout.return")} garage={devolucao.garageName} address={devolucao.garageAddress} date={devolucao.date} time={devolucao.time} />
            </ol>
            <button type="button" className="btn btn--quiet journey-edit" onClick={() => navigate("/escolha-garagem-devolucao")}>
              {t("journey.checkout.editReturn")}
            </button>
          </section>

          <section className="journey-section" aria-labelledby="checkout-servicos">
            <h2 id="checkout-servicos">{t("journey.checkout.servicesTitle")}</h2>
            {servicosContratados.length > 0 ? (
              <ul className="line-list">
                {servicosContratados.map((servico) => (
                  <li key={servico.id} className="line-list__item">
                    <div>
                      <strong>{servico.nome}</strong>
                      {servico.descricao && <p className="line-list__desc">{servico.descricao}</p>}
                      {servico.detalhesCobertura && (
                        <details className="line-list__details">
                          <summary>{t("journey.checkout.coverage")}</summary>
                          <p>{servico.detalhesCobertura}</p>
                        </details>
                      )}
                    </div>
                    <span className="tabular">{formatCurrency(servico.valor)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="journey-muted">{t("journey.checkout.noServices")}</p>
            )}
          </section>
        </div>

        <aside className="journey-layout__aside" aria-labelledby="checkout-total-title">
          <section className="price-summary" data-capture="total">
            <h2 id="checkout-total-title">{t("journey.checkout.summaryTitle")}</h2>
            <dl className="price-summary__rows">
              <div><dt>{t("journey.checkout.dailies")}</dt><dd className="tabular">{totalDiarias}</dd></div>
              <div><dt>{t("journey.checkout.dailyRate")}</dt><dd className="tabular">{formatCurrency(diariaValue)}</dd></div>
              {servicesValue > 0 && (
                <div><dt>{t("journey.checkout.extraServices")}</dt><dd className="tabular">{formatCurrency(servicesValue)}</dd></div>
              )}
            </dl>
            <div className="price-summary__total">
              <span>{t("journey.checkout.total")}</span>
              <strong className="tabular">{formatCurrency(totalValue)}</strong>
            </div>
            <p className="price-summary__note">{t("journey.checkout.totalNote")}</p>
            <button type="button" className="btn btn--lg btn--block" onClick={handleConfirmar} disabled={confirmando} aria-busy={confirmando || undefined}>
              {confirmando ? t("journey.checkout.confirming") : t("journey.checkout.confirm")}
            </button>
            {confirmError && (
              <p className="alert alert--danger" role="alert">{confirmError}</p>
            )}
          </section>
        </aside>
      </div>
    );
  }

  return (
    <main className="journey-page">
      {head}
      {content}
    </main>
  );
}
