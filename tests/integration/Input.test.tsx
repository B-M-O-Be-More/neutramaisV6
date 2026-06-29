import { describe, expect, it, vi } from "vitest";

import Input from "@/components/FormControl/Input";

import { renderWithProviders, screen } from "../test-utils";

describe("FormControl/Input", () => {
  it("associa o label ao campo via htmlFor/id", () => {
    renderWithProviders(<Input label="Nome da empresa" name="companyName" />);

    expect(screen.getByLabelText(/Nome da empresa/)).toBeInTheDocument();
  });

  it("permite digitar em um campo sem máscara", async () => {
    const { user } = renderWithProviders(<Input label="Cidade" name="city" />);

    const input = screen.getByLabelText(/Cidade/);
    await user.type(input, "São Paulo");

    expect(input).toHaveValue("São Paulo");
  });

  it("exibe a mensagem de erro quando a prop error é informada", () => {
    renderWithProviders(
      <Input label="Email" name="email" error="Email inválido" />,
    );

    expect(screen.getByText("Email inválido")).toBeInTheDocument();
  });

  it("renderiza o texto auxiliar (helperText)", () => {
    renderWithProviders(
      <Input label="CNPJ" name="document" helperText="Apenas números" />,
    );

    expect(screen.getByText("Apenas números")).toBeInTheDocument();
  });

  it("aplica a máscara e reporta o valor formatado via onAccept", async () => {
    const onAccept = vi.fn();
    const { user } = renderWithProviders(
      <Input
        label="CNPJ"
        name="document"
        mask="00.000.000/0000-00"
        onAccept={onAccept}
      />,
    );

    const input = screen.getByLabelText(/CNPJ/);
    await user.type(input, "11222333000181");

    expect(input).toHaveValue("11.222.333/0001-81");
    // react-imask chama onAccept com (value, maskRef, event) — checamos o 1º arg.
    expect(onAccept.mock.calls.at(-1)?.[0]).toBe("11.222.333/0001-81");
  });
});
