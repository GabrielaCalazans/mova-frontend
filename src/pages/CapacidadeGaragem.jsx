import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Car } from "lucide-react";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import { getGaragemById, listVeiculosDaGaragem } from "../services/garagemService";
import "../styles/carselect.css";

function VeiculoCard({ veiculo }) {
  return (
    <div className="fav-card" style={{ cursor: "default" }}>
      <span
        style={{
          width: 46,
          height: 46,
          borderRadius: 10,
          background: "var(--color-surface-muted, #ececee)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color: "var(--color-primary-strong)",
        }}
      >
        <Car size={24} />
      </span>
      <div className="fav-card__info">
        <p>ID: {veiculo.id.slice(0, 8)}</p>
        <p>{veiculo.marca} {veiculo.modelo}</p>
        <p>Placa: {veiculo.placa}</p>
      </div>
    </div>
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
    <main className="carro-page">
      <div className="carro-header">
        <TopBar showLogo iconColor="white" />
        <h1>Capacidade Atual</h1>
      </div>

      <div className="carro-content">
        <h2 style={{ color: "var(--color-primary-strong)", fontSize: "1.2rem", margin: "0 0 1.1rem" }}>
          Veículos | Localizações
        </h2>

        {loading && <p className="carro-status">Carregando…</p>}
        {!loading && erro && <p className="carro-status">{erro}</p>}

        {!loading && !erro && (
          <>
            {garagem && (
              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem", margin: "0 0 1.2rem" }}>
                {garagem.nome} — {garagem.endereco} — Capacidade {garagem.capacidade - (garagem.veiculosAlocados ?? 0)}/{garagem.capacidade}
              </p>
            )}

            <p style={{ color: "var(--color-primary-strong)", fontWeight: 600, margin: "0 0 0.6rem" }}>
              Veículos em Reserva - {emReserva.length}
            </p>
            <div className="frota-list" style={{ marginBottom: "1.5rem" }}>
              {emReserva.length === 0 && (
                <p className="carro-empty-state" style={{ padding: "0.5rem 0" }}>Nenhum veículo reservado nesta garagem.</p>
              )}
              {emReserva.map((veiculo) => (
                <VeiculoCard key={veiculo.id} veiculo={veiculo} />
              ))}
            </div>

            <p style={{ color: "var(--color-primary-strong)", fontWeight: 600, margin: "0 0 0.6rem" }}>
              Veículos em Garagem - {disponiveisNaGaragem.length}
            </p>
            <div className="frota-list">
              {disponiveisNaGaragem.length === 0 && (
                <p className="carro-empty-state" style={{ padding: "0.5rem 0" }}>Nenhum veículo alocado nesta garagem.</p>
              )}
              {disponiveisNaGaragem.map((veiculo) => (
                <VeiculoCard key={veiculo.id} veiculo={veiculo} />
              ))}
            </div>
          </>
        )}
      </div>
          <BottomNav />
    </main>
  );
}
