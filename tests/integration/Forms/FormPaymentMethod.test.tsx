import { describe, expect, it, vi } from "vitest";

import FormPaymentMethod from "@/components/Forms/FormPaymentMethod";

import {
  renderWithProviders,
  screen,
  userEvent,
  waitFor,
} from "../../test-utils";

const typist = () => userEvent.setup({ delay: null });

function renderForm(initialType?: "pix" | "card") {
  const onSubmit = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(
    <FormPaymentMethod
      initialType={initialType}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />,
  );
  return { onSubmit, onCancel };
}

const submit = () =>
  screen.getByRole("button", { name: "Wallet.addMethod.submit" });

// Digitação com máscara é lenta no jsdom: mesma folga do FormSellerOffer.
describe("FormPaymentMethod", { timeout: 20_000 }, () => {
  it("abre no PIX com a chave CNPJ e valida o formato", async () => {
    const { onSubmit } = renderForm();
    const user = typist();

    expect(
      screen.getByRole("radio", { name: /Wallet.addMethod.types.pix.title/ }),
    ).toHaveAttribute("aria-checked", "true");
    expect(
      screen.getByRole("radio", { name: "Wallet.addMethod.pix.keyTypes.cnpj" }),
    ).toHaveAttribute("aria-checked", "true");

    await user.click(submit());
    expect(
      await screen.findByText("Wallet.addMethod.errors.pixKeyRequired"),
    ).toBeInTheDocument();

    const key = screen.getByLabelText(/Wallet.addMethod.pix.keyLabel/);
    await user.type(key, "11222333000180");
    expect(key).toHaveValue("11.222.333/0001-80");
    await user.click(submit());
    expect(
      await screen.findByText("Wallet.addMethod.errors.pixKeyInvalid"),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    await user.clear(key);
    await user.type(key, "11222333000181");
    await user.click(submit());

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      methodType: "pix",
      pixKeyType: "cnpj",
      pixKey: "11.222.333/0001-81",
    });
  });

  it("troca o tipo de chave e limpa a chave digitada", async () => {
    const { onSubmit } = renderForm();
    const user = typist();

    await user.type(
      screen.getByLabelText(/Wallet.addMethod.pix.keyLabel/),
      "11222333000181",
    );
    await user.click(
      screen.getByRole("radio", {
        name: "Wallet.addMethod.pix.keyTypes.email",
      }),
    );

    const key = screen.getByLabelText(/Wallet.addMethod.pix.keyLabel/);
    expect(key).toHaveValue("");
    await user.type(key, "financeiro@empresa.com.br");
    await user.click(submit());

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      pixKeyType: "email",
      pixKey: "financeiro@empresa.com.br",
    });
  });

  it("no cartão, valida e envia os dados mascarados", async () => {
    const { onSubmit } = renderForm();
    const user = typist();

    await user.click(
      screen.getByRole("radio", { name: /Wallet.addMethod.types.card.title/ }),
    );
    await user.click(submit());
    expect(
      await screen.findByText("Wallet.addMethod.errors.cardNumberRequired"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Wallet.addMethod.errors.cardCvvRequired"),
    ).toBeInTheDocument();

    await user.type(
      screen.getByLabelText(/Wallet.addMethod.card.number/),
      "4111111111111111",
    );
    await user.type(
      screen.getByLabelText(/Wallet.addMethod.card.name/),
      "maria azevedo",
    );
    await user.type(
      screen.getByLabelText(/Wallet.addMethod.card.expiry/),
      "1240",
    );
    await user.type(screen.getByLabelText(/Wallet.addMethod.card.cvv/), "123");
    await user.click(submit());

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      methodType: "card",
      cardNumber: "4111 1111 1111 1111",
      cardName: "MARIA AZEVEDO",
      cardExpiry: "12/40",
      cardCvv: "123",
    });
  });

  it("recusa cartão com número inválido", async () => {
    const { onSubmit } = renderForm("card");
    const user = typist();

    await user.type(
      screen.getByLabelText(/Wallet.addMethod.card.number/),
      "4111111111111112",
    );
    await user.click(submit());

    expect(
      await screen.findByText("Wallet.addMethod.errors.cardNumberInvalid"),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("cancela sem enviar", async () => {
    const { onSubmit, onCancel } = renderForm();
    const user = typist();

    await user.click(
      screen.getByRole("button", { name: "Wallet.addMethod.cancel" }),
    );

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
