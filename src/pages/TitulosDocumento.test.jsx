// WCAG 2.4.2 (Task 11.3): cada tela define o próprio título do documento. Sem isso, a navegação
// SPA herda o título da tela anterior e o NVDA (NVDA+T) anuncia a página errada.
import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/authSession", () => ({
  clearAuthSession: vi.fn(),
  getAuthSession: () => ({ token: "jwt", user: { id: "u-1", name: "Locatario", cargo: "LOCATARIO" } }),
}));
vi.mock("../services/authService", () => ({
  changePassword: vi.fn(),
  deleteAccount: vi.fn(),
  fetchCurrentUserProfile: vi.fn(() => Promise.resolve(null)),
  updateUserProfile: vi.fn(),
}));
vi.mock("../services/lgpdService", () => ({ exportarMeusDados: vi.fn(), anonimizarMinhaConta: vi.fn() }));
vi.mock("../services/authIdentity", () => ({ getUserCargo: () => "LOCATARIO" }));
vi.mock("../services/cobrancaService", () => ({ listarCobrancasPendentes: vi.fn(() => Promise.resolve([])), pagarCobranca: vi.fn() }));
vi.mock("../services/reservaService", () => ({ getRastreamentoReserva: vi.fn(() => new Promise(() => {})) }));
vi.mock("../layout/AuthenticatedLayout", () => ({ default: ({ children }) => <div>{children}</div> }));
vi.mock("../components/FrotaMonitoramento", () => ({ default: () => null }));
vi.mock("../components/BottomNav", () => ({ default: () => null }));

import Conta from "./Conta";
import NotFound from "./NotFound";
import OwnerMonitoring from "./OwnerMonitoring";
import PendenciasFinanceiras from "./PendenciasFinanceiras";
import RastreamentoReserva from "./RastreamentoReserva";
import Suporte from "./Suporte";

const telas = [
  ["NotFound", NotFound, "MOVA - Página não encontrada"],
  ["PendenciasFinanceiras", PendenciasFinanceiras, "MOVA - Pendências financeiras"],
  ["Conta", Conta, "MOVA - Minha conta"],
  ["Suporte", Suporte, "MOVA - Suporte"],
  ["RastreamentoReserva", RastreamentoReserva, "MOVA - Acompanhar veículo"],
  ["OwnerMonitoring", OwnerMonitoring, "MOVA - Monitoramento"],
];

describe("título do documento por tela (WCAG 2.4.2)", () => {
  beforeEach(() => {
    document.title = "MOVA - Tela anterior";
  });

  it.each(telas)("%s define o próprio título", (_nome, Page, titulo) => {
    render(
      <MemoryRouter initialEntries={["/tela/r-1"]}>
        <Routes><Route path="/tela/:id" element={<Page />} /></Routes>
      </MemoryRouter>,
    );
    expect(document.title).toBe(titulo);
  });

  it("não há títulos de documento repetidos em nenhum idioma", () => {
    const arquivos = import.meta.glob("../i18n/locales/*/*.json", { eager: true, import: "default" });
    const porIdioma = {};
    const coletar = (obj, idioma, caminho) => {
      for (const [chave, valor] of Object.entries(obj)) {
        if (valor && typeof valor === "object") coletar(valor, idioma, `${caminho}.${chave}`);
        else if (/^(documentTitle|docTitle|docTitleNew|docTitleEdit)$/.test(chave)) {
          (porIdioma[idioma][valor] ??= []).push(`${caminho}.${chave}`);
        }
      }
    };
    for (const [arquivo, conteudo] of Object.entries(arquivos)) {
      const [, idioma, ns] = arquivo.match(/locales\/([^/]+)\/([^/]+)\.json$/);
      porIdioma[idioma] ??= {};
      coletar(conteudo, idioma, ns);
    }
    const repetidos = Object.entries(porIdioma).flatMap(([idioma, mapa]) =>
      Object.entries(mapa).filter(([, chaves]) => chaves.length > 1).map(([titulo, chaves]) => `${idioma} "${titulo}": ${chaves.join(", ")}`));
    expect(repetidos).toEqual([]);
  });
});
