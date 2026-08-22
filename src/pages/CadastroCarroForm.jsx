import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AuthenticatedLayout from "../layout/AuthenticatedLayout";
import { createVeiculo, updateVeiculo } from "../services/veiculoService";
import { getAuthSession } from "../services/authSession";
import "../styles/relatorios.css";

const ANOS = Array.from({ length: 12 }, (_, i) => String(2026 - i));
const CAMBIOS = ["Manual", "Automatico"];
const STATUS_OPCOES = ["DISPONIVEL", "RESERVADO", "MANUTENCAO", "INATIVO"];

export default function CadastroCarroForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isNovo = id === "novo";
  const idLocador = getAuthSession()?.user?.id;

  const veiculoOriginal = location.state?.veiculo;

  const [values, setValues] = useState({
    marca: veiculoOriginal?.marca || "",
    modelo: veiculoOriginal?.modelo || "",
    placa: veiculoOriginal?.placa || "",
    ano: veiculoOriginal?.ano ? String(veiculoOriginal.ano) : "",
    cambio: veiculoOriginal?.cambio || "",
    capacidade: veiculoOriginal?.capacidade ? String(veiculoOriginal.capacidade) : "",
    status: veiculoOriginal?.status || "DISPONIVEL",
    eletrico: veiculoOriginal?.eletrico || false,
    adaptado: veiculoOriginal?.adaptado || false,
  });
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    document.title = isNovo ? "MOVA - Adicionar Veículo" : "MOVA - Editar Veículo";
  }, [isNovo]);

  function handleChange(key, value) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErro(null);

    const payload = {
      marca: values.marca,
      modelo: values.modelo,
      placa: values.placa.toUpperCase(),
      ano: Number(values.ano),
      cambio: values.cambio,
      capacidade: Number(values.capacidade),
      status: values.status,
      eletrico: Boolean(values.eletrico),
      adaptado: Boolean(values.adaptado),
    };

    setSalvando(true);
    try {
      if (isNovo) {
        if (!idLocador) throw new Error("Sessão inválida. Faça login novamente.");
        await createVeiculo({ ...payload, idLocador });
      } else {
        await updateVeiculo(id, payload);
      }
      navigate("/cadastro-carros");
    } catch (e) {
      setErro(e.message || "Não foi possível salvar o veículo.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <AuthenticatedLayout title="Informações" align={isNovo ? "left" : "center"}>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {erro && (
          <p className="auth-feedback auth-feedback--error" role="status" aria-live="polite">
            {erro}
          </p>
        )}

        <div className="auth-field">
          {isNovo && <label htmlFor="marca">Marca*</label>}
          <input
            id="marca"
            type="text"
            placeholder="Marca*"
            required
            value={values.marca}
            onChange={(e) => handleChange("marca", e.target.value)}
          />
        </div>

        <div className="auth-field">
          {isNovo && <label htmlFor="modelo">Modelo*</label>}
          <input
            id="modelo"
            type="text"
            placeholder="Modelo*"
            required
            value={values.modelo}
            onChange={(e) => handleChange("modelo", e.target.value)}
          />
        </div>

        <div className="auth-field">
          {isNovo && <label htmlFor="placa">Placa*</label>}
          <input
            id="placa"
            type="text"
            placeholder="Placa* (ex: ABC1D23)"
            required
            minLength={7}
            maxLength={8}
            value={values.placa}
            onChange={(e) => handleChange("placa", e.target.value.toUpperCase())}
          />
        </div>

        <div className="auth-field">
          {isNovo && <label htmlFor="ano">Ano*</label>}
          <select
            id="ano"
            className="filtro-select"
            required
            value={values.ano}
            onChange={(e) => handleChange("ano", e.target.value)}
          >
            <option value="" disabled>Ano*</option>
            {ANOS.map((ano) => (
              <option key={ano} value={ano}>{ano}</option>
            ))}
          </select>
        </div>

        <div className="auth-field">
          {isNovo && <label htmlFor="cambio">Câmbio*</label>}
          <select
            id="cambio"
            className="filtro-select"
            required
            value={values.cambio}
            onChange={(e) => handleChange("cambio", e.target.value)}
          >
            <option value="" disabled>Câmbio*</option>
            {CAMBIOS.map((cambio) => (
              <option key={cambio} value={cambio}>{cambio}</option>
            ))}
          </select>
        </div>

        <div className="auth-field">
          {isNovo && <label htmlFor="capacidade">Capacidade*</label>}
          <input
            id="capacidade"
            type="text"
            inputMode="numeric"
            placeholder="Capacidade* (nº de lugares)"
            required
            value={values.capacidade}
            onChange={(e) => handleChange("capacidade", e.target.value.replace(/\D/g, ""))}
          />
        </div>

        <div className="auth-field">
          {isNovo && <label htmlFor="status">Status*</label>}
          <select
            id="status"
            className="filtro-select"
            required
            value={values.status}
            onChange={(e) => handleChange("status", e.target.value)}
          >
            {STATUS_OPCOES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        <div className="auth-checkbox-group">
          <label className="auth-checkbox">
            <input
              type="checkbox"
              checked={values.eletrico}
              onChange={(e) => handleChange("eletrico", e.target.checked)}
            />
            Veículo elétrico
          </label>
          <label className="auth-checkbox">
            <input
              type="checkbox"
              checked={values.adaptado}
              onChange={(e) => handleChange("adaptado", e.target.checked)}
            />
            Veículo adaptado (acessibilidade)
          </label>
        </div>

        {isNovo && <p className="auth-required-note">Todos os campos com * são obrigatórios</p>}

        <button type="submit" className="auth-button" disabled={salvando}>
          {salvando ? "Salvando..." : isNovo ? "Finalizar Cadastro" : "Editar"}
        </button>
      </form>
    </AuthenticatedLayout>
  );
}
