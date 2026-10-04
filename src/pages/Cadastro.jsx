import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle } from "lucide-react";
import movaLogo from "../assets/mova_logo.png";
import AuthLayout from "../layout/AuthLayout";
import FormField from "../components/FormField";
import { useFormState } from "../hooks/useFormState";
import { useFormSubmit } from "../hooks/useFormSubmit";
import { registerLocatario } from "../services/authService";
import { listDeficiencias } from "../services/deficienciaService";
import { maskCelphone, maskCep, maskCpf } from "../utils/inputMasks";
import {
  getPasswordState,
  validateCadastroContaForm,
  validateCadastroDetalhesForm,
} from "../utils/formValidators";
import {
  ModalOverlay,
  SuccessModal,
  IconCircle,
  SuccessTitle,
  SuccessSubtitle,
} from "../styles/authStyle";
import { t } from "../i18n";

function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [cadastroConcluido, setCadastroConcluido] = useState(false);
  const [deficiencias, setDeficiencias] = useState([]);

  useEffect(() => {
    listDeficiencias().then(setDeficiencias);
  }, []);

  const {
    values,
    errors,
    feedback,
    setFeedback,
    setFieldValue,
    setFormErrors,
  } = useFormState({
    email: "",
    password: "",
    name: "",
    celphone: "",
    cpf: "",
    cnh: "",
    rg: "",
    dataNascimento: "",
    address: "",
    cep: "",
    deficienciaId: "",
    agreeTerms: false,
    agreePrivacy: false,
  });

  useEffect(() => {
    document.title = t("auth.register.documentTitle");
  }, []);

  const passwordState = getPasswordState(values.password);

  const passwordHelperText =
    passwordState === "default" || passwordState === "warning"
      ? t("auth.register.passwordHint")
      : passwordState === "success"
        ? t("auth.register.passwordStrong")
        : undefined;

  const passwordHelperType = passwordState === "success" ? "success" : "warning";

  const { handleSubmit: handleAccountSubmit, isSubmitting: isAdvancing } = useFormSubmit({
    values,
    validate: validateCadastroContaForm,
    setFormErrors,
    setFeedback,
    getInvalidFeedback: () => ({
      type: "error",
      message: t("auth.register.invalidAccount"),
    }),
    onSubmit: async () => setStep(2),
  });

  const { handleSubmit: handleDetailsSubmit, isSubmitting: isRegistering } = useFormSubmit({
    values,
    validate: validateCadastroDetalhesForm,
    setFormErrors,
    setFeedback,
    getInvalidFeedback: () => ({
      type: "error",
      message: t("auth.invalidFields"),
    }),
    getSubmitErrorFeedback: (error) => ({
      type: "error",
      message: error.message,
    }),
    onSubmit: async (submitValues) => {
      const result = await registerLocatario(submitValues);
      setCadastroConcluido(true);
      setTimeout(() => navigate("/login", { replace: true }), 2200);
      return result;
    },
  });

  if (step === 1) {
    return (
      <AuthLayout
        title={t("auth.register.title")}
        logoSrc={movaLogo}
        logoAlt={t("auth.logoAlt")}
        wordmark="MOVA"
        tagline={t("auth.tagline")}
      >
        <form className="auth-form" onSubmit={handleAccountSubmit} noValidate>
          {feedback && (
            <p className={`auth-feedback auth-feedback--${feedback.type}`} role="status" aria-live="polite">
              {feedback.message}
            </p>
          )}

          <FormField
            id="email"
            name="email"
            type="email"
            placeholder={t("auth.email")}
            ariaLabel={t("auth.email")}
            value={values.email}
            onChange={(e) => setFieldValue("email", e.target.value)}
            required
            error={errors.email}
            autoComplete="email"
          />

          <FormField
            id="password"
            name="password"
            type="password"
            placeholder={t("auth.password")}
            ariaLabel={t("auth.password")}
            value={values.password}
            onChange={(e) => setFieldValue("password", e.target.value)}
            required
            error={errors.password}
            helperText={!errors.password ? passwordHelperText : undefined}
            helperType={passwordHelperType}
            inputState={passwordState}
            autoComplete="new-password"
          />

          <button type="submit" className="auth-button" disabled={isAdvancing}>
            {isAdvancing ? t("auth.register.advancing") : t("auth.register.continue")}
          </button>

          <div className="auth-divider">
            <p className="auth-footer">
              {t("auth.haveAccount")} <Link to="/login">{t("auth.signIn")}</Link>
            </p>
            <p className="auth-footer">
              {t("auth.register.ownerPrompt")} <Link to="/cadastro-locador">{t("auth.register.ownerLink")}</Link>
            </p>
          </div>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={t("auth.register.title")}
      align="left"
      logoSrc={movaLogo}
      topBarSlot={
        <button
          type="button"
          className="auth-step-back"
          onClick={() => setStep(1)}
          aria-label={t("auth.register.back")}
        >
          <ArrowLeft strokeWidth={2} aria-hidden="true" />
        </button>
      }
    >
      <form className="auth-form" onSubmit={handleDetailsSubmit} noValidate>
        {feedback && (
          <p className={`auth-feedback auth-feedback--${feedback.type}`} role="status" aria-live="polite">
            {feedback.message}
          </p>
        )}

        <FormField
          id="name"
          name="name"
          type="text"
          label={`${t("auth.register.name")}*`}
          placeholder={`${t("auth.register.name")}*`}
          ariaLabel={t("auth.register.name")}
          value={values.name}
          onChange={(e) => setFieldValue("name", e.target.value)}
          required
          error={errors.name}
          autoComplete="name"
        />

        <FormField
          id="email-details"
          name="email"
          type="email"
          label={`${t("auth.email")}*`}
          placeholder={`${t("auth.email")}*`}
          ariaLabel={t("auth.email")}
          value={values.email}
          onChange={(e) => setFieldValue("email", e.target.value)}
          required
          error={errors.email}
          autoComplete="email"
        />

        <FormField
          id="celphone"
          name="celphone"
          type="text"
          label={`${t("auth.register.celphone")}*`}
          placeholder={`${t("auth.register.celphone")}*`}
          ariaLabel={t("auth.register.celphone")}
          value={values.celphone}
          onChange={(e) => setFieldValue("celphone", maskCelphone(e.target.value))}
          required
          error={errors.celphone}
          inputMode="numeric"
          autoComplete="tel-national"
        />

        <FormField
          id="cpf"
          name="cpf"
          type="text"
          label={`${t("auth.register.cpf")}*`}
          placeholder={`${t("auth.register.cpf")}*`}
          ariaLabel={t("auth.register.cpf")}
          value={values.cpf}
          onChange={(e) => setFieldValue("cpf", maskCpf(e.target.value))}
          required
          error={errors.cpf}
          inputMode="numeric"
        />

        <FormField
          id="cnh"
          name="cnh"
          type="text"
          label={`${t("auth.register.cnh")}*`}
          placeholder={`${t("auth.register.cnh")}*`}
          ariaLabel={t("auth.register.cnh")}
          value={values.cnh}
          onChange={(e) => setFieldValue("cnh", e.target.value)}
          required
          error={errors.cnh}
          inputMode="numeric"
        />

        <FormField
          id="rg"
          name="rg"
          type="text"
          label={`${t("auth.register.rg")}*`}
          placeholder={`${t("auth.register.rg")}*`}
          ariaLabel={t("auth.register.rg")}
          value={values.rg}
          onChange={(e) => setFieldValue("rg", e.target.value.toUpperCase())}
          required
          error={errors.rg}
        />

        <FormField
          id="dataNascimento"
          name="dataNascimento"
          type="date"
          label={`${t("auth.register.birthDate")}*`}
          ariaLabel={t("auth.register.birthDate")}
          value={values.dataNascimento}
          onChange={(e) => setFieldValue("dataNascimento", e.target.value)}
          required
          error={errors.dataNascimento}
        />

        <FormField
          id="address"
          name="address"
          type="text"
          label={`${t("auth.register.address")}*`}
          placeholder={`${t("auth.register.address")}*`}
          ariaLabel={t("auth.register.address")}
          value={values.address}
          onChange={(e) => setFieldValue("address", e.target.value)}
          required
          error={errors.address}
          autoComplete="street-address"
        />

        <FormField
          id="cep"
          name="cep"
          type="text"
          label={`${t("auth.register.cep")}*`}
          placeholder={`${t("auth.register.cep")}*`}
          ariaLabel={t("auth.register.cep")}
          value={values.cep}
          onChange={(e) => setFieldValue("cep", maskCep(e.target.value))}
          required
          error={errors.cep}
          inputMode="numeric"
          autoComplete="postal-code"
        />

        <div className="auth-field">
          <label htmlFor="deficienciaId">{t("auth.register.disability")}</label>
          <select
            id="deficienciaId"
            className="field__control"
            value={values.deficienciaId}
            onChange={(e) => setFieldValue("deficienciaId", e.target.value)}
          >
            <option value="">{t("auth.register.disabilityNone")}</option>
            {deficiencias.map((deficiencia) => (
              <option key={deficiencia.id} value={deficiencia.id}>
                {deficiencia.descricao}
              </option>
            ))}
          </select>
        </div>

        <p className="auth-required-note">{t("auth.register.requiredNote")}</p>

        <div className="auth-checkbox-group">
          <label className="auth-checkbox">
            <input
              type="checkbox"
              checked={values.agreeTerms}
              onChange={(e) => setFieldValue("agreeTerms", e.target.checked)}
            />
            {t("auth.register.agreeTerms")}
          </label>
          {errors.agreeTerms && (
            <p className="auth-message auth-message--error">{errors.agreeTerms}</p>
          )}

          <label className="auth-checkbox">
            <input
              type="checkbox"
              checked={values.agreePrivacy}
              onChange={(e) => setFieldValue("agreePrivacy", e.target.checked)}
            />
            {t("auth.register.agreePrivacy")}
          </label>
          {errors.agreePrivacy && (
            <p className="auth-message auth-message--error">{errors.agreePrivacy}</p>
          )}
        </div>

        <button type="submit" className="auth-button" disabled={isRegistering}>
          {isRegistering ? t("auth.registering") : t("auth.register.submit")}
        </button>
      </form>

      {cadastroConcluido && (
        <ModalOverlay>
          <SuccessModal>
            <IconCircle>
              <CheckCircle size={48} color="currentColor" strokeWidth={1.5} aria-hidden="true" />
            </IconCircle>
            <SuccessTitle>{t("auth.successTitle")}</SuccessTitle>
            <SuccessSubtitle>
              {t("auth.register.successText")}
            </SuccessSubtitle>
          </SuccessModal>
        </ModalOverlay>
      )}
    </AuthLayout>
  );
}

export default Register;
