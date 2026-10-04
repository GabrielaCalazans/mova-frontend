import { useCallback, useRef } from "react";

// O conceito do CursorCard (React + Tailwind + shadcn + motion/react) adaptado
// à stack real: React + CSS. Um único listener no contêiner calcula, para cada
// cartão `.cursor-card` dentro dele, a posição do ponteiro em coordenadas
// locais (--mx/--my). O CSS desenha um brilho discreto na borda e na
// superfície dos cartões PRÓXIMOS ao ponteiro — inclusive no vão entre eles.
// Só roda com ponteiro fino que faz hover; com prefers-reduced-motion o CSS
// remove o efeito. É realce progressivo: nada depende dele.
const CAN_GLOW = "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

function canGlow() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(CAN_GLOW).matches;
}

export default function CursorGlowArea({ as = "div", className = "", children, ...props }) {
  const Tag = as;
  const ref = useRef(null);
  const frame = useRef(0);

  const onPointerMove = useCallback((event) => {
    if (event.pointerType !== "mouse" || !canGlow()) return;
    const { clientX, clientY } = event;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      ref.current?.querySelectorAll(".cursor-card").forEach((card) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${clientX - rect.left}px`);
        card.style.setProperty("--my", `${clientY - rect.top}px`);
        card.dataset.glow = "on";
      });
    });
  }, []);

  const onPointerLeave = useCallback(() => {
    cancelAnimationFrame(frame.current);
    ref.current?.querySelectorAll(".cursor-card").forEach((card) => { delete card.dataset.glow; });
  }, []);

  return (
    <Tag ref={ref} className={className} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave} {...props}>
      {children}
    </Tag>
  );
}
