import { Component, createElement, Suspense } from "react";
import BrandLogo from "../brand/BrandLogo";
import { t } from "../../i18n";

// `label` é o nome da tela ("o login"); `text` substitui a frase inteira.
export function RouteLoading({ label, text }) {
  return (
    <div className="route-loading" aria-busy="true">
      <BrandLogo variant="icon" className="route-loading__mark" decorative />
      <p role="status">{text ?? (label ? t("common.route.opening", { label }) : t("common.route.loading"))}</p>
    </div>
  );
}

export class RouteErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="route-error" role="alert">
        <h1>{t("common.route.errorTitle")}</h1>
        <p>{t("common.route.errorText")}</p>
        <button type="button" className="btn" onClick={() => window.location.reload()}>
          {t("common.route.reload")}
        </button>
      </main>
    );
  }
}

export function RouteView({ Page, label, ...props }) {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<RouteLoading label={label} />}>
        {createElement(Page, props)}
      </Suspense>
    </RouteErrorBoundary>
  );
}
