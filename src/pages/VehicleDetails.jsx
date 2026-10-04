import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faBan, faBell, faBolt, faCheck, faHeart as faHeartSolid, faLocationDot, faWheelchair, faXmark } from "@fortawesome/free-solid-svg-icons";
import { faHeart } from "@fortawesome/free-regular-svg-icons";
import PublicAppShell from "../components/layout/PublicAppShell";
import VehicleMedia from "../components/vehicle/VehicleMedia";
import { getAuthSession } from "../services/authSession";
import { getUserCargo } from "../services/authIdentity";
import { getVeiculoById } from "../services/veiculoService";
import { getGaragemById } from "../services/garagemService";
import { listServicos } from "../services/servicoService";
import { desfavoritar, favoritar, listarFavoritos } from "../services/favoritoService";
import { cancelarInteresse, listarInteresses, registrarInteresse } from "../services/interesseService";
import { formatCambio, formatCategoria, resolveVehicleImages } from "../utils/vehicleDisplay";
import { formatMoneyBRL } from "../utils/reservationMath";
import { updateJourneyStep } from "../utils/journeyStorage";
import "../styles/vehicle.css";
import "../styles/home.css";

const STATUS_LABEL = { RESERVADO: "Reservado no momento", MANUTENCAO: "Em manutenção", INATIVO: "Fora do catálogo" };

function Gallery({ vehicle, nome }) {
  const images = resolveVehicleImages(vehicle);
  const [index, setIndex] = useState(0);

  return (
    <section className="gallery" aria-label={`Fotos de ${nome}`}>
      <VehicleMedia vehicle={vehicle} index={index} eager />
      {images.length > 1 && (
        <ul className="gallery__thumbs">
          {images.map((image, imageIndex) => (
            <li key={`${image.src}-${imageIndex}`}>
              <button
                type="button"
                className="gallery__thumb"
                aria-current={imageIndex === index ? "true" : undefined}
                onClick={() => setIndex(imageIndex)}
              >
                <img src={image.src} alt="" loading="lazy" decoding="async" />
                <span className="sr-only">Ver foto {imageIndex + 1} de {images.length}: {image.alt}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AccessItem({ ok, icon, title, children, tone }) {
  const variant = tone ?? (ok ? "yes" : "no");
  return (
    <li>
      <span className={`access-list__icon access-list__icon--${variant}`}>
        <FontAwesomeIcon icon={icon ?? (ok ? faCheck : faXmark)} aria-hidden="true" />
      </span>
      <div>
        <strong>{title}</strong>
        {children ? <span>{children}</span> : null}
      </div>
    </li>
  );
}

export default function VehicleDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const session = getAuthSession();
  const isRenter = Boolean(session?.token) && getUserCargo(session?.user) === "LOCATARIO";
  const [vehicle, setVehicle] = useState(null);
  const [garagem, setGaragem] = useState(null);
  const [servicos, setServicos] = useState([]);
  const [favorito, setFavorito] = useState(false);
  const [interesse, setInteresse] = useState(false);
  const [aviso, setAviso] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "MOVA - Detalhes do veículo";
    let active = true;
    getVeiculoById(id)
      .then((result) => { if (active) setVehicle(result); })
      .catch((requestError) => { if (active) setError(requestError?.message || "Não foi possível carregar este veículo."); });
    listServicos()
      .then((result) => { if (active) setServicos(Array.isArray(result) ? result : []); })
      .catch(() => {});
    return () => { active = false; };
  }, [id]);

  const garagemId = vehicle?.garagemId || vehicle?.garagem?.id || "";
  useEffect(() => {
    if (!garagemId) return undefined;
    let active = true;
    // Endereço e acessibilidade da garagem vêm do GET público /garagem/:id.
    getGaragemById(garagemId).then((result) => { if (active) setGaragem(result); }).catch(() => {});
    return () => { active = false; };
  }, [garagemId]);

  useEffect(() => {
    if (!isRenter || !vehicle?.id) return undefined;
    let active = true;
    Promise.all([listarFavoritos().catch(() => []), listarInteresses().catch(() => [])]).then(([favs, ints]) => {
      if (!active) return;
      setFavorito(favs.some((item) => String(item.idVeiculo) === String(vehicle.id)));
      setInteresse(ints.some((item) => String(item.idVeiculo) === String(vehicle.id)));
    });
    return () => { active = false; };
  }, [isRenter, vehicle?.id]);

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

  async function toggleFavorito() {
    try {
      if (favorito) await desfavoritar(vehicle.id);
      else await favoritar(vehicle.id);
      setFavorito(!favorito);
      setAviso(favorito ? "Removido dos favoritos." : "Adicionado aos favoritos.");
    } catch (requestError) {
      setAviso(requestError?.message || "Não foi possível atualizar o favorito.");
    }
  }

  async function toggleInteresse() {
    try {
      if (interesse) await cancelarInteresse(vehicle.id);
      else await registrarInteresse(vehicle.id);
      setInteresse(!interesse);
      setAviso(interesse ? "Aviso de disponibilidade cancelado." : "Vamos avisar quando o veículo ficar disponível.");
    } catch (requestError) {
      setAviso(requestError?.message || "Não foi possível atualizar o aviso de disponibilidade.");
    }
  }

  if (error) {
    return (
      <PublicAppShell>
        <div className="state-block state-block--error" role="alert">
          <h1 className="state-block__title">Detalhe indisponível</h1>
          <p className="state-block__text">{error}</p>
          <Link className="btn btn--secondary" to="/">Voltar ao catálogo</Link>
        </div>
      </PublicAppShell>
    );
  }

  if (!vehicle) {
    return (
      <PublicAppShell>
        <p className="loading-state public-home__message" role="status" aria-busy="true"><span className="spinner" aria-hidden="true" />Carregando veículo…</p>
      </PublicAppShell>
    );
  }

  const marca = vehicle.marca || "Marca não informada";
  const modelo = vehicle.modelo || "Modelo não informado";
  const nome = `${marca} ${modelo}`;
  const publicReservable = vehicle.status === "DISPONIVEL" && vehicle.garagem?.status !== "INATIVA" && Boolean(garagemId);
  const statusLabel = vehicle.status !== "DISPONIVEL" ? STATUS_LABEL[vehicle.status] || "Indisponível" : null;
  const diaria = Number(vehicle.valorDiaria);
  const precoValido = vehicle.valorDiaria != null && Number.isFinite(diaria);
  const garagemNome = garagem?.nome || vehicle.garagem?.nome || "Garagem não informada";
  const garagemAcessivel = typeof garagem?.acessibilidade === "boolean" ? garagem.acessibilidade : null;
  const preco = precoValido ? formatMoneyBRL(diaria) : null;

  const reserveButton = (
    <button type="button" className="btn btn--lg" disabled={!publicReservable} onClick={reserve} aria-describedby={publicReservable ? undefined : "vdetail-indisponivel"}>
      Reservar este carro
    </button>
  );
  const favoriteButton = isRenter ? (
    <button type="button" className="icon-btn icon-btn--outlined icon-btn--lg" aria-pressed={favorito} onClick={toggleFavorito}>
      <FontAwesomeIcon icon={favorito ? faHeartSolid : faHeart} aria-hidden="true" />
      <span className="sr-only">{favorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}</span>
    </button>
  ) : null;

  return (
    <PublicAppShell>
      <div className="vdetail-page">
        <Link className="page-head__back vdetail__back" to="/">
          <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" /> Voltar ao catálogo
        </Link>

        <header className="vdetail__head">
          <h1 id="vehicle-detail-title">{nome}</h1>
          {vehicle.ano ? <p className="vdetail__year tabular">{vehicle.ano}</p> : null}
          {statusLabel ? <p className="vdetail__status"><span className="badge badge--warning">{statusLabel}</span></p> : null}
        </header>

        <article className="vdetail vehicle-detail" aria-labelledby="vehicle-detail-title">
          <div className="vdetail__main">
            <Gallery vehicle={vehicle} nome={nome} />

            <section className="vsection" aria-labelledby="essenciais">
              <h2 id="essenciais">Informações essenciais</h2>
              <dl className="spec-grid">
                <div><dt>Câmbio</dt><dd>{formatCambio(vehicle.cambio)}</dd></div>
                <div><dt>Lugares</dt><dd className="tabular">{vehicle.capacidade || "Não informado"}</dd></div>
                <div><dt>Categoria</dt><dd>{formatCategoria(vehicle.categoria)}</dd></div>
                <div><dt>Energia</dt><dd>{vehicle.eletrico ? "Elétrico" : "Combustão"}</dd></div>
              </dl>
            </section>

            <section className="vsection" aria-labelledby="acessibilidade">
              <h2 id="acessibilidade">Acessibilidade</h2>
              <ul className="access-list">
                <AccessItem ok={Boolean(vehicle.adaptado)} icon={vehicle.adaptado ? faWheelchair : faXmark} title={vehicle.adaptado ? "Veículo adaptado para PCD" : "Veículo sem adaptação PCD"}>
                  {vehicle.adaptado
                    ? "Reservar um veículo adaptado exige deficiência declarada na sua conta (RN01)."
                    : "Para ver só os adaptados, use o filtro PCD no catálogo."}
                </AccessItem>
                {garagemAcessivel !== null && (
                  <AccessItem ok={garagemAcessivel} icon={garagemAcessivel ? faCheck : faBan} title={garagemAcessivel ? "Garagem com acessibilidade" : "Garagem sem acessibilidade informada"} />
                )}
                {vehicle.eletrico && <AccessItem tone="info" icon={faBolt} title="Veículo elétrico" />}
              </ul>
            </section>

            <section className="vsection" aria-labelledby="local">
              <h2 id="local">Localização</h2>
              <div className="location-block">
                <FontAwesomeIcon icon={faLocationDot} aria-hidden="true" />
                <div>
                  <strong>{garagemNome}</strong>
                  <p>{garagem?.endereco || "Endereço exibido ao escolher a retirada."}</p>
                  <p>Retirada nesta garagem. A devolução pode ser em outra garagem do mesmo locador.</p>
                </div>
              </div>
            </section>

            {servicos.length > 0 && (
              <section className="vsection" aria-labelledby="servicos">
                <h2 id="servicos">Serviços opcionais</h2>
                <ul className="service-list">
                  {servicos.map((servico) => (
                    <li key={servico.id}>
                      <strong>{servico.nome}</strong>
                      {servico.valor != null && <span className="tabular">{formatMoneyBRL(servico.valor)}</span>}
                    </li>
                  ))}
                </ul>
                <p className="vsection__note">Você escolhe os serviços durante a reserva, antes do pagamento.</p>
              </section>
            )}
          </div>

          <aside className="vdetail__aside" aria-label="Preço e reserva" data-capture="decisao">
            <div className="decision">
              <div className="decision__block">
                <p className="decision__label">Diária</p>
                <p className="decision__price">
                  {preco ? <><strong className="tabular">{preco}</strong><span>por dia</span></> : <strong>Diária indisponível</strong>}
                </p>
                <p className="decision__hint">O total aparece no resumo, com diárias e serviços separados.</p>
              </div>
              <div className="decision__block decision__garage">
                <p className="decision__label">Retirada</p>
                <strong>{garagemNome}</strong>
              </div>
              <div className="decision__block">
                {!publicReservable && (
                  <p className="alert alert--warning public-home__message decision__unavailable" id="vdetail-indisponivel">
                    Este veículo não está disponível para uma nova reserva.
                  </p>
                )}
                <div className="decision__actions">
                  {reserveButton}
                  {favoriteButton}
                </div>
                {isRenter && !publicReservable && (
                  <button type="button" className="btn btn--secondary btn--block decision__notify" aria-pressed={interesse} onClick={toggleInteresse}>
                    <FontAwesomeIcon icon={faBell} aria-hidden="true" />
                    {interesse ? "Cancelar aviso de disponibilidade" : "Avise-me quando disponível"}
                  </button>
                )}
                <p className="sr-only" role="status" aria-live="polite">{aviso}</p>
              </div>
            </div>
          </aside>
        </article>

        <section className="vdetail__bar" aria-label="Reserva rápida">
          <p className="vdetail__bar-price">
            {preco ? <><strong className="tabular">{preco}</strong><span>por dia</span></> : <strong>Diária indisponível</strong>}
          </p>
          {favoriteButton}
          {reserveButton}
        </section>
      </div>
    </PublicAppShell>
  );
}
