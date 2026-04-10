import { useEffect } from "react";
import movaLogo from "../assets/mova_logo.png";
import FormField from "../components/FormField";
import { useFormState } from "../hooks/useFormState";
import { useFormSubmit } from "../hooks/useFormSubmit";
import AuthLayout from "../layout/AuthLayout";
import { requestPasswordReset } from "../services/authService";
import { validateForgotPasswordForm } from "../utils/formValidators";

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
    document.title = "MOVA - Recuperar Senha";
  }, []);

  const { handleSubmit, isSubmitting } = useFormSubmit({
    values,
    validate: validateForgotPasswordForm,
    setFormErrors,
    setFeedback,
    getInvalidFeedback: () => ({
      type: "error",
      message: "Informe um e-mail valido para continuar.",
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
      title="Recuperar Senha"
      logoSrc={movaLogo}
      logoAlt="Mova Logo"
      footerText="Lembrou sua senha?"
      footerLinkTo="/login"
      footerLinkLabel="Entrar"
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
          placeholder="seuemail@exemplo.com"
          ariaLabel="E-mail"
          value={values.email}
          onChange={(event) => setFieldValue("email", event.target.value)}
          required
          error={errors.email}
          autoComplete="email"
        />

        <button type="submit" className="auth-button" disabled={isSubmitting}>
          {isSubmitting ? "Enviando..." : "Enviar Link de Recuperacao"}
        </button>
      </form>
    </AuthLayout>
  );
}

export default ForgotPassword;
