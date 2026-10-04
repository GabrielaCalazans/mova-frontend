import { Fragment, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBolt, faWheelchair } from "@fortawesome/free-solid-svg-icons";
import PublicAppShell from "../components/layout/PublicAppShell";
import CursorGlowArea from "../components/ui/CursorGlowArea";
import VehicleCard from "../components/vehicle/VehicleCard";
import { vehicleTitle } from "../utils/vehicleDisplay";
import { listVeiculos } from "../services/veiculoService";
import "../styles/vehicle.css";
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
    <section className="category-strip public-home__category-carousel" role="group" aria-labelledby="categorias-title" data-capture="carousel">
      <h2 id="categorias-title">Filtrar por categoria</h2>
      <div className="category-strip__list">
        <button type="button" className="chip" aria-pressed={!categoria} onClick={() => onChange("")}>Todos</button>
        {CATEGORIAS.map(([value, label]) => (
          <button key={value} type="button" className="chip" aria-pressed={categoria === value} onClick={() => onChange(categoria === value ? "" : value)}>
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}

function SkeletonGrid() {
  return (
    <div className="vehicle-grid" aria-hidden="true">
      {[0, 1, 2].map((item) => (
        <div key={item} className="vcard vcard--skeleton">
          <div className="skeleton" style={{ aspectRatio: "16 / 10" }} />
          <div className="vcard__body">
            <div className="skeleton" style={{ height: 24, width: "60%" }} />
            <div className="skeleton" style={{ height: 16, width: "40%" }} />
            <div className="skeleton" style={{ height: 44, marginTop: 24 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Home() {
  const [veiculos, setVeiculos] = useState([]);
  const [categoria, setCategoria] = useState("");
  const [filtroMarca, setFiltroMarca] = useState("");
  const [filtroModelo, setFiltroModelo] = useState("");
  const [filtroPcd, setFiltroPcd] = useState(false);
  const [filtroEletrico, setFiltroEletrico] = useState(false);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [tentativa, setTentativa] = useState(0);

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
  }, [filtros, tentativa]);

  const filtrando = Object.keys(filtros).length > 0;
  const nomeCategoria = CATEGORIAS.find(([value]) => value === categoria)?.[1];

  function limparFiltros() {
    setCategoria("");
    setFiltroMarca("");
    setFiltroModelo("");
    setFiltroPcd(false);
    setFiltroEletrico(false);
  }

  return (
    <PublicAppShell>
      <section className="public-home" aria-labelledby="home-title">
        <header className="page-head">
          <h1 id="home-title">Veículos disponíveis agora</h1>
          <p className="page-head__lede">Veja os veículos, filtre por categoria e abra os detalhes sem criar conta.</p>
        </header>

        <section className="public-home__catalog" aria-labelledby="catalog-title">
          <h2 id="catalog-title" className="sr-only">Buscar veículos</h2>
          <form className="catalog-search" role="search" aria-label="Buscar veículos" onSubmit={(event) => event.preventDefault()}>
            <div className="field">
              <label className="field__label" htmlFor="catalog-marca">Marca</label>
              <input id="catalog-marca" className="field__control" value={filtroMarca} onChange={(event) => setFiltroMarca(event.target.value)} placeholder="Ex.: Fiat" autoComplete="off" />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="catalog-modelo">Modelo</label>
              <input id="catalog-modelo" className="field__control" value={filtroModelo} onChange={(event) => setFiltroModelo(event.target.value)} placeholder="Ex.: Argo" autoComplete="off" />
            </div>
            <div className="catalog-search__toggles">
              <label className="toggle-chip">
                <input type="checkbox" checked={filtroPcd} onChange={(event) => setFiltroPcd(event.target.checked)} />
                <span><FontAwesomeIcon icon={faWheelchair} aria-hidden="true" />PCD</span>
              </label>
              <label className="toggle-chip">
                <input type="checkbox" checked={filtroEletrico} onChange={(event) => setFiltroEletrico(event.target.checked)} />
                <span><FontAwesomeIcon icon={faBolt} aria-hidden="true" />Elétrico</span>
              </label>
            </div>
          </form>

          <p className="resultbar" role="status" aria-live="polite">
            {loading ? (
              <span>Carregando veículos…</span>
            ) : erro ? (
              <span>Catálogo indisponível</span>
            ) : (
              <>
                <span><strong className="tabular">{veiculos.length}</strong> {veiculos.length === 1 ? "veículo disponível" : "veículos disponíveis"}</span>
                <span>{nomeCategoria ? `Categoria ${nomeCategoria}` : "Todas as categorias"}</span>
              </>
            )}
          </p>

          <div className="public-home__results">
            {loading && <SkeletonGrid />}

            {!loading && erro && (
              <div className="state-block state-block--error" role="alert">
                <h3 className="state-block__title">Não conseguimos carregar os veículos</h3>
                <p className="state-block__text">{erro} Verifique sua conexão e tente de novo.</p>
                <button type="button" className="btn btn--secondary" onClick={() => setTentativa((valor) => valor + 1)}>Tentar novamente</button>
              </div>
            )}

            {!loading && !erro && veiculos.length === 0 && (
              <>
                <div className="state-block public-home__message">
                  <h3 className="state-block__title">{filtrando ? "Nenhum veículo para este filtro" : "Nenhum veículo publicado agora"}</h3>
                  <p className="state-block__text">
                    {filtrando
                      ? "Nenhum veículo publicado para este filtro. Limpe os filtros para ver a lista completa."
                      : "Novos veículos aparecem aqui assim que um locador os publica."}
                  </p>
                  {filtrando && <button type="button" className="btn btn--secondary" onClick={limparFiltros}>Limpar filtros</button>}
                </div>
                <CategoryCarousel categoria={categoria} onChange={setCategoria} />
              </>
            )}

            {!loading && !erro && veiculos.length > 0 && (
              <CursorGlowArea className="vehicle-grid public-home__grid">
                {veiculos.map((veiculo, index) => {
                  const nome = vehicleTitle(veiculo);
                  return (
                    <Fragment key={veiculo.id || `${nome}-${index}`}>
                      <VehicleCard
                        vehicle={veiculo}
                        className="vehicle-card"
                        titleTo={`/carros/${veiculo.id}`}
                        actions={(
                          <Link className="btn btn--secondary" to={`/carros/${veiculo.id}`}>
                            Ver detalhes<span className="sr-only"> de {nome}</span>
                          </Link>
                        )}
                      />
                      {(index === 2 || (veiculos.length < 3 && index === veiculos.length - 1)) && (
                        <CategoryCarousel categoria={categoria} onChange={setCategoria} />
                      )}
                    </Fragment>
                  );
                })}
              </CursorGlowArea>
            )}
          </div>
        </section>
      </section>
    </PublicAppShell>
  );
}

export default Home;
