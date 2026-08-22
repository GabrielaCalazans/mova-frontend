import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AuthenticatedLayout from "../layout/AuthenticatedLayout";
import { createGaragem, updateGaragem } from "../services/garagemService";
import { getAuthSession } from "../services/authSession";
import "../styles/relatorios.css";

export default function CadastroGaragemForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isNovo = id === "novo";
  const idLocador = getAuthSession()?.user?.id;

  const garagemOriginal = location.state?.garagem;

  const [values, setValues] = useState({
    nome: garagemOriginal?.nome || "",
    endereco: garagemOriginal?.endereco || "",
    capacidade: garagemOriginal?.capacidade ? String(garagemOriginal.capacidade) : "",
    acessibilidade: garagemOriginal?.acessibilidade ?? true,
  });
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    document.title = isNovo ? "MOVA - Adicionar Garagem" : "MOVA - Editar Garagem";
  }, [isNovo]);

  function handleChange(key, value) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErro(null);

    const payload = {
      nome: values.nome,
      endereco: values.endereco,
      capacidade: Number(values.capacidade),
      acessibilidade: Boolean(values.acessibilidade),
    };

    setSalvando(true);
    try {
      if (isNovo) {
        if (!idLocador) throw new Error("Sessão inválida. Faça login novamente.");
        await createGaragem({ ...payload, idLocador });
      } else {
        await updateGaragem(id, payload);
      }
      navigate("/cadastro-garagens");
    } catch (e) {
      setErro(e.message || "Não foi possível salvar a garagem.");
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
          {isNovo && <label htmlFor="nome">Nome*</label>}
          <input
            id="nome"
            type="text"
            placeholder="Nome*"
            required
            value={values.nome}
            onChange={(e) => handleChange("nome", e.target.value)}
          />
        </div>

        <div className="auth-field">
          {isNovo && <label htmlFor="endereco">Endereço*</label>}
          <input
            id="endereco"
            type="text"
            placeholder="Endereço*"
            required
            value={values.endereco}
            onChange={(e) => handleChange("endereco", e.target.value)}
          />
        </div>

        <div className="auth-field">
          {isNovo && <label htmlFor="capacidade">Capacidade Total*</label>}
          <input
            id="capacidade"
            type="text"
            inputMode="numeric"
            placeholder="Capacidade Total* (nº de vagas)"
            required
            value={values.capacidade}
            onChange={(e) => handleChange("capacidade", e.target.value.replace(/\D/g, ""))}
          />
        </div>

        <div className="auth-checkbox-group">
          <label className="auth-checkbox">
            <input
              type="checkbox"
              checked={values.acessibilidade}
              onChange={(e) => handleChange("acessibilidade", e.target.checked)}
            />
            Garagem acessível (vagas para veículos adaptados)
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
