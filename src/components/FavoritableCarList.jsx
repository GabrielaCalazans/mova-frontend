import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import BottomNav from "../components/BottomNav";
import { listVeiculos } from "../services/veiculoService";
import { resolveModelDetails } from "../utils/vehicleDisplay";
import { getFavoriteIds, toggleFavorite } from "../utils/favoritesStore";
import "../styles/carselect.css";
import "../styles/home.css";
import "../styles/relatorios.css";

function resolveModeloVeiculo(veiculo) {
  return veiculo?.modeloVeiculo ?? {};
}

function resolveVeiculoField(veiculo, modeloVeiculo, field) {
  return veiculo?.[field] ?? modeloVeiculo?.[field] ?? "";
}

export default function FavoritableCarList({ title, onlyFavorites, emptyMessage, documentTitle }) {
  const navigate = useNavigate();
  const [veiculos, setVeiculos] = useState([]);
  const [favoritos, setFavoritos] = useState(() => new Set(getFavoriteIds()));
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);

  const crossLinkRoute = onlyFavorites ? "/carros/disponiveis" : "/carros/favoritos";
  const crossLinkLabel = onlyFavorites ? "Ver carros disponíveis" : "Ver meus favoritos";

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);

    try {
      const resultado = await listVeiculos();
      setVeiculos(resultado);
    } catch (e) {
      setErro(e.message || "Não foi possível carregar os veículos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = documentTitle;
    carregar();
  }, [carregar, documentTitle]);

  function handleToggleFavorito(event, id) {
    event.stopPropagation();
    const nextIds = toggleFavorite(id);
    setFavoritos(new Set(nextIds));
  }

  const listaExibida = veiculos.filter((veiculo) =>
    onlyFavorites ? favoritos.has(String(veiculo.id)) : true
  );

  return (
    <main className="carro-page">
      <div className="carro-header">
        <h1>{title}</h1>
      </div>

      <div className="carro-content">
        {loading && <p className="carro-status">Carregando veículos…</p>}
        {!loading && erro && <p className="carro-status">{erro}</p>}

        {!loading && !erro && listaExibida.length === 0 && (
          <p className="carro-empty-state">{emptyMessage}</p>
        )}

        {!loading && !erro && listaExibida.length > 0 && (
          <div className="fav-list">
            {listaExibida.map((veiculo) => {
              const modeloVeiculo = resolveModeloVeiculo(veiculo);
              const marca = resolveVeiculoField(veiculo, modeloVeiculo, "marca");
              const modelo = resolveVeiculoField(veiculo, modeloVeiculo, "modelo");
              const details = resolveModelDetails(marca, modelo);
              const isFav = favoritos.has(String(veiculo.id));

              return (
                <div
                  className="fav-card"
                  key={veiculo.id}
                  onClick={() => navigate("/carros/lista", { state: {} })}
                >
                  <img src={details.image} alt={`${marca} ${modelo}`} className="fav-card__image" />
                  <div className="fav-card__info">
                    <h3>{modelo}</h3>
                    <p>{marca}</p>
                    <p>{details.cor}</p>
                    <p>{details.precoDia ? `R$${details.precoDia},00 /dia` : "Consulte o preço"}</p>
                  </div>
                  <button
                    type="button"
                    className="fav-card__heart"
                    aria-label={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                    aria-pressed={isFav}
                    onClick={(event) => handleToggleFavorito(event, veiculo.id)}
                  >
                    <Heart size={24} fill={isFav ? "currentColor" : "none"} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <p className="relatorio-filter-summary" style={{ marginTop: "1rem" }}>
          <button type="button" onClick={() => navigate(crossLinkRoute)}>
            {crossLinkLabel}
          </button>
        </p>
      </div>

      <BottomNav />
    </main>
  );
}
