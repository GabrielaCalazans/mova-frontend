import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CondutoresAdicionais from "./CondutoresAdicionais";
import { addCondutor, listCondutores, removeCondutor } from "../services/condutorService";

const navigate = vi.fn();
vi.mock("react-router-dom", () => ({ useNavigate: () => navigate }));
vi.mock("../layout/AuthenticatedLayout", () => ({ default: ({ children }) => <div>{children}</div> }));
vi.mock("../utils/journeyStorage", () => ({ getJourneyStep: () => ({ id: "reserva-1" }) }));
vi.mock("../services/condutorService", () => ({ addCondutor: vi.fn(), listCondutores: vi.fn(), removeCondutor: vi.fn() }));

async function preencher(nome = "João Silva", cpf = "123.456.789-09", cnh = "12345678901") {
  await userEvent.type(screen.getByLabelText("Nome"), nome);
  if (cpf) await userEvent.type(screen.getByLabelText(/CPF/), cpf);
  await userEvent.type(screen.getByLabelText("CNH"), cnh);
  await userEvent.click(screen.getByRole("button", { name: "Adicionar condutor" }));
}

describe("CondutoresAdicionais", () => {
  beforeEach(() => { vi.clearAllMocks(); listCondutores.mockResolvedValue([]); });

  it("suporta zero condutores e segue para pagamento", async () => {
    render(<CondutoresAdicionais />);
    await screen.findByText(/até 3 pessoas/i);
    await userEvent.click(screen.getByRole("button", { name: "Continuar para pagamento" }));
    expect(navigate).toHaveBeenCalledWith("/pagamento");
  });

  it("adiciona e remove condutor usando a API", async () => {
    addCondutor.mockResolvedValue({ id: "condutor-1", nome: "João Silva", cpf: "12345678909", cnh: "12345678901" });
    render(<CondutoresAdicionais />);
    await screen.findByLabelText("Nome");
    await preencher();
    expect(addCondutor).toHaveBeenCalledWith("reserva-1", { nome: "João Silva", cpf: "12345678909", cnh: "12345678901" });
    expect(await screen.findByText("João Silva")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Remover" }));
    expect(removeCondutor).toHaveBeenCalledWith("reserva-1", "condutor-1");
  });

  it("mostra a validação devolvida pela API para CPF inválido ou CNH duplicada", async () => {
    addCondutor.mockRejectedValueOnce(new Error("CPF inválido")).mockRejectedValueOnce(new Error("Já existe um condutor com esta CNH nesta reserva."));
    render(<CondutoresAdicionais />);
    await screen.findByLabelText("Nome");
    await preencher();
    expect(await screen.findByRole("alert")).toHaveTextContent("CPF inválido");
    await preencher("Maria", "", "99999999999");
    expect(await screen.findByRole("alert")).toHaveTextContent("Já existe um condutor com esta CNH");
  });

  it("não mostra formulário quando já há 3 condutores", async () => {
    listCondutores.mockResolvedValue([{ id: "1", nome: "A" }, { id: "2", nome: "B" }, { id: "3", nome: "C" }]);
    render(<CondutoresAdicionais />);
    expect(await screen.findByText(/Limite de 3/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Adicionar condutor" })).toBeNull();
  });
});
