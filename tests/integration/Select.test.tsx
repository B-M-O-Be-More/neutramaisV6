import { describe, expect, it } from "vitest";

import Select from "@/components/FormControl/Select";

import { renderWithProviders, screen } from "../test-utils";

function CountrySelect(props: { error?: string }) {
  return (
    <Select label="País" name="country" {...props}>
      <option value="BR">Brasil</option>
      <option value="US">Estados Unidos</option>
    </Select>
  );
}

describe("FormControl/Select", () => {
  it("renderiza o label e as opções", () => {
    renderWithProviders(<CountrySelect />);

    expect(screen.getByLabelText(/País/)).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Brasil" })).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Estados Unidos" }),
    ).toBeInTheDocument();
  });

  it("permite selecionar uma opção", async () => {
    const { user } = renderWithProviders(<CountrySelect />);

    const select = screen.getByLabelText(/País/);
    await user.selectOptions(select, "US");

    expect(select).toHaveValue("US");
  });

  it("exibe a mensagem de erro quando informada", () => {
    renderWithProviders(<CountrySelect error="País é obrigatório" />);

    expect(screen.getByText("País é obrigatório")).toBeInTheDocument();
  });
});
