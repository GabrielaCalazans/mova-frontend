import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AuthenticatedLayout from "../layout/AuthenticatedLayout";
import { createVeiculo, listFrota, updateVeiculo, uploadImagemVeiculo, deleteImagemVeiculo, reorderImagensVeiculo, setCapaImagemVeiculo } from "../services/veiculoService";
import { listGaragens } from "../services/garagemService";
import { getAuthSession } from "../services/authSession";
import "../styles/relatorios.css";

const ANOS = Array.from({ length: 12 }, (_, i) => String(2026 - i));
const CAMBIOS = ["Manual", "Automatico"];
const STATUS_OPCOES = ["DISPONIVEL", "MANUTENCAO", "INATIVO"];
const CATEGORIAS = ["ECONOMICO", "ESPACOSO", "EXECUTIVO", "PCD"];

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
    valorDiaria: veiculoOriginal?.valorDiaria ? String(veiculoOriginal.valorDiaria) : "",
    status: veiculoOriginal?.status || "DISPONIVEL",
    eletrico: veiculoOriginal?.eletrico || false,
    adaptado: veiculoOriginal?.adaptado || false,
    categoria: veiculoOriginal?.categoria || "",
    garagemId: veiculoOriginal?.garagemId || "",
  });
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [carregandoVeiculo, setCarregandoVeiculo] = useState(!isNovo && !veiculoOriginal);
  const [garagens, setGaragens] = useState([]);
  const [erroGaragens, setErroGaragens] = useState(null);
  const [imagensSelecionadas, setImagensSelecionadas] = useState([]);
  const [enviandoImagens, setEnviandoImagens] = useState(false);
  const [progressoImagens, setProgressoImagens] = useState(0);
  const [imagensAtuais, setImagensAtuais] = useState(veiculoOriginal?.imagens ?? []);

  const previewsSelecionadas = useMemo(() => imagensSelecionadas.map((arquivo) => ({
      nome: arquivo.name,
      url: URL.createObjectURL(arquivo),
    })), [imagensSelecionadas]);

  useEffect(() => () => {
    previewsSelecionadas.forEach(({ url }) => URL.revokeObjectURL(url));
  }, [previewsSelecionadas]);

  useEffect(() => {
    if (isNovo || veiculoOriginal || !id) return undefined;

    let ativo = true;
    listFrota()
      .then((frota) => {
        if (!ativo) return;
        const veiculo = (Array.isArray(frota) ? frota : []).find(
          (item) => String(item.id) === String(id),
        );
        if (!veiculo) {
          throw new Error("Veículo não encontrado na sua frota.");
        }
        setValues({
          marca: veiculo.marca || "",
          modelo: veiculo.modelo || "",
          placa: veiculo.placa || "",
          ano: veiculo.ano ? String(veiculo.ano) : "",
          cambio: veiculo.cambio || "",
          capacidade: veiculo.capacidade ? String(veiculo.capacidade) : "",
          valorDiaria: veiculo.valorDiaria ? String(veiculo.valorDiaria) : "",
          status: veiculo.status || "DISPONIVEL",
          eletrico: Boolean(veiculo.eletrico),
          adaptado: Boolean(veiculo.adaptado),
          categoria: veiculo.categoria || "",
          garagemId: veiculo.garagemId || "",
        });
        setImagensAtuais(veiculo.imagens ?? []);
        setErro(null);
      })
      .catch((error) => {
        if (ativo) setErro(error.message || "Não foi possível carregar o veículo.");
      })
      .finally(() => {
        if (ativo) setCarregandoVeiculo(false);
      });

    return () => {
      ativo = false;
    };
  }, [id, isNovo, veiculoOriginal]);

  useEffect(() => {
    let ativo = true;

    if (!idLocador) {
      queueMicrotask(() => {
        if (ativo) setErroGaragens("Sessão inválida. Faça login novamente.");
      });
      return () => {
        ativo = false;
      };
    }

    listGaragens({ idLocador })
      .then((lista) => {
        if (!ativo) return;
        setGaragens(Array.isArray(lista) ? lista : []);
        setErroGaragens(null);
      })
      .catch((e) => {
        if (!ativo) return;
        setGaragens([]);
        setErroGaragens(e.message || "Não foi possível carregar as garagens.");
      });

    return () => {
      ativo = false;
    };
  }, [idLocador]);

  useEffect(() => {
    document.title = isNovo ? "MOVA - Adicionar Veículo" : "MOVA - Editar Veículo";
  }, [isNovo]);

  function handleChange(key, value) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function removerImagem(imagem) {
    if (!id || typeof deleteImagemVeiculo !== "function") return;
    try {
      await deleteImagemVeiculo(id, imagem.id);
      setImagensAtuais((atual) => atual.filter((item) => item.id !== imagem.id));
    } catch (error) {
      setErro(error.message || "Não foi possível remover a imagem.");
    }
  }

  async function definirCapa(imagem) {
    if (!id || typeof setCapaImagemVeiculo !== "function") return;
    try {
      const imagens = await setCapaImagemVeiculo(id, imagem.id);
      setImagensAtuais(imagens);
    } catch (error) {
      setErro(error.message || "Não foi possível definir a capa.");
    }
  }

  async function moverImagem(index, delta) {
    if (!id || typeof reorderImagensVeiculo !== "function") return;
    const ordem = [...imagensAtuais];
    const destino = index + delta;
    if (destino < 0 || destino >= ordem.length) return;
    [ordem[index], ordem[destino]] = [ordem[destino], ordem[index]];
    try {
      const imagens = await reorderImagensVeiculo(id, ordem.map((item) => item.id));
      setImagensAtuais(imagens);
    } catch (error) {
      setErro(error.message || "Não foi possível reordenar as imagens.");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErro(null);

    const modeloPayload = {
      marca: values.marca,
      modelo: values.modelo,
      ano: Number(values.ano),
      cambio: values.cambio,
      capacidade: Number(values.capacidade),
      // Fonte de verdade do preco da reserva: o backend multiplica esta diaria
      // pelo numero de diarias. Ver auditoria/PAGAMENTO.md.
      valorDiaria: Number(values.valorDiaria),
      eletrico: Boolean(values.eletrico),
      adaptado: Boolean(values.adaptado),
      categoria: values.categoria || null,
    };
    const payload = isNovo
      ? {
          ...modeloPayload,
          placa: values.placa.toUpperCase(),
          status: values.status,
          categoria: values.categoria || undefined,
        }
      : {
          placa: values.placa.toUpperCase(),
          status: values.status,
          garagemId: values.garagemId || null,
          modelo: modeloPayload,
        };

    const payloadComGaragem = {
      ...payload,
      garagemId: values.garagemId || null,
    };

    setSalvando(true);
    try {
      let veiculoSalvo;
      if (isNovo) {
        if (!idLocador) throw new Error("Sessão inválida. Faça login novamente.");
        veiculoSalvo = await createVeiculo({ ...payloadComGaragem, idLocador });
      } else {
        veiculoSalvo = await updateVeiculo(id, payloadComGaragem);
      }
      const idParaUpload = veiculoSalvo?.id || id;
      if (imagensSelecionadas.length > 0) {
        if (!idParaUpload || typeof uploadImagemVeiculo !== "function") {
          throw new Error("Salve o veículo antes de enviar imagens.");
        }
        setEnviandoImagens(true);
        for (const arquivo of imagensSelecionadas) {
          const imagem = await uploadImagemVeiculo(
            idParaUpload,
            arquivo,
            "",
            (carregado, total) => {
              if (total > 0) setProgressoImagens(Math.round((carregado / total) * 100));
            },
          );
          if (imagem?.id) setImagensAtuais((atual) => [...atual, imagem]);
        }
      }
      navigate("/cadastro-carros");
    } catch (e) {
      setErro(
        e.code === "VEHICLE_HAS_ACTIVE_RESERVATION"
          ? "O veículo possui uma reserva que impede sua transferência de garagem."
          : e.message || "Não foi possível salvar o veículo.",
      );
    } finally {
      setEnviandoImagens(false);
      setProgressoImagens(0);
      setSalvando(false);
    }
  }

  const garagensElegiveis = garagens.filter((garagem) => {
    const atual = String(garagem.id) === String(values.garagemId);
    const temVaga = (garagem.veiculosAlocados ?? 0) < (garagem.capacidade ?? 0);
    return atual || (garagem.status === "ATIVA" && temVaga);
  });

  if (carregandoVeiculo) {
    return (
      <AuthenticatedLayout title="Informações" align="center">
        <p role="status" aria-live="polite">Carregando veículo…</p>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout title="Informações" align={isNovo ? "left" : "center"}>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {erro && (
          <p className="auth-feedback auth-feedback--error" role="status" aria-live="polite">
            {erro}
          </p>
        )}

        {imagensAtuais.length > 0 && (
          <section aria-label="Galeria de imagens do veículo" className="vehicle-image-gallery">
            {imagensAtuais.map((imagem, index) => (
              <figure key={imagem.id} className="vehicle-image-gallery__item">
                <img src={imagem.url} alt={imagem.altText || `Imagem ${index + 1} do veículo`} width={imagem.largura} height={imagem.altura} loading="lazy" />
                <figcaption>
                  <button type="button" onClick={() => definirCapa(imagem)} disabled={index === 0}>Definir capa</button>
                  <button type="button" onClick={() => void moverImagem(index, -1)} disabled={index === 0} aria-label={`Mover imagem ${index + 1} para cima`}>↑</button>
                  <button type="button" onClick={() => void moverImagem(index, 1)} disabled={index === imagensAtuais.length - 1} aria-label={`Mover imagem ${index + 1} para baixo`}>↓</button>
                  <button type="button" onClick={() => void removerImagem(imagem)}>Excluir</button>
                </figcaption>
              </figure>
            ))}
          </section>
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
          {isNovo && <label htmlFor="valorDiaria">Valor da diária*</label>}
          <input
            id="valorDiaria"
            type="text"
            inputMode="decimal"
            placeholder="Valor da diária* (R$)"
            required
            value={values.valorDiaria}
            onChange={(e) =>
              handleChange(
                "valorDiaria",
                e.target.value.replace(",", ".").replace(/[^0-9.]/g, ""),
              )
            }
          />
        </div>

        <div className="auth-field">
          <label htmlFor="categoria">Categoria</label>
          <select
            id="categoria"
            className="filtro-select"
            value={values.categoria}
            onChange={(e) => handleChange("categoria", e.target.value)}
          >
            <option value="">Sem categoria</option>
            {CATEGORIAS.map((categoria) => (
              <option key={categoria} value={categoria}>{categoria}</option>
            ))}
          </select>
        </div>

        <div className="auth-field">
          <label htmlFor="status">Status{isNovo ? "*" : ""}</label>
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

        <div className="auth-field">
          <label htmlFor="garagemId">Garagem operacional</label>
          <select
            id="garagemId"
            className="filtro-select"
            value={values.garagemId}
            onChange={(e) => handleChange("garagemId", e.target.value)}
          >
            <option value="">Sem garagem (em preparação)</option>
            {garagensElegiveis.map((garagem) => (
              <option key={garagem.id} value={garagem.id}>
                {garagem.nome}
                {garagem.status !== "ATIVA" ? " (indisponível)" : ""}
              </option>
            ))}
          </select>
          {erroGaragens && (
            <small role="status">{erroGaragens}</small>
          )}
          {!erroGaragens && garagensElegiveis.length === 0 && (
            <small role="status">
              Nenhuma garagem própria ativa com vaga disponível.
            </small>
          )}
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

        <div className="auth-field">
          <label htmlFor="imagens-veiculo">Imagens reais do veículo</label>
          <input
            id="imagens-veiculo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(event) => setImagensSelecionadas(Array.from(event.target.files ?? []))}
          />
          <small>JPEG, PNG ou WebP; o servidor valida bytes e dimensões.</small>
          {imagensSelecionadas.length > 0 && <span role="status">{imagensSelecionadas.length} imagem(ns) pronta(s) para envio.</span>}
          {previewsSelecionadas.length > 0 && (
            <div aria-label="Pré-visualizações locais" className="vehicle-image-gallery">
              {previewsSelecionadas.map((preview) => (
                <figure key={preview.url} className="vehicle-image-gallery__item">
                  <img src={preview.url} alt={`Prévia local de ${preview.nome}`} width="160" height="100" />
                  <figcaption>{preview.nome}</figcaption>
                </figure>
              ))}
            </div>
          )}
        </div>

        {isNovo && <p className="auth-required-note">Todos os campos com * são obrigatórios</p>}

        <button type="submit" className="auth-button" disabled={salvando}>
          {salvando ? (enviandoImagens ? `Enviando imagens${progressoImagens ? ` (${progressoImagens}%)` : "..."}` : "Salvando...") : isNovo ? "Finalizar Cadastro" : "Editar"}
        </button>
      </form>
    </AuthenticatedLayout>
  );
}
