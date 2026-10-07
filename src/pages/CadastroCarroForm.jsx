import { useEffect, useMemo, useRef, useState } from "react";
import { rotulo, STATUS_VEICULO_LABELS } from "../services/apiEnums";
import { formatCategoria } from "../utils/vehicleDisplay";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowDown, ArrowUp } from "lucide-react";
import { createVeiculo, listFrota, updateVeiculo, uploadImagemVeiculo, deleteImagemVeiculo, reorderImagensVeiculo, setCapaImagemVeiculo } from "../services/veiculoService";
import { listGaragens } from "../services/garagemService";
import { getAuthSession } from "../services/authSession";
import { t } from "../i18n";
import HistoricoAlteracoes from "../components/vehicle/HistoricoAlteracoes";
import "../styles/owner.css";

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

  // Status confirmado pelo backend; volta para ele quando a mudança é recusada.
  const statusSalvo = useRef(veiculoOriginal?.status || "DISPONIVEL");
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
          throw new Error(t("owner.carForm.notFound"));
        }
        statusSalvo.current = veiculo.status || "DISPONIVEL";
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
        if (ativo) setErro(error.message || t("owner.carForm.loadError"));
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
        if (ativo) setErroGaragens(t("owner.common.sessionInvalid"));
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
        setErroGaragens(e.message || t("owner.carForm.garagesLoadError"));
      });

    return () => {
      ativo = false;
    };
  }, [idLocador]);

  useEffect(() => {
    document.title = isNovo ? t("owner.carForm.docTitleNew") : t("owner.carForm.docTitleEdit");
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
      setErro(error.message || t("owner.carForm.removeImageError"));
    }
  }

  async function definirCapa(imagem) {
    if (!id || typeof setCapaImagemVeiculo !== "function") return;
    try {
      const imagens = await setCapaImagemVeiculo(id, imagem.id);
      setImagensAtuais(imagens);
    } catch (error) {
      setErro(error.message || t("owner.carForm.coverError"));
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
      setErro(error.message || t("owner.carForm.reorderError"));
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
        if (!idLocador) throw new Error(t("owner.common.sessionInvalid"));
        veiculoSalvo = await createVeiculo({ ...payloadComGaragem, idLocador });
      } else {
        veiculoSalvo = await updateVeiculo(id, payloadComGaragem);
      }
      const idParaUpload = veiculoSalvo?.id || id;
      if (imagensSelecionadas.length > 0) {
        if (!idParaUpload || typeof uploadImagemVeiculo !== "function") {
          throw new Error(t("owner.carForm.saveBeforeUpload"));
        }
        setEnviandoImagens(true);
        let enviadas = 0;
        try {
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
            enviadas += 1;
          }
        } catch (erroUpload) {
          // Só as que falharam continuam selecionadas para nova tentativa.
          setImagensSelecionadas((atual) => atual.slice(enviadas));
          if (isNovo && veiculoSalvo?.id) {
            navigate(`/cadastro-carros/${veiculoSalvo.id}`, {
              replace: true,
              state: { aviso: t("owner.carForm.partialUpload") },
            });
            return;
          }
          throw erroUpload;
        }
      }
      navigate("/cadastro-carros");
    } catch (e) {
      if (e.code === "VEICULO_COM_RESERVA_FUTURA_CONFIRMADA") {
        handleChange("status", statusSalvo.current);
      }
      setErro(
        e.code === "VEHICLE_HAS_ACTIVE_RESERVATION"
          ? t("owner.carForm.activeReservation")
          : e.code === "VEICULO_COM_RESERVA_FUTURA_CONFIRMADA"
            ? t("owner.carForm.futureBookingBlocksStatus")
            : e.message || t("owner.carForm.saveError"),
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

  const titulo = isNovo ? t("owner.carForm.titleNew") : t("owner.carForm.titleEdit");

  if (carregandoVeiculo) {
    return (
      <main className="owner-page" aria-labelledby="veiculo-form-title">
        <header className="page-head"><h1 id="veiculo-form-title">{titulo}</h1></header>
        <p className="loading-state" role="status" aria-live="polite"><span className="spinner" aria-hidden="true" />{t("owner.carForm.loading")}</p>
      </main>
    );
  }

  const campo = (id, rotulo, props, onChange) => (
    <div className="field">
      <label className="field__label" htmlFor={id}>{rotulo}</label>
      <input id={id} className="field__control" value={values[id]} onChange={onChange} {...props} />
    </div>
  );

  return (
    <main className="owner-page" aria-labelledby="veiculo-form-title">
      <header className="page-head">
        <h1 id="veiculo-form-title">{titulo}</h1>
        <p className="page-head__lede">{t("owner.carForm.lede")}</p>
      </header>
      <form className="owner-form" onSubmit={handleSubmit} noValidate>
        {location.state?.aviso && (
          <p className="alert alert--warning" role="status">
            {location.state.aviso}
          </p>
        )}
        {erro && (
          <p className="alert alert--danger" role="status" aria-live="polite">
            {erro}
          </p>
        )}

        <fieldset className="fieldset">
          <legend>{t("owner.carForm.identification")}</legend>
          <div className="owner-form__grid">
            {campo("marca", t("owner.carForm.brand"), { type: "text", placeholder: t("owner.carForm.brand"), required: true }, (e) => handleChange("marca", e.target.value))}
            {campo("modelo", t("owner.carForm.model"), { type: "text", placeholder: t("owner.carForm.model"), required: true }, (e) => handleChange("modelo", e.target.value))}
            {campo("placa", t("owner.carForm.plate"), { type: "text", placeholder: t("owner.carForm.platePlaceholder"), required: true, minLength: 7, maxLength: 8, autoCapitalize: "characters" }, (e) => handleChange("placa", e.target.value.toUpperCase()))}
            <div className="field">
              <label className="field__label" htmlFor="ano">{t("owner.carForm.year")}</label>
              <select id="ano" className="field__control" required value={values.ano} onChange={(e) => handleChange("ano", e.target.value)}>
                <option value="" disabled>{t("owner.carForm.year")}</option>
                {ANOS.map((ano) => (
                  <option key={ano} value={ano}>{ano}</option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset className="fieldset">
          <legend>{t("owner.carForm.features")}</legend>
          <div className="owner-form__grid">
            <div className="field">
              <label className="field__label" htmlFor="cambio">{t("owner.carForm.gearbox")}</label>
              <select id="cambio" className="field__control" required value={values.cambio} onChange={(e) => handleChange("cambio", e.target.value)}>
                <option value="" disabled>{t("owner.carForm.gearbox")}</option>
                {CAMBIOS.map((cambio) => (
                  <option key={cambio} value={cambio}>{t(`owner.carForm.gearboxOptions.${cambio}`)}</option>
                ))}
              </select>
            </div>
            {campo("capacidade", t("owner.carForm.seats"), { type: "text", inputMode: "numeric", placeholder: t("owner.carForm.seatsPlaceholder"), required: true }, (e) => handleChange("capacidade", e.target.value.replace(/\D/g, "")))}
            <div className="field">
              <label className="field__label" htmlFor="categoria">{t("owner.carForm.category")}</label>
              <select id="categoria" className="field__control" aria-describedby="categoria-hint" value={values.categoria} onChange={(e) => handleChange("categoria", e.target.value)}>
                <option value="">{t("owner.carForm.noCategory")}</option>
                {CATEGORIAS.map((categoria) => (
                  <option key={categoria} value={categoria}>{formatCategoria(categoria)}</option>
                ))}
              </select>
              {/* RF16: categorias são predefinidas pela plataforma; o locador só escolhe. */}
              <small id="categoria-hint" className="field__hint">{t("owner.carForm.categoryHint")}</small>
            </div>
          </div>
          <div>
            <label className="checkline">
              <input
                type="checkbox"
                checked={values.eletrico}
                onChange={(e) => handleChange("eletrico", e.target.checked)}
              />
              {t("owner.carForm.electric")}
            </label>
            <label className="checkline">
              <input
                type="checkbox"
                checked={values.adaptado}
                onChange={(e) => handleChange("adaptado", e.target.checked)}
              />
              {t("owner.carForm.adapted")}
            </label>
          </div>
        </fieldset>

        <fieldset className="fieldset">
          <legend>{t("owner.common.operation")}</legend>
          <div className="owner-form__grid">
            {campo("valorDiaria", t("owner.carForm.dailyRate"), { type: "text", inputMode: "decimal", placeholder: t("owner.carForm.dailyRatePlaceholder"), required: true }, (e) =>
              handleChange("valorDiaria", e.target.value.replace(",", ".").replace(/[^0-9.]/g, "")),
            )}
            <div className="field">
              <label className="field__label" htmlFor="status">{t("owner.common.status")}{isNovo ? "*" : ""}</label>
              <select id="status" className="field__control" required value={values.status} onChange={(e) => handleChange("status", e.target.value)}>
                {STATUS_OPCOES.map((status) => (
                  <option key={status} value={status}>{rotulo(STATUS_VEICULO_LABELS, status)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="garagemId">{t("owner.carForm.garage")}</label>
            <select id="garagemId" className="field__control" value={values.garagemId} onChange={(e) => handleChange("garagemId", e.target.value)}>
              <option value="">{t("owner.carForm.noGarage")}</option>
              {garagensElegiveis.map((garagem) => (
                <option key={garagem.id} value={garagem.id}>
                  {garagem.nome}
                  {garagem.status !== "ATIVA" ? t("owner.carForm.garageUnavailable") : ""}
                </option>
              ))}
            </select>
            {erroGaragens && (
              <small className="field__error" role="status">{erroGaragens}</small>
            )}
            {!erroGaragens && garagensElegiveis.length === 0 && (
              <small className="field__hint" role="status">
                {t("owner.carForm.noEligibleGarage")}
              </small>
            )}
          </div>
        </fieldset>

        <fieldset className="fieldset">
          <legend>{t("owner.carForm.images")}</legend>
          {imagensAtuais.length > 0 && (
            <section aria-label={t("owner.carForm.galleryLabel")} className="owner-gallery">
              {imagensAtuais.map((imagem, index) => (
                <figure key={imagem.id}>
                  <img src={imagem.url} alt={imagem.altText || t("owner.carForm.imageAlt", { index: index + 1 })} width={imagem.largura} height={imagem.altura} loading="lazy" />
                  <figcaption>
                    <button type="button" className="btn btn--quiet" onClick={() => definirCapa(imagem)} disabled={index === 0}>{t("owner.carForm.setCover")}</button>
                    <button type="button" className="icon-btn icon-btn--outlined" onClick={() => void moverImagem(index, -1)} disabled={index === 0} aria-label={t("owner.carForm.moveUp", { index: index + 1 })}><ArrowUp className="icon" aria-hidden="true" /></button>
                    <button type="button" className="icon-btn icon-btn--outlined" onClick={() => void moverImagem(index, 1)} disabled={index === imagensAtuais.length - 1} aria-label={t("owner.carForm.moveDown", { index: index + 1 })}><ArrowDown className="icon" aria-hidden="true" /></button>
                    <button type="button" className="btn btn--danger" onClick={() => void removerImagem(imagem)}>{t("owner.common.delete")}</button>
                  </figcaption>
                </figure>
              ))}
            </section>
          )}
          <div className="field">
            <label className="field__label" htmlFor="imagens-veiculo">{t("owner.carForm.realImages")}</label>
            <input
              id="imagens-veiculo"
              className="field__control"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              aria-describedby="imagens-veiculo-hint"
              onChange={(event) => setImagensSelecionadas(Array.from(event.target.files ?? []))}
            />
            <small id="imagens-veiculo-hint" className="field__hint">{t("owner.carForm.imagesHint")}</small>
            {imagensSelecionadas.length > 0 && <span className="field__hint" role="status">{t("owner.carForm.imagesReady", { count: imagensSelecionadas.length })}</span>}
          </div>
          {previewsSelecionadas.length > 0 && (
            <div aria-label={t("owner.carForm.previewsLabel")} className="owner-gallery">
              {previewsSelecionadas.map((preview) => (
                <figure key={preview.url}>
                  <img src={preview.url} alt={t("owner.carForm.previewAlt", { name: preview.nome })} width="160" height="100" />
                  <figcaption>{preview.nome}</figcaption>
                </figure>
              ))}
            </div>
          )}
        </fieldset>

        {isNovo && <p className="owner-form__note">{t("owner.common.requiredNote")}</p>}

        <div className="owner-form__actions">
          <button type="button" className="btn btn--secondary btn--lg" onClick={() => navigate("/cadastro-carros")} disabled={salvando}>
            {t("owner.common.cancel")}
          </button>
          <button type="submit" className="btn btn--lg" disabled={salvando}>
            {salvando ? (enviandoImagens ? t("owner.carForm.uploading", { progress: progressoImagens ? ` (${progressoImagens}%)` : t("owner.carForm.uploadingDots") }) : t("owner.common.saving")) : isNovo ? t("owner.common.finishRegistration") : t("owner.common.submitEdit")}
          </button>
        </div>
      </form>
      {!isNovo && id && <HistoricoAlteracoes idVeiculo={id} garagens={garagens} />}
    </main>
  );
}
