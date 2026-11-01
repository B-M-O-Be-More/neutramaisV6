import { describe, expect, it, vi } from "vitest";

import FormReturnRequest from "@/components/Forms/FormReturnRequest";

import { renderWithProviders, screen, waitFor } from "../test-utils";

function renderForm() {
  const onSubmit = vi.fn();
  const result = renderWithProviders(
    <FormReturnRequest
      locale="pt-BR"
      isSubmitting={false}
      onSubmit={onSubmit}
    />,
  );
  return { ...result, onSubmit };
}

describe("FormReturnRequest", { timeout: 20_000 }, () => {
  it("exige motivo e descrição antes de enviar", async () => {
    const { user, onSubmit } = renderForm();

    await user.click(
      screen.getByRole("button", { name: "Returns.types.return.submit" }),
    );

    expect(
      await screen.findByText("Returns.errors.reasonRequired"),
    ).toBeVisible();
    expect(
      screen.getByText("Returns.errors.descriptionRequired"),
    ).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("mostra quem paga o frete pelo motivo e envia a troca com os arquivos", async () => {
    const { user, onSubmit } = renderForm();

    expect(screen.getByText("Returns.form.freightPending")).toBeVisible();

    await user.click(
      screen.getByRole("radio", { name: /Returns.types.exchange.label/ }),
    );
    await user.click(
      screen.getByRole("radio", { name: "Returns.reasons.transportDamage" }),
    );
    expect(screen.getByText("Returns.freight.summary")).toBeVisible();

    await user.type(
      screen.getByLabelText(/Returns.form.description/),
      "Duas unidades chegaram quebradas.",
    );
    const photo = new File(["x"], "avaria.jpg", { type: "image/jpeg" });
    await user.upload(screen.getByLabelText(/Returns.form.evidenceTitle/), [
      photo,
    ]);
    expect(screen.getByText("avaria.jpg")).toBeVisible();

    await user.click(
      screen.getByRole("button", { name: "Returns.types.exchange.submit" }),
    );

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toEqual({
      type: "exchange",
      reason: "transportDamage",
      description: "Duas unidades chegaram quebradas.",
      files: [photo],
    });
  });
});
