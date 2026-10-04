import { Component, createElement, Suspense } from "react";
import BrandLogo from "../brand/BrandLogo";

export function RouteLoading({ label = "Carregando tela…" }) {
  return (
    <div className="route-loading" aria-busy="true">
      <BrandLogo variant="icon" className="route-loading__mark" decorative />
      <p role="status">{label.startsWith("Abrindo") ? label : `Abrindo ${label}…`}</p>
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
        <h1>Não foi possível carregar esta tela</h1>
        <p>O recurso pode ter sido atualizado. Tente carregar a tela novamente.</p>
        <button type="button" className="btn" onClick={() => window.location.reload()}>
          Recarregar tela
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
