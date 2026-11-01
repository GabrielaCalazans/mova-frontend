import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import Historico from "./Historico";

const navigate = vi.fn();
const listaProps = vi.fn();
vi.mock("react-router-dom", () => ({ useNavigate: () => navigate }));
vi.mock("../components/ReservasList", () => ({
  default: (props) => {
    listaProps(props);
    return <div>{props.filtros}<p>{props.emptyMessage}</p></div>;
  },
}));

const ultimoStatus = () => listaProps.mock.lastCall[0].status;

describe("Historico", () => {
  it("oferece acesso às pendências financeiras", async () => {
    render(<Historico />);
    await userEvent.click(screen.getByRole("button", { name: "Ver pendências financeiras" }));
    expect(navigate).toHaveBeenCalledWith("/pendencias-financeiras");
  });

  it("abre só com em andamento e confirmadas e alterna os filtros", async () => {
    render(<Historico />);
    const filtro = (nome) => screen.getByRole("button", { name: nome });

    expect(screen.getByRole("group", { name: "Filtrar por situação" })).toBeInTheDocument();
    expect(filtro("Em andamento")).toHaveAttribute("aria-pressed", "true");
    expect(filtro("Confirmadas")).toHaveAttribute("aria-pressed", "true");
    expect(filtro("Concluídas")).toHaveAttribute("aria-pressed", "false");
    expect(filtro("Canceladas")).toHaveAttribute("aria-pressed", "false");
    expect(ultimoStatus()).toEqual(["EM_ANDAMENTO", "CONFIRMADA", "AGUARDANDO_PAGAMENTO"]);
    expect(screen.getByText("Nenhuma reserva nas situações selecionadas.")).toBeInTheDocument();

    await userEvent.click(filtro("Canceladas"));
    expect(filtro("Canceladas")).toHaveAttribute("aria-pressed", "true");
    expect(ultimoStatus()).toEqual(["EM_ANDAMENTO", "CONFIRMADA", "AGUARDANDO_PAGAMENTO", "CANCELADA"]);

    await userEvent.click(filtro("Em andamento"));
    await userEvent.click(filtro("Confirmadas"));
    expect(ultimoStatus()).toEqual(["CANCELADA"]);
  });
});
