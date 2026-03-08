import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../layout/AuthLayout";
import movaLogo from "../assets/mova_logo.png";

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  useEffect(() => {
    document.title = "MOVA - Login";
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    console.log({ email, senha });
  }

  return (
    <AuthLayout
      title="Login"
      logoSrc={movaLogo}
      logoAlt="Mova Logo"
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <input
          id="email"
          type="email"
          placeholder="seuemail@exemplo.com"
          aria-label="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          id="senha"
          type="password"
          placeholder="Senha"
          aria-label="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />

        <div className="auth-actions">
          <button type="submit">Entrar</button>
          <Link to="/cadastro" className="auth-button-secondary">
            Cadastre-se
          </Link>
        </div>

        <p className="auth-forgot">
          <Link to="/esqueci-senha">Esqueci minha senha</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default Login;