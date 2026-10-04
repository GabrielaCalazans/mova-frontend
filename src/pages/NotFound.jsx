import { Link } from "react-router-dom";
import "../styles/journey.css";
import "../styles/postcompra.css";

function NotFound() {
  return (
    <main className="journey-page">
      <section className="state-block" aria-labelledby="not-found-title">
        <p className="notfound__code">Erro 404</p>
        <h1 id="not-found-title">Página não encontrada</h1>
        <p className="state-block__text">O endereço que você tentou acessar não existe.</p>
        <div className="journey-actions">
          <Link to="/" className="btn">Ir para a página inicial</Link>
          <Link to="/login" className="btn btn--secondary">Voltar para o login</Link>
        </div>
      </section>
    </main>
  );
}

export default NotFound;
