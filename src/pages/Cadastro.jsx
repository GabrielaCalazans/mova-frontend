import { useEffect } from "react";
import { Link } from "react-router-dom";
import movaLogo from "../assets/mova_logo.png";
import AuthLayout from "../layout/AuthLayout";
import FormField from "../components/FormField";
import { useFormState } from "../hooks/useFormState";
import { useFormSubmit } from "../hooks/useFormSubmit";
import { registerLocatario } from "../services/authService";
import { maskCelphone, maskCpf, maskCep } from "../utils/inputMasks";
import { getPasswordState, validateLocatarioRegisterForm } from "../utils/formValidators";

function Register() {
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
    cpf: "",
    cnh: "",
    address: "",
    cep: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    document.title = "MOVA - Cadastro de Locatário";
  }, []);

  const passwordState = getPasswordState(values.password);

  const { handleSubmit, isSubmitting } = useFormSubmit({
    values,
    validate: validateLocatarioRegisterForm,
    setFormErrors,
    setFeedback,
    getInvalidFeedback: () => ({
      type: "error",
      message: "Existem campos invalidos. Revise os avisos abaixo.",
    }),
    getValidFeedback: (_validValues, submitResult) => ({
      type: "success",
      message: submitResult.message,
    }),
    getSubmitErrorFeedback: (error) => ({
      type: "error",
      message: error.message,
    }),
    onSubmit: registerLocatario,
  });

  const passwordHelperText =
    passwordState === "default"
      ? "Use pelo menos 8 caracteres."
      : passwordState === "warning"
        ? "Use pelo menos 8 caracteres."
      : passwordState === "success"
        ? "Senha forte para cadastro."
        : undefined;

  const passwordHelperType = passwordState === "success" ? "success" : "warning";

  return (
    <AuthLayout
      title="Cadastro de Locatário"
      logoSrc={movaLogo}
      logoAlt="Mova Logo"
      footerText="Ja tem conta?"
      footerLinkTo="/login"
      footerLinkLabel="Entrar"
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {feedback && (
          <p className={`auth-feedback auth-feedback--${feedback.type}`} role="status" aria-live="polite">
            {feedback.message}
          </p>
        )}

        <Link to="/cadastro-locador" className="auth-button auth-button-callout">
          SEJA UM LOCADOR
        </Link>

        <FormField
          id="name"
          name="name"
          type="text"
          placeholder="Nome Completo"
          ariaLabel="Nome Completo"
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
          placeholder="E-mail"
          ariaLabel="E-mail"
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
          placeholder="Numero de telefone"
          ariaLabel="Numero de telefone"
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
          placeholder="Numero de CPF"
          ariaLabel="Numero de CPF"
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
          placeholder="Numero de CNH"
          ariaLabel="Numero de CNH"
          value={values.cnh}
          onChange={(e) => setFieldValue("cnh", e.target.value)}
          required
          error={errors.cnh}
          inputMode="numeric"
        />

        <FormField
          id="address"
          name="address"
          type="text"
          placeholder="Endereco Completo"
          ariaLabel="Endereco Completo"
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
          placeholder="CEP"
          ariaLabel="CEP"
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
          placeholder="Senha"
          ariaLabel="Senha"
          value={values.password}
          onChange={(e) => setFieldValue("password", e.target.value)}
          required
          error={errors.password}
          helperText={!errors.password ? passwordHelperText : undefined}
          helperType={passwordHelperType}
          inputState={passwordState}
          autoComplete="new-password"
        />

        <FormField
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Repita a senha"
          ariaLabel="Repita a senha"
          value={values.confirmPassword}
          onChange={(e) => setFieldValue("confirmPassword", e.target.value)}
          required
          error={errors.confirmPassword}
          autoComplete="new-password"
        />

        <button type="submit" className="auth-button" disabled={isSubmitting}>
          {isSubmitting ? "Cadastrando..." : "Cadastrar"}
        </button>
      </form>
    </AuthLayout>
  );
}

export default Register;