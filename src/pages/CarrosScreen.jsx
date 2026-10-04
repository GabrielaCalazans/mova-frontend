import { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import CursorGlowArea from "../components/ui/CursorGlowArea";
import VehicleCard from "../components/vehicle/VehicleCard";
import { listVeiculos } from "../services/veiculoService";
import { updateJourneyStep } from "../utils/journeyStorage";
import { t } from "../i18n";
import "../styles/vehicle.css";

function resolveModeloVeiculo(veiculo) {
  return veiculo?.modeloVeiculo ?? {};
}

function resolveVeiculoField(veiculo, modeloVeiculo, field) {
  return veiculo?.[field] ?? modeloVeiculo?.[field] ?? "";
}

// Rótulos traduzidos no render: o idioma pode mudar depois do import.
const FILTROS_CATEGORIA = [
  { id: "economico", labelKey: "catalog.categories.economico" },
  { id: "espacoso", labelKey: "catalog.categories.espacoso" },
  { id: "executivo", labelKey: "catalog.categories.executivo" },
  { id: "adaptado", labelKey: "catalog.categories.pcd" },
];

function veiculoSelecionavel(veiculo) {
  if (veiculo?.status !== "DISPONIVEL") return false;
  if (!veiculo.garagem) return true;
  return veiculo.garagem.status === "ATIVA";
}

function CarrosScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tipoFiltro, setTipoFiltro] = useState(location.state?.tipo ?? null);

  const [veiculos, setVeiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const buscar = useCallback(async () => {
    setLoading(true);
    setErro(null);

    try {
      const filtrosPorTipo = {
        economico: { categoria: "ECONOMICO" },
        espacoso: { categoria: "ESPACOSO" },
        executivo: { categoria: "EXECUTIVO" },
        adaptado: { pcd: true },
        eletrico: { eletrico: true },
      };
      const resultado = await listVeiculos(filtrosPorTipo[tipoFiltro] ?? {});
      setVeiculos(resultado);
    } catch (e) {
      setErro(e.message || t("catalog.list.loadError"));
    } finally {
      setLoading(false);
    }
  }, [tipoFiltro]);

  useEffect(() => {
    document.title = t("catalog.list.documentTitle");
    queueMicrotask(() => {
      void buscar();
    });
  }, [buscar]);

  function selecionarVeiculo(veiculo) {
    if (!veiculoSelecionavel(veiculo)) return;

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
      categoria: resolveVeiculoField(veiculo, modeloVeiculo, "categoria"),
      imagem: veiculo.imagem ?? veiculo.image ?? veiculo.foto ?? "",
      capacidade: resolveVeiculoField(veiculo, modeloVeiculo, "capacidade"),
      acessibilidade: resolveVeiculoField(veiculo, modeloVeiculo, "adaptado"),
      adaptado: veiculo.adaptado ?? false,
      eletrico: veiculo.eletrico ?? false,
      cambio:
        resolveVeiculoField(veiculo, modeloVeiculo, "cambio") ||
        veiculo.transmissao ||
        "",
      ano: resolveVeiculoField(veiculo, modeloVeiculo, "ano"),
      placa: veiculo.placa ?? "",
      status: veiculo.status ?? "",
      garagemId: veiculo.garagemId ?? "",
    });

    navigate("/escolha-garagem-retirada");
  }

  return (
    <main className="carro-page catalog-page">
      <header className="page-head">
        <h1>{t("catalog.list.title")}</h1>
        <p className="page-head__lede">{t("catalog.list.lede")}</p>
      </header>

      <div className="catalog-page__body">
        <fieldset className="fieldset category-strip carro-filters" aria-label={t("catalog.list.filtersLabel")}>
          <legend>{t("catalog.home.filterByCategory")}</legend>
          <div className="category-strip__list">
            {FILTROS_CATEGORIA.map(({ id, labelKey }) => (
              <button
                key={id}
                type="button"
                className="chip"
                aria-pressed={tipoFiltro === id}
                onClick={() => setTipoFiltro((atual) => atual === id ? null : id)}
              >
                {t(labelKey)}
              </button>
            ))}
            <button type="button" className="btn btn--quiet" onClick={() => setTipoFiltro(null)}>
              {t("catalog.home.clearFilters")}
            </button>
          </div>
        </fieldset>

        {loading && <p className="loading-state carro-status" role="status"><span className="spinner" aria-hidden="true" />{t("catalog.home.loading")}</p>}

        {!loading && erro && (
          <div className="state-block state-block--error carro-status" role="alert">
            <h2 className="state-block__title">{t("catalog.home.errorTitle")}</h2>
            <p className="state-block__text">{erro}</p>
            <button type="button" className="btn btn--secondary" onClick={() => void buscar()}>{t("catalog.home.retry")}</button>
          </div>
        )}

        {!loading && !erro && veiculos.length === 0 && (
          <div className="state-block carro-empty-state">
            <h2 className="state-block__title">{t("catalog.list.emptyTitle")}</h2>
            <p className="state-block__text">
              {tipoFiltro ? t("catalog.list.emptyCategory") : t("catalog.list.empty")}
            </p>
            {tipoFiltro && (
              <button type="button" className="btn btn--secondary" onClick={() => setTipoFiltro(null)}>{t("catalog.list.seeAll")}</button>
            )}
          </div>
        )}

        {!loading && !erro && veiculos.length > 0 && (
          <CursorGlowArea className="vehicle-grid carro-list">
            {veiculos.map((veiculo) => {
              const disponivel = veiculo.status === "DISPONIVEL";
              const selecionavel = veiculoSelecionavel(veiculo);
              const garagemIndisponivel = disponivel && Boolean(veiculo.garagem) && veiculo.garagem.status !== "ATIVA";
              const noteId = `nota-${veiculo.id}`;

              return (
                <VehicleCard
                  key={veiculo.id}
                  vehicle={veiculo}
                  className="carro-list-card"
                  note={garagemIndisponivel ? t("catalog.list.garageUnavailable") : undefined}
                  noteId={noteId}
                  actions={(
                    <button
                      type="button"
                      className="btn"
                      disabled={!selecionavel}
                      aria-describedby={garagemIndisponivel ? noteId : undefined}
                      onClick={() => selecionarVeiculo(veiculo)}
                    >
                      {selecionavel ? t("catalog.list.select") : t("catalog.list.unavailable")}
                    </button>
                  )}
                />
              );
            })}
          </CursorGlowArea>
        )}
      </div>
      <BottomNav />
    </main>
  );
}

export default CarrosScreen;
