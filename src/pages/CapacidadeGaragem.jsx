import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import VehicleMedia from "../components/vehicle/VehicleMedia";
import BottomNav from "../components/BottomNav";
import { getGaragemById, listVeiculosDaGaragem } from "../services/garagemService";
import "../styles/vehicle.css";
import "../styles/owner.css";

function VeiculoLista({ veiculos, vazio }) {
  if (veiculos.length === 0) return <p className="owner-note">{vazio}</p>;
  return (
    <ul className="owner-list">
      {veiculos.map((veiculo) => (
        <li className="owner-row" key={veiculo.id}>
          <VehicleMedia vehicle={veiculo} className="owner-row__media" />
          <div className="owner-row__body">
            <h3 className="owner-row__title">{veiculo.marca} {veiculo.modelo}</h3>
            <p className="owner-row__meta">
              <span>Placa: <span className="owner-plate">{veiculo.placa}</span></span>
              <span className="tabular">ID: {veiculo.id.slice(0, 8)}</span>
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function CapacidadeGaragem() {
  const { id } = useParams();
  const [garagem, setGaragem] = useState(null);
  const [veiculos, setVeiculos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    document.title = "MOVA - Capacidade Atual";

    let active = true;
    async function carregar() {
      setLoading(true);
      setErro(null);
      try {
        const [garagemResult, veiculosResult] = await Promise.all([
          getGaragemById(id),
          listVeiculosDaGaragem(id),
        ]);
        if (!active) return;
        setGaragem(garagemResult);
        setVeiculos(veiculosResult);
      } catch (e) {
        if (!active) return;
        setErro(e.message || "Não foi possível carregar a capacidade da garagem.");
      } finally {
        if (active) setLoading(false);
      }
    }
    carregar();
    return () => { active = false; };
  }, [id]);

  const emReserva = veiculos.filter((v) => v.status === "RESERVADO");
  const disponiveisNaGaragem = veiculos.filter((v) => v.status !== "RESERVADO");

  return (
    <main className="owner-page" aria-labelledby="capacidade-title">
      <header className="page-head">
        <Link className="page-head__back" to="/cadastro-garagens"><ChevronLeft className="icon" aria-hidden="true" />Garagens</Link>
        <h1 id="capacidade-title">Capacidade Atual</h1>
        {garagem && (
          <p className="page-head__lede">
            {garagem.nome} — {garagem.endereco} — Capacidade {garagem.capacidade - (garagem.veiculosAlocados ?? 0)}/{garagem.capacidade}
          </p>
        )}
      </header>

      {loading && <p className="loading-state" role="status"><span className="spinner" aria-hidden="true" />Carregando…</p>}
      {!loading && erro && <p className="alert alert--danger" role="alert">{erro}</p>}

      {!loading && !erro && (
        <>
          <section className="owner-section" aria-labelledby="capacidade-reserva">
            <div className="owner-section__head">
              <h2 id="capacidade-reserva">Veículos em reserva <span className="badge badge--info tabular">{emReserva.length}</span></h2>
            </div>
            <VeiculoLista veiculos={emReserva} vazio="Nenhum veículo reservado nesta garagem." />
          </section>

          <section className="owner-section" aria-labelledby="capacidade-garagem">
            <div className="owner-section__head">
              <h2 id="capacidade-garagem">Veículos em garagem <span className="badge badge--neutral tabular">{disponiveisNaGaragem.length}</span></h2>
            </div>
            <VeiculoLista veiculos={disponiveisNaGaragem} vazio="Nenhum veículo alocado nesta garagem." />
          </section>
        </>
      )}
      <BottomNav />
    </main>
  );
}
