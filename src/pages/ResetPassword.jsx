import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";

import movaLogo from "../assets/mova_logo.png";
import FormField from "../components/FormField";
import { useFormState } from "../hooks/useFormState";
import { useFormSubmit } from "../hooks/useFormSubmit";
import AuthLayout from "../layout/AuthLayout";
import { resetPassword } from "../services/authService";
import { validateResetPasswordForm } from "../utils/formValidators";
import { t } from "../i18n";

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{40,200}$/;

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const tokenValido = TOKEN_PATTERN.test(token);
  const {
    values,
    errors,
    feedback,
    setFeedback,
    setFieldValue,
    setFormErrors,
  } = useFormState({ token: tokenValido ? token : "", novaSenha: "", confirmarNovaSenha: "" });

  useEffect(() => {
    document.title = t("auth.reset.documentTitle");
  }, []);

  const { handleSubmit, isSubmitting } = useFormSubmit({
    values,
    validate: validateResetPasswordForm,
    setFormErrors,
    setFeedback,
    getInvalidFeedback: () => ({
      type: "error",
      message: t("auth.reset.invalid"),
    }),
    getValidFeedback: (_values, result) => ({
      type: "success",
      message: result.message,
    }),
    getSubmitErrorFeedback: (error) => ({
      type: "error",
      message: error.message,
    }),
    onSubmit: ({ token: formToken, novaSenha }) =>
      resetPassword({ token: formToken, novaSenha }),
  });

  return (
    <AuthLayout
      title={t("auth.reset.title")}
      logoSrc={movaLogo}
      logoAlt={t("auth.logoAlt")}
      wordmark="MOVA"
      compactLogo
      footerText={t("auth.rememberedPassword")}
      footerLinkTo="/login"
      footerLinkLabel={t("auth.signIn")}
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {!tokenValido && (
          <p className="auth-feedback auth-feedback--error" role="alert" aria-live="assertive">
            {t("auth.reset.invalidLink")}
          </p>
        )}
        {feedback && (
          <p className={`auth-feedback auth-feedback--${feedback.type}`} role="status" aria-live="polite">
            {feedback.message}
          </p>
        )}
        <p className="auth-required-note">
          {t("auth.reset.passwordRule")}
        </p>
        <FormField
          id="novaSenha"
          name="novaSenha"
          type="password"
          ariaLabel={t("auth.reset.newPassword")}
          value={values.novaSenha}
          onChange={(event) => setFieldValue("novaSenha", event.target.value)}
          error={errors.novaSenha}
          autoComplete="new-password"
          disabled={!tokenValido || isSubmitting}
          required
        />
        <FormField
          id="confirmarNovaSenha"
          name="confirmarNovaSenha"
          type="password"
          ariaLabel={t("auth.reset.confirmPassword")}
          value={values.confirmarNovaSenha}
          onChange={(event) => setFieldValue("confirmarNovaSenha", event.target.value)}
          error={errors.confirmarNovaSenha}
          autoComplete="new-password"
          disabled={!tokenValido || isSubmitting}
          required
        />
        <button type="submit" className="auth-button" disabled={!tokenValido || isSubmitting}>
          {isSubmitting ? t("auth.reset.submitting") : t("auth.reset.submit")}
        </button>
        {feedback?.type === "success" && (
          <p className="auth-footer"><Link to="/login">{t("auth.reset.signInWithNew")}</Link></p>
        )}
      </form>
    </AuthLayout>
  );
}

export default ResetPassword;
