import { Link } from "react-router-dom";

function NotFound() {
  return (
    <main>
      <section aria-labelledby="not-found-title">
        <p>Erro 404</p>
        <h1 id="not-found-title">Página não encontrada</h1>
        <p>O endereço que você tentou acessar não existe.</p>
        <Link to="/login">Voltar para o login</Link>
      </section>
    </main>
  );
}

export default NotFound;
