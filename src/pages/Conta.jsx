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
import { t } from "../i18n";
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
          message: t("account.sessionExpired"),
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
        const message = error instanceof Error ? error.message : t("account.loadError");

        if (message === t("errors.sessionExpired")) {
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
      setPasswordFeedback({ type: "error", message: t("account.password.missing") });
      return;
    }

    if (!isSenhaForte(passwordValues.novaSenha)) {
      setPasswordFeedback({
        type: "error",
        message: t("account.password.weak"),
      });
      return;
    }

    if (passwordValues.novaSenha !== passwordValues.confirmarNovaSenha) {
      setPasswordFeedback({ type: "error", message: t("account.password.mismatch") });
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
        message: error instanceof Error ? error.message : t("account.password.error"),
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
          message: t("account.delete.hasHistory"),
        });
        setOpenSection("lgpd");
      } else {
        setFeedback({
          type: "error",
          message: error instanceof Error ? error.message : t("account.delete.error"),
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
      setLgpdFeedback({ type: "success", message: t("account.lgpd.exportSuccess", { file: "meus-dados-mova.json" }) });
    } catch (error) {
      setLgpdFeedback({ type: "error", message: error?.message || t("account.lgpd.exportError") });
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
      setLgpdFeedback({ type: "error", message: error?.message || t("account.lgpd.anonymizeError") });
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
      message: t("account.invalidFields"),
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
  const nameLabel = isLocador ? t("account.fields.ownerName") : t("account.fields.fullName");
  const profileLabel = isLocador ? t("account.profileOwner") : t("account.profileRenter");

  if (!authToken) {
    return (
      <AuthenticatedLayout
        title={t("account.title")}
        footerText={t("account.logoutPrompt")}
        footerLinkTo="/login"
        footerLinkLabel={t("account.backToLogin")}
      >
        <p className="auth-feedback auth-feedback--error" role="status" aria-live="polite">
          {profileFeedback?.message || t("account.sessionExpired")}
        </p>
        <div className="auth-actions">
          <button type="button" className="auth-button" onClick={handleLogout}>
            {t("account.backToLogin")}
          </button>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (profileStatus === "loading" && !sessionUser) {
    return (
      <AuthenticatedLayout
        title={t("account.title")}
      >
        <p className="loading-state" role="status" aria-live="polite">
          <span className="spinner" aria-hidden="true" />
          {t("account.loading")}
        </p>
      </AuthenticatedLayout>
    );
  }

  if (profileStatus === "error" && !sessionUser) {
    return (
      <AuthenticatedLayout
        title={t("account.title")}
        footerText={t("account.logoutPrompt")}
        footerLinkTo="/login"
        footerLinkLabel={t("account.backToLogin")}
      >
        <p className="auth-feedback auth-feedback--error" role="status" aria-live="polite">
          {profileFeedback?.message || t("account.loadError")}
        </p>
        <div className="auth-actions">
          <button type="button" className="auth-button" onClick={handleLogout}>
            {t("account.backToLogin")}
          </button>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout
      title={t("account.title")}
    >
      {profileStatus === "loading" && (
        <StatusMessage role="status" aria-live="polite">
          {t("account.refreshing")}
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
          label={t("account.sections.name")}
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
              {isSubmitting ? t("account.saving") : t("account.save")}
            </button>
          </form>
        </ProfileMenuRow>

        <ProfileMenuRow
          label={t("account.sections.password")}
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
              placeholder={t("account.password.current")}
              ariaLabel={t("account.password.current")}
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
              placeholder={t("account.password.new")}
              ariaLabel={t("account.password.new")}
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
              placeholder={t("account.password.confirm")}
              ariaLabel={t("account.password.confirm")}
              value={passwordValues.confirmarNovaSenha}
              onChange={(e) => handlePasswordFieldChange("confirmarNovaSenha", e.target.value)}
              required
              autoComplete="new-password"
              disabled={profileStatus === "loading"}
            />
            <button type="submit" className="auth-button" disabled={isChangingPassword || profileStatus === "loading"}>
              {isChangingPassword ? t("account.password.submitting") : t("account.password.submit")}
            </button>
          </form>
        </ProfileMenuRow>

        <ProfileMenuRow
          label={t("account.sections.email")}
          open={openSection === "email"}
          onToggle={() => toggleSection("email")}
        >
          {/* O backend não altera e-mail pelo perfil: o campo é só leitura. */}
          <div className="auth-form">
            <FormField
              id="email"
              name="email"
              type="email"
              placeholder={t("account.fields.email")}
              ariaLabel={t("account.fields.email")}
              value={values.email}
              readOnly
              helperText={t("account.fields.emailReadOnly")}
              autoComplete="email"
            />
          </div>
        </ProfileMenuRow>

        <ProfileMenuRow
          label={t("account.sections.celphone")}
          open={openSection === "celphone"}
          onToggle={() => toggleSection("celphone")}
        >
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <FormField
              id="celphone"
              name="celphone"
              type="text"
              placeholder={t("account.fields.celphone")}
              ariaLabel={t("account.fields.celphone")}
              value={values.celphone}
              onChange={(e) => handleChange("celphone", e.target.value)}
              required
              error={errors.celphone}
              inputMode="numeric"
              autoComplete="tel-national"
              disabled={profileStatus === "loading"}
            />
            <button type="submit" className="auth-button" disabled={isSubmitting || profileStatus === "loading"}>
              {isSubmitting ? t("account.saving") : t("account.save")}
            </button>
          </form>
        </ProfileMenuRow>

        <ProfileMenuRow
          label={t("account.sections.address")}
          open={openSection === "address"}
          onToggle={() => toggleSection("address")}
        >
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <FormField
              id="address"
              name="address"
              type="text"
              placeholder={t("account.fields.address")}
              ariaLabel={t("account.fields.address")}
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
              placeholder={t("account.fields.cep")}
              ariaLabel={t("account.fields.cep")}
              value={values.cep}
              onChange={(e) => handleChange("cep", e.target.value)}
              required
              error={errors.cep}
              inputMode="numeric"
              autoComplete="postal-code"
              disabled={profileStatus === "loading"}
            />
            <button type="submit" className="auth-button" disabled={isSubmitting || profileStatus === "loading"}>
              {isSubmitting ? t("account.saving") : t("account.save")}
            </button>
          </form>
        </ProfileMenuRow>

        {isLocador ? (
          <ProfileMenuRow
            label={t("account.sections.company")}
            open={openSection === "empresa"}
            onToggle={() => toggleSection("empresa")}
          >
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <FormField
                id="empresa"
                name="empresa"
                type="text"
                placeholder={t("account.fields.company")}
                ariaLabel={t("account.fields.company")}
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
                placeholder={t("account.fields.cnpj")}
                ariaLabel={t("account.fields.cnpj")}
                value={values.cnpj}
                onChange={(e) => handleChange("cnpj", e.target.value)}
                required
                error={errors.cnpj}
                inputMode="numeric"
                disabled={profileStatus === "loading"}
              />
              <button type="submit" className="auth-button" disabled={isSubmitting || profileStatus === "loading"}>
                {isSubmitting ? t("account.saving") : t("account.save")}
              </button>
            </form>
          </ProfileMenuRow>
        ) : (
          <ProfileMenuRow
            label={t("account.sections.cnh")}
            open={openSection === "cnh"}
            onToggle={() => toggleSection("cnh")}
          >
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <FormField
                id="cpf"
                name="cpf"
                type="text"
                placeholder={t("account.fields.cpf")}
                ariaLabel={t("account.fields.cpf")}
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
                placeholder={t("account.fields.cnh")}
                ariaLabel={t("account.fields.cnh")}
                value={values.cnh}
                onChange={(e) => handleChange("cnh", e.target.value)}
                required
                error={errors.cnh}
                inputMode="numeric"
                disabled={profileStatus === "loading"}
              />
              <button type="submit" className="auth-button" disabled={isSubmitting || profileStatus === "loading"}>
                {isSubmitting ? t("account.saving") : t("account.save")}
              </button>
            </form>
          </ProfileMenuRow>
        )}

        {isLocador && (
          <>
            <ProfileMenuRow
              label={t("account.sections.vehicles")}
              open={false}
              onToggle={() => navigate("/cadastro-carros")}
            />
            <ProfileMenuRow
              label={t("account.sections.garages")}
              open={false}
              onToggle={() => navigate("/cadastro-garagens")}
            />
          </>
        )}

        <ProfileMenuRow
          label={t("account.sections.privacy")}
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
              {t("account.lgpd.intro")}
            </p>
            <button type="button" className="auth-button-secondary" onClick={handleExportarDados} disabled={isExporting}>
              {isExporting ? t("account.lgpd.exporting") : t("account.lgpd.export")}
            </button>
            <button type="button" className="auth-button auth-button--danger" onClick={() => setIsAnonymizeModalOpen(true)}>
              {t("account.lgpd.anonymize")}
            </button>
          </div>
        </ProfileMenuRow>

        <ProfileMenuRow
          label={t("account.sections.logout")}
          tone="muted"
          open={false}
          onToggle={handleLogout}
        />

        <ProfileMenuRow
          label={t("account.sections.delete")}
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
          <h2 id="excluir-conta-title">{t("account.delete.title")}</h2>
          <p id="excluir-conta-desc">{t("account.delete.description")}</p>
          <div className="owner-dialog__actions">
            <button type="button" className="auth-button-secondary" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeletingAccount} data-autofocus>
              {t("account.cancel")}
            </button>
            <button type="button" className="auth-button auth-button--danger" onClick={confirmDeleteAccount} disabled={isDeletingAccount}>
              {isDeletingAccount ? t("account.delete.submitting") : t("account.delete.submit")}
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
          <h2 id="anonimizar-conta-title">{t("account.lgpd.title")}</h2>
          <p id="anonimizar-conta-desc">{t("account.lgpd.description")}</p>
          <div className="owner-dialog__actions">
            <button type="button" className="auth-button-secondary" onClick={() => setIsAnonymizeModalOpen(false)} disabled={isAnonymizing} data-autofocus>
              {t("account.cancel")}
            </button>
            <button type="button" className="auth-button auth-button--danger" onClick={confirmAnonimizar} disabled={isAnonymizing}>
              {isAnonymizing ? t("account.lgpd.submitting") : t("account.lgpd.submit")}
            </button>
          </div>
        </ModalDialog>
      )}
    </AuthenticatedLayout>
  );
}

export default Conta;
