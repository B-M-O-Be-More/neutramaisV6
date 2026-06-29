import { describe, expect, it } from "vitest";

import FormRegister from "@/components/Forms/FormRegister";

import { renderWithProviders, screen } from "../../test-utils";

// As traduções carregam via HTTP em runtime; nos testes o i18n devolve as
// próprias chaves, então as assertivas usam as chaves de tradução.
describe("FormRegister", () => {
  it("exibe o card de seleção de tipo de conta quando nenhum tipo é informado", () => {
    renderWithProviders(<FormRegister />);

    expect(screen.getByText("Register.accountType.title")).toBeInTheDocument();
    expect(
      screen.getByText("Register.accountType.buyer.title"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Register.accountType.seller.title"),
    ).toBeInTheDocument();
  });

  it("ao escolher um tipo, avança para o formulário e mostra o botão de voltar", async () => {
    const { user } = renderWithProviders(<FormRegister />);

    await user.click(screen.getByText("Register.accountType.buyer.title"));

    expect(
      await screen.findByText("Register.accountType.back"),
    ).toBeInTheDocument();
    // O card de seleção deixa de ser exibido.
    expect(
      screen.queryByText("Register.accountType.title"),
    ).not.toBeInTheDocument();
  });

  it("renderiza direto o formulário quando typeRegister é informado", () => {
    renderWithProviders(<FormRegister typeRegister="buyer" />);

    expect(screen.getByText("Register.accountType.back")).toBeInTheDocument();
    expect(
      screen.queryByText("Register.accountType.title"),
    ).not.toBeInTheDocument();
  });
});
