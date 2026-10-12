import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import FiltroDataPicker from "./FiltroDataPicker";

// Task 11.2: o calendário é um diálogo modal; com teclado o foco entra, Esc fecha e o foco volta.
describe("FiltroDataPicker — diálogo por teclado", () => {
  it("abre com foco dentro, fecha com Esc e devolve o foco ao gatilho", async () => {
    const user = userEvent.setup();
    render(<FiltroDataPicker dataSelecionada={null} onChange={vi.fn()} />);
    const gatilho = screen.getByRole("button", { name: /^Data/ });
    gatilho.focus();
    await user.keyboard("{Enter}");
    const dialogo = screen.getByRole("dialog", { name: "Seleção de data" });
    expect(dialogo).toContainElement(document.activeElement);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(gatilho).toHaveFocus();
  });

  it("mantém o Tab dentro do calendário", async () => {
    const user = userEvent.setup();
    render(<FiltroDataPicker dataSelecionada={null} onChange={vi.fn()} />);
    screen.getByRole("button", { name: /^Data/ }).focus();
    await user.keyboard("{Enter}");
    const dialogo = screen.getByRole("dialog", { name: "Seleção de data" });
    for (let i = 0; i < 40; i += 1) {
      await user.tab();
      expect(dialogo).toContainElement(document.activeElement);
    }
  });
});
