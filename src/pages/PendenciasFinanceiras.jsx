import { useEffect, useState } from "react";
import { listarCobrancasPendentes, pagarCobranca } from "../services/cobrancaService";
export default function PendenciasFinanceiras() {
  const [itens, setItens] = useState([]); const [erro, setErro] = useState(""); const [loading, setLoading] = useState(true);
  const carregar = async () => { setLoading(true); try { setItens(await listarCobrancasPendentes()); setErro(""); } catch (e) { setErro(e.message || "Não foi possível carregar pendências."); } finally { setLoading(false); } };
  useEffect(() => { carregar(); }, []);
  const pagar = async (id) => { try { await pagarCobranca(id, { metodoPagamento: "PIX" }); await carregar(); } catch (e) { setErro(e.message || "Pagamento não aprovado."); } };
  return <main><h1>Pendências financeiras</h1>{loading && <p>Carregando pendências...</p>}{erro && <p role="alert">{erro}</p>}{!loading && !erro && itens.length === 0 && <p>Você não possui pendências financeiras.</p>}{itens.map((c) => <article key={c.id}><p>{c.tipo} — R$ {Number(c.valor).toFixed(2)}</p><p>Status: {c.statusPagamento}</p><button onClick={() => pagar(c.id)}>Pagar via Pix (sandbox)</button></article>)}</main>;
}
