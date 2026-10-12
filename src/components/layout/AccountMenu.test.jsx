import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ThemeProvider } from "../../context/ThemeContext";
import AccountMenu from "./AccountMenu";

// O gatilho não move o foco por conta própria: quem fecha o menu devolve o foco.
function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <ThemeProvider>
      <MemoryRouter>
        <button type="button" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>Conta</button>
        <AccountMenu open={open} onClose={() => setOpen(false)} />
      </MemoryRouter>
    </ThemeProvider>
  );
}

// Task 11.2: no piloto NVDA o gatilho foi anunciado "expandido" depois do Esc,
// porque o foco voltava antes de o estado aria-expanded ser atualizado.
describe("AccountMenu — retorno de foco", () => {
  it("Esc fecha e devolve o foco ao gatilho já com aria-expanded=false", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const gatilho = screen.getByRole("button", { name: "Conta" });
    gatilho.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("dialog")).toContainElement(document.activeElement);
    let expandidoNoFoco = null;
    gatilho.addEventListener("focus", () => { expandidoNoFoco = gatilho.getAttribute("aria-expanded"); }, { once: true });
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(gatilho).toHaveFocus();
    expect(expandidoNoFoco).toBe("false");
  });
});
