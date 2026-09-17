import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Download, Share2 } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import BottomNav from "../components/BottomNav";
import "../styles/carselect.css";
import "../styles/relatorios.css";

// Media de avaliacao (0 a 5) por modelo de veiculo e por tipo de cambio.
// Sem endpoint de relatorio agregado no backend, os dados abaixo sao
// ilustrativos - mesma abordagem ja usada em Relatorios | Veiculos.
const VEICULOS_DATA = [
  { nome: "Civic", nota: 1.2, cor: "#4f7cff" },
  { nome: "Gol", nota: 2.0, cor: "#b39ddb" },
  { nome: "HB20", nota: 2.8, cor: "#f0ad4e" },
  { nome: "Sedan", nota: 4.0, cor: "#f4d35e" },
  { nome: "SUV", nota: 4.6, cor: "#ef5b5b" },
];

const CATEGORIAS_DATA = [
  { nome: "Automático", nota: 1.0, cor: "#4f7cff" },
  { nome: "Manual", nota: 2.0, cor: "#b39ddb" },
  { nome: "Semi-automático", nota: 3.0, cor: "#f0ad4e" },
];

function toCsv(data) {
  const header = ["Categoria", "Nota Media"];
  const rows = data.map((row) => [row.nome, row.nota]);
  return [header, ...rows].map((row) => row.join(";")).join("\n");
}

function downloadCsv(filename, data) {
  const blob = new Blob([toCsv(data)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function shareReport(title, data) {
  const text = `${title}\n\n${toCsv(data)}`;

  if (navigator.share) {
    try {
      await navigator.share({ title, text });
      return;
    } catch {
      // usuário cancelou o compartilhamento — segue para o fallback
    }
  }

  await navigator.clipboard?.writeText(text);
}

function Legend({ data }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
      {data.map((item) => (
        <span key={item.nome} style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.78rem", color: "var(--color-text)" }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: item.cor, display: "inline-block" }} />
          {item.nome}
        </span>
      ))}
    </div>
  );
}

export default function RelatoriosAvaliacoes() {
  const navigate = useNavigate();
  const location = useLocation();
  const filtro = location.state;

  useEffect(() => {
    document.title = "MOVA - Relatórios de Avaliações";
  }, []);

  const filtroAtivo = Boolean(filtro?.data || filtro?.veiculo || filtro?.tipo || filtro?.avaliacao);

  return (
    <main className="carro-page">
      <div className="carro-header">
        <h1>Relatórios | Avaliações</h1>
      </div>

      <div className="carro-content">
        {filtroAtivo && (
          <p className="relatorio-filter-summary">
            Filtro: {[filtro?.data, filtro?.veiculo, filtro?.tipo, filtro?.avaliacao && `Nota ${filtro.avaliacao}`].filter(Boolean).join(" • ")}{" "}
            <button type="button" onClick={() => navigate("/relatorios/avaliacoes-filtro")}>
              Editar
            </button>
          </p>
        )}

        <div className="relatorio-grid">
          <div className="relatorio-card">
            <Legend data={VEICULOS_DATA} />
            <div className="relatorio-card__chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={VEICULOS_DATA} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="nota" radius={[4, 4, 0, 0]}>
                    {VEICULOS_DATA.map((entry) => (
                      <Cell key={entry.nome} fill={entry.cor} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="relatorio-card__footer">
              <div>
                <h3>Relatório 1 - Veículos</h3>
                <p>Baixe ou compartilhe seu relatório</p>
              </div>
              <div className="relatorio-card__actions">
                <button
                  type="button"
                  aria-label="Baixar relatório de avaliações por veículo"
                  onClick={() => downloadCsv("relatorio-avaliacoes-veiculos.csv", VEICULOS_DATA)}
                >
                  <Download size={20} />
                </button>
                <button
                  type="button"
                  aria-label="Compartilhar relatório de avaliações por veículo"
                  onClick={() => shareReport("Relatório 1 - Veículos", VEICULOS_DATA)}
                >
                  <Share2 size={20} />
                </button>
              </div>
            </div>
          </div>

          <div className="relatorio-card">
            <Legend data={CATEGORIAS_DATA} />
            <div className="relatorio-card__chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={CATEGORIAS_DATA} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="nota" radius={[4, 4, 0, 0]}>
                    {CATEGORIAS_DATA.map((entry) => (
                      <Cell key={entry.nome} fill={entry.cor} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="relatorio-card__footer">
              <div>
                <h3>Relatório 2 - Categorias</h3>
                <p>Baixar ou compartilhe seu relatório</p>
              </div>
              <div className="relatorio-card__actions">
                <button
                  type="button"
                  aria-label="Baixar relatório de avaliações por categoria"
                  onClick={() => downloadCsv("relatorio-avaliacoes-categorias.csv", CATEGORIAS_DATA)}
                >
                  <Download size={20} />
                </button>
                <button
                  type="button"
                  aria-label="Compartilhar relatório de avaliações por categoria"
                  onClick={() => shareReport("Relatório 2 - Categorias", CATEGORIAS_DATA)}
                >
                  <Share2 size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
