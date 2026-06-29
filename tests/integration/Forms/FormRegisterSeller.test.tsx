import { describe, expect, it } from "vitest";

import FormRegisterSeller from "@/components/Forms/FormRegisterSeller";

import { renderWithProviders, screen } from "../../test-utils";

describe("FormRegisterSeller", () => {
  it("renderiza o stepper de 4 etapas (inclui Documentos) na etapa 1", () => {
    renderWithProviders(<FormRegisterSeller />);

    // O título da etapa atual aparece no stepper E no cabeçalho da seção.
    expect(
      screen.getAllByText("Register.steps.companyData").length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Register.steps.address")).toBeInTheDocument();
    expect(screen.getByText("Register.steps.responsible")).toBeInTheDocument();
    expect(screen.getByText("Register.steps.documents")).toBeInTheDocument();
  });

  it("mostra os campos de Dados da Empresa na primeira etapa", () => {
    renderWithProviders(<FormRegisterSeller />);

    expect(
      screen.getByLabelText(/Register.fields.companyName.label/),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Register.fields.country.label/),
    ).toBeInTheDocument();
  });

  it("bloqueia o avanço quando a etapa 1 está vazia", async () => {
    const { user } = renderWithProviders(<FormRegisterSeller />);

    await user.click(screen.getByText("Register.buttons.next"));

    expect(
      await screen.findByText("Register.errors.companyName"),
    ).toBeInTheDocument();
  });
});
