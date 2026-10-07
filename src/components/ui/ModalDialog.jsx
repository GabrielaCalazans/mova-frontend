import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function ModalDialog({ role = "dialog", labelledBy, describedBy, onClose, closeDisabled = false, className = "", panelClassName = "", children }) {
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const closeDisabledRef = useRef(closeDisabled);
  useEffect(() => {
    onCloseRef.current = onClose;
    closeDisabledRef.current = closeDisabled;
  });

  useEffect(() => {
    const trigger = document.activeElement;
    const root = document.getElementById("root");
    root?.setAttribute("inert", "");

    const panel = panelRef.current;
    (panel?.querySelector("[data-autofocus]") || panel?.querySelector(FOCUSABLE) || panel)?.focus();

    function onKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!closeDisabledRef.current) onCloseRef.current?.();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const focusable = [...panel.querySelectorAll(FOCUSABLE)];
      if (!focusable.length) { event.preventDefault(); return; }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      root?.removeAttribute("inert");
      const destino = trigger && document.contains(trigger) ? trigger : document.getElementById("conteudo-principal");
      destino?.focus?.();
    };
  }, []);

  return createPortal(
    <div className={className} onClick={() => !closeDisabled && onClose?.()}>
      <div
        ref={panelRef}
        className={panelClassName}
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
