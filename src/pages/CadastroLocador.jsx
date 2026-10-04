import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import movaLogo from "../assets/mova_logo.png";
import AuthLayout from "../layout/AuthLayout";
import FormField from "../components/FormField";
import { useFormState } from "../hooks/useFormState";
import { useFormSubmit } from "../hooks/useFormSubmit";
import { registerLocador } from "../services/authService";
import { maskCelphone, maskCnpj, maskCep } from "../utils/inputMasks";
import { validateLocadorRegisterForm } from "../utils/formValidators";
import {
  ModalOverlay,
  SuccessModal,
  IconCircle,
  SuccessTitle,
  SuccessSubtitle,
} from "../styles/authStyle";
import { t } from "../i18n";

function CadastroLocador() {
  const navigate = useNavigate();
  const [cadastroConcluido, setCadastroConcluido] = useState(false);
  const {
    values,
    errors,
    feedback,
    setFeedback,
    setFieldValue,
    setFormErrors,
  } = useFormState({
    name: "",
    email: "",
    celphone: "",
    empresa: "",
    cnpj: "",
    address: "",
    cep: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    document.title = t("auth.registerOwner.documentTitle");
  }, []);

  const { handleSubmit, isSubmitting } = useFormSubmit({
    values,
    validate: validateLocadorRegisterForm,
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
      const result = await registerLocador(submitValues);
      setCadastroConcluido(true);
      setTimeout(() => navigate("/login", { replace: true }), 2200);
      return result;
    },
  });

  return (
    <AuthLayout
      title={t("auth.registerOwner.title")}
      logoSrc={movaLogo}
      logoAlt={t("auth.logoAlt")}
      footerText={t("auth.registerOwner.renterPrompt")}
      footerLinkTo="/cadastro"
      footerLinkLabel={t("auth.registerOwner.renterLink")}
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {feedback && (
          <p className={`auth-feedback auth-feedback--${feedback.type}`} role="status" aria-live="polite">
            {feedback.message}
          </p>
        )}

        <FormField
          id="name"
          name="name"
          type="text"
          placeholder={t("auth.registerOwner.ownerName")}
          ariaLabel={t("auth.registerOwner.ownerName")}
          value={values.name}
          onChange={(e) => setFieldValue("name", e.target.value)}
          required
          error={errors.name}
          autoComplete="name"
        />

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
          id="celphone"
          name="celphone"
          type="text"
          placeholder={t("auth.registerOwner.phone")}
          ariaLabel={t("auth.registerOwner.phone")}
          value={values.celphone}
          onChange={(e) => setFieldValue("celphone", maskCelphone(e.target.value))}
          required
          error={errors.celphone}
          inputMode="numeric"
          autoComplete="tel-national"
        />

        <FormField
          id="empresa"
          name="empresa"
          type="text"
          placeholder={t("auth.registerOwner.company")}
          ariaLabel={t("auth.registerOwner.company")}
          value={values.empresa}
          onChange={(e) => setFieldValue("empresa", e.target.value)}
          required
          error={errors.empresa}
          autoComplete="organization"
        />

        <FormField
          id="cnpj"
          name="cnpj"
          type="text"
          placeholder={t("auth.registerOwner.cnpj")}
          ariaLabel={t("auth.registerOwner.cnpj")}
          value={values.cnpj}
          onChange={(e) => setFieldValue("cnpj", maskCnpj(e.target.value))}
          required
          error={errors.cnpj}
          inputMode="numeric"
        />

        <FormField
          id="address"
          name="address"
          type="text"
          placeholder={t("auth.registerOwner.address")}
          ariaLabel={t("auth.registerOwner.address")}
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
          placeholder={t("auth.registerOwner.cep")}
          ariaLabel={t("auth.registerOwner.cep")}
          value={values.cep}
          onChange={(e) => setFieldValue("cep", maskCep(e.target.value))}
          required
          error={errors.cep}
          inputMode="numeric"
          autoComplete="postal-code"
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
          autoComplete="new-password"
        />

        <FormField
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder={t("auth.registerOwner.confirmPassword")}
          ariaLabel={t("auth.registerOwner.confirmPassword")}
          value={values.confirmPassword}
          onChange={(e) => setFieldValue("confirmPassword", e.target.value)}
          required
          error={errors.confirmPassword}
          autoComplete="new-password"
        />

        <button type="submit" className="auth-button" disabled={isSubmitting}>
          {isSubmitting ? t("auth.registering") : t("auth.registerOwner.submit")}
        </button>

        <p className="auth-footer">
          {t("auth.haveAccount")} <Link to="/login">{t("auth.signIn")}</Link>
        </p>
      </form>

      {cadastroConcluido && (
        <ModalOverlay>
          <SuccessModal>
            <IconCircle>
              <CheckCircle size={48} color="currentColor" strokeWidth={1.5} aria-hidden="true" />
            </IconCircle>
            <SuccessTitle>{t("auth.successTitle")}</SuccessTitle>
            <SuccessSubtitle>
              {t("auth.registerOwner.successText")}
            </SuccessSubtitle>
          </SuccessModal>
        </ModalOverlay>
      )}
    </AuthLayout>
  );
}

export default CadastroLocador;