import { describe, expect, it } from "vitest";

import FormRegister from "@/components/Forms/FormRegister";
import { RegisterFlowProvider } from "@/contexts/RegisterFlowContext";

import { renderWithProviders, screen } from "../../test-utils";

// As traduções carregam via HTTP em runtime; nos testes o i18n devolve as
// próprias chaves, então as assertivas usam as chaves de tradução.
//
// O stepper vive no RegisterFlowContext: sem o provider o `setStep` é no-op e o
// formulário fica preso na etapa 1, por isso os testes embrulham o provider.
function renderFormRegister(props?: React.ComponentProps<typeof FormRegister>) {
  return renderWithProviders(
    <RegisterFlowProvider>
      <FormRegister {...props} />
    </RegisterFlowProvider>,
  );
}

describe("FormRegister", () => {
  it("abre na etapa de tipo de conta com as duas opções", () => {
    renderFormRegister();

    expect(screen.getByText("Register.flow.role.heading")).toBeInTheDocument();
    expect(screen.getByText("Register.flow.role.question")).toBeInTheDocument();
    expect(
      screen.getByText("Register.flow.role.buyer.title"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Register.flow.role.seller.title"),
    ).toBeInTheDocument();
    // Na primeira etapa o "voltar" leva ao login, não à etapa anterior.
    expect(screen.getByText("Register.flow.backToLogin")).toBeInTheDocument();
    expect(screen.queryByText("Register.flow.back")).not.toBeInTheDocument();
  });

  it("marca a opção escolhida e revela o aviso de compliance do seller", async () => {
    const { user } = renderFormRegister();

    expect(
      screen.queryByText("Register.flow.role.selected"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByText("Register.flow.role.seller.title"));

    expect(
      await screen.findByText("Register.flow.role.selected"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Register.flow.role.sellerNotice"),
    ).toBeInTheDocument();
  });

  it("avança para os dados da empresa depois de escolher um tipo", async () => {
    const { user } = renderFormRegister();

    await user.click(screen.getByText("Register.flow.role.buyer.title"));
    await user.click(
      screen.getByRole("button", { name: /Register.flow.continue/ }),
    );

    expect(
      await screen.findByText("Register.sidebar.steps.company.title"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Register.flow.role.question"),
    ).not.toBeInTheDocument();
    // Fora da primeira etapa o "voltar" volta uma etapa.
    expect(screen.getByText("Register.flow.back")).toBeInTheDocument();
  });

  it("não avança sem tipo de conta selecionado", async () => {
    const { user } = renderFormRegister();

    await user.click(
      screen.getByRole("button", { name: /Register.flow.continue/ }),
    );

    expect(screen.getByText("Register.flow.role.question")).toBeInTheDocument();
    expect(
      screen.queryByText("Register.sidebar.steps.company.title"),
    ).not.toBeInTheDocument();
  });

  it("respeita o tipo recebido por prop", async () => {
    renderFormRegister({ typeRegister: "seller" });

    expect(
      await screen.findByText("Register.flow.role.selected"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Register.flow.role.sellerNotice"),
    ).toBeInTheDocument();
  });
});
