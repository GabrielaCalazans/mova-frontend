import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Cadastro from "../pages/Cadastro";
import CadastroLocador from "../pages/CadastroLocador";
import ForgotPassword from "../pages/ForgotPassword";
import Login from "../pages/Login";
import Conta from "../pages/Conta";
import CarrosScreen from "../pages/CarrosScreen";
import TiposDeCarros from "../pages/TiposDeCarros";
import EscolhaGaragemRetirada from "../pages/EscolhaGaragemRetirada";
import EscolhaGaragemDevolucao from "../pages/EscolhaGaragemDevolucao";
import CheckoutReserva from "../pages/CheckoutReserva";
import Pagamento from "../pages/Pagamento";
import DesbloqueioDeCarro from "../pages/DesbloqueioDeCarro";
import RastreamentoReserva from "../pages/RastreamentoReserva";
import DevolucaoReserva from "../pages/DevolucaoReserva";
import AvaliacaoReserva from "../pages/AvaliacaoReserva";
import ServicosOpcionais from "../pages/ServicosOpcionais";
import CondutoresAdicionais from "../pages/CondutoresAdicionais";
import CancelamentoReserva from "../pages/CancelamentoReserva";
import RelatoriosFiltro from "../pages/RelatoriosFiltro";
import RelatoriosVeiculos from "../pages/RelatoriosVeiculos";
import CarrosDisponiveis from "../pages/CarrosDisponiveis";
import CarrosFavoritados from "../pages/CarrosFavoritados";
import CadastroDeCarros from "../pages/CadastroDeCarros";
import CadastroCarroForm from "../pages/CadastroCarroForm";
import CadastroDeGaragens from "../pages/CadastroDeGaragens";
import CadastroGaragemForm from "../pages/CadastroGaragemForm";
import CapacidadeGaragem from "../pages/CapacidadeGaragem";
import Historico from "../pages/Historico";
import PendenciasFinanceiras from "../pages/PendenciasFinanceiras";
import RelatoriosAvaliacoesFiltro from "../pages/RelatoriosAvaliacoesFiltro";
import RelatoriosAvaliacoes from "../pages/RelatoriosAvaliacoes";
import Suporte from "../pages/Suporte";
import Configuracoes from "../pages/Configuracoes";
import InteressesDisponibilidade from "../pages/InteressesDisponibilidade";
import Home from "../pages/Home";
import { getAuthSession } from "../services/authSession";

function NotFound() {
  return <Navigate to="/login" replace />;
}

function ProtectedRoute({ children }) {
  const session = getAuthSession();

  if (!session?.token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/cadastro-locatario" element={<Cadastro />} />
        <Route path="/cadastro-locador" element={<CadastroLocador />} />
        <Route path="/recuperar-senha" element={<ForgotPassword />} />
        <Route path="/conta" element={<ProtectedRoute><Conta /></ProtectedRoute>} />
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />

        <Route path="/tipos-carros" element={<Navigate to="/carros" replace />} />
        <Route path="/carros" element={<ProtectedRoute><TiposDeCarros /></ProtectedRoute>} />
        <Route path="/carros/lista" element={<ProtectedRoute><CarrosScreen /></ProtectedRoute>} />
        <Route path="/escolha-garagem-retirada" element={<ProtectedRoute><EscolhaGaragemRetirada /></ProtectedRoute>} />
        <Route path="/escolha-garagem-devolucao" element={<ProtectedRoute><EscolhaGaragemDevolucao /></ProtectedRoute>} />
        <Route path="/servicos-opcionais" element={<ProtectedRoute><ServicosOpcionais /></ProtectedRoute>} />
        <Route path="/checkout-reserva" element={<ProtectedRoute><CheckoutReserva /></ProtectedRoute>} />
        <Route path="/condutores-adicionais" element={<ProtectedRoute><CondutoresAdicionais /></ProtectedRoute>} />
        <Route path="/pagamento" element={<ProtectedRoute><Pagamento /></ProtectedRoute>} />
        <Route path="/desbloqueio" element={<ProtectedRoute><DesbloqueioDeCarro /></ProtectedRoute>} />
        <Route path="/reserva/:id/localizacao" element={<ProtectedRoute><RastreamentoReserva /></ProtectedRoute>} />
        <Route path="/devolucao" element={<ProtectedRoute><DevolucaoReserva /></ProtectedRoute>} />
        <Route path="/cancelamento" element={<ProtectedRoute><CancelamentoReserva /></ProtectedRoute>} />
        <Route path="/avaliacao" element={<ProtectedRoute><AvaliacaoReserva /></ProtectedRoute>} />
        <Route path="/relatorios" element={<ProtectedRoute><RelatoriosFiltro /></ProtectedRoute>} />
        <Route path="/relatorios/veiculos" element={<ProtectedRoute><RelatoriosVeiculos /></ProtectedRoute>} />
        <Route path="/carros/disponiveis" element={<ProtectedRoute><CarrosDisponiveis /></ProtectedRoute>} />
        <Route path="/carros/favoritos" element={<ProtectedRoute><CarrosFavoritados /></ProtectedRoute>} />
        <Route path="/cadastro-carros" element={<ProtectedRoute><CadastroDeCarros /></ProtectedRoute>} />
        <Route path="/cadastro-carros/:id" element={<ProtectedRoute><CadastroCarroForm /></ProtectedRoute>} />
        <Route path="/cadastro-garagens" element={<ProtectedRoute><CadastroDeGaragens /></ProtectedRoute>} />
        <Route path="/cadastro-garagens/:id/capacidade" element={<ProtectedRoute><CapacidadeGaragem /></ProtectedRoute>} />
        <Route path="/cadastro-garagens/:id" element={<ProtectedRoute><CadastroGaragemForm /></ProtectedRoute>} />

        <Route path="/historico" element={<ProtectedRoute><Historico /></ProtectedRoute>} />
        <Route path="/pendencias-financeiras" element={<ProtectedRoute><PendenciasFinanceiras /></ProtectedRoute>} />
        <Route path="/relatorios/avaliacoes-filtro" element={<ProtectedRoute><RelatoriosAvaliacoesFiltro /></ProtectedRoute>} />
        <Route path="/relatorios/avaliacoes" element={<ProtectedRoute><RelatoriosAvaliacoes /></ProtectedRoute>} />
        <Route path="/suporte" element={<ProtectedRoute><Suporte /></ProtectedRoute>} />
        <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
        <Route path="/interesses" element={<ProtectedRoute><InteressesDisponibilidade /></ProtectedRoute>} />

        <Route path="/carros-screens" element={<Navigate to="/carros" replace />} />
        <Route path="/escolha-garagem" element={<Navigate to="/escolha-garagem-retirada" replace />} />
        <Route path="/agendamento" element={<Navigate to="/escolha-garagem-retirada" replace />} />
        <Route path="/escolha-data-e-hora" element={<Navigate to="/escolha-garagem-retirada" replace />} />
        <Route path="/checkout" element={<Navigate to="/checkout-reserva" replace />} />
        <Route path="/modo-de-pagamento" element={<Navigate to="/pagamento" replace />} />
        <Route path="/desbloqueio-de-carro" element={<Navigate to="/desbloqueio" replace />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
