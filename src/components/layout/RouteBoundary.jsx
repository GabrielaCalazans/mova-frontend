import { Component, createElement, Suspense } from "react";

export function RouteLoading({ label = "Carregando tela…" }) {
  return (
    <main className="route-loading" aria-busy="true">
      <p role="status">{label}</p>
    </main>
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
        <button type="button" onClick={() => window.location.reload()}>
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
