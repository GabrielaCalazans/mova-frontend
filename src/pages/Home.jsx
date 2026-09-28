import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PublicAppShell from "../components/layout/PublicAppShell";
import { useAuthSession } from "../hooks/useAuthSession";
import { listVeiculos } from "../services/veiculoService";
import { resolveModelDetails } from "../utils/vehicleDisplay";
import "../styles/home.css";

const CATEGORIAS = [
  ["ECONOMICO", "Econômicos"],
  ["ESPACOSO", "Espaçosos"],
  ["EXECUTIVO", "Executivos"],
  ["PCD", "Adaptados PCD"],
  ["ELETRICO", "Elétricos"],
];

function CategoryCarousel({ categoria, onChange }) {
  return (
    <section className="public-home__category-carousel" role="group" aria-label="Filtrar por categoria">
      <h2 className="home-sr-only">Filtrar por categoria</h2>
      <div className="public-home__category-carousel-list">
        <button type="button" className="mova-button mova-button--quiet" aria-pressed={!categoria} onClick={() => onChange("")}>Todos</button>
        {CATEGORIAS.map(([value, label]) => (
          <button key={value} type="button" className="mova-button mova-button--quiet" aria-pressed={categoria === value} onClick={() => onChange(categoria === value ? "" : value)}>
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}

function Home() {
  const navigate = useNavigate();
  const session = useAuthSession();
  const [veiculos, setVeiculos] = useState([]);
  const [categoria, setCategoria] = useState("");
  const [filtroMarca, setFiltroMarca] = useState("");
  const [filtroModelo, setFiltroModelo] = useState("");
  const [filtroPcd, setFiltroPcd] = useState(false);
  const [filtroEletrico, setFiltroEletrico] = useState(false);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const filtros = useMemo(() => {
    return {
      ...(categoria && !["PCD", "ELETRICO"].includes(categoria) ? { categoria } : {}),
      ...(categoria === "PCD" || filtroPcd ? { pcd: true } : {}),
      ...(categoria === "ELETRICO" || filtroEletrico ? { eletrico: true } : {}),
      ...(filtroMarca.trim() ? { marca: filtroMarca.trim() } : {}),
      ...(filtroModelo.trim() ? { modelo: filtroModelo.trim() } : {}),
    };
  }, [categoria, filtroEletrico, filtroMarca, filtroModelo, filtroPcd]);

  useEffect(() => {
    document.title = "MOVA - Veículos disponíveis agora";
    let ativo = true;
    // Cada combinação de filtros inicia um novo request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setErro("");
    listVeiculos(filtros)
      .then((resultado) => { if (ativo) setVeiculos(resultado); })
      .catch((error) => { if (ativo) setErro(error?.message || "Não foi possível carregar os veículos."); })
      .finally(() => { if (ativo) setLoading(false); });
    return () => { ativo = false; };
  }, [filtros]);

  return (
    <PublicAppShell>
      <section className="public-home" aria-labelledby="home-title">
        <header className="public-home__intro">
          <p className="mova-eyebrow">Catálogo público</p>
          <h1 id="home-title">Veículos disponíveis agora</h1>
          <p>Veja os veículos, filtre por categoria e abra os detalhes sem criar conta.</p>
          {session?.token && (
            <button type="button" className="public-home__profile" onClick={() => navigate("/conta")} aria-label="Perfil">
              Perfil
            </button>
          )}
        </header>

        <section className="public-home__catalog" aria-labelledby="catalog-title">
          <div className="public-home__section-heading">
            <div>
              <p className="mova-eyebrow">Catálogo público</p>
              <h2 id="catalog-title">Veículos disponíveis</h2>
            </div>
            <p aria-live="polite">{loading ? "Carregando…" : `${veiculos.length} veículo(s)`}</p>
          </div>

          <form className="public-home__search" onSubmit={(event) => event.preventDefault()}>
            <label htmlFor="catalog-marca">Marca</label>
            <input id="catalog-marca" value={filtroMarca} onChange={(event) => setFiltroMarca(event.target.value)} placeholder="Ex.: Fiat" />
            <label htmlFor="catalog-modelo">Modelo</label>
            <input id="catalog-modelo" value={filtroModelo} onChange={(event) => setFiltroModelo(event.target.value)} placeholder="Ex.: Argo" />
            <label className="public-home__check"><input type="checkbox" checked={filtroPcd} onChange={(event) => setFiltroPcd(event.target.checked)} /> PCD</label>
            <label className="public-home__check"><input type="checkbox" checked={filtroEletrico} onChange={(event) => setFiltroEletrico(event.target.checked)} /> Elétrico</label>
          </form>

          {erro && <p className="public-home__message" role="alert">{erro}</p>}
          {!loading && !erro && veiculos.length === 0 && <p className="public-home__message">Nenhum veículo publicado para este filtro.</p>}
          {!loading && !erro && veiculos.length > 0 && (
            <div className="public-home__grid">
              {veiculos.map((veiculo, index) => {
                const marca = veiculo.marca || veiculo.modeloVeiculo?.marca || "Marca não informada";
                const modelo = veiculo.modelo || veiculo.modeloVeiculo?.modelo || "Modelo não informado";
                const details = resolveModelDetails(marca, modelo, categoria.toLowerCase());
                return (
                  <Fragment key={veiculo.id || `${marca}-${modelo}-${index}`}>
                    <article className="vehicle-card">
                      <img src={details.image} alt={`${marca} ${modelo}`} className="vehicle-card__image" />
                      <div className="vehicle-card__body">
                        <p className="mova-eyebrow">{veiculo.categoria || "Veículo"}</p>
                        <h3>{marca} {modelo}</h3>
                        <dl className="vehicle-card__specs">
                          <div><dt>Câmbio</dt><dd>{veiculo.cambio || "Não informado"}</dd></div>
                          <div><dt>Lugares</dt><dd>{veiculo.capacidade || "Não informado"}</dd></div>
                          <div><dt>Adaptado para PCD</dt><dd>{veiculo.adaptado ? "Sim" : "Não"}</dd></div>
                        </dl>
                        <p className="vehicle-card__location">{veiculo.garagem?.nome || veiculo.garagemNome || "Garagem não informada"}</p>
                        <p className="vehicle-card__price">
                          {Number.isFinite(Number(veiculo.valorDiaria))
                            ? <><strong>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(veiculo.valorDiaria))}</strong> por dia</>
                            : "Diária indisponível"}
                        </p>
                        <button type="button" className="mova-button mova-button--secondary" onClick={() => navigate(`/carros/${veiculo.id}`)}>
                          Ver detalhes
                        </button>
                      </div>
                    </article>
                    {(index === 2 || (veiculos.length < 3 && index === veiculos.length - 1)) && (
                      <CategoryCarousel categoria={categoria} onChange={setCategoria} />
                    )}
                  </Fragment>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </PublicAppShell>
  );
}

export default Home;
