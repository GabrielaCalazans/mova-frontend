import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import AuthenticatedLayout from "../layout/AuthenticatedLayout";
import movaLogo from "../assets/mova_logo.png";
import { getJourneyStep, updateJourneyStep } from "../utils/journeyStorage";
import {
  calculateReservationDays,
  formatMoneyBRL,
  parseJourneyDateTime,
} from "../utils/reservationMath";
import { getVeiculoById } from "../services/veiculoService";
import { getReservationPricing } from "../services/reservationPricing";
import { createReserva } from "../services/reservaService";
import { getAuthSession } from "../services/authSession";
import {
  LogoContainer,
  PrimaryButton,
  SecondaryButton,
  StatusMessage,
  Subtitle,
  Title,
  JourneySummaryCard,
  JourneySummaryLabel,
  JourneySummaryValue,
} from "../styles/authStyle";

const PageStack = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SectionCard = styled.section`
  width: 100%;
  border-radius: 16px;
  background: #fff;
  border: 1px solid #d8e4f4;
  box-shadow: 0 6px 18px rgba(0, 51, 102, 0.08);
  padding: 1rem;
  box-sizing: border-box;
`;

const SectionTitle = styled.h2`
  margin: 0 0 1rem;
  color: #003366;
  font-size: 1.05rem;
`;

const VehicleTop = styled.div`
  display: grid;
  grid-template-columns: minmax(84px, 120px) 1fr;
  gap: 1rem;
  align-items: start;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const VehicleImageWrap = styled.div`
  min-height: 110px;
  border-radius: 14px;
  overflow: hidden;
  background: linear-gradient(135deg, #eff5fb, #dce8f6);
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const VehiclePlaceholder = styled.div`
  color: #003366;
  font-size: 0.9rem;
  font-weight: 700;
  text-align: center;
  padding: 1rem;
`;

const VehicleTitle = styled.h3`
  margin: 0 0 0.35rem;
  color: #003366;
  font-size: 1.15rem;
`;

const VehicleMeta = styled.p`
  margin: 0 0 0.5rem;
  color: #555;
  font-size: 0.92rem;
  line-height: 1.45;
`;

const KeyValueGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
  }
`;

const KeyValueItem = styled.div`
  border: 1px solid #e5edf7;
  border-radius: 12px;
  padding: 0.85rem;
  background: #f9fbfe;
`;

const KeyValueLabel = styled.span`
  display: block;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #7a8aa3;
  margin-bottom: 0.35rem;
`;

const KeyValueValue = styled.p`
  margin: 0;
  color: #1f2d40;
  font-size: 0.95rem;
  line-height: 1.45;
  font-weight: 600;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
  }
`;

const SummaryActionRow = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;

  button {
    flex: 1 1 220px;
  }
`;

const PriceList = styled.div`
  display: grid;
  gap: 0.6rem;
`;

const PriceRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.95rem;
  color: #1f2d40;
`;

const PriceLabel = styled.span`
  color: #58687d;
`;

const PriceValue = styled.strong`
  color: #003366;
`;

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background: #e3ebf7;
  margin: 0.25rem 0;
`;

function formatDisplayDate(value) {
  return value || "Não informado";
}

function formatDisplayTime(value) {
  return value || "Não informado";
}

function resolveVehicleImage(vehicle) {
  return (
    vehicle?.imagem ||
    vehicle?.image ||
    vehicle?.foto ||
    vehicle?.urlImagem ||
    vehicle?.photo ||
    vehicle?.imagemUrl ||
    ""
  );
}

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

function normalizeDisplayValue(value) {
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "Não informado";
  }

  if (value && typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "Não informado";
    }
  }

  if (typeof value === "boolean") {
    return value ? "Sim" : "Não";
  }

  if (value === null || value === undefined || value === "") {
    return "Não informado";
  }

  return String(value);
}

function formatEnergyText(autonomy, fuel) {
  const parts = [autonomy, fuel]
    .map((part) => normalizeDisplayValue(part))
    .filter((part) => part !== "Não informado");

  return parts.length > 0 ? parts.join(" • ") : "Não informado";
}

function buildAdditionalDetails(vehicle) {
  const ignoredKeys = new Set([
    "id",
    "idLocador",
    "idModeloVeiculo",
    "nome",
    "marca",
    "modelo",
    "categoria",
    "imagem",
    "image",
    "foto",
    "urlImagem",
    "imagemUrl",
    "photo",
    "capacidade",
    "caracteristicas",
    "acessibilidade",
    "adaptado",
    "eletrico",
    "cambio",
    "transmissao",
    "autonomia",
    "combustivel",
    "energia",
    "valorDiaria",
    "precoDiaria",
    "dailyRate",
    "locadorId",
    "idModeloVeiculo",
    "modeloVeiculo",  // objeto aninhado — campos já promovidos pela normalização
    "garagemId",
    "createdAt",
    "criadoEm",
    "status",
    "garagemId",
    "modeloVeiculo",
  ]);

  return Object.entries(vehicle || {})
    .filter(
      ([key, value]) =>
        !ignoredKeys.has(key) &&
        value !== undefined &&
        value !== null &&
        value !== "",
    )
    .map(([key, value]) => ({
      label: key
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/[_-]/g, " ")
        .replace(/^./, (letter) => letter.toUpperCase()),
      value: normalizeDisplayValue(value),
    }));
}

function JourneySummary({ label, value }) {
  return (
    <JourneySummaryCard>
      <JourneySummaryLabel>{label}</JourneySummaryLabel>
      <JourneySummaryValue style={{ whiteSpace: "pre-line" }}>
        {value}
      </JourneySummaryValue>
    </JourneySummaryCard>
  );
}

export default function CheckoutReserva() {
  const navigate = useNavigate();
  const [journey] = useState(() => ({
    veiculo: getJourneyStep("veiculo"),
    retirada: getJourneyStep("retirada"),
    devolucao: getJourneyStep("devolucao"),
  }));

  const { veiculo: veiculoSalvo, retirada, devolucao } = journey;

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
    if (!pickupDateTime || !dropoffDateTime) {
      setConfirmError("Selecione data e horário de retirada e devolução.");
      return;
    }

    setConfirmando(true);
    try {
      const reserva = await createReserva({
        idVeiculo: veiculoSalvo.id,
        idLocatario,
        dataHoraInicio: pickupDateTime.toISOString(),
        dataHoraFim: dropoffDateTime.toISOString(),
        valorTotal: pricing?.total ?? 0,
      });

      updateJourneyStep("reserva", { id: reserva.id, codigoDesbloqueio: reserva.codigoDesbloqueio || "" });
      navigate("/pagamento");
    } catch (caughtError) {
      setConfirmError(caughtError?.message || "Não foi possível confirmar a reserva.");
    } finally {
      setConfirmando(false);
    }
  }

  const pickupDateTime = useMemo(
    () => parseJourneyDateTime(retirada),
    [retirada],
  );
  const dropoffDateTime = useMemo(
    () => parseJourneyDateTime(devolucao),
    [devolucao],
  );

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

        const totalDiarias = calculateReservationDays(
          pickupDateTime,
          dropoffDateTime,
        );
        const [vehicleDetails, pricingDetails] = await Promise.all([
          getVeiculoById(veiculoSalvo.id),
          getReservationPricing({
            days: totalDiarias,
            vehicle: veiculoSalvo,
          }),
        ]);

        if (!active) {
          return;
        }

        setVehicle(vehicleDetails);
        setPricing({ ...pricingDetails, totalDiarias });
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
  }, [dropoffDateTime, pickupDateTime, veiculoSalvo]);

  const additionalDetails = useMemo(
    () => buildAdditionalDetails(vehicle),
    [vehicle],
  );

  if (loading) {
    return (
      <AuthenticatedLayout>
        <LogoContainer>
          <img src={movaLogo} alt="Mova Logo" />
        </LogoContainer>
        <Title>Checkout da Reserva</Title>
        <StatusMessage>Carregando informações da reserva…</StatusMessage>
      </AuthenticatedLayout>
    );
  }

  if (error) {
    return (
      <AuthenticatedLayout>
        <LogoContainer>
          <img src={movaLogo} alt="Mova Logo" />
        </LogoContainer>
        <Title>Checkout da Reserva</Title>
        <StatusMessage style={{ color: "#c0392b" }}>{error}</StatusMessage>
        <SummaryActionRow>
          <SecondaryButton
            type="button"
            onClick={() => navigate("/escolha-garagem-devolucao")}
          >
            Voltar para devolução
          </SecondaryButton>
          <PrimaryButton type="button" onClick={() => navigate("/carros")}>
            Escolher outro veículo
          </PrimaryButton>
        </SummaryActionRow>
      </AuthenticatedLayout>
    );
  }

  const vehicleName = resolveVehicleName(vehicle);
  const vehicleImage = resolveVehicleImage(vehicle);
  const totalDiarias = pricing?.totalDiarias ?? 1;
  const diariaValue = pricing?.dailyRate ?? 0;
  const feeValue = pricing?.fees ?? 0;
  const totalValue = pricing?.total ?? 0;
  // Novo modelo: campos descritivos vêm de modeloVeiculo mas já normalizados
  // por normalizeVeiculo() no serviço. Fallback para veiculoSalvo (journey storage).
  const vehicleCategory = resolveVehicleField(
    vehicle,
    veiculoSalvo,
    "categoria",
  );
  const vehicleTransmission = resolveVehicleField(
    vehicle,
    veiculoSalvo,
    "cambio",
  );
  const vehicleCapacity = resolveVehicleField(
    vehicle,
    veiculoSalvo,
    "capacidade",
  );
  const vehicleEletrico = vehicle?.eletrico ?? veiculoSalvo?.eletrico;
  const vehicleAdaptado = vehicle?.adaptado ?? veiculoSalvo?.adaptado;
  const vehicleAccessibility =
    vehicleAdaptado !== undefined
      ? vehicleAdaptado
        ? "Sim"
        : "Não"
      : resolveVehicleField(vehicle, veiculoSalvo, "acessibilidade");
  const vehicleAutonomy = resolveVehicleField(
    vehicle,
    veiculoSalvo,
    "autonomia",
  );
  const vehicleFuel =
    vehicleEletrico === true
      ? "Elétrico"
      : resolveVehicleField(vehicle, veiculoSalvo, "combustivel");
  const pickupAddress =
    retirada.garageAddress || retirada.garageName || "Não informado";
  const dropoffAddress =
    devolucao.garageAddress || devolucao.garageName || "Não informado";

  return (
    <AuthenticatedLayout>
      <LogoContainer>
        <img src={movaLogo} alt="Mova Logo" />
      </LogoContainer>

      <Title>Checkout da Reserva</Title>
      <Subtitle>
        Confira todos os detalhes antes de seguir para o pagamento.
      </Subtitle>

      <PageStack>
        <SectionCard>
          <SectionTitle>Veículo selecionado</SectionTitle>
          <VehicleTop>
            <VehicleImageWrap>
              {vehicleImage ? (
                <img src={vehicleImage} alt={vehicleName} />
              ) : (
                <VehiclePlaceholder>Imagem não disponível</VehiclePlaceholder>
              )}
            </VehicleImageWrap>

            <div>
              <VehicleTitle>{vehicleName}</VehicleTitle>
              <VehicleMeta>{vehicleCategory}</VehicleMeta>
              <VehicleMeta>
                Transmissão: {normalizeDisplayValue(vehicleTransmission)}
              </VehicleMeta>
              <VehicleMeta>
                Capacidade: {normalizeDisplayValue(vehicleCapacity)} pessoas
              </VehicleMeta>
              <VehicleMeta>
                Elétrico:{" "}
                {vehicleEletrico !== undefined
                  ? vehicleEletrico
                    ? "Sim"
                    : "Não"
                  : "Não informado"}
              </VehicleMeta>
              <VehicleMeta>
                Acessibilidade: {normalizeDisplayValue(vehicleAccessibility)}
              </VehicleMeta>
              <VehicleMeta>
                Autonomia/combustível:{" "}
                {formatEnergyText(vehicleAutonomy, vehicleFuel)}
              </VehicleMeta>
            </div>
          </VehicleTop>

          <Divider />

          <KeyValueGrid>
            <KeyValueItem>
              <KeyValueLabel>Características</KeyValueLabel>
              <KeyValueValue>
                {normalizeDisplayValue(
                  vehicle?.caracteristicas ?? veiculoSalvo?.caracteristicas,
                )}
              </KeyValueValue>
            </KeyValueItem>

            <KeyValueItem>
              <KeyValueLabel>Placa</KeyValueLabel>
              <KeyValueValue>
                {normalizeDisplayValue(vehicle?.placa ?? veiculoSalvo?.placa)}
              </KeyValueValue>
            </KeyValueItem>

            <KeyValueItem>
              <KeyValueLabel>Modelo do veículo</KeyValueLabel>
              <KeyValueValue>
                {normalizeDisplayValue(
                  vehicle?.modeloVeiculo
                    ? `${vehicle.modeloVeiculo.marca ?? ""} ${vehicle.modeloVeiculo.modelo ?? ""}`.trim()
                    : veiculoSalvo?.nome ||
                        `${veiculoSalvo?.marca ?? ""} ${veiculoSalvo?.modelo ?? ""}`.trim(),
                )}
              </KeyValueValue>
            </KeyValueItem>

            <KeyValueItem>
              <KeyValueLabel>Status</KeyValueLabel>
              <KeyValueValue>
                {normalizeDisplayValue(vehicle?.status ?? veiculoSalvo?.status)}
              </KeyValueValue>
            </KeyValueItem>
          </KeyValueGrid>

          {additionalDetails.length > 0 && (
            <>
              <Divider />
              <SectionTitle
                style={{ fontSize: "0.95rem", marginBottom: "0.75rem" }}
              >
                Detalhes adicionais
              </SectionTitle>
              <KeyValueGrid>
                {additionalDetails.map((detail) => (
                  <KeyValueItem key={detail.label}>
                    <KeyValueLabel>{detail.label}</KeyValueLabel>
                    <KeyValueValue>{detail.value}</KeyValueValue>
                  </KeyValueItem>
                ))}
              </KeyValueGrid>
            </>
          )}
        </SectionCard>

        <SummaryGrid>
          <JourneySummary
            label="Retirada"
            value={`${retirada.garageName || "Garagem não informada"}\n${pickupAddress}\n${formatDisplayDate(retirada.date)} • ${formatDisplayTime(retirada.time)}`}
          />
          <JourneySummary
            label="Devolução"
            value={`${devolucao.garageName || "Garagem não informada"}\n${dropoffAddress}\n${formatDisplayDate(devolucao.date)} • ${formatDisplayTime(devolucao.time)}`}
          />
        </SummaryGrid>

        <JourneySummaryCard>
          <JourneySummaryLabel>Resumo financeiro</JourneySummaryLabel>
          <PriceList>
            <PriceRow>
              <PriceLabel>Diárias</PriceLabel>
              <PriceValue>{totalDiarias}</PriceValue>
            </PriceRow>
            <PriceRow>
              <PriceLabel>Valor da diária</PriceLabel>
              <PriceValue>{formatMoneyBRL(diariaValue)}</PriceValue>
            </PriceRow>
            <PriceRow>
              <PriceLabel>Taxas</PriceLabel>
              <PriceValue>{formatMoneyBRL(feeValue)}</PriceValue>
            </PriceRow>
            <Divider />
            <PriceRow>
              <PriceLabel>Total</PriceLabel>
              <PriceValue>{formatMoneyBRL(totalValue)}</PriceValue>
            </PriceRow>
          </PriceList>
        </JourneySummaryCard>

        <SummaryActionRow>
          <SecondaryButton
            type="button"
            onClick={() => navigate("/escolha-garagem-devolucao")}
          >
            Editar devolução
          </SecondaryButton>
          <PrimaryButton type="button" onClick={handleConfirmar} disabled={confirmando}>
            {confirmando ? "Confirmando..." : "Confirmar e seguir para pagamento"}
          </PrimaryButton>
        </SummaryActionRow>
        {confirmError && (
          <StatusMessage style={{ color: "#c0392b" }}>{confirmError}</StatusMessage>
        )}
      </PageStack>
    </AuthenticatedLayout>
  );
}
