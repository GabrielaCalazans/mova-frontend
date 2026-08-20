import { useEffect } from "react";
import { Link } from "react-router-dom";
import movaLogo from "../assets/mova_logo.png";
import AuthLayout from "../layout/AuthLayout";
import FormField from "../components/FormField";
import { useFormState } from "../hooks/useFormState";
import { useFormSubmit } from "../hooks/useFormSubmit";
import { registerLocador } from "../services/authService";
import { maskCelphone, maskCnpj, maskCep } from "../utils/inputMasks";
import { validateLocadorRegisterForm } from "../utils/formValidators";

function CadastroLocador() {
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
    document.title = "MOVA - Cadastro de Locador";
  }, []);

  const { handleSubmit, isSubmitting } = useFormSubmit({
    values,
    validate: validateLocadorRegisterForm,
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
    onSubmit: registerLocador,
  });

  return (
    <AuthLayout
      title="Cadastro de Locador"
      logoSrc={movaLogo}
      logoAlt="Mova Logo"
      footerText="Quer cadastrar como locatário?"
      footerLinkTo="/cadastro"
      footerLinkLabel="Voltar ao cadastro de locatário"
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
          placeholder="Nome do Proprietário"
          ariaLabel="Nome do Proprietário"
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
          id="empresa"
          name="empresa"
          type="text"
          placeholder="Nome da empresa"
          ariaLabel="Nome da empresa"
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
          placeholder="CNPJ"
          ariaLabel="CNPJ"
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
          {isSubmitting ? "Cadastrando..." : "Cadastrar Locador"}
        </button>

        <p className="auth-footer">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default CadastroLocador;