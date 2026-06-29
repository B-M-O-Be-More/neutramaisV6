import { describe, expect, it } from "vitest";

import FormRegisterPayer from "@/components/Forms/FormRegisterPayer";

import { renderWithProviders, screen } from "../../test-utils";

describe("FormRegisterPayer", () => {
  it("renderiza a etapa 1 (Dados da Empresa) e o stepper de 3 etapas", () => {
    renderWithProviders(<FormRegisterPayer />);

    // O título da etapa atual aparece no stepper E no cabeçalho da seção.
    expect(
      screen.getAllByText("Register.steps.companyData").length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Register.steps.address")).toBeInTheDocument();
    expect(screen.getByText("Register.steps.responsible")).toBeInTheDocument();

    expect(
      screen.getByLabelText(/Register.fields.companyName.label/),
    ).toBeInTheDocument();
  });

  it("não exibe o botão de voltar na primeira etapa", () => {
    renderWithProviders(<FormRegisterPayer />);

    expect(screen.queryByText("Register.buttons.back")).not.toBeInTheDocument();
  });

  it("bloqueia o avanço e mostra erros quando a etapa 1 está vazia", async () => {
    const { user } = renderWithProviders(<FormRegisterPayer />);

    await user.click(screen.getByText("Register.buttons.next"));

    // O erro de campo obrigatório aparece...
    expect(
      await screen.findByText("Register.errors.companyName"),
    ).toBeInTheDocument();

    // ...e continuamos na etapa 1 (o campo da empresa segue visível).
    expect(
      screen.getByLabelText(/Register.fields.companyName.label/),
    ).toBeInTheDocument();
  });
});
