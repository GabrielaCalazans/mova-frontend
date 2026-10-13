// Organiza a aba Suites do Allure: parentSuite = grupo (ator, entidade ou
// segmento), suite = describe de topo, subSuite = describes aninhados.
// O grupo sai do nome do arquivo (sem .test/.spec) ou, na falta dele, da pasta.
const GRUPOS = {
  "Ator: Locador": ["OwnerDashboard", "dashboardService"],
  "Ator: Visitante": ["public-routing"],
  "Entidade: Auditoria": ["HistoricoAlteracoes"],
  "Entidade: Avaliação": ["AvaliacaoReserva", "RelatoriosAvaliacoes", "RelatoriosAvaliacoesFiltro"],
  "Entidade: Cobrança": ["PendenciasFinanceiras", "cobrancaService"],
  "Entidade: Compartilhamento de reserva": ["CompartilhamentoViagem", "compartilhamentoService"],
  "Entidade: Condutor adicional": ["CondutoresAdicionais"],
  "Entidade: Conta": ["Conta", "ForgotPassword", "ResetPassword", "authService"],
  "Entidade: Favorito": ["FavoritableCarList"],
  "Entidade: Garagem": ["CadastroDeGaragens", "CadastroGaragemForm", "GarageJourneyStep"],
  "Entidade: Interesse em veículo": ["InteressesDisponibilidade", "interesseService"],
  "Entidade: Localização": ["RastreamentoReserva"],
  "Entidade: Notificação": ["Configuracoes"],
  "Entidade: Pagamento": ["Pagamento"],
  "Entidade: Reserva": [
    "CancelamentoReserva",
    "CheckoutReserva",
    "DesbloqueioDeCarro",
    "DevolucaoReserva",
    "Historico",
    "OwnerReservations",
    "ReservaDetalhe",
    "ReservasList",
    "reservaService",
    "reservationMath",
    "reservationPricing",
  ],
  "Entidade: Serviço opcional": ["ServicosOpcionais", "servicoService"],
  "Entidade: Veículo": [
    "CadastroCarroForm",
    "CadastroDeCarros",
    "CarrosScreen",
    "FrotaMonitoramento",
    "RelatoriosVeiculos",
    "TiposDeCarros",
    "VehicleDetails",
    "vehicleDisplay",
    "veiculoService",
  ],
  "Segmento: Acessibilidade": ["AccountMenu", "ConteinerRolavel", "FiltroDataPicker", "Home", "ModalDialog", "TitulosDocumento"],
  "Segmento: Autenticação e segurança": ["App.flow", "authIdentity", "authSecurity", "authSession", "useAuthSession"],
  "Segmento: Contrato da API": ["apiClient", "apiEnums"],
  "Segmento: Infraestrutura": ["allureSuites", "networkIsolation"],
  "Segmento: Internacionalização": ["i18n", "Auth.i18n", "OwnerReports.i18n", "ReservationLifecycle.i18n", "common.i18n", "LanguageSelect"],
  "Segmento: Jornadas ponta a ponta": ["happy-path", "public-home", "real-api", "real-media", "task10-edge-path"],
  "Segmento: Validação de dados": ["formValidators", "useFormSubmit"],
};

const GRUPO_POR_NOME = new Map(Object.entries(GRUPOS).flatMap(([grupo, nomes]) => nomes.map((n) => [n, grupo])));
const ROTULOS_DE_SUITE = new Set(["parentSuite", "suite", "subSuite"]);
const ARQUIVO_DE_TESTE = /\.(test|spec)\.jsx?$/;

export function grupoDoArquivo(arquivo) {
  const partes = arquivo.split("/");
  return GRUPO_POR_NOME.get(partes.at(-1).replace(ARQUIVO_DE_TESTE, "")) ?? GRUPO_POR_NOME.get(partes.at(-2));
}

// Listener beforeTestResultWrite do allure-vitest e do allure-playwright.
export function organizarSuites(resultado) {
  const partes = resultado.titlePath ?? [];
  const iArquivo = partes.findIndex((p) => ARQUIVO_DE_TESTE.test(p));
  if (iArquivo < 0) return;
  const [suite = partes[iArquivo], ...aninhados] = partes.slice(iArquivo + 1);
  resultado.labels = resultado.labels.filter((l) => !ROTULOS_DE_SUITE.has(l.name));
  resultado.labels.push(
    { name: "parentSuite", value: grupoDoArquivo(partes.slice(0, iArquivo + 1).join("/")) ?? "Sem grupo" },
    { name: "suite", value: suite },
  );
  if (aninhados.length) resultado.labels.push({ name: "subSuite", value: aninhados.join(" > ") });
}
