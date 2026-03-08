import { useEffect } from "react";
import movaLogo from "../assets/mova_logo.png";
import AuthLayout from "../layout/AuthLayout";

function Register() {
  useEffect(() => {
    document.title = "MOVA - Cadastre-se";
  }, []);
  return (
    <AuthLayout
      title="Cadastro"
      logoSrc={movaLogo}
      logoAlt="Mova Logo"
      footerText="Ja tem conta?"
      footerLinkTo="/login"
      footerLinkLabel="Entrar"
    >
      <form className="auth-form">
        <input type="text" name="name" placeholder="Nome Completo" aria-label="Nome Completo" required />
        <input type="email" name="email" placeholder="E-mail" aria-label="E-mail" required />
        <input type="text" name="celphone" placeholder="Numero de Celular" aria-label="Numero de Celular" required />
        <input type="text" name="cpf" placeholder="Numero de CPF" aria-label="Numero de CPF" required />
        <input type="text" name="cnh" placeholder="Numero de CNH" aria-label="Numero de CNH" required />
        <input type="text" name="address" placeholder="Endereco Completo" aria-label="Endereco Completo" required />
        <input type="text" name="cep" placeholder="CEP" aria-label="CEP" required />
        <input type="password" name="password" placeholder="Senha" aria-label="Senha" required />

        <button type="submit">Cadastrar</button>
      </form>
    </AuthLayout>
  );
}

export default Register;