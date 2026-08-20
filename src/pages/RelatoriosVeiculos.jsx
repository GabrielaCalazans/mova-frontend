import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Download, Share2 } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import "../styles/carselect.css";
import "../styles/relatorios.css";

const CORES = { HB20: "#4f7cff", Sedan: "#b39ddb", SUV: "#f0ad4e", Gol: "#f4d35e" };

const QUILOMETRAGEM_DATA = [
  { ano: "2021", HB20: 2100, Sedan: 2400, SUV: 3100, Gol: 3450 },
  { ano: "2022", HB20: 2450, Sedan: 1500, SUV: 1700, Gol: 3050 },
  { ano: "2023", HB20: 1750, Sedan: 3350, SUV: 1200, Gol: 1650 },
  { ano: "2024", HB20: 1350, Sedan: 1150, SUV: 1050, Gol: 2350 },
  { ano: "2025", HB20: 1950, Sedan: 1700, SUV: 1450, Gol: 900 },
  { ano: "2026", HB20: 1500, Sedan: 1050, SUV: 2000, Gol: 3350 },
];

const ALUGUEL_DATA = [
  { ano: "2021", HB20: 1200, Sedan: 2000, SUV: 2050, Gol: 2750 },
  { ano: "2022", HB20: 2000, Sedan: 1250, SUV: 2200, Gol: 1750 },
  { ano: "2023", HB20: 2100, Sedan: 1900, SUV: 2200, Gol: 1200 },
  { ano: "2024", HB20: 1300, Sedan: 3000, SUV: 1200, Gol: 1200 },
  { ano: "2025", HB20: 2200, Sedan: 1250, SUV: 1000, Gol: 1700 },
  { ano: "2026", HB20: 1600, Sedan: 1250, SUV: 3200, Gol: 1250 },
];

function toCsv(data) {
  const header = ["Ano", "HB20", "Sedan", "SUV", "Gol"];
  const rows = data.map((row) => [row.ano, row.HB20, row.Sedan, row.SUV, row.Gol]);
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

export default function RelatoriosVeiculos() {
  const navigate = useNavigate();
  const location = useLocation();
  const filtro = location.state;

  useEffect(() => {
    document.title = "MOVA - Relatórios de Veículos";
  }, []);

  const filtroAtivo = Boolean(filtro?.data || filtro?.garagem || filtro?.veiculo);

  return (
    <main className="carro-page">
      <div className="carro-header">
        <TopBar showLogo iconColor="white" />
        <h1>Relatórios | Veículos</h1>
      </div>

      <div className="carro-content">
        {filtroAtivo && (
          <p className="relatorio-filter-summary">
            Filtro: {[filtro?.data, filtro?.garagem, filtro?.veiculo, filtro?.status].filter(Boolean).join(" • ")}{" "}
            <button type="button" onClick={() => navigate("/relatorios")}>
              Editar
            </button>
          </p>
        )}

        <div className="relatorio-grid">
        <div className="relatorio-card">
          <ChartLegend />
          <div className="relatorio-card__chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={QUILOMETRAGEM_DATA} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="HB20" stroke={CORES.HB20} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Sedan" stroke={CORES.Sedan} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="SUV" stroke={CORES.SUV} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Gol" stroke={CORES.Gol} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="relatorio-card__footer">
            <div>
              <h3>Relatório 1 - Quilometragem</h3>
              <p>Baixe ou compartilhe seu relatório</p>
            </div>
            <div className="relatorio-card__actions">
              <button
                type="button"
                aria-label="Baixar relatório de quilometragem"
                onClick={() => downloadCsv("relatorio-quilometragem.csv", QUILOMETRAGEM_DATA)}
              >
                <Download size={20} />
              </button>
              <button
                type="button"
                aria-label="Compartilhar relatório de quilometragem"
                onClick={() => shareReport("Relatório 1 - Quilometragem", QUILOMETRAGEM_DATA)}
              >
                <Share2 size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="relatorio-card">
          <ChartLegend />
          <div className="relatorio-card__chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ALUGUEL_DATA} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="HB20" stackId="a" fill={CORES.HB20} />
                <Bar dataKey="Sedan" stackId="a" fill={CORES.Sedan} />
                <Bar dataKey="SUV" stackId="a" fill={CORES.SUV} />
                <Bar dataKey="Gol" stackId="a" fill={CORES.Gol} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="relatorio-card__footer">
            <div>
              <h3>Relatório 2 - Aluguel</h3>
              <p>Baixar ou compartilhe seu relatório</p>
            </div>
            <div className="relatorio-card__actions">
              <button
                type="button"
                aria-label="Baixar relatório de aluguel"
                onClick={() => downloadCsv("relatorio-aluguel.csv", ALUGUEL_DATA)}
              >
                <Download size={20} />
              </button>
              <button
                type="button"
                aria-label="Compartilhar relatório de aluguel"
                onClick={() => shareReport("Relatório 2 - Aluguel", ALUGUEL_DATA)}
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

function ChartLegend() {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
      {Object.entries(CORES).map(([label, cor]) => (
        <span key={label} style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.78rem", color: "var(--color-text)" }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: cor, display: "inline-block" }} />
          {label}
        </span>
      ))}
    </div>
  );
}
