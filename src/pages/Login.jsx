import { useEffect } from "react";
import { useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../layout/AuthLayout";
import movaLogo from "../assets/mova_logo.png";
import FormField from "../components/FormField";
import { useFormState } from "../hooks/useFormState";
import { useFormSubmit } from "../hooks/useFormSubmit";
import { resolveAuthRoute } from "../services/authIdentity";
import { consumeAuthFeedback, getAuthSession } from "../services/authSession";
import { loginUser } from "../services/authService";
import { validateLoginForm } from "../utils/formValidators";
import { t } from "../i18n";

function resolvePostLoginRoute(user) {
  return resolveAuthRoute(user);
}

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const redirectAfterLogin = useCallback((user) => {
    const from = location.state?.from;
    if (from?.pathname) {
      navigate(`${from.pathname}${from.search || ""}${from.hash || ""}`, { replace: true, state: from.state });
      return;
    }
    navigate(resolvePostLoginRoute(user), { replace: true });
  }, [location.state, navigate]);

  const {
    values,
    errors,
    feedback,
    setFeedback,
    setFieldValue,
    setFormErrors,
  } = useFormState({
    email: "",
    senha: "",
  });

  useEffect(() => {
    document.title = t("auth.login.documentTitle");

    const authFeedback = consumeAuthFeedback();
    if (authFeedback?.message) {
      setFeedback({ type: authFeedback.type || "error", message: authFeedback.message });
    }

    const session = getAuthSession();
    if (session?.user) {
      redirectAfterLogin(session.user);
    }
  }, [redirectAfterLogin, setFeedback]);

  const { handleSubmit, isSubmitting } = useFormSubmit({
    values,
    validate: validateLoginForm,
    setFormErrors,
    setFeedback,
    getInvalidFeedback: () => ({
      type: "error",
      message: t("auth.login.invalid"),
    }),
    getValidFeedback: (_validValues, submitResult) => ({
      type: "success",
      message: submitResult.message,
    }),
    getSubmitErrorFeedback: (error) => ({
      type: "error",
      message: error.message,
    }),
    onSubmit: loginUser,
    onSuccess: (submitResult) => {
      redirectAfterLogin(submitResult?.user);
    },
  });

  return (
    <AuthLayout
      title={t("auth.login.title")}
      logoSrc={movaLogo}
      logoAlt={t("auth.logoAlt")}
      wordmark="MOVA"
      tagline={t("auth.tagline")}
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {feedback && (
          <p className={`auth-feedback auth-feedback--${feedback.type}`} role={feedback.type === "error" ? "alert" : "status"} aria-live="polite">
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
          id="senha"
          name="senha"
          type="password"
          placeholder={t("auth.password")}
          ariaLabel={t("auth.password")}
          value={values.senha}
          onChange={(e) => setFieldValue("senha", e.target.value)}
          required
          error={errors.senha}
          autoComplete="current-password"
        />

        <button type="submit" className="auth-button" disabled={isSubmitting}>
          {isSubmitting ? t("auth.login.submitting") : t("auth.signIn")}
        </button>

        <p className="auth-forgot">
          <Link to="/recuperar-senha">{t("auth.login.forgot")}</Link>
        </p>

        <div className="auth-actions auth-divider">
          <p className="auth-footer">{t("auth.login.noAccount")}</p>
          <Link to="/cadastro" className="auth-button-secondary">
            {t("auth.login.signUp")}
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

export default Login;
