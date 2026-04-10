import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import movaLogo from "../assets/mova_logo.png";
import AuthLayout from "../layout/AuthLayout";
import FormField from "../components/FormField";
import { useFormState } from "../hooks/useFormState";
import { useFormSubmit } from "../hooks/useFormSubmit";
import { clearAuthSession, getAuthSession } from "../services/authSession";
import {
  changePassword,
  deleteAccount,
  fetchCurrentUserProfile,
  updateUserProfile,
} from "../services/authService";
import { maskCelphone, maskCep, maskCpf, maskCnpj } from "../utils/inputMasks";
import { validateProfileForm } from "../utils/formValidators";

const CONTA_DEBUG_ENABLED = String(import.meta.env.VITE_AUTH_DEBUG).toLowerCase() === "true";

function contaDebug(label, payload) {
  if (!CONTA_DEBUG_ENABLED) {
    return;
  }

  console.groupCollapsed(`[conta-debug] ${label}`);
  console.log(payload);
  console.groupEnd();
}

function normalizeProfileType(profileType, profile) {
  if (profile?.empresa || profile?.cnpj) {
    return "locador";
  }

  if (profileType === "locador" || profileType === "locatario") {
    return profileType;
  }

  return "locatario";
}

function Conta() {
  const navigate = useNavigate();
  const session = getAuthSession();
  const sessionUser = session?.user || null;
  const [passwordValues, setPasswordValues] = useState({
    senhaAtual: "",
    novaSenha: "",
    confirmarNovaSenha: "",
  });
  const [passwordFeedback, setPasswordFeedback] = useState(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const initialValues = useMemo(() => {
    const user = sessionUser || {};

    return {
      id: user.id || "",
      name: user.name || "",
      email: user.email || "",
      profileType: normalizeProfileType(user.profileType, user),
      empresa: user.empresa || "",
      cnpj: user.cnpj || "",
      celphone: user.celphone || "",
      cpf: user.cpf || "",
      cnh: user.cnh || "",
      address: user.address || "",
      cep: user.cep || "",
    };
  }, [sessionUser]);

  const {
    values,
    setValues,
    errors,
    feedback,
    setFeedback,
    setFieldValue,
    setFormErrors,
  } = useFormState(initialValues);

  useEffect(() => {
    let isMounted = true;

    if (!sessionUser) {
      return () => {
        isMounted = false;
      };
    }

    contaDebug("hydrateProfile.sessionUser", sessionUser);

    async function hydrateProfile() {
      try {
        const freshProfile = await fetchCurrentUserProfile({
          persistToSession: false,
        });

        contaDebug("hydrateProfile.freshProfile", freshProfile);

        if (!isMounted || !freshProfile) {
          return;
        }

        setValues((prev) => {
          const nextProfileType = normalizeProfileType(freshProfile.profileType, freshProfile);
          const nextValues = {
            ...prev,
            id: freshProfile.id || prev.id,
            name: freshProfile.name || prev.name,
            email: freshProfile.email || prev.email,
            profileType: nextProfileType,
            empresa: freshProfile.empresa || prev.empresa,
            cnpj: freshProfile.cnpj || prev.cnpj,
            celphone: freshProfile.celphone || prev.celphone,
            cpf: freshProfile.cpf || prev.cpf,
            cnh: freshProfile.cnh || prev.cnh,
            address: freshProfile.address || prev.address,
            cep: freshProfile.cep || prev.cep,
          };

          contaDebug("hydrateProfile.nextFormValues", nextValues);
          return nextValues;
        });
      } catch (error) {
        contaDebug("hydrateProfile.error", error);
        // If API fetch fails, keep current session profile in the form.
      }
    }

    hydrateProfile();

    return () => {
      isMounted = false;
    };
  }, [sessionUser, setValues]);

  function applyMask(field, value) {
    if (field === "celphone") return maskCelphone(value);
    if (field === "cpf") return maskCpf(value);
    if (field === "cnpj") return maskCnpj(value);
    if (field === "cep") return maskCep(value);
    return value;
  }

  function handleChange(field, value) {
    setFieldValue(field, applyMask(field, value));
  }

  function handleLogout() {
    clearAuthSession();
    navigate("/login", { replace: true });
  }

  function handlePasswordFieldChange(field, value) {
    setPasswordValues((prev) => ({ ...prev, [field]: value }));
  }

  async function handleChangePassword(event) {
    event.preventDefault();

    if (!passwordValues.senhaAtual || !passwordValues.novaSenha) {
      setPasswordFeedback({ type: "error", message: "Informe senha atual e nova senha." });
      return;
    }

    if (passwordValues.novaSenha.length < 8) {
      setPasswordFeedback({ type: "error", message: "A senha precisa ter mais de 7 caracteres." });
      return;
    }

    if (passwordValues.novaSenha !== passwordValues.confirmarNovaSenha) {
      setPasswordFeedback({ type: "error", message: "As senhas devem ser iguais." });
      return;
    }

    try {
      setIsChangingPassword(true);
      const result = await changePassword({
        senhaAtual: passwordValues.senhaAtual,
        novaSenha: passwordValues.novaSenha,
      });

      setPasswordFeedback({ type: "success", message: result.message });
      setPasswordValues({ senhaAtual: "", novaSenha: "", confirmarNovaSenha: "" });
    } catch (error) {
      setPasswordFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel alterar a senha.",
      });
    } finally {
      setIsChangingPassword(false);
    }
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm("Tem certeza que deseja deletar sua conta?");
    if (!confirmed) {
      return;
    }

    try {
      setIsDeletingAccount(true);
      await deleteAccount();
      navigate("/login", { replace: true });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel deletar a conta.",
      });
    } finally {
      setIsDeletingAccount(false);
    }
  }

  const { handleSubmit, isSubmitting } = useFormSubmit({
    values,
    validate: validateProfileForm,
    setFormErrors,
    setFeedback,
    getInvalidFeedback: () => ({
      type: "error",
      message: "Existem campos invalidos. Revise os avisos abaixo.",
    }),
    getValidFeedback: (_validValues, submitResult) => ({
      type: submitResult.mode === "api" ? "success" : "warning",
      message: submitResult.message,
    }),
    getSubmitErrorFeedback: (error) => ({
      type: "error",
      message: error.message,
    }),
    onSubmit: updateUserProfile,
  });

  const isLocador = values.profileType === "locador";
  const profileLabel = isLocador ? "Perfil: Locador" : "Perfil: Locatário";

  if (!sessionUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AuthLayout
      title="Minha Conta"
      logoSrc={movaLogo}
      logoAlt="Mova Logo"
      footerText="Quer sair da conta?"
      footerLinkTo="/login"
      footerLinkLabel="Voltar ao login"
    >
      <p className="auth-profile-badge" role="status" aria-live="polite">
        {profileLabel}
      </p>

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
          placeholder="Nome Completo"
          ariaLabel="Nome Completo"
          value={values.name}
          onChange={(e) => handleChange("name", e.target.value)}
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
          onChange={(e) => handleChange("email", e.target.value)}
          required
          error={errors.email}
          autoComplete="email"
        />

        {isLocador && (
          <>
            <FormField
              id="empresa"
              name="empresa"
              type="text"
              placeholder="Empresa"
              ariaLabel="Empresa"
              value={values.empresa}
              onChange={(e) => handleChange("empresa", e.target.value)}
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
              onChange={(e) => handleChange("cnpj", e.target.value)}
              required
              error={errors.cnpj}
              inputMode="numeric"
            />
          </>
        )}

        {!isLocador && (
          <>
            <FormField
              id="celphone"
              name="celphone"
              type="text"
              placeholder="Numero de Celular"
              ariaLabel="Numero de Celular"
              value={values.celphone}
              onChange={(e) => handleChange("celphone", e.target.value)}
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
              onChange={(e) => handleChange("cpf", e.target.value)}
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
              onChange={(e) => handleChange("cnh", e.target.value)}
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
              onChange={(e) => handleChange("address", e.target.value)}
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
              onChange={(e) => handleChange("cep", e.target.value)}
              required
              error={errors.cep}
              inputMode="numeric"
              autoComplete="postal-code"
            />
          </>
        )}

        <div className="auth-actions">
          <button type="submit" className="auth-button" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Salvar alteracoes"}
          </button>
          <button type="button" className="auth-button-secondary" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </form>

      <form className="auth-form" onSubmit={handleChangePassword} noValidate>
        {passwordFeedback && (
          <p className={`auth-feedback auth-feedback--${passwordFeedback.type}`} role="status" aria-live="polite">
            {passwordFeedback.message}
          </p>
        )}

        <FormField
          id="senhaAtual"
          name="senhaAtual"
          type="password"
          placeholder="Senha atual"
          ariaLabel="Senha atual"
          value={passwordValues.senhaAtual}
          onChange={(e) => handlePasswordFieldChange("senhaAtual", e.target.value)}
          required
        />

        <FormField
          id="novaSenha"
          name="novaSenha"
          type="password"
          placeholder="Nova senha"
          ariaLabel="Nova senha"
          value={passwordValues.novaSenha}
          onChange={(e) => handlePasswordFieldChange("novaSenha", e.target.value)}
          required
        />

        <FormField
          id="confirmarNovaSenha"
          name="confirmarNovaSenha"
          type="password"
          placeholder="Confirmar nova senha"
          ariaLabel="Confirmar nova senha"
          value={passwordValues.confirmarNovaSenha}
          onChange={(e) => handlePasswordFieldChange("confirmarNovaSenha", e.target.value)}
          required
        />

        <div className="auth-actions">
          <button type="submit" className="auth-button" disabled={isChangingPassword}>
            {isChangingPassword ? "Alterando..." : "Alterar senha"}
          </button>
          <button
            type="button"
            className="auth-button-secondary"
            onClick={handleDeleteAccount}
            disabled={isDeletingAccount}
          >
            {isDeletingAccount ? "Deletando..." : "Deletar conta"}
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}

export default Conta;
