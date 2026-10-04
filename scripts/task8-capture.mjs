// Task 8 — evidências visuais (light/dark × mobile/desktop).
// Uso: node scripts/task8-capture.mjs <antes|depois> [filtro-de-tela]
// Requer o front no ar (MOVA_BASE, padrão http://localhost:5180).
// A API é respondida por fixtures no formato do contrato real (page.route),
// igual à suíte e2e/public-home.spec.js: nenhuma tela do produto é alterada.
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const fase = process.argv[2] ?? "depois";
const filtro = process.argv[3] ?? "";
const BASE = process.env.MOVA_BASE ?? "http://localhost:5180";
const DIR = `../docs/auditoria/fase-8/capturas/${fase}`;

const IMG = {
  argo: "/src/assets/fiat-argo-drive.png",
  onix: "/src/assets/chevrolet-onix-flex.png",
  hb20: "/src/assets/hiunday-hb20-plus.png",
  civic: "/src/assets/honda-civic-confort.png",
};

const garagemCentro = {
  id: "garage-1", nome: "Garagem Centro", status: "ATIVA", acessibilidade: true,
  endereco: "Rua Augusta, 1500 — Consolação, São Paulo — SP", capacidade: 20, veiculosAlocados: 12,
  latitude: -23.556, longitude: -46.662,
};
const garagemSul = {
  id: "garage-2", nome: "Garagem Vila Mariana", status: "ATIVA", acessibilidade: false,
  endereco: "Avenida Domingos de Morais, 2781 — Vila Mariana, São Paulo — SP, 04035-001", capacidade: 12, veiculosAlocados: 11,
};

function veiculo(id, modelo, extra = {}) {
  return {
    id, idLocador: "owner-1", idModeloVeiculo: `model-${id}`, garagemId: "garage-1", garagem: garagemCentro,
    placa: "BRA2E19", status: "DISPONIVEL",
    modeloVeiculo: { marca: "Fiat", modelo: "Argo", ano: 2025, cambio: "Automatico", capacidade: 5, eletrico: false, adaptado: false, categoria: "ECONOMICO", valorDiaria: 180, ...modelo },
    imagens: [], ...extra,
  };
}

const VEICULOS = [
  veiculo("v-argo", { marca: "Fiat", modelo: "Argo", adaptado: true, categoria: "PCD", valorDiaria: 189.9 }, { imagens: [{ id: "i1", url: IMG.argo, altText: "Fiat Argo prata, vista lateral" }, { id: "i2", url: IMG.argo, altText: "Fiat Argo, vista traseira" }] }),
  veiculo("v-onix", { marca: "Chevrolet", modelo: "Onix", cambio: "Manual", valorDiaria: 149 }, { imagens: [{ id: "i3", url: IMG.onix, altText: "Chevrolet Onix" }] }),
  veiculo("v-civic", { marca: "Honda", modelo: "Civic", categoria: "EXECUTIVO", valorDiaria: 1289.5 }, { garagemId: "garage-2", garagem: garagemSul, imagens: [{ id: "i4", url: IMG.civic, altText: "Honda Civic" }] }),
  veiculo("v-hb20", { marca: "Hyundai", modelo: "HB20", categoria: "ECONOMICO", valorDiaria: 159 }, { status: "RESERVADO" }),
  veiculo("v-long", { marca: "Volkswagen", modelo: "ID.4 Pro Performance Edição Acessível com Rampa Traseira", eletrico: true, adaptado: true, categoria: "ESPACOSO", capacidade: 7, valorDiaria: 24890 }, { garagem: { ...garagemSul } }),
];

const RESERVA_ATIVA = {
  id: "res-1", status: "CONFIRMADA", statusPagamento: "SUCESSO", valorTotal: 569.7,
  dataHoraInicio: "2030-10-01T13:00:00.000Z", dataHoraFim: "2030-10-04T13:00:00.000Z",
  garagemRetirada: garagemCentro, garagemDevolucao: garagemSul, idVeiculo: "v-argo",
  veiculo: VEICULOS[0], codigoDesbloqueio: "482913", servicos: [],
};
const RESERVAS = [
  RESERVA_ATIVA,
  { ...RESERVA_ATIVA, id: "res-2", status: "PENDENTE", statusPagamento: "AGUARDANDO_PAGAMENTO", dataHoraInicio: "2030-11-10T12:00:00.000Z", dataHoraFim: "2030-11-12T12:00:00.000Z", veiculo: VEICULOS[1] },
  { ...RESERVA_ATIVA, id: "res-3", status: "FINALIZADA", statusPagamento: "SUCESSO", dataHoraInicio: "2026-08-01T12:00:00.000Z", dataHoraFim: "2026-08-03T12:00:00.000Z", veiculo: VEICULOS[2] },
  { ...RESERVA_ATIVA, id: "res-4", status: "CANCELADA", statusPagamento: "ESTORNADO", dataHoraInicio: "2026-07-01T12:00:00.000Z", dataHoraFim: "2026-07-02T12:00:00.000Z", veiculo: VEICULOS[3] },
];

const SERVICOS = [
  { id: "s1", nome: "Seguro completo", descricao: "Cobertura para colisão, roubo e terceiros.", valor: 89.9, tipoCobranca: "POR_RESERVA" },
  { id: "s2", nome: "Cadeira infantil", descricao: "Assento homologado para crianças de 9 a 18 kg.", valor: 25, tipoCobranca: "POR_DIA" },
  { id: "s3", nome: "Condutor adicional", descricao: "Permite cadastrar mais um motorista.", valor: 30, tipoCobranca: "POR_RESERVA" },
];

const RENTER = { id: "renter-1", cargo: "LOCATARIO", nome: "Ana Almeida", email: "ana@mova.local" };
const OWNER = { id: "owner-1", cargo: "LOCADOR", nome: "Carlos Dias", email: "carlos@mova.local" };

const page1 = (result) => ({ result, pagination: { total: result.length, page: 1, limit: 100, totalPages: 1 } });

function router(url, method) {
  const u = new URL(url);
  const p = u.pathname.replace(/^\/api/, "");
  if (p === "/veiculo" && method === "GET") return page1(VEICULOS);
  if (p === "/veiculo/meus") return page1(VEICULOS);
  const v = p.match(/^\/veiculo\/([^/]+)$/);
  if (v) return { result: VEICULOS.find((x) => x.id === v[1]) ?? VEICULOS[0] };
  if (/^\/veiculo\/[^/]+\/imagens$/.test(p)) return { result: VEICULOS[0].imagens };
  if (p.startsWith("/reserva/locatario/")) return page1(RESERVAS);
  if (p === "/reserva/precificacao") return { result: { diarias: 3, valorDiaria: 189.9, valorDiarias: 569.7, valorServicos: 89.9, valorTotal: 659.6, servicos: [{ id: "s1", nome: "Seguro completo", valor: 89.9 }] } };
  const r = p.match(/^\/reserva\/([^/]+)$/);
  if (r) return { result: RESERVAS.find((x) => x.id === r[1]) ?? RESERVA_ATIVA };
  if (/^\/reserva\/[^/]+\/condutores$/.test(p)) return { result: [] };
  if (/^\/reserva\/[^/]+\/localizacao$/.test(p)) return { result: { latitude: -23.556, longitude: -46.662, registradoEm: "2030-10-01T14:00:00.000Z" } };
  if (p === "/garagem" || p.startsWith("/garagem?")) return page1([garagemCentro, garagemSul]);
  const g = p.match(/^\/garagem\/([^/]+)$/);
  if (g) return { result: g[1] === "garage-2" ? garagemSul : garagemCentro };
  if (/^\/garagem\/[^/]+\/veiculos$/.test(p)) return page1(VEICULOS.slice(0, 3));
  if (p === "/servico") return page1(SERVICOS);
  if (p === "/favorito") return page1([{ id: "f1", idVeiculo: "v-argo", veiculo: VEICULOS[0] }, { id: "f2", idVeiculo: "v-civic", veiculo: VEICULOS[2] }]);
  if (p === "/cobranca/pendentes") return page1([]);
  if (p === "/conta/auth/me") return { result: { conta: { ...RENTER, telefone: "11999990000", cpf: "52998224725", dataNascimento: "1990-05-10", locatario: { id: "renter-1", cnh: "12345678900" } } } };
  if (p === "/deficiencia/all") return page1([{ id: "d1", nome: "Deficiência física" }, { id: "d2", nome: "Deficiência auditiva" }]);
  if (p.startsWith("/interesse")) return page1([]);
  if (p === "/avaliacao" || p.startsWith("/avaliacao")) return page1([
    { id: "a1", nota: 5, comentario: "Rampa traseira funcionou muito bem e a garagem tinha vaga acessível sinalizada.", criadoEm: "2026-08-04T10:00:00.000Z", veiculo: VEICULOS[0] },
    { id: "a2", nota: 4, comentario: "Carro limpo. A retirada pelo código foi rápida.", criadoEm: "2026-08-10T10:00:00.000Z", veiculo: VEICULOS[1] },
  ]);
  if (p === "/dashboard/frota") return { result: { veiculos: { total: 5, disponivel: 3, reservado: 1, manutencao: 1, inativo: 0 }, alertasAtivos: 2, alertasPorTipo: { INATIVIDADE: 2, BAIXA_AVALIACAO: 1 }, ultimasLocalizacoes: [] } };
  if (p === "/dashboard/reservas") return { result: { total: RESERVAS.length, reservas: RESERVAS } };
  if (p === "/dashboard/financeiro") return { result: { faturamentoBruto: 12345.67, faturamentoLiquido: 11020.1, reservasPagas: 18 } };
  if (p === "/dashboard/utilizacao") return { result: { taxaOcupacao: 0.58, veiculosAlocados: 4 } };
  if (p.startsWith("/dashboard/avaliacoes")) return { result: { media: 4.5, total: 2, avaliacoes: [] } };
  return page1([]);
}

const JOURNEY = {
  veiculo: { id: "v-argo", idModeloVeiculo: "model-v-argo", idLocador: "owner-1", marca: "Fiat", modelo: "Argo", categoria: "PCD", capacidade: 5, cambio: "Automatico", ano: 2025, adaptado: true, eletrico: false, garagemId: "garage-1", garagemName: "Garagem Centro", status: "DISPONIVEL", valorDiaria: 189.9 },
  retirada: { garageId: "garage-1", garageName: "Garagem Centro", garageAddress: garagemCentro.endereco, garageInfo: "8 de 20 vagas livres", date: "2030-10-01", time: "10:00" },
  devolucao: { garageId: "garage-2", garageName: "Garagem Vila Mariana", garageAddress: garagemSul.endereco, garageInfo: "1 de 12 vagas livres", date: "2030-10-04", time: "10:00" },
  pagamento: { metodoPagamento: "PIX" },
  reserva: { id: "res-2", codigoDesbloqueio: "" },
  servicos: { ids: ["s1"] },
};

// [id, rota, sessão, seções a centralizar (seletores) opcionais]
const TELAS = [
  ["home", "/", null, [".public-home__catalog", "[data-capture='carousel']"]],
  ["home-auth", "/", RENTER],
  ["detalhe", "/carros/v-argo", null, ["#acessibilidade", "#local", "[data-capture='decisao']"]],
  ["detalhe-reservado", "/carros/v-hb20", RENTER],
  ["login", "/login", null],
  ["cadastro", "/cadastro", null],
  ["tipos", "/carros", RENTER],
  ["lista", "/carros/lista", RENTER],
  ["favoritos", "/carros/favoritos", RENTER],
  ["retirada", "/escolha-garagem-retirada", RENTER],
  ["devolucao", "/escolha-garagem-devolucao", RENTER],
  ["servicos", "/servicos-opcionais", RENTER],
  ["checkout", "/checkout-reserva", RENTER, ["[data-capture='total']"]],
  ["condutores", "/condutores-adicionais", RENTER],
  ["pagamento", "/pagamento", RENTER],
  ["historico", "/historico", RENTER],
  ["reserva", "/reservas/res-1", RENTER],
  ["pendencias", "/pendencias-financeiras", RENTER],
  ["conta", "/conta", RENTER],
  ["config", "/configuracoes", RENTER],
  ["painel", "/painel", OWNER],
  ["frota", "/cadastro-carros", OWNER],
  ["frota-form", "/cadastro-carros/v-argo", OWNER],
  ["garagens", "/cadastro-garagens", OWNER],
  ["owner-reservas", "/reservas", OWNER],
  ["relatorios", "/relatorios", OWNER],
  ["notfound", "/rota-inexistente", null],
];

const VIEWPORTS = [
  { id: "mobile", width: 375, height: 812 },
  { id: "desktop", width: 1440, height: 900 },
];
const TEMAS = ["light", "dark"];

await mkdir(DIR, { recursive: true });
const browser = await chromium.launch();
let n = 0;

for (const [id, rota, sessao, secoes = []] of TELAS) {
  if (filtro && !id.includes(filtro)) continue;
  for (const vp of VIEWPORTS) {
    for (const tema of TEMAS) {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, colorScheme: tema, timezoneId: "America/Sao_Paulo", locale: "pt-BR" });
      await context.addInitScript(({ s, j, t }) => {
        window.localStorage.setItem("mova:tema-escuro:v2", t === "dark" ? "true" : "false");
        if (s) window.localStorage.setItem("mova_auth_session", JSON.stringify({ token: `${s.cargo.toLowerCase()}-token`, user: s }));
        window.sessionStorage.setItem("mova_journey_flow", JSON.stringify(j));
      }, { s: sessao, j: JOURNEY, t: tema });
      await context.route("**/api/**", async (route) => {
        const req = route.request();
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(router(req.url(), req.method())) });
      });
      const page = await context.newPage();
      try {
        await page.goto(`${BASE}${rota}`, { waitUntil: "networkidle", timeout: 20000 });
        await page.waitForTimeout(400);
        const base = `${DIR}/${id}-${vp.id}-${tema}`;
        await page.screenshot({ path: `${base}.png` });
        n += 1;
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        if (overflow > 1) console.warn(`OVERFLOW ${id} ${vp.id} ${tema}: +${overflow}px`);
        for (const [i, sel] of secoes.entries()) {
          const el = page.locator(sel).first();
          if (!(await el.count())) continue;
          await el.evaluate((node) => node.scrollIntoView({ block: "center" }));
          await page.waitForTimeout(150);
          await page.screenshot({ path: `${base}-s${i + 1}.png` });
          n += 1;
        }
      } catch (error) {
        console.error(`FALHA ${id} ${vp.id} ${tema}: ${error.message.split("\n")[0]}`);
      }
      await context.close();
    }
  }
}

await browser.close();
console.log(`${n} capturas em ${DIR}`);
