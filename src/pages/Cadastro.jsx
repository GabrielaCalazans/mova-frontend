<<<<<<< HEAD
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
=======
﻿import { useEffect } from "react";
<<<<<<< HEAD
import { Link } from "react-router-dom";
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
import { useNavigate } from "react-router-dom";
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
import movaLogo from "../assets/mova_logo.png";
import AuthLayout from "../layout/AuthLayout";
import FormField from "../components/FormField";
import { useFormState } from "../hooks/useFormState";
import { useFormSubmit } from "../hooks/useFormSubmit";
import { registerLocatario } from "../services/authService";
<<<<<<< HEAD
import { listDeficiencias } from "../services/deficienciaService";
import { maskCelphone, maskCep, maskCpf } from "../utils/inputMasks";
import {
  getPasswordState,
  validateCadastroContaForm,
  validateCadastroDetalhesForm,
} from "../utils/formValidators";
import "../styles/relatorios.css";

function Register() {
  const [step, setStep] = useState(1);
  const [deficiencias, setDeficiencias] = useState([]);

  useEffect(() => {
    listDeficiencias().then(setDeficiencias);
  }, []);

=======
import { maskCelphone, maskCpf, maskCep } from "../utils/inputMasks";
import { getPasswordState, validateLocatarioRegisterForm } from "../utils/formValidators";

function Register() {
<<<<<<< HEAD
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  const navigate = useNavigate();
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  const {
    values,
    errors,
    feedback,
    setFeedback,
    setFieldValue,
    setFormErrors,
  } = useFormState({
<<<<<<< HEAD
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
=======
    name: "",
    email: "",
    celphone: "",
    cpf: "",
    cnh: "",
    address: "",
    cep: "",
    password: "",
    confirmPassword: "",
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
  });

  useEffect(() => {
    document.title = "MOVA - Cadastro de Locatário";
  }, []);

  const passwordState = getPasswordState(values.password);

<<<<<<< HEAD
  const passwordHelperText =
    passwordState === "default" || passwordState === "warning"
      ? "Minimo 8 caracteres, com maiuscula, minuscula, numero e caractere especial."
      : passwordState === "success"
        ? "Senha forte para cadastro."
        : undefined;

  const passwordHelperType = passwordState === "success" ? "success" : "warning";

  const { handleSubmit: handleAccountSubmit, isSubmitting: isAdvancing } = useFormSubmit({
    values,
    validate: validateCadastroContaForm,
    setFormErrors,
    setFeedback,
    getInvalidFeedback: () => ({
      type: "error",
      message: "Verifique o e-mail e a senha informados.",
    }),
    onSubmit: async () => setStep(2),
  });

  const { handleSubmit: handleDetailsSubmit, isSubmitting: isRegistering } = useFormSubmit({
    values,
    validate: validateCadastroDetalhesForm,
=======
  const { handleSubmit, isSubmitting } = useFormSubmit({
    values,
    validate: validateLocatarioRegisterForm,
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
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

<<<<<<< HEAD
  if (step === 1) {
    return (
      <AuthLayout
        title="Crie uma conta"
        logoSrc={movaLogo}
        logoAlt="Mova Logo"
        wordmark="MOVA"
        tagline="Mobilidade on-demand versátil e acessível"
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
            placeholder="E-mail"
            ariaLabel="E-mail"
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

          <button type="submit" className="auth-button" disabled={isAdvancing}>
            {isAdvancing ? "Avançando..." : "Continuar"}
          </button>

          <p className="auth-footer">
            Já tem conta? <Link to="/login">Entrar</Link>
          </p>

          <p className="auth-footer">
            Quer alugar seu carro? <Link to="/cadastro-locador">Seja um locador</Link>
          </p>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Crie uma conta"
      align="left"
      topBarSlot={
        <div className="auth-step-bar">
          <button
            type="button"
            className="auth-step-back"
            onClick={() => setStep(1)}
            aria-label="Voltar"
          >
            <ArrowLeft strokeWidth={2} />
          </button>
          <img src={movaLogo} className="auth-logo auth-logo--compact" alt="Mova Logo" />
        </div>
      }
    >
      <form className="auth-form" onSubmit={handleDetailsSubmit} noValidate>
=======
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
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
        {feedback && (
          <p className={`auth-feedback auth-feedback--${feedback.type}`} role="status" aria-live="polite">
            {feedback.message}
          </p>
        )}

<<<<<<< HEAD
<<<<<<< HEAD
=======
        <Link to="/cadastro-locador" className="auth-button auth-button-callout">
=======
        <button type="button" className="auth-button auth-button--green" onClick={() => navigate("/cadastro-locador")}>
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
          SEJA UM LOCADOR
        </button>

>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
        <FormField
          id="name"
          name="name"
          type="text"
<<<<<<< HEAD
          label="Nome*"
          placeholder="Nome*"
          ariaLabel="Nome"
=======
          placeholder="Nome Completo"
          ariaLabel="Nome Completo"
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
          value={values.name}
          onChange={(e) => setFieldValue("name", e.target.value)}
          required
          error={errors.name}
          autoComplete="name"
        />

        <FormField
<<<<<<< HEAD
          id="email-details"
          name="email"
          type="email"
          label="E-mail*"
          placeholder="E-mail*"
=======
          id="email"
          name="email"
          type="email"
          placeholder="E-mail"
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
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
<<<<<<< HEAD
          label="Celular*"
          placeholder="Celular*"
          ariaLabel="Celular"
=======
          placeholder="Numero de telefone"
          ariaLabel="Numero de telefone"
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
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
<<<<<<< HEAD
          label="CPF*"
          placeholder="CPF*"
          ariaLabel="CPF"
=======
          placeholder="Numero de CPF"
          ariaLabel="Numero de CPF"
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
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
<<<<<<< HEAD
          label="CNH*"
          placeholder="CNH*"
          ariaLabel="CNH"
=======
          placeholder="Numero de CNH"
          ariaLabel="Numero de CNH"
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
          value={values.cnh}
          onChange={(e) => setFieldValue("cnh", e.target.value)}
          required
          error={errors.cnh}
          inputMode="numeric"
        />

        <FormField
<<<<<<< HEAD
          id="rg"
          name="rg"
          type="text"
          label="RG*"
          placeholder="RG*"
          ariaLabel="RG"
          value={values.rg}
          onChange={(e) => setFieldValue("rg", e.target.value.toUpperCase())}
          required
          error={errors.rg}
        />

        <FormField
          id="dataNascimento"
          name="dataNascimento"
          type="date"
          label="Data de Nascimento*"
          ariaLabel="Data de Nascimento"
          value={values.dataNascimento}
          onChange={(e) => setFieldValue("dataNascimento", e.target.value)}
          required
          error={errors.dataNascimento}
        />

        <FormField
          id="address"
          name="address"
          type="text"
          label="Endereço Residencial*"
          placeholder="Endereço Residencial*"
          ariaLabel="Endereço Residencial"
=======
          id="address"
          name="address"
          type="text"
          placeholder="Endereco Completo"
          ariaLabel="Endereco Completo"
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
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
<<<<<<< HEAD
          label="CEP*"
          placeholder="CEP*"
=======
          placeholder="CEP"
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
          ariaLabel="CEP"
          value={values.cep}
          onChange={(e) => setFieldValue("cep", maskCep(e.target.value))}
          required
          error={errors.cep}
          inputMode="numeric"
          autoComplete="postal-code"
        />

<<<<<<< HEAD
        <div className="auth-field">
          <label htmlFor="deficienciaId">Deficiência (opcional)</label>
          <select
            id="deficienciaId"
            className="filtro-select"
            value={values.deficienciaId}
            onChange={(e) => setFieldValue("deficienciaId", e.target.value)}
          >
            <option value="">Nenhuma</option>
            {deficiencias.map((deficiencia) => (
              <option key={deficiencia.id} value={deficiencia.id}>
                {deficiencia.descricao}
              </option>
            ))}
          </select>
        </div>

        <p className="auth-required-note">Todos os campos com * são obrigatórios</p>

        <div className="auth-checkbox-group">
          <label className="auth-checkbox">
            <input
              type="checkbox"
              checked={values.agreeTerms}
              onChange={(e) => setFieldValue("agreeTerms", e.target.checked)}
            />
            Concordo com os termos de uso
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
            Concordo com os termos de privacidade
          </label>
          {errors.agreePrivacy && (
            <p className="auth-message auth-message--error">{errors.agreePrivacy}</p>
          )}
        </div>

        <button type="submit" className="auth-button" disabled={isRegistering}>
          {isRegistering ? "Cadastrando..." : "Finalizar Cadastro"}
=======
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
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
        </button>
      </form>
    </AuthLayout>
  );
}

<<<<<<< HEAD
export default Register;
=======
export default Register;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
