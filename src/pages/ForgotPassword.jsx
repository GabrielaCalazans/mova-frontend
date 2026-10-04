import { useEffect } from "react";
import movaLogo from "../assets/mova_logo.png";
import FormField from "../components/FormField";
import { useFormState } from "../hooks/useFormState";
import { useFormSubmit } from "../hooks/useFormSubmit";
import AuthLayout from "../layout/AuthLayout";
import { requestPasswordReset } from "../services/authService";
import { validateForgotPasswordForm } from "../utils/formValidators";
import { t } from "../i18n";

function ForgotPassword() {
  const {
    values,
    errors,
    feedback,
    setFeedback,
    setFieldValue,
    setFormErrors,
  } = useFormState({
    email: "",
  });

  useEffect(() => {
    document.title = t("auth.forgot.documentTitle");
  }, []);

  const { handleSubmit, isSubmitting } = useFormSubmit({
    values,
    validate: validateForgotPasswordForm,
    setFormErrors,
    setFeedback,
    getInvalidFeedback: () => ({
      type: "error",
      message: t("auth.forgot.invalid"),
    }),
    getValidFeedback: (_validValues, submitResult) => ({
      type: "success",
      message: submitResult.message,
    }),
    getSubmitErrorFeedback: (error) => ({
      type: "error",
      message: error.message,
    }),
    onSubmit: requestPasswordReset,
  });

  return (
    <AuthLayout
      title={t("auth.forgot.title")}
      logoSrc={movaLogo}
      logoAlt={t("auth.logoAlt")}
      wordmark="MOVA"
      compactLogo
      footerText={t("auth.rememberedPassword")}
      footerLinkTo="/login"
      footerLinkLabel={t("auth.signIn")}
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {feedback && (
          <p className={`auth-feedback auth-feedback--${feedback.type}`} role="status" aria-live="polite">
            {feedback.message}
          </p>
        )}

        <FormField
          id="email"
          name="email"
          type="email"
          placeholder={t("auth.forgot.placeholder")}
          ariaLabel={t("auth.email")}
          value={values.email}
          onChange={(event) => setFieldValue("email", event.target.value)}
          required
          error={errors.email}
          autoComplete="email"
        />

        <button type="submit" className="auth-button" disabled={isSubmitting}>
          {isSubmitting ? t("auth.forgot.sending") : t("auth.forgot.submit")}
        </button>
      </form>
    </AuthLayout>
  );
}

export default ForgotPassword;
