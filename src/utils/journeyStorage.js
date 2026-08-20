const JOURNEY_STORAGE_KEY = "mova_journey_flow";

const EMPTY_STEP = {
  garageId: "",
  garageName: "",
  garageAddress: "",
  garageInfo: "",
  date: "",
  time: "",
};

const EMPTY_VEHICLE = {
  id: "",
  nome: "",
  marca: "",
  modelo: "",
  categoria: "",
  imagem: "",
  capacidade: "",
  caracteristicas: [],
  acessibilidade: "",
  cambio: "",
  autonomia: "",
  combustivel: "",
};

<<<<<<< HEAD
const EMPTY_PAYMENT = {
  metodo: "",
};

const EMPTY_RESERVA = {
  id: "",
  codigoDesbloqueio: "",
};

=======
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
const EMPTY_JOURNEY = {
  veiculo: { ...EMPTY_VEHICLE },
  retirada: { ...EMPTY_STEP },
  devolucao: { ...EMPTY_STEP },
<<<<<<< HEAD
  pagamento: { ...EMPTY_PAYMENT },
  reserva: { ...EMPTY_RESERVA },
=======
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
};

function readRawJourney() {
  if (typeof window === "undefined") {
    return EMPTY_JOURNEY;
  }

  try {
    const stored = window.sessionStorage.getItem(JOURNEY_STORAGE_KEY);
    if (!stored) {
      return EMPTY_JOURNEY;
    }

    const parsed = JSON.parse(stored);
    return {
      veiculo: { ...EMPTY_VEHICLE, ...(parsed?.veiculo ?? {}) },
      retirada: { ...EMPTY_STEP, ...(parsed?.retirada ?? {}) },
      devolucao: { ...EMPTY_STEP, ...(parsed?.devolucao ?? {}) },
<<<<<<< HEAD
      pagamento: { ...EMPTY_PAYMENT, ...(parsed?.pagamento ?? {}) },
      reserva: { ...EMPTY_RESERVA, ...(parsed?.reserva ?? {}) },
=======
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
    };
  } catch {
    return EMPTY_JOURNEY;
  }
}

function writeRawJourney(nextJourney) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify(nextJourney));
}

export function getJourneyStep(section) {
  return readRawJourney()[section] ?? { ...EMPTY_STEP };
}

export function updateJourneyStep(section, stepValues) {
  const currentJourney = readRawJourney();
  const nextJourney = {
    ...currentJourney,
    [section]: {
      ...currentJourney[section],
      ...stepValues,
    },
  };

  writeRawJourney(nextJourney);
  return nextJourney[section];
}
