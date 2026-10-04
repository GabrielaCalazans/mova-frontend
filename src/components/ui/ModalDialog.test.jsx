import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import ModalDialog from "./ModalDialog";

function Harness() {
  const [aberto, setAberto] = useState(false);
  return (
    <main>
      <button type="button">Antes</button>
      <button type="button" onClick={() => setAberto(true)}>Excluir Fiat Argo</button>
      {aberto && (
        <ModalDialog role="alertdialog" labelledBy="t" describedBy="d" onClose={() => setAberto(false)}>
          <h2 id="t">Deseja excluir esse veículo?</h2>
          <p id="d">Esta ação não pode ser desfeita.</p>
          <button type="button" data-autofocus onClick={() => setAberto(false)}>Cancelar</button>
          <button type="button">Confirmar exclusão</button>
        </ModalDialog>
      )}
    </main>
  );
}

function renderNoRoot() {
  const root = document.createElement("div");
  root.id = "root";
  document.body.appendChild(root);
  return render(<Harness />, { container: root });
}

afterEach(() => {
  document.getElementById("root")?.remove();
});

describe("ModalDialog", () => {
  it("tem nome e descrição acessíveis e prende o foco com Tab e Shift+Tab", async () => {
    const user = userEvent.setup();
    renderNoRoot();
    await user.click(screen.getByRole("button", { name: "Excluir Fiat Argo" }));

    const dialog = screen.getByRole("alertdialog", { name: "Deseja excluir esse veículo?" });
    expect(dialog).toHaveAccessibleDescription("Esta ação não pode ser desfeita.");
    expect(dialog).toHaveAttribute("aria-modal", "true");

    const cancelar = screen.getByRole("button", { name: "Cancelar" });
    const confirmar = screen.getByRole("button", { name: "Confirmar exclusão" });
    expect(cancelar).toHaveFocus();

    await user.tab();
    expect(confirmar).toHaveFocus();
    await user.tab();
    expect(cancelar).toHaveFocus();
    await user.tab({ shift: true });
    expect(confirmar).toHaveFocus();
  });

  it("deixa o fundo inerte enquanto aberto", async () => {
    const user = userEvent.setup();
    renderNoRoot();
    await user.click(screen.getByRole("button", { name: "Excluir Fiat Argo" }));
    expect(document.getElementById("root")).toHaveAttribute("inert");
    await user.keyboard("{Escape}");
    expect(document.getElementById("root")).not.toHaveAttribute("inert");
  });

  it("Escape fecha e devolve o foco ao acionador", async () => {
    const user = userEvent.setup();
    renderNoRoot();
    const acionador = screen.getByRole("button", { name: "Excluir Fiat Argo" });
    await user.click(acionador);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(acionador).toHaveFocus();
  });
});
