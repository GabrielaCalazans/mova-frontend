import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { RouteErrorBoundary, RouteView, RouteLoading } from "../components/layout/RouteBoundary";
import { useAuthSession } from "../hooks/useAuthSession";
import { getUserCargo, resolveAuthRoute } from "../services/authIdentity";

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
    : children;
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
      <Suspense fallback={<RouteLoading label="Abrindo MOVA" />}>
        <Routes>
          <Route path="/" element={<Screen Page={Home} label="a página inicial" />} />
          <Route path="/home" element={<Screen Page={Home} label="a página inicial" />} />
          <Route path="/login" element={<Screen Page={Login} label="o login" />} />
          <Route path="/viagem/compartilhada/:token" element={<Screen Page={CompartilhamentoViagem} label="a viagem compartilhada" />} />
          <Route path="/cadastro" element={<Screen Page={Cadastro} label="o cadastro" />} />
          <Route path="/cadastro-locatario" element={<Screen Page={Cadastro} label="o cadastro" />} />
          <Route path="/cadastro-locador" element={<Screen Page={CadastroLocador} label="o cadastro do locador" />} />
          <Route path="/recuperar-senha" element={<Screen Page={ForgotPassword} label="a recuperação de senha" />} />
          <Route path="/redefinir-senha" element={<Screen Page={ResetPassword} label="a redefinição de senha" />} />

          <Route path="/painel" element={<OwnerProtectedRoute><Screen Page={OwnerDashboard} label="o painel do locador" /></OwnerProtectedRoute>} />
          <Route path="/locador" element={<Navigate to="/painel" replace />} />
          <Route path="/reservas" element={<OwnerProtectedRoute><Screen Page={OwnerReservations} label="as reservas da frota" /></OwnerProtectedRoute>} />
          <Route path="/reservas/:id" element={<ProtectedRoute requiredCargo="LOCATARIO"><Screen Page={ReservaDetalhe} label="o detalhe da reserva" /></ProtectedRoute>} />
          <Route path="/reserva/:id" element={<ProtectedRoute requiredCargo="LOCATARIO"><Screen Page={ReservaDetalhe} label="o detalhe da reserva" /></ProtectedRoute>} />
          <Route path="/monitoramento" element={<OwnerProtectedRoute><Screen Page={OwnerMonitoring} label="o monitoramento" /></OwnerProtectedRoute>} />
          <Route path="/conta" element={<ProtectedRoute><RoleShell><Screen Page={Conta} label="a conta" /></RoleShell></ProtectedRoute>} />
          <Route path="/carros" element={<Screen Page={TiposDeCarros} label="a escolha do tipo de carro" />} />
          <Route path="/tipos-carros" element={<Navigate to="/carros" replace />} />
          <Route path="/carros/:id" element={<Screen Page={VehicleDetails} label="os detalhes do veículo" />} />
          <Route path="/carros/lista" element={<Screen Page={CarrosScreen} label="a lista de carros" />} />

          <Route path="/escolha-garagem-retirada" element={<ProtectedRoute requiredCargo="LOCATARIO"><Screen Page={EscolhaGaragemRetirada} label="a garagem de retirada" /></ProtectedRoute>} />
          <Route path="/escolha-garagem-devolucao" element={<ProtectedRoute requiredCargo="LOCATARIO"><Screen Page={EscolhaGaragemDevolucao} label="a garagem de devolução" /></ProtectedRoute>} />
          <Route path="/servicos-opcionais" element={<ProtectedRoute requiredCargo="LOCATARIO"><Screen Page={ServicosOpcionais} label="os serviços opcionais" /></ProtectedRoute>} />
          <Route path="/checkout-reserva" element={<ProtectedRoute requiredCargo="LOCATARIO"><Screen Page={CheckoutReserva} label="o checkout da reserva" /></ProtectedRoute>} />
          <Route path="/condutores-adicionais" element={<ProtectedRoute requiredCargo="LOCATARIO"><Screen Page={CondutoresAdicionais} label="os condutores adicionais" /></ProtectedRoute>} />
          <Route path="/pagamento" element={<ProtectedRoute requiredCargo="LOCATARIO"><Screen Page={Pagamento} label="o pagamento" /></ProtectedRoute>} />
          <Route path="/desbloqueio" element={<ProtectedRoute requiredCargo="LOCATARIO"><Screen Page={DesbloqueioDeCarro} label="o desbloqueio" /></ProtectedRoute>} />
          <Route path="/reserva/:id/localizacao" element={<ProtectedRoute requiredCargo="LOCATARIO"><Screen Page={RastreamentoReserva} label="o acompanhamento da reserva" /></ProtectedRoute>} />
          <Route path="/devolucao" element={<ProtectedRoute requiredCargo="LOCATARIO"><Screen Page={DevolucaoReserva} label="a devolução" /></ProtectedRoute>} />
          <Route path="/cancelamento" element={<ProtectedRoute requiredCargo="LOCATARIO"><Screen Page={CancelamentoReserva} label="o cancelamento" /></ProtectedRoute>} />
          <Route path="/avaliacao" element={<ProtectedRoute requiredCargo="LOCATARIO"><Screen Page={AvaliacaoReserva} label="a avaliação" /></ProtectedRoute>} />
          <Route path="/historico" element={<ProtectedRoute requiredCargo="LOCATARIO"><Screen Page={Historico} label="o histórico" /></ProtectedRoute>} />
          <Route path="/pendencias-financeiras" element={<ProtectedRoute requiredCargo="LOCATARIO"><Screen Page={PendenciasFinanceiras} label="as pendências financeiras" /></ProtectedRoute>} />
          <Route path="/suporte" element={<ProtectedRoute><Screen Page={Suporte} label="o suporte" /></ProtectedRoute>} />
          <Route path="/configuracoes" element={<ProtectedRoute><Screen Page={Configuracoes} label="as configurações" /></ProtectedRoute>} />
          <Route path="/interesses" element={<ProtectedRoute requiredCargo="LOCATARIO"><Screen Page={InteressesDisponibilidade} label="os avisos de disponibilidade" /></ProtectedRoute>} />

          <Route path="/relatorios" element={<ProtectedRoute requiredCargo="LOCADOR"><Screen Page={RelatoriosFiltro} label="os relatórios" /></ProtectedRoute>} />
          <Route path="/relatorios/veiculos" element={<ProtectedRoute requiredCargo="LOCADOR"><Screen Page={RelatoriosVeiculos} label="o relatório de veículos" /></ProtectedRoute>} />
          <Route path="/relatorios/avaliacoes-filtro" element={<ProtectedRoute requiredCargo="LOCADOR"><Screen Page={RelatoriosAvaliacoesFiltro} label="o filtro de avaliações" /></ProtectedRoute>} />
          <Route path="/relatorios/avaliacoes" element={<ProtectedRoute requiredCargo="LOCADOR"><Screen Page={RelatoriosAvaliacoes} label="as avaliações" /></ProtectedRoute>} />
          <Route path="/cadastro-carros" element={<ProtectedRoute requiredCargo="LOCADOR"><Screen Page={CadastroDeCarros} label="a frota" /></ProtectedRoute>} />
          <Route path="/cadastro-carros/:id" element={<ProtectedRoute requiredCargo="LOCADOR"><Screen Page={CadastroCarroForm} label="o veículo" /></ProtectedRoute>} />
          <Route path="/cadastro-garagens" element={<ProtectedRoute requiredCargo="LOCADOR"><Screen Page={CadastroDeGaragens} label="as garagens" /></ProtectedRoute>} />
          <Route path="/cadastro-garagens/:id/capacidade" element={<ProtectedRoute requiredCargo="LOCADOR"><Screen Page={CapacidadeGaragem} label="a capacidade da garagem" /></ProtectedRoute>} />
          <Route path="/cadastro-garagens/:id" element={<ProtectedRoute requiredCargo="LOCADOR"><Screen Page={CadastroGaragemForm} label="a garagem" /></ProtectedRoute>} />
          <Route path="/carros/disponiveis" element={<ProtectedRoute requiredCargo="LOCADOR"><Screen Page={CarrosDisponiveis} label="os carros disponíveis" /></ProtectedRoute>} />
          <Route path="/carros/favoritos" element={<ProtectedRoute requiredCargo="LOCATARIO"><Screen Page={CarrosFavoritados} label="os favoritos" /></ProtectedRoute>} />

          <Route path="/carros-screens" element={<Navigate to="/carros" replace />} />
          <Route path="/escolha-garagem" element={<Navigate to="/escolha-garagem-retirada" replace />} />
          <Route path="/agendamento" element={<Navigate to="/escolha-garagem-retirada" replace />} />
          <Route path="/escolha-data-e-hora" element={<Navigate to="/escolha-garagem-retirada" replace />} />
          <Route path="/checkout" element={<Navigate to="/checkout-reserva" replace />} />
          <Route path="/modo-de-pagamento" element={<Navigate to="/pagamento" replace />} />
          <Route path="/desbloqueio-de-carro" element={<Navigate to="/desbloqueio" replace />} />
          <Route path="*" element={<Screen Page={NotFound} label="a página" />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default AppRoutes;
