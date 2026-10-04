import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import Historico from "./Historico";

const navigate = vi.fn();
vi.mock("react-router-dom", () => ({ useNavigate: () => navigate }));
vi.mock("../components/ReservasList", () => ({ default: () => <div>Reservas do histórico</div> }));

describe("Historico", () => {
  it("oferece acesso às pendências financeiras", async () => {
    render(<Historico />);
    await userEvent.click(screen.getByRole("button", { name: "Ver pendências financeiras" }));
    expect(navigate).toHaveBeenCalledWith("/pendencias-financeiras");
  });
});
