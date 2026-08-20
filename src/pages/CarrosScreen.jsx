import { useEffect, useState, useCallback } from "react";
<<<<<<< HEAD
import { useLocation, useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import { listVeiculos } from "../services/veiculoService";
import { updateJourneyStep } from "../utils/journeyStorage";
import { resolveModelDetails } from "../utils/vehicleDisplay";
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
      const filters = {};
      if (tipoFiltro === "eletrico") filters.eletrico = true;
      if (tipoFiltro === "adaptado") filters.adaptado = true;
      if (tipoFiltro === "executivo") filters.cambio = "Automatico";

      const resultado = await listVeiculos(filters);
      setVeiculos(resultado);
    } catch (e) {
      setErro(e.message || "Não foi possível carregar os veículos.");
    } finally {
      setLoading(false);
    }
  }, [tipoFiltro]);

  useEffect(() => {
    document.title = "MOVA - Escolha seu Carro";
    buscar();
  }, [buscar]);

  const veiculosFiltrados = veiculos.filter((v) => {
    if (tipoFiltro === "economico") return !v.eletrico && !v.adaptado;
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
        <TopBar showLogo iconColor="white" />
        <h1>Escolha Seu Carro</h1>
      </div>

      <div className="carro-content">
        {loading && <p className="carro-status">Carregando veículos…</p>}

        {!loading && erro && <p className="carro-status">{erro}</p>}

        {!loading && !erro && veiculosFiltrados.length === 0 && (
          <p className="carro-empty-state">
            Nenhum veículo encontrado com os filtros selecionados.
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
                    Local: {details.garagem}
                  </p>
                  <p className="carro-list-card__price">
                    {details.precoDia ? `Preço: R$${details.precoDia},00/dia` : "Consulte o preço"}
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
=======
import { useNavigate } from "react-router-dom";
import AuthenticatedLayout from "../layout/AuthenticatedLayout";
import movaLogo from "../assets/mova_logo.png";
import { listVeiculos } from "../services/veiculoService";
import { updateJourneyStep } from "../utils/journeyStorage";

import {
    LogoContainer,
    Title,
    PrimaryButton,
    CarListContainer,
    CarCard,
    CarInfoText,
    PriceTag,
    SearchWrapper,
    SearchInputWrapper,
    SearchInput,
    SearchIcon,
    FiltersRow,
    FilterSelect,
    FilterToggle,
    ClearButton,
    StatusMessage,
    ResultCount,
} from "../styles/authStyle";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCambio(cambio) {
    if (!cambio) return "—";
    return cambio;
}

function formatBool(value) {
    if (value === true) return "Sim";
    if (value === false) return "Não";
    return "—";
}

function formatStatus(status) {
    const map = {
        DISPONIVEL: { label: "Disponível", disponivel: true },
        ALUGADO: { label: "Alugado", disponivel: false },
        MANUTENCAO: { label: "Em manutenção", disponivel: false },
    };
    return map[status] ?? { label: status, disponivel: false };
}

// ── Componente principal ──────────────────────────────────────────────────────

const CAMBIO_OPTIONS = ["", "Manual", "Automatico"];

function CarrosScreen() {
    const navigate = useNavigate();

    // Estados de busca
    const [textoBusca, setTextoBusca] = useState("");
    const [cambioFiltro, setCambioFiltro] = useState("");
    const [eletricoFiltro, setEletricoFiltro] = useState(null); // null | true | false
    const [adaptadoFiltro, setAdaptadoFiltro] = useState(null);

    // Estados de dados
    const [veiculos, setVeiculos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState(null);

    // Busca na API
    const buscar = useCallback(async () => {
        setLoading(true);
        setErro(null);

        try {
            const filters = {};
            if (cambioFiltro) filters.cambio = cambioFiltro;
            if (eletricoFiltro !== null) filters.eletrico = eletricoFiltro;
            if (adaptadoFiltro !== null) filters.adaptado = adaptadoFiltro;

            const resultado = await listVeiculos(filters);
            setVeiculos(resultado);
        } catch (e) {
            setErro(e.message || "Não foi possível carregar os veículos.");
        } finally {
            setLoading(false);
        }
    }, [cambioFiltro, eletricoFiltro, adaptadoFiltro]);

    // Busca inicial e ao mudar filtros de API
    useEffect(() => {
        document.title = "MOVA - Escolha seu Carro";
        buscar();
    }, [buscar]);

    // Filtragem local por texto (marca, modelo, placa)
    const veiculosFiltrados = veiculos.filter((v) => {
        if (!textoBusca.trim()) return true;
        const termo = textoBusca.toLowerCase();
        return (
            v.marca?.toLowerCase().includes(termo) ||
            v.modelo?.toLowerCase().includes(termo) ||
            v.placa?.toLowerCase().includes(termo) ||
            String(v.ano).includes(termo)
        );
    });

    const temFiltros =
        textoBusca || cambioFiltro || eletricoFiltro !== null || adaptadoFiltro !== null;

    function limparFiltros() {
        setTextoBusca("");
        setCambioFiltro("");
        setEletricoFiltro(null);
        setAdaptadoFiltro(null);
    }

    function toggleEletrico() {
        setEletricoFiltro((prev) => (prev === true ? null : true));
    }

    function toggleAdaptado() {
        setAdaptadoFiltro((prev) => (prev === true ? null : true));
    }

    function selecionarVeiculo(veiculo) {
        updateJourneyStep("veiculo", {
            id: veiculo.id,
            nome: veiculo.nome ?? `${veiculo.marca ?? ""} ${veiculo.modelo ?? ""}`.trim(),
            marca: veiculo.marca ?? "",
            modelo: veiculo.modelo ?? "",
            categoria: veiculo.categoria ?? veiculo.tipo ?? "",
            imagem: veiculo.imagem ?? veiculo.image ?? veiculo.foto ?? "",
            capacidade: veiculo.capacidade ?? "",
            caracteristicas: veiculo.caracteristicas ?? [],
            acessibilidade: veiculo.acessibilidade ?? veiculo.adaptado ?? "",
            cambio: veiculo.cambio ?? veiculo.transmissao ?? "",
            autonomia: veiculo.autonomia ?? "",
            combustivel: veiculo.combustivel ?? veiculo.energia ?? "",
            ano: veiculo.ano ?? "",
            placa: veiculo.placa ?? "",
            status: veiculo.status ?? "",
        });

        navigate("/escolha-garagem-retirada");
    }

    return (
        <AuthenticatedLayout>
            <LogoContainer>
                <img src={movaLogo} alt="Mova Logo" />
            </LogoContainer>

            <Title>Escolha seu Carro</Title>

            {/* ── Área de busca ── */}
            <SearchWrapper>
                <SearchInputWrapper>
                    <SearchInput
                        type="text"
                        placeholder="Buscar por marca, modelo ou placa…"
                        value={textoBusca}
                        onChange={(e) => setTextoBusca(e.target.value)}
                    />
                    <SearchIcon>🔍</SearchIcon>
                </SearchInputWrapper>

                <FiltersRow>
                    <FilterSelect
                        value={cambioFiltro}
                        onChange={(e) => setCambioFiltro(e.target.value)}
                    >
                        <option value="">Câmbio: todos</option>
                        <option value="Manual">Manual</option>
                        <option value="Automatico">Automático</option>
                    </FilterSelect>

                    <FilterToggle active={eletricoFiltro === true} onClick={toggleEletrico}>
                        ⚡ Elétrico
                    </FilterToggle>

                    <FilterToggle active={adaptadoFiltro === true} onClick={toggleAdaptado}>
                        ♿ Adaptado
                    </FilterToggle>

                    {temFiltros && (
                        <ClearButton onClick={limparFiltros}>Limpar filtros</ClearButton>
                    )}
                </FiltersRow>
            </SearchWrapper>

            {/* ── Resultado ── */}
            {loading && <StatusMessage>Carregando veículos…</StatusMessage>}

            {!loading && erro && (
                <StatusMessage style={{ color: "#c0392b" }}>{erro}</StatusMessage>
            )}

            {!loading && !erro && (
                <>
                    <ResultCount>
                        {veiculosFiltrados.length}{" "}
                        {veiculosFiltrados.length === 1 ? "veículo encontrado" : "veículos encontrados"}
                    </ResultCount>

                    {veiculosFiltrados.length === 0 ? (
                        <StatusMessage>Nenhum veículo encontrado com os filtros selecionados.</StatusMessage>
                    ) : (
                        <CarListContainer>
                            {veiculosFiltrados.map((veiculo) => {
                                const { label, disponivel } = formatStatus(veiculo.status);

                                return (
                                    <CarCard key={veiculo.id} disponivel={disponivel}>
                                        <h3>
                                            {veiculo.marca} {veiculo.modelo}
                                        </h3>

                                        <div className="info-grid">
                                            <CarInfoText>
                                                Placa: <strong>{veiculo.placa}</strong>
                                            </CarInfoText>
                                            <CarInfoText>
                                                Ano: {veiculo.ano} • Câmbio: {formatCambio(veiculo.cambio)}
                                            </CarInfoText>
                                            <CarInfoText>
                                                Capacidade: {veiculo.capacidade} pessoas
                                            </CarInfoText>
                                            <CarInfoText>
                                                Elétrico: {formatBool(veiculo.eletrico)} •{" "}
                                                Adaptado: {formatBool(veiculo.adaptado)}
                                            </CarInfoText>
                                            <CarInfoText
                                                style={{ color: disponivel ? "#27ae60" : "#c0392b", fontWeight: 600 }}
                                            >
                                                {label}
                                            </CarInfoText>
                                        </div>

                                        <PrimaryButton
                                            disabled={!disponivel}
                                            onClick={() => selecionarVeiculo(veiculo)}
                                            style={{
                                                marginTop: "15px",
                                                opacity: disponivel ? 1 : 0.5,
                                                cursor: disponivel ? "pointer" : "not-allowed",
                                            }}
                                        >
                                            {disponivel ? "Selecionar" : "Indisponível"}
                                        </PrimaryButton>
                                    </CarCard>
                                );
                            })}
                        </CarListContainer>
                    )}
                </>
            )}
        </AuthenticatedLayout>
    );
}

export default CarrosScreen;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
