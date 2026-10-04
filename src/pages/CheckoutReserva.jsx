import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightToBracket, faArrowRightFromBracket, faCalendarDay } from "@fortawesome/free-solid-svg-icons";
import JourneySteps from "../components/reservation/JourneySteps";
import VehicleMedia from "../components/vehicle/VehicleMedia";
import { getJourneyStep, updateJourneyStep } from "../utils/journeyStorage";
import { formatCambio, formatCategoria } from "../utils/vehicleDisplay";
import {
  formatMoneyBRL,
  parseJourneyDateTime,
  validarPeriodoReserva,
} from "../utils/reservationMath";
import { getVeiculoById } from "../services/veiculoService";
import { getReservationPricing } from "../services/reservationPricing";
import { createReserva } from "../services/reservaService";
import { getAuthSession } from "../services/authSession";
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
    "Não informado"
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
    "Veículo selecionado"
  );
}

function yesNo(value) {
  if (value === undefined || value === null || value === "") return "Não informado";
  return value ? "Sim" : "Não";
}

function Leg({ icon, label, garage, address, date, time }) {
  return (
    <li className="itinerary__leg">
      <span className="itinerary__icon"><FontAwesomeIcon icon={icon} aria-hidden="true" /></span>
      <div className="itinerary__body">
        <p className="itinerary__label">{label}</p>
        <p className="itinerary__garage">{garage || "Garagem não informada"}</p>
        {address && address !== garage ? <p className="itinerary__address">{address}</p> : null}
        <p className="itinerary__when">
          <FontAwesomeIcon icon={faCalendarDay} aria-hidden="true" />
          <span className="tabular">{date || "Data não informada"}</span>
          <span aria-hidden="true">·</span>
          <span className="tabular">{time || "Horário não informado"}</span>
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

  async function handleConfirmar() {
    setConfirmError("");

    const idLocatario = getAuthSession()?.user?.id;
    if (!idLocatario) {
      setConfirmError("Sessão inválida. Faça login novamente.");
      return;
    }
    if (!veiculoSalvo?.id) {
      setConfirmError("Selecione um veículo para continuar.");
      return;
    }
    // Espelha RN05 antes do POST: mesma mensagem que o backend devolveria,
    // sem gastar um round-trip. O servidor revalida de qualquer forma.
    const erroPeriodo = validarPeriodoReserva(pickupDateTime, dropoffDateTime);
    if (erroPeriodo) {
      setConfirmError(erroPeriodo);
      return;
    }
    // A retirada é derivada do veículo (pode não existir, se ele não estiver
    // alocado em nenhuma garagem). A devolução é escolha do usuário.
    if (!devolucao?.garageId) {
      setConfirmError("Selecione a garagem de devolução.");
      return;
    }

    setConfirmando(true);
    try {
      const sessionUser = getAuthSession()?.user;
      const servicosIds = servicos?.ids ?? [];

      // Payload completo do contrato POST /api/reserva. status e statusPagamento
      // NÃO entram: são do domínio. Ver auditoria/CONTRATO-FRONTEND-BACKEND.md.
      const reserva = await createReserva({
        idVeiculo: veiculoSalvo.id,
        idLocatario,
        dataHoraInicio: pickupDateTime.toISOString(),
        dataHoraFim: dropoffDateTime.toISOString(),
        // Garagens reais escolhidas na jornada (UUIDs vindos de GET /api/garagem).
        ...(retirada?.garageId ? { idGaragemRetirada: retirada.garageId } : {}),
        ...(devolucao?.garageId ? { idGaragemDevolucao: devolucao.garageId } : {}),
        // RN01: só é necessário quando o veículo é adaptado/PCD e o locatário
        // ainda não tem deficiência cadastrada no perfil.
        ...(sessionUser?.deficienciaId
          ? { deficienciaId: sessionUser.deficienciaId }
          : {}),
        ...(servicosIds.length > 0 ? { servicosIds } : {}),
      });

      // valorTotal vem calculado pelo backend (fonte de verdade); o que o
      // checkout mostrou era só estimativa.
      updateJourneyStep("reserva", {
        id: reserva.id,
        valorTotal: reserva.valorTotal,
        codigoDesbloqueio: reserva.codigoDesbloqueio || "",
      });
      navigate("/condutores-adicionais");
    } catch (caughtError) {
      setConfirmError(caughtError?.message || "Não foi possível confirmar a reserva.");
    } finally {
      setConfirmando(false);
    }
  }

  useEffect(() => {
    document.title = "MOVA - Checkout da Reserva";
  }, []);

  useEffect(() => {
    let active = true;

    async function loadCheckoutData() {
      setLoading(true);
      setError("");

      try {
        if (!veiculoSalvo?.id) {
          throw new Error("Selecione um veículo para continuar.");
        }

        const sessionUser = getAuthSession()?.user;
        if (!sessionUser?.id) throw new Error("Sessão inválida. Faça login novamente.");
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
            "Não foi possível carregar o checkout da reserva.",
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
        <h1>Checkout da Reserva</h1>
        <p className="page-head__lede">Confira o que você está alugando, quando, onde e quanto custa antes de pagar.</p>
      </header>
    </>
  );

  let content;
  if (loading) {
    content = <p className="loading-state" role="status"><span className="spinner" aria-hidden="true" />Carregando informações da reserva…</p>;
  } else if (error) {
    content = (
      <div className="state-block state-block--error" role="alert">
        <h2 className="state-block__title">Não foi possível montar o resumo</h2>
        <p className="state-block__text">{error}</p>
        <div className="journey-actions">
          <button type="button" className="btn btn--secondary" onClick={() => navigate("/escolha-garagem-devolucao")}>
            Voltar para devolução
          </button>
          <button type="button" className="btn" onClick={() => navigate("/carros")}>
            Escolher outro veículo
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
    // Campos descritivos vêm de modeloVeiculo, já normalizados por
    // normalizeVeiculo(); fallback para o veículo salvo na jornada.
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
            <h2 id="checkout-veiculo">O que você está alugando</h2>
            <div className="summary-vehicle">
              <VehicleMedia vehicle={vehicle ?? veiculoSalvo} className="summary-vehicle__media" />
              <div className="summary-vehicle__body">
                <p className="summary-vehicle__name">{vehicleName}</p>
                <p className="summary-vehicle__meta">{vehicleCategory}</p>
                <ul className="summary-vehicle__facts">
                  <li>Transmissão: {vehicleTransmission}</li>
                  <li>Capacidade: {vehicleCapacity} pessoas</li>
                  <li>Elétrico: {yesNo(vehicleEletrico)}</li>
                  <li>Acessibilidade: {yesNo(vehicleAdaptado)}</li>
                  {placa ? <li>Placa: <span className="tabular">{placa}</span></li> : null}
                </ul>
              </div>
            </div>
          </section>

          <section className="journey-section" aria-labelledby="checkout-quando">
            <h2 id="checkout-quando">Quando e onde</h2>
            <ol className="itinerary">
              <Leg icon={faArrowRightFromBracket} label="Retirada" garage={retirada.garageName} address={retirada.garageAddress} date={retirada.date} time={retirada.time} />
              <Leg icon={faArrowRightToBracket} label="Devolução" garage={devolucao.garageName} address={devolucao.garageAddress} date={devolucao.date} time={devolucao.time} />
            </ol>
            <button type="button" className="btn btn--quiet journey-edit" onClick={() => navigate("/escolha-garagem-devolucao")}>
              Editar devolução
            </button>
          </section>

          <section className="journey-section" aria-labelledby="checkout-servicos">
            <h2 id="checkout-servicos">Serviços selecionados</h2>
            {servicosContratados.length > 0 ? (
              <ul className="line-list">
                {servicosContratados.map((servico) => (
                  <li key={servico.id} className="line-list__item">
                    <div>
                      <strong>{servico.nome}</strong>
                      {servico.descricao && <p className="line-list__desc">{servico.descricao}</p>}
                      {servico.detalhesCobertura && (
                        <details className="line-list__details">
                          <summary>Ver detalhes da cobertura</summary>
                          <p>{servico.detalhesCobertura}</p>
                        </details>
                      )}
                    </div>
                    <span className="tabular">{formatMoneyBRL(servico.valor)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="journey-muted">Nenhum serviço opcional selecionado.</p>
            )}
          </section>
        </div>

        <aside className="journey-layout__aside" aria-labelledby="checkout-total-title">
          <section className="price-summary" data-capture="total">
            <h2 id="checkout-total-title">Resumo financeiro</h2>
            <dl className="price-summary__rows">
              <div><dt>Diárias</dt><dd className="tabular">{totalDiarias}</dd></div>
              <div><dt>Valor da diária</dt><dd className="tabular">{formatMoneyBRL(diariaValue)}</dd></div>
              {servicesValue > 0 && (
                <div><dt>Serviços adicionais</dt><dd className="tabular">{formatMoneyBRL(servicesValue)}</dd></div>
              )}
            </dl>
            <div className="price-summary__total">
              <span>Total</span>
              <strong className="tabular">{formatMoneyBRL(totalValue)}</strong>
            </div>
            <p className="price-summary__note">Valor calculado pelo servidor para este período. O pagamento é a próxima etapa.</p>
            <button type="button" className="btn btn--lg btn--block" onClick={handleConfirmar} disabled={confirmando} aria-busy={confirmando || undefined}>
              {confirmando ? "Confirmando..." : "Confirmar e seguir para pagamento"}
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
