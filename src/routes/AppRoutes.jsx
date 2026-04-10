import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Cadastro from "../pages/Cadastro";
import CadastroLocador from "../pages/CadastroLocador";
import ForgotPassword from "../pages/ForgotPassword";
import Login from "../pages/Login";
import Conta from "../pages/Conta";

function NotFound() {
  return <Navigate to="/login" replace />;
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
        <Route path="/conta" element={<Conta />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;