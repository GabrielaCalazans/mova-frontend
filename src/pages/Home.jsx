import { Fragment, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBolt, faWheelchair } from "@fortawesome/free-solid-svg-icons";
import PublicAppShell from "../components/layout/PublicAppShell";
import CursorGlowArea from "../components/ui/CursorGlowArea";
import VehicleCard from "../components/vehicle/VehicleCard";
import { vehicleTitle } from "../utils/vehicleDisplay";
import { listVeiculos } from "../services/veiculoService";
import { t } from "../i18n";
import "../styles/vehicle.css";
import "../styles/home.css";

// Rótulo traduzido na hora do render (o idioma pode mudar depois do import).
const CATEGORIAS = ["ECONOMICO", "ESPACOSO", "EXECUTIVO", "PCD", "ELETRICO"];
const categoriaLabel = (value) => t(`catalog.categories.${value.toLowerCase()}`);

function CategoryCarousel({ categoria, onChange }) {
  return (
    <section className="category-strip public-home__category-carousel" role="group" aria-labelledby="categorias-title" data-capture="carousel">
      <h2 id="categorias-title">{t("catalog.home.filterByCategory")}</h2>
      <div className="category-strip__list">
        <button type="button" className="chip" aria-pressed={!categoria} onClick={() => onChange("")}>{t("catalog.home.all")}</button>
        {CATEGORIAS.map((value) => (
          <button key={value} type="button" className="chip" aria-pressed={categoria === value} onClick={() => onChange(categoria === value ? "" : value)}>
            {categoriaLabel(value)}
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
    document.title = t("catalog.home.documentTitle");
    let ativo = true;
    // Cada combinação de filtros inicia um novo request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setErro("");
    listVeiculos(filtros)
      .then((resultado) => { if (ativo) setVeiculos(resultado); })
      .catch((error) => { if (ativo) setErro(error?.message || t("catalog.home.loadError")); })
      .finally(() => { if (ativo) setLoading(false); });
    return () => { ativo = false; };
  }, [filtros, tentativa]);

  const filtrando = Object.keys(filtros).length > 0;
  const nomeCategoria = categoria ? categoriaLabel(categoria) : "";

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
          <h1 id="home-title">{t("catalog.home.title")}</h1>
          <p className="page-head__lede">{t("catalog.home.lede")}</p>
        </header>

        <section className="public-home__catalog" aria-labelledby="catalog-title">
          <h2 id="catalog-title" className="sr-only">{t("catalog.home.searchTitle")}</h2>
          <form className="catalog-search" role="search" aria-label={t("catalog.home.searchTitle")} onSubmit={(event) => event.preventDefault()}>
            <div className="field">
              <label className="field__label" htmlFor="catalog-marca">{t("catalog.home.brand")}</label>
              <input id="catalog-marca" className="field__control" value={filtroMarca} onChange={(event) => setFiltroMarca(event.target.value)} placeholder={t("catalog.home.brandPlaceholder")} autoComplete="off" />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="catalog-modelo">{t("catalog.home.model")}</label>
              <input id="catalog-modelo" className="field__control" value={filtroModelo} onChange={(event) => setFiltroModelo(event.target.value)} placeholder={t("catalog.home.modelPlaceholder")} autoComplete="off" />
            </div>
            <div className="catalog-search__toggles">
              <label className="toggle-chip">
                <input type="checkbox" checked={filtroPcd} onChange={(event) => setFiltroPcd(event.target.checked)} />
                <span><FontAwesomeIcon icon={faWheelchair} aria-hidden="true" />{t("catalog.home.pcd")}</span>
              </label>
              <label className="toggle-chip">
                <input type="checkbox" checked={filtroEletrico} onChange={(event) => setFiltroEletrico(event.target.checked)} />
                <span><FontAwesomeIcon icon={faBolt} aria-hidden="true" />{t("catalog.home.electric")}</span>
              </label>
            </div>
          </form>

          <p className="resultbar" role="status" aria-live="polite">
            {loading ? (
              <span>{t("catalog.home.loading")}</span>
            ) : erro ? (
              <span>{t("catalog.home.unavailable")}</span>
            ) : (
              <>
                <span><strong className="tabular">{veiculos.length}</strong> {t(veiculos.length === 1 ? "catalog.home.availableOne" : "catalog.home.availableOther")}</span>
                <span>{nomeCategoria ? t("catalog.home.categoryName", { name: nomeCategoria }) : t("catalog.home.allCategories")}</span>
              </>
            )}
          </p>

          <div className="public-home__results">
            {loading && <SkeletonGrid />}

            {!loading && erro && (
              <div className="state-block state-block--error" role="alert">
                <h3 className="state-block__title">{t("catalog.home.errorTitle")}</h3>
                <p className="state-block__text">{erro} {t("catalog.home.errorHint")}</p>
                <button type="button" className="btn btn--secondary" onClick={() => setTentativa((valor) => valor + 1)}>{t("catalog.home.retry")}</button>
              </div>
            )}

            {!loading && !erro && veiculos.length === 0 && (
              <>
                <div className="state-block public-home__message">
                  <h3 className="state-block__title">{filtrando ? t("catalog.home.emptyFilteredTitle") : t("catalog.home.emptyTitle")}</h3>
                  <p className="state-block__text">
                    {filtrando
                      ? t("catalog.home.emptyFilteredText")
                      : t("catalog.home.emptyText")}
                  </p>
                  {filtrando && <button type="button" className="btn btn--secondary" onClick={limparFiltros}>{t("catalog.home.clearFilters")}</button>}
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
                            {t("catalog.home.viewDetails")}<span className="sr-only">{t("catalog.home.viewDetailsOf", { name: nome })}</span>
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
