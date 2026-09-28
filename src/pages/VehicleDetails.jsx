import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import PublicAppShell from "../components/layout/PublicAppShell";
import { getAuthSession } from "../services/authSession";
import { getVeiculoById } from "../services/veiculoService";
import { getVehicleCharacteristics, resolveModelDetails } from "../utils/vehicleDisplay";
import { updateJourneyStep } from "../utils/journeyStorage";
import "../styles/home.css";

export default function VehicleDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "MOVA - Detalhes do veículo";
    let active = true;
    getVeiculoById(id)
      .then((result) => { if (active) setVehicle(result); })
      .catch((requestError) => { if (active) setError(requestError?.message || "Não foi possível carregar este veículo."); });
    return () => { active = false; };
  }, [id]);

  function reserve() {
    if (!getAuthSession()?.token) {
      navigate("/login", { state: { from: { pathname: location.pathname, search: "", hash: "", state: { intent: "reserve" } } } });
      return;
    }

    updateJourneyStep("veiculo", {
      id: vehicle.id,
      idModeloVeiculo: vehicle.idModeloVeiculo || "",
      idLocador: vehicle.idLocador || "",
      marca: vehicle.marca || "",
      modelo: vehicle.modelo || "",
      categoria: vehicle.categoria || "",
      capacidade: vehicle.capacidade || "",
      cambio: vehicle.cambio || "",
      ano: vehicle.ano || "",
      adaptado: Boolean(vehicle.adaptado),
      eletrico: Boolean(vehicle.eletrico),
      garagemId: vehicle.garagemId || vehicle.garagem?.id || "",
      garagemName: vehicle.garagem?.nome || "",
      status: vehicle.status || "",
    });
    navigate("/escolha-garagem-retirada");
  }

  if (error) return <PublicAppShell><p className="public-home__message" role="alert">{error}</p></PublicAppShell>;
  if (!vehicle) return <PublicAppShell><p className="public-home__message" role="status" aria-busy="true">Carregando veículo…</p></PublicAppShell>;

  const marca = vehicle.marca || "Marca não informada";
  const modelo = vehicle.modelo || "Modelo não informado";
  const details = resolveModelDetails(marca, modelo);
  const publicReservable = vehicle.status === "DISPONIVEL" && vehicle.garagem?.status !== "INATIVA" && Boolean(vehicle.garagemId || vehicle.garagem?.id);

  return (
    <PublicAppShell>
      <article className="vehicle-detail" aria-labelledby="vehicle-detail-title">
        <img src={details.image} alt={`${marca} ${modelo}`} className="vehicle-detail__image" />
        <div className="vehicle-detail__body">
          <p className="mova-eyebrow">Ficha técnica</p>
          <h1 id="vehicle-detail-title">{marca} {modelo}</h1>
          <p>{[vehicle.ano, ...getVehicleCharacteristics(vehicle)].filter(Boolean).join(" · ")}</p>
          <dl>
            <div><dt>Categoria</dt><dd>{vehicle.categoria || "Não informada"}</dd></div>
            <div><dt>Garagem</dt><dd>{vehicle.garagem?.nome || "Não informada"}</dd></div>
            <div><dt>Status</dt><dd>{vehicle.status || "Não informado"}</dd></div>
          </dl>
          {!publicReservable && <p className="public-home__message">Este veículo não está disponível para uma nova reserva.</p>}
          <button type="button" className="mova-button public-home__primary" disabled={!publicReservable} onClick={reserve}>
            Reservar este carro
          </button>
        </div>
      </article>
    </PublicAppShell>
  );
}
