import React from "react";
import { describe, expect, it, vi } from "vitest";

import { MONEY_MASK, OfferMaskedInput } from "@/components/OfferMaskedInput";

import { renderWithProviders, screen } from "../test-utils";

/** Campo de dinheiro controlado, como o Controller do RHF faz. */
function MoneyField({
  initial = "",
  onAccept,
}: {
  initial?: string;
  onAccept?: (value: string) => void;
}) {
  const [value, setValue] = React.useState(initial);
  return (
    <OfferMaskedInput
      aria-label="Preço"
      maskOptions={MONEY_MASK}
      value={value}
      onAccept={(accepted) => {
        setValue(accepted);
        onAccept?.(accepted);
      }}
    />
  );
}

describe("OfferMaskedInput com MONEY_MASK (caixa de banco)", () => {
  it("começa em 0,00 e cada dígito entra pela direita", async () => {
    const { user } = renderWithProviders(<MoneyField />);
    const price = screen.getByLabelText("Preço");
    expect(price).toHaveValue("0,00");

    await user.type(price, "5");
    expect(price).toHaveValue("0,05");
    await user.type(price, "0");
    expect(price).toHaveValue("0,50");
    await user.type(price, "0");
    expect(price).toHaveValue("5,00");
  });

  it("ignora letras e agrupa os milhares", async () => {
    const { user } = renderWithProviders(<MoneyField />);
    const price = screen.getByLabelText("Preço");

    await user.type(price, "1a89b000");
    expect(price).toHaveValue("1.890,00");

    // Sair do campo não muda o valor.
    await user.tab();
    expect(price).toHaveValue("1.890,00");
  });

  it("apagar tira o último dígito e zerado devolve vazio", async () => {
    const onAccept = vi.fn();
    const { user } = renderWithProviders(
      <MoneyField initial="5,00" onAccept={onAccept} />,
    );
    const price = screen.getByLabelText("Preço");

    await user.click(price);
    await user.keyboard("{Backspace}");
    expect(price).toHaveValue("0,50");

    await user.keyboard("{Backspace}{Backspace}");
    expect(price).toHaveValue("0,00");
    expect(onAccept).toHaveBeenLastCalledWith("");
  });

  it("mostra um valor recebido já formatado", () => {
    renderWithProviders(<MoneyField initial="1.890,00" />);
    expect(screen.getByLabelText("Preço")).toHaveValue("1.890,00");
  });
});
