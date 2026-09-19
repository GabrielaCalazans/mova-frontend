import { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { listVeiculos } from "../services/veiculoService";
import { updateJourneyStep } from "../utils/journeyStorage";
import { resolveModelDetails } from "../utils/vehicleDisplay";
import { formatMoneyBRL } from "../utils/reservationMath";
import "../styles/carselect.css";

function resolveModeloVeiculo(veiculo) {
  return veiculo?.modeloVeiculo ?? {};
}

function resolveVeiculoField(veiculo, modeloVeiculo, field) {
  return veiculo?.[field] ?? modeloVeiculo?.[field] ?? "";
}

function formatCambio(cambio) {
  return cambio || "—";
}

function CarrosScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const tipoFiltro = location.state?.tipo ?? null;

  const [veiculos, setVeiculos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);

  const buscar = useCallback(async () => {
    setLoading(true);
    setErro(null);

    try {
      // Filtragem feita no cliente (nao no servidor): evita depender de o
      // backend aceitar exatamente os mesmos nomes/valores de filtro que
      // usamos aqui (ex.: diferenca de maiusculas/minusculas em "cambio").
      const resultado = await listVeiculos();
      // eslint-disable-next-line no-console
      console.log("[CarrosScreen] veiculos recebidos da API:", resultado);
      setVeiculos(resultado);
    } catch (e) {
      setErro(e.message || "Não foi possível carregar os veículos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "MOVA - Escolha seu Carro";
    buscar();
  }, [buscar]);

  const veiculosFiltrados = veiculos.filter((v) => {
    const eletrico = v.eletrico === true || v.eletrico === "true";
    const adaptado = v.adaptado === true || v.adaptado === "true";
    const cambio = String(v.cambio ?? v.modeloVeiculo?.cambio ?? "").toLowerCase();

    if (tipoFiltro === "eletrico") return eletrico;
    if (tipoFiltro === "adaptado") return adaptado;
    if (tipoFiltro === "executivo") return cambio.includes("automat");
    if (tipoFiltro === "economico") return !eletrico && !adaptado;
    return true;
  });

  function selecionarVeiculo(veiculo) {
    const modeloVeiculo = resolveModeloVeiculo(veiculo);

    updateJourneyStep("veiculo", {
      id: veiculo.id,
      idModeloVeiculo: veiculo.idModeloVeiculo ?? "",
      idLocador: veiculo.idLocador ?? "",
      nome:
        veiculo.nome ??
        `${resolveVeiculoField(veiculo, modeloVeiculo, "marca")} ${resolveVeiculoField(veiculo, modeloVeiculo, "modelo")}`.trim(),
      marca: resolveVeiculoField(veiculo, modeloVeiculo, "marca"),
      modelo: resolveVeiculoField(veiculo, modeloVeiculo, "modelo"),
      categoria: veiculo.categoria ?? veiculo.tipo ?? "",
      imagem: veiculo.imagem ?? veiculo.image ?? veiculo.foto ?? "",
      capacidade: resolveVeiculoField(veiculo, modeloVeiculo, "capacidade"),
      caracteristicas: veiculo.caracteristicas ?? [],
      acessibilidade: resolveVeiculoField(veiculo, modeloVeiculo, "adaptado"),
      adaptado: veiculo.adaptado ?? false,
      eletrico: veiculo.eletrico ?? false,
      cambio:
        resolveVeiculoField(veiculo, modeloVeiculo, "cambio") ||
        veiculo.transmissao ||
        "",
      autonomia: veiculo.autonomia ?? "",
      combustivel: veiculo.combustivel ?? veiculo.energia ?? "",
      ano: resolveVeiculoField(veiculo, modeloVeiculo, "ano"),
      placa: veiculo.placa ?? "",
      status: veiculo.status ?? "",
      garagemId: veiculo.garagemId ?? "",
    });

    navigate("/escolha-garagem-retirada");
  }

  return (
    <main className="carro-page">
      <div className="carro-header">
        <h1>Escolha Seu Carro</h1>
      </div>

      <div className="carro-content">
        {loading && <p className="carro-status">Carregando veículos…</p>}

        {!loading && erro && <p className="carro-status">{erro}</p>}

        {!loading && !erro && veiculosFiltrados.length === 0 && (
          <p className="carro-empty-state">
            {veiculos.length === 0
              ? "Nenhum veículo cadastrado no momento. Volte mais tarde."
              : "Nenhum veículo desse tipo disponível no momento."}
            {veiculos.length > 0 && tipoFiltro && (
              <>
                {" "}
                <button
                  type="button"
                  onClick={() => navigate("/carros/lista")}
                  style={{ background: "none", border: "none", color: "var(--color-primary-strong)", textDecoration: "underline", cursor: "pointer", font: "inherit" }}
                >
                  Ver todos os veículos
                </button>
              </>
            )}
          </p>
        )}

        {!loading && !erro && veiculosFiltrados.length > 0 && (
          <div className="carro-list">
            {veiculosFiltrados.map((veiculo) => {
              const modeloVeiculo = resolveModeloVeiculo(veiculo);
              const marca = resolveVeiculoField(veiculo, modeloVeiculo, "marca");
              const modelo = resolveVeiculoField(veiculo, modeloVeiculo, "modelo");
              const ano = resolveVeiculoField(veiculo, modeloVeiculo, "ano");
              const cambio = resolveVeiculoField(veiculo, modeloVeiculo, "cambio");
              const disponivel = veiculo.status === "DISPONIVEL";
              const details = resolveModelDetails(marca, modelo, tipoFiltro);
              const local = veiculo.garagem?.nome ?? veiculo.garagemNome ?? "Local não informado";

              return (
                <div className="carro-list-card" key={veiculo.id}>
                  <img
                    src={details.image}
                    alt={`${marca} ${modelo}`}
                    className="carro-list-card__image"
                  />
                  <h3>
                    {marca} {modelo}
                  </h3>
                  <p className="carro-list-card__specs">
                    {marca} - {modelo}
                    <br />
                    {ano} - {formatCambio(cambio)}
                    <br />
                    Autonomia: {details.autonomia}
                    <br />
                    Local: {local}
                  </p>
                  <p className="carro-list-card__price">
                    {veiculo.valorDiaria != null ? `Preço: ${formatMoneyBRL(veiculo.valorDiaria)}/dia` : "Consulte o preço"}
                  </p>
                  <button
                    type="button"
                    className="carro-button"
                    disabled={!disponivel}
                    onClick={() => selecionarVeiculo(veiculo)}
                  >
                    {disponivel ? "Selecionar" : "Indisponível"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
          <BottomNav />
    </main>
  );
}

export default CarrosScreen;
