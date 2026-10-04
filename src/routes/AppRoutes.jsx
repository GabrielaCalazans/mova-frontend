import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { RouteErrorBoundary, RouteView, RouteLoading } from "../components/layout/RouteBoundary";
import AppShell from "../components/layout/AppShell";
import { useAuthSession } from "../hooks/useAuthSession";
import { getUserCargo, resolveAuthRoute } from "../services/authIdentity";
import { t } from "../i18n";

const Home = lazy(() => import("../pages/Home"));
const VehicleDetails = lazy(() => import("../pages/VehicleDetails"));
const Login = lazy(() => import("../pages/Login"));
const Cadastro = lazy(() => import("../pages/Cadastro"));
const CadastroLocador = lazy(() => import("../pages/CadastroLocador"));
const ForgotPassword = lazy(() => import("../pages/ForgotPassword"));
const ResetPassword = lazy(() => import("../pages/ResetPassword"));
const Conta = lazy(() => import("../pages/Conta"));
const CarrosScreen = lazy(() => import("../pages/CarrosScreen"));
const TiposDeCarros = lazy(() => import("../pages/TiposDeCarros"));
const EscolhaGaragemRetirada = lazy(() => import("../pages/EscolhaGaragemRetirada"));
const EscolhaGaragemDevolucao = lazy(() => import("../pages/EscolhaGaragemDevolucao"));
const CheckoutReserva = lazy(() => import("../pages/CheckoutReserva"));
const Pagamento = lazy(() => import("../pages/Pagamento"));
const DesbloqueioDeCarro = lazy(() => import("../pages/DesbloqueioDeCarro"));
const RastreamentoReserva = lazy(() => import("../pages/RastreamentoReserva"));
const DevolucaoReserva = lazy(() => import("../pages/DevolucaoReserva"));
const AvaliacaoReserva = lazy(() => import("../pages/AvaliacaoReserva"));
const ServicosOpcionais = lazy(() => import("../pages/ServicosOpcionais"));
const CondutoresAdicionais = lazy(() => import("../pages/CondutoresAdicionais"));
const CancelamentoReserva = lazy(() => import("../pages/CancelamentoReserva"));
const RelatoriosFiltro = lazy(() => import("../pages/RelatoriosFiltro"));
const RelatoriosVeiculos = lazy(() => import("../pages/RelatoriosVeiculos"));
const CarrosDisponiveis = lazy(() => import("../pages/CarrosDisponiveis"));
const CarrosFavoritados = lazy(() => import("../pages/CarrosFavoritados"));
const CadastroDeCarros = lazy(() => import("../pages/CadastroDeCarros"));
const CadastroCarroForm = lazy(() => import("../pages/CadastroCarroForm"));
const CadastroDeGaragens = lazy(() => import("../pages/CadastroDeGaragens"));
const CadastroGaragemForm = lazy(() => import("../pages/CadastroGaragemForm"));
const CapacidadeGaragem = lazy(() => import("../pages/CapacidadeGaragem"));
const Historico = lazy(() => import("../pages/Historico"));
const ReservaDetalhe = lazy(() => import("../pages/ReservaDetalhe"));
const PendenciasFinanceiras = lazy(() => import("../pages/PendenciasFinanceiras"));
const RelatoriosAvaliacoesFiltro = lazy(() => import("../pages/RelatoriosAvaliacoesFiltro"));
const RelatoriosAvaliacoes = lazy(() => import("../pages/RelatoriosAvaliacoes"));
const Suporte = lazy(() => import("../pages/Suporte"));
const Configuracoes = lazy(() => import("../pages/Configuracoes"));
const InteressesDisponibilidade = lazy(() => import("../pages/InteressesDisponibilidade"));
const CompartilhamentoViagem = lazy(() => import("../pages/CompartilhamentoViagem"));
const OwnerDashboard = lazy(() => import("../pages/OwnerDashboard"));
const OwnerReservations = lazy(() => import("../pages/OwnerReservations"));
const OwnerMonitoring = lazy(() => import("../pages/OwnerMonitoring"));
const OwnerAppShell = lazy(() => import("../components/layout/OwnerAppShell"));
const NotFound = lazy(() => import("../pages/NotFound"));

function ProtectedRoute({ children, requiredCargo }) {
  const location = useLocation();
  const session = useAuthSession();
  const cargo = getUserCargo(session?.user);

  if (!session?.token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requiredCargo && cargo !== requiredCargo) {
    return <Navigate to={resolveAuthRoute(session.user)} replace />;
  }

  if (requiredCargo === "LOCADOR") {
    return <RouteErrorBoundary><OwnerAppShell>{children}</OwnerAppShell></RouteErrorBoundary>;
  }

  return children;
}

function OwnerProtectedRoute({ children }) {
  return <ProtectedRoute requiredCargo="LOCADOR">{children}</ProtectedRoute>;
}

function RoleShell({ children }) {
  const session = useAuthSession();
  return getUserCargo(session?.user) === "LOCADOR"
    ? <RouteErrorBoundary><OwnerAppShell>{children}</OwnerAppShell></RouteErrorBoundary>
    : <AppShell>{children}</AppShell>;
}

/** Visitante e locatário compartilham um shell que persiste entre rotas. */
function AppShellLayout() {
  return <AppShell><Outlet /></AppShell>;
}

function Screen({ Page, label, ...props }) {
  return <RouteView Page={Page} label={label} {...props} />;
}

function FocusOnRouteChange() {
  const location = useLocation();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      document.getElementById("conteudo-principal")?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname, location.search]);

  return null;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <FocusOnRouteChange />
      <Suspense fallback={<RouteLoading text={t("common.route.openingApp")} />}>
        <Routes>
          {/* Telas de acesso: marca própria, sem shell. */}
          <Route path="/login" element={<Screen Page={Login} label={t("common.route.screens.login")} />} />
          <Route path="/cadastro" element={<Screen Page={Cadastro} label={t("common.route.screens.signup")} />} />
          <Route path="/cadastro-locatario" element={<Screen Page={Cadastro} label={t("common.route.screens.signup")} />} />
          <Route path="/cadastro-locador" element={<Screen Page={CadastroLocador} label={t("common.route.screens.ownerSignup")} />} />
          <Route path="/recuperar-senha" element={<Screen Page={ForgotPassword} label={t("common.route.screens.forgotPassword")} />} />
          <Route path="/redefinir-senha" element={<Screen Page={ResetPassword} label={t("common.route.screens.resetPassword")} />} />

          {/* Visitante e locatário: AppShell único e persistente. */}
          <Route element={<AppShellLayout />}>
            <Route path="/" element={<Screen Page={Home} label={t("common.route.screens.home")} />} />
            <Route path="/home" element={<Screen Page={Home} label={t("common.route.screens.home")} />} />
            <Route path="/viagem/compartilhada/:token" element={<Screen Page={CompartilhamentoViagem} label={t("common.route.screens.sharedTrip")} />} />
            <Route path="/reservas/:id" element={<ProtectedRoute requiredCargo="LOCATARIO"><Screen Page={ReservaDetalhe} label={t("common.route.screens.reservationDetail")} /></ProtectedRoute>} />
            <Route path="/reserva/:id" element={<ProtectedRoute requiredCargo="LOCATARIO"><Screen Page={ReservaDetalhe} label={t("common.route.screens.reservationDetail")} /></ProtectedRoute>} />
            <Route path="/carros" element={<Screen Page={TiposDeCarros} label={t("common.route.screens.carTypes")} />} />
            <Route path="/carros/:id" element={<Screen Page={VehicleDetails} label={t("common.route.screens.vehicleDetails")} />} />
            <Route path="/carros/lista" element={<Screen Page={CarrosScreen} label={t("common.route.screens.carList")} />} />
            <Route path="/escolha-garagem-retirada" element={<ProtectedRoute requiredCargo="LOCATARIO"><Screen Page={EscolhaGaragemRetirada} label={t("common.route.screens.pickupGarage")} /></ProtectedRoute>} />
            <Route path="/escolha-garagem-devolucao" element={<ProtectedRoute requiredCargo="LOCATARIO"><Screen Page={EscolhaGaragemDevolucao} label={t("common.route.screens.returnGarage")} /></ProtectedRoute>} />
            <Route path="/servicos-opcionais" element={<ProtectedRoute requiredCargo="LOCATARIO"><Screen Page={ServicosOpcionais} label={t("common.route.screens.extras")} /></ProtectedRoute>} />
            <Route path="/checkout-reserva" element={<ProtectedRoute requiredCargo="LOCATARIO"><Screen Page={CheckoutReserva} label={t("common.route.screens.checkout")} /></ProtectedRoute>} />
            <Route path="/condutores-adicionais" element={<ProtectedRoute requiredCargo="LOCATARIO"><Screen Page={CondutoresAdicionais} label={t("common.route.screens.drivers")} /></ProtectedRoute>} />
            <Route path="/pagamento" element={<ProtectedRoute requiredCargo="LOCATARIO"><Screen Page={Pagamento} label={t("common.route.screens.payment")} /></ProtectedRoute>} />
            <Route path="/desbloqueio" element={<ProtectedRoute requiredCargo="LOCATARIO"><Screen Page={DesbloqueioDeCarro} label={t("common.route.screens.unlock")} /></ProtectedRoute>} />
            <Route path="/reserva/:id/localizacao" element={<ProtectedRoute requiredCargo="LOCATARIO"><Screen Page={RastreamentoReserva} label={t("common.route.screens.tracking")} /></ProtectedRoute>} />
            <Route path="/devolucao" element={<ProtectedRoute requiredCargo="LOCATARIO"><Screen Page={DevolucaoReserva} label={t("common.route.screens.return")} /></ProtectedRoute>} />
            <Route path="/cancelamento" element={<ProtectedRoute requiredCargo="LOCATARIO"><Screen Page={CancelamentoReserva} label={t("common.route.screens.cancellation")} /></ProtectedRoute>} />
            <Route path="/avaliacao" element={<ProtectedRoute requiredCargo="LOCATARIO"><Screen Page={AvaliacaoReserva} label={t("common.route.screens.review")} /></ProtectedRoute>} />
            <Route path="/historico" element={<ProtectedRoute requiredCargo="LOCATARIO"><Screen Page={Historico} label={t("common.route.screens.history")} /></ProtectedRoute>} />
            <Route path="/pendencias-financeiras" element={<ProtectedRoute requiredCargo="LOCATARIO"><Screen Page={PendenciasFinanceiras} label={t("common.route.screens.pendingPayments")} /></ProtectedRoute>} />
            <Route path="/interesses" element={<ProtectedRoute requiredCargo="LOCATARIO"><Screen Page={InteressesDisponibilidade} label={t("common.route.screens.availabilityAlerts")} /></ProtectedRoute>} />
            <Route path="/carros/disponiveis" element={<ProtectedRoute requiredCargo="LOCATARIO"><Screen Page={CarrosDisponiveis} label={t("common.route.screens.availableCars")} /></ProtectedRoute>} />
            <Route path="/carros/favoritos" element={<ProtectedRoute requiredCargo="LOCATARIO"><Screen Page={CarrosFavoritados} label={t("common.route.screens.favorites")} /></ProtectedRoute>} />
            <Route path="*" element={<Screen Page={NotFound} label={t("common.route.screens.page")} />} />
          </Route>

          {/* Conta, suporte e configurações: shell conforme o cargo. */}
          <Route path="/conta" element={<ProtectedRoute><RoleShell><Screen Page={Conta} label={t("common.route.screens.account")} /></RoleShell></ProtectedRoute>} />
          <Route path="/suporte" element={<ProtectedRoute><RoleShell><Screen Page={Suporte} label={t("common.route.screens.support")} /></RoleShell></ProtectedRoute>} />
          <Route path="/configuracoes" element={<ProtectedRoute><RoleShell><Screen Page={Configuracoes} label={t("common.route.screens.settings")} /></RoleShell></ProtectedRoute>} />

          {/* Locador: OwnerAppShell aplicado pelo ProtectedRoute. */}
          <Route path="/painel" element={<OwnerProtectedRoute><Screen Page={OwnerDashboard} label={t("common.route.screens.ownerDashboard")} /></OwnerProtectedRoute>} />
          <Route path="/reservas" element={<OwnerProtectedRoute><Screen Page={OwnerReservations} label={t("common.route.screens.fleetReservations")} /></OwnerProtectedRoute>} />
          <Route path="/monitoramento" element={<OwnerProtectedRoute><Screen Page={OwnerMonitoring} label={t("common.route.screens.monitoring")} /></OwnerProtectedRoute>} />
          <Route path="/relatorios" element={<ProtectedRoute requiredCargo="LOCADOR"><Screen Page={RelatoriosFiltro} label={t("common.route.screens.reports")} /></ProtectedRoute>} />
          <Route path="/relatorios/veiculos" element={<ProtectedRoute requiredCargo="LOCADOR"><Screen Page={RelatoriosVeiculos} label={t("common.route.screens.vehicleReport")} /></ProtectedRoute>} />
          <Route path="/relatorios/avaliacoes-filtro" element={<ProtectedRoute requiredCargo="LOCADOR"><Screen Page={RelatoriosAvaliacoesFiltro} label={t("common.route.screens.reviewFilter")} /></ProtectedRoute>} />
          <Route path="/relatorios/avaliacoes" element={<ProtectedRoute requiredCargo="LOCADOR"><Screen Page={RelatoriosAvaliacoes} label={t("common.route.screens.reviews")} /></ProtectedRoute>} />
          <Route path="/cadastro-carros" element={<ProtectedRoute requiredCargo="LOCADOR"><Screen Page={CadastroDeCarros} label={t("common.route.screens.fleet")} /></ProtectedRoute>} />
          <Route path="/cadastro-carros/:id" element={<ProtectedRoute requiredCargo="LOCADOR"><Screen Page={CadastroCarroForm} label={t("common.route.screens.vehicle")} /></ProtectedRoute>} />
          <Route path="/cadastro-garagens" element={<ProtectedRoute requiredCargo="LOCADOR"><Screen Page={CadastroDeGaragens} label={t("common.route.screens.garages")} /></ProtectedRoute>} />
          <Route path="/cadastro-garagens/:id/capacidade" element={<ProtectedRoute requiredCargo="LOCADOR"><Screen Page={CapacidadeGaragem} label={t("common.route.screens.garageCapacity")} /></ProtectedRoute>} />
          <Route path="/cadastro-garagens/:id" element={<ProtectedRoute requiredCargo="LOCADOR"><Screen Page={CadastroGaragemForm} label={t("common.route.screens.garage")} /></ProtectedRoute>} />

          {/* Redirecionamentos legados. */}
          <Route path="/locador" element={<Navigate to="/painel" replace />} />
          <Route path="/tipos-carros" element={<Navigate to="/carros" replace />} />
          <Route path="/carros-screens" element={<Navigate to="/carros" replace />} />
          <Route path="/escolha-garagem" element={<Navigate to="/escolha-garagem-retirada" replace />} />
          <Route path="/agendamento" element={<Navigate to="/escolha-garagem-retirada" replace />} />
          <Route path="/escolha-data-e-hora" element={<Navigate to="/escolha-garagem-retirada" replace />} />
          <Route path="/checkout" element={<Navigate to="/checkout-reserva" replace />} />
          <Route path="/modo-de-pagamento" element={<Navigate to="/pagamento" replace />} />
          <Route path="/desbloqueio-de-carro" element={<Navigate to="/desbloqueio" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default AppRoutes;
