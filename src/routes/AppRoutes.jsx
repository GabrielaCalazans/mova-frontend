import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Cadastro from "../pages/Cadastro";
import CadastroLocador from "../pages/CadastroLocador";
import ForgotPassword from "../pages/ForgotPassword";
import Login from "../pages/Login";
import Conta from "../pages/Conta";
import TiposDeCarros from "../pages/TiposDeCarros";
import CarrosScreen from "../pages/CarrosScreen";
import EscolhaGaragem from "../pages/EscolhaGaragem";
import DataHora from "../pages/DataHora";
import Pagamento from "../pages/Pagamento";
import DesbloqueioDeCarro from "../pages/DesbloqueioDeCarro";
import Historico from "../pages/Historico";
import Suporte from "../pages/Suporte";
import Configuracoes from "../pages/Configuracoes";
import { getAuthSession } from "../services/authSession";

function NotFound() {
  return <Navigate to="/login" replace />;
}

function ProtectedRoute({ children }) {
  const session = getAuthSession();

  if (!session?.user) {
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

        <Route path="/tipos-carros" element={<ProtectedRoute><TiposDeCarros /></ProtectedRoute>} />
        <Route path="/carros" element={<ProtectedRoute><CarrosScreen /></ProtectedRoute>} />
        <Route path="/escolha-garagem" element={<ProtectedRoute><EscolhaGaragem /></ProtectedRoute>} />
        <Route path="/agendamento" element={<ProtectedRoute><DataHora /></ProtectedRoute>} />
        <Route path="/pagamento" element={<ProtectedRoute><Pagamento /></ProtectedRoute>} />
        <Route path="/desbloqueio" element={<ProtectedRoute><DesbloqueioDeCarro /></ProtectedRoute>} />

        <Route path="/historico" element={<ProtectedRoute><Historico /></ProtectedRoute>} />
        <Route path="/suporte" element={<ProtectedRoute><Suporte /></ProtectedRoute>} />
        <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />

        <Route path="/carros-screens" element={<Navigate to="/carros" replace />} />
        <Route path="/escolha-data-e-hora" element={<Navigate to="/agendamento" replace />} />
        <Route path="/modo-de-pagamento" element={<Navigate to="/pagamento" replace />} />
        <Route path="/desbloqueio-de-carro" element={<Navigate to="/desbloqueio" replace />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;