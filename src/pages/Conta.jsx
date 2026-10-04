import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import AuthenticatedLayout from "../layout/AuthenticatedLayout";
import FormField from "../components/FormField";
import { useFormState } from "../hooks/useFormState";
import { useFormSubmit } from "../hooks/useFormSubmit";
import { getUserCargo } from "../services/authIdentity";
import ModalDialog from "../components/ui/ModalDialog";
import { StatusMessage } from "../styles/authStyle";
import { clearAuthSession, getAuthSession } from "../services/authSession";
import {
  changePassword,
  deleteAccount,
  fetchCurrentUserProfile,
  updateUserProfile,
} from "../services/authService";
import { maskCelphone, maskCep, maskCpf, maskCnpj } from "../utils/inputMasks";
import { validateProfileForm, isSenhaForte } from "../utils/formValidators";
import { anonimizarMinhaConta, exportarMeusDados } from "../services/lgpdService";
import "../styles/owner.css";

function baixarJson(dados, nomeArquivo) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function ProfileMenuRow({ label, open, onToggle, tone = "default", children }) {
  const isExpandable = Boolean(children);

  return (
    <div className={`profile-menu-row${tone !== "default" ? ` profile-menu-row--${tone}` : ""}`}>
      <button
        type="button"
        className="profile-menu-row__trigger"
        onClick={onToggle}
        aria-expanded={isExpandable ? open : undefined}
      >
        <span>{label}</span>
        {tone === "default" && (
          <ChevronRight
            size={20}
            aria-hidden="true"
            className={`profile-menu-row__chevron${open ? " profile-menu-row__chevron--open" : ""}`}
          />
        )}
      </button>
      {isExpandable && open && (
        <div className="profile-menu-row__content">{children}</div>
      )}
    </div>
  );
}

function Conta() {
  const navigate = useNavigate();
  const authSession = getAuthSession();
  const [profileStatus, setProfileStatus] = useState(() => (authSession?.token ? "loading" : "error"));
  const [profileFeedback, setProfileFeedback] = useState(null);
  const [passwordValues, setPasswordValues] = useState({
    senhaAtual: "",
    novaSenha: "",
    confirmarNovaSenha: "",
  });
  const [passwordFeedback, setPasswordFeedback] = useState(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAnonymizeModalOpen, setIsAnonymizeModalOpen] = useState(false);
  const [isAnonymizing, setIsAnonymizing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [lgpdFeedback, setLgpdFeedback] = useState(null);
  const [openSection, setOpenSection] = useState(null);

  function toggleSection(key) {
    setOpenSection((current) => (current === key ? null : key));
  }

  const sessionUser = authSession?.user || null;
  const authToken = authSession?.token || null;

  const initialValues = useMemo(() => {
    const user = sessionUser || {};
    const cargo = getUserCargo(user);

    return {
      id: user.id || "",
      name: user.name || "",
      email: user.email || "",
      cargo,
      profileType: cargo.toLowerCase(),
      empresa: cargo === "LOCADOR" ? user.empresa || "" : "",
      cnpj: cargo === "LOCADOR" ? user.cnpj || "" : "",
      celphone: user.celphone || "",
      cpf: cargo === "LOCATARIO" ? user.cpf || "" : "",
      cnh: cargo === "LOCATARIO" ? user.cnh || "" : "",
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

    if (!authToken) {
      queueMicrotask(() => {
        if (!isMounted) return;
        setProfileStatus("error");
        setProfileFeedback({
          type: "error",
          message: "Sua sessao expirou. Entre novamente para acessar a conta.",
        });
      });
      return () => {
        isMounted = false;
      };
    }

    queueMicrotask(() => {
      if (!isMounted) return;
      setProfileStatus("loading");
      setProfileFeedback(null);
    });

    async function hydrateProfile() {
      try {
        const freshProfile = await fetchCurrentUserProfile({
          authToken,
          persistToSession: true,
        });

        if (!isMounted || !freshProfile) {
          return;
        }

        setValues((prev) => {
          const nextCargo = getUserCargo(freshProfile);
          const nextValues = {
            id: freshProfile.accountId || freshProfile.id || prev.id,
            name: freshProfile.name || "",
            email: freshProfile.email || "",
            cargo: nextCargo,
            profileType: nextCargo.toLowerCase(),
            empresa: nextCargo === "LOCADOR" ? freshProfile.empresa || "" : "",
            cnpj: nextCargo === "LOCADOR" ? freshProfile.cnpj || "" : "",
            celphone: freshProfile.celphone || "",
            cpf: nextCargo === "LOCATARIO" ? freshProfile.cpf || "" : "",
            cnh: nextCargo === "LOCATARIO" ? freshProfile.cnh || "" : "",
            address: freshProfile.address || "",
            cep: freshProfile.cep || "",
          };

          return nextValues;
        });

        setProfileStatus("ready");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Nao foi possivel carregar os dados da conta.";

        if (/sessao expirada|faca login novamente/i.test(message)) {
          clearAuthSession();
          if (isMounted) {
            navigate("/login", { replace: true });
          }
          return;
        }

        if (isMounted) {
          setProfileStatus("error");
          setProfileFeedback({
            type: "error",
            message,
          });
        }
      }
    }

    hydrateProfile();

    return () => {
      isMounted = false;
    };
  }, [authToken, navigate, setValues]);

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

    if (!isSenhaForte(passwordValues.novaSenha)) {
      setPasswordFeedback({
        type: "error",
        message: "Nova senha deve ter 8+ caracteres, com maiuscula, minuscula, numero e caractere especial.",
      });
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

  function handleDeleteAccount() {
    setIsDeleteModalOpen(true);
  }

  async function confirmDeleteAccount() {

    try {
      setIsDeletingAccount(true);
      await deleteAccount();
      setIsDeleteModalOpen(false);
      navigate("/login", { replace: true });
    } catch (error) {
      if (error?.status === 409 || error?.code === "ACCOUNT_HAS_HISTORY") {
        // A mensagem crua do backend cita a rota da API; o usuário precisa do caminho na tela.
        setFeedback({
          type: "error",
          message: "Sua conta tem histórico de reservas e não pode ser excluída. Você pode anonimizar seus dados em Privacidade (LGPD), logo abaixo.",
        });
        setOpenSection("lgpd");
      } else {
        setFeedback({
          type: "error",
          message: error instanceof Error ? error.message : "Nao foi possivel deletar a conta.",
        });
      }
      setIsDeleteModalOpen(false);
    } finally {
      setIsDeletingAccount(false);
    }
  }

  async function handleExportarDados() {
    setLgpdFeedback(null);
    try {
      setIsExporting(true);
      baixarJson(await exportarMeusDados(), "meus-dados-mova.json");
      setLgpdFeedback({ type: "success", message: "Download dos seus dados iniciado (meus-dados-mova.json)." });
    } catch (error) {
      setLgpdFeedback({ type: "error", message: error?.message || "Não foi possível exportar seus dados." });
    } finally {
      setIsExporting(false);
    }
  }

  async function confirmAnonimizar() {
    try {
      setIsAnonymizing(true);
      await anonimizarMinhaConta();
      setIsAnonymizeModalOpen(false);
      clearAuthSession();
      navigate("/", { replace: true });
    } catch (error) {
      setIsAnonymizeModalOpen(false);
      setLgpdFeedback({ type: "error", message: error?.message || "Não foi possível anonimizar a conta." });
    } finally {
      setIsAnonymizing(false);
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

  const isLocador = getUserCargo(values) === "LOCADOR";
  const nameLabel = isLocador ? "Nome do Proprietário" : "Nome Completo";
  const profileLabel = isLocador ? "Perfil: Locador" : "Perfil: Locatário";

  if (!authToken) {
    return (
      <AuthenticatedLayout
        title="Minha Conta"
        footerText="Quer sair da conta?"
        footerLinkTo="/login"
        footerLinkLabel="Voltar ao login"
      >
        <p className="auth-feedback auth-feedback--error" role="status" aria-live="polite">
          {profileFeedback?.message || "Sua sessao expirou. Entre novamente para acessar a conta."}
        </p>
        <div className="auth-actions">
          <button type="button" className="auth-button" onClick={handleLogout}>
            Voltar ao login
          </button>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (profileStatus === "loading" && !sessionUser) {
    return (
      <AuthenticatedLayout
        title="Minha Conta"
      >
        <p className="loading-state" role="status" aria-live="polite">
          <span className="spinner" aria-hidden="true" />
          Carregando dados da conta...
        </p>
      </AuthenticatedLayout>
    );
  }

  if (profileStatus === "error" && !sessionUser) {
    return (
      <AuthenticatedLayout
        title="Minha Conta"
        footerText="Quer sair da conta?"
        footerLinkTo="/login"
        footerLinkLabel="Voltar ao login"
      >
        <p className="auth-feedback auth-feedback--error" role="status" aria-live="polite">
          {profileFeedback?.message || "Nao foi possivel carregar os dados da conta."}
        </p>
        <div className="auth-actions">
          <button type="button" className="auth-button" onClick={handleLogout}>
            Voltar ao login
          </button>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout
      title="Minha Conta"
    >
      {profileStatus === "loading" && (
        <StatusMessage role="status" aria-live="polite">
          Atualizando dados da conta...
        </StatusMessage>
      )}

      {profileFeedback && profileStatus === "error" && (
        <p className={`auth-feedback auth-feedback--${profileFeedback.type}`} role="status" aria-live="polite">
          {profileFeedback.message}
        </p>
      )}

      <p className="badge badge--neutral auth-profile-badge" role="status" aria-live="polite">
        {profileLabel}
      </p>

      <div className="profile-menu-card">
        {feedback && (
          <p className={`auth-feedback auth-feedback--${feedback.type}`} role="status" aria-live="polite">
            {feedback.message}
          </p>
        )}

        <ProfileMenuRow
          label="Alterar Nome"
          open={openSection === "name"}
          onToggle={() => toggleSection("name")}
        >
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <FormField
              id="name"
              name="name"
              type="text"
              placeholder={nameLabel}
              ariaLabel={nameLabel}
              value={values.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
              error={errors.name}
              autoComplete="name"
              disabled={profileStatus === "loading"}
            />
            <button type="submit" className="auth-button" disabled={isSubmitting || profileStatus === "loading"}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </button>
          </form>
        </ProfileMenuRow>

        <ProfileMenuRow
          label="Alterar senha"
          open={openSection === "password"}
          onToggle={() => toggleSection("password")}
        >
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
              autoComplete="current-password"
              disabled={profileStatus === "loading"}
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
              autoComplete="new-password"
              disabled={profileStatus === "loading"}
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
              autoComplete="new-password"
              disabled={profileStatus === "loading"}
            />
            <button type="submit" className="auth-button" disabled={isChangingPassword || profileStatus === "loading"}>
              {isChangingPassword ? "Alterando..." : "Alterar senha"}
            </button>
          </form>
        </ProfileMenuRow>

        <ProfileMenuRow
          label="E-mail"
          open={openSection === "email"}
          onToggle={() => toggleSection("email")}
        >
          {/* O backend não altera e-mail pelo perfil: o campo é só leitura. */}
          <div className="auth-form">
            <FormField
              id="email"
              name="email"
              type="email"
              placeholder="E-mail"
              ariaLabel="E-mail"
              value={values.email}
              readOnly
              helperText="O e-mail não pode ser alterado."
              autoComplete="email"
            />
          </div>
        </ProfileMenuRow>

        <ProfileMenuRow
          label="Alterar Celular"
          open={openSection === "celphone"}
          onToggle={() => toggleSection("celphone")}
        >
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
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
              disabled={profileStatus === "loading"}
            />
            <button type="submit" className="auth-button" disabled={isSubmitting || profileStatus === "loading"}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </button>
          </form>
        </ProfileMenuRow>

        <ProfileMenuRow
          label="Alterar Endereço"
          open={openSection === "address"}
          onToggle={() => toggleSection("address")}
        >
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
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
              disabled={profileStatus === "loading"}
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
              disabled={profileStatus === "loading"}
            />
            <button type="submit" className="auth-button" disabled={isSubmitting || profileStatus === "loading"}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </button>
          </form>
        </ProfileMenuRow>

        {isLocador ? (
          <ProfileMenuRow
            label="Alterar Empresa e CNPJ"
            open={openSection === "empresa"}
            onToggle={() => toggleSection("empresa")}
          >
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
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
                disabled={profileStatus === "loading"}
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
                disabled={profileStatus === "loading"}
              />
              <button type="submit" className="auth-button" disabled={isSubmitting || profileStatus === "loading"}>
                {isSubmitting ? "Salvando..." : "Salvar"}
              </button>
            </form>
          </ProfileMenuRow>
        ) : (
          <ProfileMenuRow
            label="Alterar CNH"
            open={openSection === "cnh"}
            onToggle={() => toggleSection("cnh")}
          >
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
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
                disabled={profileStatus === "loading"}
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
                disabled={profileStatus === "loading"}
              />
              <button type="submit" className="auth-button" disabled={isSubmitting || profileStatus === "loading"}>
                {isSubmitting ? "Salvando..." : "Salvar"}
              </button>
            </form>
          </ProfileMenuRow>
        )}

        {isLocador && (
          <>
            <ProfileMenuRow
              label="Meus Veículos"
              open={false}
              onToggle={() => navigate("/cadastro-carros")}
            />
            <ProfileMenuRow
              label="Minhas Garagens"
              open={false}
              onToggle={() => navigate("/cadastro-garagens")}
            />
          </>
        )}

        <ProfileMenuRow
          label="Privacidade (LGPD)"
          open={openSection === "lgpd"}
          onToggle={() => toggleSection("lgpd")}
        >
          <div className="auth-form">
            {lgpdFeedback && (
              <p className={`auth-feedback auth-feedback--${lgpdFeedback.type}`} role="status" aria-live="polite">
                {lgpdFeedback.message}
              </p>
            )}
            <p className="auth-message auth-message--warning">
              Baixe uma cópia dos seus dados pessoais ou anonimize a conta. A anonimização mantém o histórico de reservas sem identificar você e encerra o acesso.
            </p>
            <button type="button" className="auth-button-secondary" onClick={handleExportarDados} disabled={isExporting}>
              {isExporting ? "Preparando arquivo..." : "Baixar meus dados"}
            </button>
            <button type="button" className="auth-button auth-button--danger" onClick={() => setIsAnonymizeModalOpen(true)}>
              Anonimizar minha conta
            </button>
          </div>
        </ProfileMenuRow>

        <ProfileMenuRow
          label="Sair"
          tone="muted"
          open={false}
          onToggle={handleLogout}
        />

        <ProfileMenuRow
          label="Deletar conta"
          tone="danger"
          open={false}
          onToggle={handleDeleteAccount}
        />
      </div>

      {isDeleteModalOpen && (
        <ModalDialog
          role="alertdialog"
          className="owner-dialog"
          panelClassName="owner-dialog__panel"
          labelledBy="excluir-conta-title"
          describedBy="excluir-conta-desc"
          onClose={() => setIsDeleteModalOpen(false)}
          closeDisabled={isDeletingAccount}
        >
          <h2 id="excluir-conta-title">Excluir conta</h2>
          <p id="excluir-conta-desc">Tem certeza que deseja excluir sua conta? Essa ação não pode ser desfeita.</p>
          <div className="owner-dialog__actions">
            <button type="button" className="auth-button-secondary" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeletingAccount} data-autofocus>
              Cancelar
            </button>
            <button type="button" className="auth-button auth-button--danger" onClick={confirmDeleteAccount} disabled={isDeletingAccount}>
              {isDeletingAccount ? "Deletando..." : "Excluir conta"}
            </button>
          </div>
        </ModalDialog>
      )}

      {isAnonymizeModalOpen && (
        <ModalDialog
          role="alertdialog"
          className="owner-dialog"
          panelClassName="owner-dialog__panel"
          labelledBy="anonimizar-conta-title"
          describedBy="anonimizar-conta-desc"
          onClose={() => setIsAnonymizeModalOpen(false)}
          closeDisabled={isAnonymizing}
        >
          <h2 id="anonimizar-conta-title">Anonimizar conta</h2>
          <p id="anonimizar-conta-desc">Seus dados pessoais serão substituídos por valores anônimos e você não poderá mais entrar com esta conta. Essa ação não pode ser desfeita.</p>
          <div className="owner-dialog__actions">
            <button type="button" className="auth-button-secondary" onClick={() => setIsAnonymizeModalOpen(false)} disabled={isAnonymizing} data-autofocus>
              Cancelar
            </button>
            <button type="button" className="auth-button auth-button--danger" onClick={confirmAnonimizar} disabled={isAnonymizing}>
              {isAnonymizing ? "Anonimizando..." : "Anonimizar conta"}
            </button>
          </div>
        </ModalDialog>
      )}
    </AuthenticatedLayout>
  );
}

export default Conta;
