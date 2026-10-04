import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faBellSlash } from "@fortawesome/free-solid-svg-icons";
import BottomNav from "../components/BottomNav";
import CursorGlowArea from "./ui/CursorGlowArea";
import VehicleCard from "./vehicle/VehicleCard";
import { listVeiculos, normalizeVeiculo } from "../services/veiculoService";
import { desfavoritar, favoritar, listarFavoritos } from "../services/favoritoService";
import { cancelarInteresse, listarInteresses, registrarInteresse } from "../services/interesseService";
import { t } from "../i18n";
import "../styles/vehicle.css";

export default function FavoritableCarList({ title, onlyFavorites, emptyMessage, documentTitle }) {
  const navigate = useNavigate();
  const [veiculos, setVeiculos] = useState([]);
  const [favoritos, setFavoritos] = useState(new Set());
  const [interesses, setInteresses] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  // Falha ao favoritar/avisar não invalida a lista já carregada.
  const [erroAcao, setErroAcao] = useState(null);

  const crossLinkRoute = onlyFavorites ? "/carros/disponiveis" : "/carros/favoritos";
  const crossLinkLabel = onlyFavorites ? t("reservation.list.browseCars") : t("tenant.carList.viewFavorites");

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);

    try {
      const [favoritosApi, interessesApi, resultado] = await Promise.all([
        listarFavoritos(),
        listarInteresses(),
        onlyFavorites ? Promise.resolve([]) : listVeiculos(),
      ]);
      setFavoritos(new Set(favoritosApi.map((item) => String(item.idVeiculo))));
      setInteresses(new Set(interessesApi.map((item) => String(item.idVeiculo))));
      // Favorito órfão (veículo removido) não pode derrubar a lista inteira.
      setVeiculos(onlyFavorites ? favoritosApi.map((item) => normalizeVeiculo(item.veiculo)).filter(Boolean) : resultado);
    } catch (e) {
      setErro(e.message || t("tenant.carList.loadError"));
    } finally {
      setLoading(false);
    }
  }, [onlyFavorites]);

  useEffect(() => {
    document.title = documentTitle;
    queueMicrotask(() => {
      void carregar();
    });
  }, [carregar, documentTitle]);

  function toggleIn(setter, id) {
    setter((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(String(id))) proximo.delete(String(id));
      else proximo.add(String(id));
      return proximo;
    });
  }

  async function handleToggleFavorito(id) {
    setErroAcao(null);
    try {
      if (favoritos.has(String(id))) await desfavoritar(id);
      else await favoritar(id);
      toggleIn(setFavoritos, id);
    } catch (e) {
      setErroAcao(e.message || t("tenant.carList.favoriteError"));
    }
  }

  async function handleToggleInteresse(id) {
    setErroAcao(null);
    try {
      if (interesses.has(String(id))) await cancelarInteresse(id);
      else await registrarInteresse(id);
      toggleIn(setInteresses, id);
    } catch (e) {
      setErroAcao(e.message || t("tenant.carList.alertError"));
    }
  }

  const listaExibida = veiculos.filter((veiculo) =>
    onlyFavorites ? favoritos.has(String(veiculo.id)) : true
  );

  return (
    <main className="carro-page catalog-page">
      <header className="page-head">
        <h1>{title}</h1>
      </header>

      <div className="catalog-page__body">
        {loading && <p className="loading-state carro-status" role="status"><span className="spinner" aria-hidden="true" />{t("tenant.carList.loading")}</p>}
        {!loading && erro && <p className="alert alert--danger carro-status" role="alert">{erro}</p>}
        {!loading && !erro && erroAcao && <p className="alert alert--danger carro-status" role="alert">{erroAcao}</p>}

        {!loading && !erro && listaExibida.length === 0 && (
          <div className="state-block carro-empty-state">
            <p className="state-block__text">{emptyMessage}</p>
          </div>
        )}

        {!loading && !erro && listaExibida.length > 0 && (
          <CursorGlowArea className="vehicle-grid fav-list">
            {listaExibida.map((veiculo) => {
              const avisando = interesses.has(String(veiculo.id));
              return (
                <VehicleCard
                  key={veiculo.id}
                  vehicle={veiculo}
                  className="fav-card"
                  favorite={{ active: favoritos.has(String(veiculo.id)), onToggle: () => handleToggleFavorito(veiculo.id) }}
                  actions={(
                    <>
                      <button type="button" className="btn btn--secondary" onClick={() => navigate(`/carros/${veiculo.id}`)}>
                        {t("tenant.carList.details")}
                      </button>
                      <button type="button" className="btn btn--quiet" aria-pressed={avisando} onClick={() => handleToggleInteresse(veiculo.id)}>
                        <FontAwesomeIcon icon={avisando ? faBellSlash : faBell} aria-hidden="true" />
                        {avisando ? t("tenant.interests.cancel") : t("tenant.interests.notify")}
                      </button>
                    </>
                  )}
                />
              );
            })}
          </CursorGlowArea>
        )}

        <p className="catalog-page__crosslink">
          <button type="button" className="btn btn--quiet" onClick={() => navigate(crossLinkRoute)}>
            {crossLinkLabel}
          </button>
        </p>
      </div>

      <BottomNav />
    </main>
  );
}
