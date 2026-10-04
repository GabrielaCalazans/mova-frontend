import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { createGaragem, listGaragens, updateGaragem } from "../services/garagemService";
import { getAuthSession } from "../services/authSession";
import "../styles/owner.css";

const STATUS_OPCOES = ["ATIVA", "INATIVA", "MANUTENCAO"];

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
    status: garagemOriginal?.status || "ATIVA",
  });
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [carregandoGaragem, setCarregandoGaragem] = useState(!isNovo && !garagemOriginal);

  useEffect(() => {
    if (isNovo || garagemOriginal || !idLocador || !id) return undefined;

    let ativo = true;
    listGaragens({ idLocador })
      .then((garagens) => {
        if (!ativo) return;
        const garagem = (Array.isArray(garagens) ? garagens : []).find(
          (item) => String(item.id) === String(id),
        );
        if (!garagem) {
          throw new Error("Garagem não encontrada na sua conta.");
        }
        setValues({
          nome: garagem.nome || "",
          endereco: garagem.endereco || "",
          capacidade: garagem.capacidade ? String(garagem.capacidade) : "",
          acessibilidade: garagem.acessibilidade ?? true,
          status: garagem.status || "ATIVA",
        });
        setErro(null);
      })
      .catch((error) => {
        if (ativo) setErro(error.message || "Não foi possível carregar a garagem.");
      })
      .finally(() => {
        if (ativo) setCarregandoGaragem(false);
      });

    return () => {
      ativo = false;
    };
  }, [garagemOriginal, id, idLocador, isNovo]);

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
      ...(isNovo ? {} : { status: values.status }),
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

  const titulo = isNovo ? "Adicionar garagem" : "Editar garagem";

  if (carregandoGaragem) {
    return (
      <main className="owner-page" aria-labelledby="garagem-form-title">
        <header className="page-head"><h1 id="garagem-form-title">{titulo}</h1></header>
        <p className="loading-state" role="status" aria-live="polite"><span className="spinner" aria-hidden="true" />Carregando garagem…</p>
      </main>
    );
  }

  return (
    <main className="owner-page" aria-labelledby="garagem-form-title">
      <header className="page-head">
        <h1 id="garagem-form-title">{titulo}</h1>
        <p className="page-head__lede">Ponto de retirada e devolução: endereço, vagas e acessibilidade.</p>
      </header>
      <form className="owner-form" onSubmit={handleSubmit} noValidate>
        {erro && (
          <p className="alert alert--danger" role="status" aria-live="polite">
            {erro}
          </p>
        )}

        <fieldset className="fieldset">
          <legend>Dados da garagem</legend>
          <div className="field">
            <label className="field__label" htmlFor="nome">Nome*</label>
            <input
              id="nome"
              className="field__control"
              type="text"
              placeholder="Nome*"
              required
              value={values.nome}
              onChange={(e) => handleChange("nome", e.target.value)}
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="endereco">Endereço*</label>
            <input
              id="endereco"
              className="field__control"
              type="text"
              placeholder="Endereço*"
              required
              value={values.endereco}
              onChange={(e) => handleChange("endereco", e.target.value)}
            />
          </div>
        </fieldset>

        <fieldset className="fieldset">
          <legend>Operação</legend>
          <div className="owner-form__grid">
            <div className="field">
              <label className="field__label" htmlFor="capacidade">Capacidade Total*</label>
              <input
                id="capacidade"
                className="field__control"
                type="text"
                inputMode="numeric"
                placeholder="Capacidade Total* (nº de vagas)"
                required
                value={values.capacidade}
                onChange={(e) => handleChange("capacidade", e.target.value.replace(/\D/g, ""))}
              />
            </div>

            {!isNovo && (
              <div className="field">
                <label className="field__label" htmlFor="status">Status</label>
                <select
                  id="status"
                  className="field__control"
                  value={values.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                >
                  {STATUS_OPCOES.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <label className="checkline">
            <input
              type="checkbox"
              checked={values.acessibilidade}
              onChange={(e) => handleChange("acessibilidade", e.target.checked)}
            />
            Garagem acessível (vagas para veículos adaptados)
          </label>
        </fieldset>

        {isNovo && <p className="owner-form__note">Todos os campos com * são obrigatórios</p>}

        <div className="owner-form__actions">
          <button type="button" className="btn btn--secondary btn--lg" onClick={() => navigate("/cadastro-garagens")} disabled={salvando}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--lg" disabled={salvando}>
            {salvando ? "Salvando..." : isNovo ? "Finalizar Cadastro" : "Editar"}
          </button>
        </div>
      </form>
    </main>
  );
}
