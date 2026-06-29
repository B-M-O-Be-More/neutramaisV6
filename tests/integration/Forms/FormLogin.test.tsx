import { describe, expect, it, vi } from "vitest";

import FormLogin from "@/components/Forms/FormLogin";

import { renderWithProviders, screen, waitFor } from "../../test-utils";

// O i18n devolve as chaves nos testes (traduções carregam via HTTP em runtime).
describe("FormLogin", () => {
  it("renderiza título, campos e ações principais", () => {
    renderWithProviders(<FormLogin />);

    expect(screen.getByText("Login.title")).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Login.fields.email.label/),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Login.fields.password.label/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Login.submit/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Login.createAccount" }),
    ).toHaveAttribute("href", "/register");
  });

  it("alterna a visibilidade da senha pelo botão do olho", async () => {
    const { user } = renderWithProviders(<FormLogin />);

    const password = screen.getByLabelText(/Login.fields.password.label/);
    expect(password).toHaveAttribute("type", "password");

    await user.click(
      screen.getByRole("button", { name: "Login.showPassword" }),
    );
    expect(password).toHaveAttribute("type", "text");

    await user.click(
      screen.getByRole("button", { name: "Login.hidePassword" }),
    );
    expect(password).toHaveAttribute("type", "password");
  });

  it("valida campos obrigatórios e não chama onSubmit quando vazio", async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(<FormLogin onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: /Login.submit/ }));

    expect(
      await screen.findByText("Login.errors.emailRequired"),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submete os valores válidos via onSubmit", async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(<FormLogin onSubmit={onSubmit} />);

    await user.type(
      screen.getByLabelText(/Login.fields.email.label/),
      "joao@bmo.dev.br",
    );
    await user.type(
      screen.getByLabelText(/Login.fields.password.label/),
      "senha1234",
    );
    await user.click(screen.getByRole("button", { name: /Login.submit/ }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "joao@bmo.dev.br",
          password: "senha1234",
          rememberMe: false,
        }),
      ),
    );
  });
});
