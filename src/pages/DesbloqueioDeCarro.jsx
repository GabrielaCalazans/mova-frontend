import { useEffect, useState } from "react";
import BottomNav from "../components/BottomNav";
import { getJourneyStep } from "../utils/journeyStorage";
import "../styles/carselect.css";
import "../styles/payment.css";

export default function TelaDeDesbloqueio() {
  const [codigo, setCodigo] = useState("");

  useEffect(() => {
    document.title = "MOVA - Desbloqueio";
    setCodigo(getJourneyStep("reserva")?.codigoDesbloqueio || "");
  }, []);

  return (
    <main className="carro-page">
      <div className="carro-header">
        <h1>Pagamento</h1>
      </div>

      <div className="carro-content" style={{ marginTop: "-1.75rem", textAlign: "center" }}>
        <h2 style={{ color: "var(--color-primary-strong)", fontSize: "1.3rem", margin: "2.5rem 0 1.5rem" }}>
          Veículo Desbloqueado
        </h2>

        <div className="payment-method-card">
          <p style={{ margin: "0 0 0.75rem", color: "var(--color-primary-strong)" }}>
            Sua reserva foi efetuada com sucesso!
          </p>
          <p style={{ margin: "0 0 0.5rem", color: "var(--color-primary-strong)" }}>
            Seu código de desbloqueio é:
          </p>
          <p style={{ margin: 0, color: "var(--color-primary-strong)", fontSize: "1.4rem", fontWeight: 700 }}>
            {codigo || "Código indisponível"}
          </p>
        </div>
      </div>
          <BottomNav />
    </main>
  );
}
