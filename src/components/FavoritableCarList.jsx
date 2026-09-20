import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import BottomNav from "../components/BottomNav";
import { listVeiculos } from "../services/veiculoService";
import { normalizeVeiculo } from "../services/veiculoService";
import { getVehicleCharacteristics, resolveModelDetails } from "../utils/vehicleDisplay";
import { desfavoritar, favoritar, listarFavoritos } from "../services/favoritoService";
import { cancelarInteresse, listarInteresses, registrarInteresse } from "../services/interesseService";
import { formatMoneyBRL } from "../utils/reservationMath";
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
  const [favoritos, setFavoritos] = useState(new Set());
  const [interesses, setInteresses] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);

  const crossLinkRoute = onlyFavorites ? "/carros/disponiveis" : "/carros/favoritos";
  const crossLinkLabel = onlyFavorites ? "Ver carros disponíveis" : "Ver meus favoritos";

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
      setVeiculos(onlyFavorites ? favoritosApi.map((item) => normalizeVeiculo(item.veiculo)) : resultado);
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

  async function handleToggleFavorito(event, id) {
    event.stopPropagation();
    try {
      if (favoritos.has(String(id))) await desfavoritar(id);
      else await favoritar(id);
      setFavoritos((atual) => {
        const proximo = new Set(atual);
        if (proximo.has(String(id))) proximo.delete(String(id));
        else proximo.add(String(id));
        return proximo;
      });
    } catch (e) {
      setErro(e.message || "Não foi possível atualizar o favorito.");
    }
  }

  async function handleToggleInteresse(event, id) {
    event.stopPropagation();
    try {
      if (interesses.has(String(id))) await cancelarInteresse(id);
      else await registrarInteresse(id);
      setInteresses((atual) => {
        const proximo = new Set(atual);
        if (proximo.has(String(id))) proximo.delete(String(id));
        else proximo.add(String(id));
        return proximo;
      });
    } catch (e) {
      setErro(e.message || "Não foi possível atualizar o aviso de disponibilidade.");
    }
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
              const caracteristicas = getVehicleCharacteristics(veiculo);
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
                    {caracteristicas.map((caracteristica) => (
                      <p key={caracteristica}>{caracteristica}</p>
                    ))}
                    <p>{veiculo.valorDiaria != null ? `${formatMoneyBRL(veiculo.valorDiaria)} /dia` : "Consulte o preço"}</p>
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
                  <button
                    type="button"
                    className="carro-button"
                    aria-pressed={interesses.has(String(veiculo.id))}
                    onClick={(event) => handleToggleInteresse(event, veiculo.id)}
                  >
                    {interesses.has(String(veiculo.id)) ? "Cancelar aviso" : "Avisar quando disponível"}
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
