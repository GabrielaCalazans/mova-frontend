import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";

import movaLogo from "../assets/mova_logo.png";
import FormField from "../components/FormField";
import { useFormState } from "../hooks/useFormState";
import { useFormSubmit } from "../hooks/useFormSubmit";
import AuthLayout from "../layout/AuthLayout";
import { resetPassword } from "../services/authService";
import { validateResetPasswordForm } from "../utils/formValidators";

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
    document.title = "MOVA - Redefinir Senha";
  }, []);

  const { handleSubmit, isSubmitting } = useFormSubmit({
    values,
    validate: validateResetPasswordForm,
    setFormErrors,
    setFeedback,
    getInvalidFeedback: () => ({
      type: "error",
      message: "Confira a nova senha e a confirmação.",
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
      title="Redefinir Senha"
      logoSrc={movaLogo}
      logoAlt="Mova Logo"
      wordmark="MOVA"
      compactLogo
      footerText="Lembrou sua senha?"
      footerLinkTo="/login"
      footerLinkLabel="Entrar"
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {!tokenValido && (
          <p className="auth-feedback auth-feedback--error" role="alert" aria-live="assertive">
            Link de recuperação inválido ou expirado.
          </p>
        )}
        {feedback && (
          <p className={`auth-feedback auth-feedback--${feedback.type}`} role="status" aria-live="polite">
            {feedback.message}
          </p>
        )}
        <p className="auth-required-note">
          Use 8+ caracteres com maiúscula, minúscula, número e caractere especial.
        </p>
        <FormField
          id="novaSenha"
          name="novaSenha"
          type="password"
          ariaLabel="Nova senha"
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
          ariaLabel="Confirmar nova senha"
          value={values.confirmarNovaSenha}
          onChange={(event) => setFieldValue("confirmarNovaSenha", event.target.value)}
          error={errors.confirmarNovaSenha}
          autoComplete="new-password"
          disabled={!tokenValido || isSubmitting}
          required
        />
        <button type="submit" className="auth-button" disabled={!tokenValido || isSubmitting}>
          {isSubmitting ? "Redefinindo..." : "Redefinir Senha"}
        </button>
        {feedback?.type === "success" && (
          <p className="auth-footer"><Link to="/login">Entrar com a nova senha</Link></p>
        )}
      </form>
    </AuthLayout>
  );
}

export default ResetPassword;
