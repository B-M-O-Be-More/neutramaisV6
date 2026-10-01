import { describe, expect, it, vi } from "vitest";

import FormMfaEnrollment from "@/components/Forms/FormMfaEnrollment";

import { renderWithProviders, screen, waitFor } from "../../test-utils";

function renderForm(props: { formError?: string } = {}) {
  const onSubmit = vi.fn();
  return {
    onSubmit,
    ...renderWithProviders(
      <FormMfaEnrollment onSubmit={onSubmit} onBack={vi.fn()} {...props} />,
    ),
  };
}

// O i18n devolve as chaves nos testes (traduções carregam via HTTP em runtime).
describe("FormMfaEnrollment (validação do TOTP)", () => {
  it("mantém o envio bloqueado até os seis dígitos", async () => {
    const { user } = renderForm();
    const submit = screen.getByRole("button", {
      name: /MfaEnrollment.totp.submit/,
    });

    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText("MfaEnrollment.totp.label"), "12345");
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText("MfaEnrollment.totp.label"), "6");
    expect(submit).toBeEnabled();
  });

  it("aceita colar o código com espaço e preserva o zero à esquerda", async () => {
    const { user, onSubmit } = renderForm();

    const input = screen.getByLabelText("MfaEnrollment.totp.label");
    await user.click(input);
    await user.paste("012 345");
    expect(input).toHaveValue("012345");

    await user.click(
      screen.getByRole("button", { name: /MfaEnrollment.totp.submit/ }),
    );

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("012345"));
  });

  it("exibe o erro de código inválido vindo do hook", () => {
    renderForm({ formError: "MfaEnrollment.errors.invalidCode" });

    expect(
      screen.getByText("MfaEnrollment.errors.invalidCode"),
    ).toBeInTheDocument();
  });
});
