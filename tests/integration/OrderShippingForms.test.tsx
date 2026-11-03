import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import FormOrderInvoice from "@/components/Forms/FormOrderInvoice";
import FormOrderTracking from "@/components/Forms/FormOrderTracking";

import { renderWithProviders, screen, waitFor } from "../test-utils";

const KEY = "23261012345678000195550010000045121482139073";
const PDF = "%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF\n";

const field = (name: string) =>
  screen.getByLabelText(
    new RegExp(`OrderShipping\\.invoice\\.fields\\.${name}`),
  );

function renderInvoice(onSubmit = vi.fn()) {
  const view = renderWithProviders(
    <FormOrderInvoice
      defaultValues={{
        value: "779,80",
        postalCode: "60160230",
        senderEmail: "expedicao@conecta.com.br",
      }}
      isSubmitting={false}
      onCancel={vi.fn()}
      onSubmit={onSubmit}
    />,
  );
  return { ...view, onSubmit };
}

/** Preenche tudo, menos o PDF e a chave. */
async function fillSenderAndRecipient(
  user: ReturnType<typeof renderInvoice>["user"],
) {
  await user.type(field("senderName"), "Conecta Distribuidora Ltda");
  await user.type(field("stateRegister"), "069876543");
  await user.type(field("address"), "Avenida Dom Luís");
  await user.type(field("number"), "500");
  await user.type(field("district"), "Meireles");
  await user.type(field("city"), "Fortaleza");
  await user.type(field("stateAbbr"), "ce");
  await user.type(field("senderPhone"), "(85) 3224-1100");
  await user.type(field("recipientDocument"), "11.222.333/0001-81");
  await user.type(field("recipientPhone"), "85988776655");
  await user.type(field("recipientEmail"), "compras@clinica.com.br");
}

describe("FormOrderInvoice", () => {
  it("mostra os erros e não envia sem PDF e com chave inválida", async () => {
    const { user, onSubmit } = renderInvoice();

    await user.type(field("accessKey"), `${KEY.slice(0, 43)}4`);
    await user.click(
      screen.getByRole("button", { name: "OrderShipping.invoice.submit" }),
    );

    expect(
      await screen.findByText("OrderShipping.errors.fileRequired"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("OrderShipping.errors.accessKeyInvalid"),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("lê o CNPJ do emitente na chave e envia o corpo pronto", async () => {
    const { user, onSubmit } = renderInvoice();

    fireEvent.change(document.getElementById("order-invoice-file")!, {
      target: {
        files: [new File([PDF], "nf.pdf", { type: "application/pdf" })],
      },
    });
    expect(screen.getByText("nf.pdf")).toBeInTheDocument();

    await user.type(field("accessKey"), KEY);
    // A chave aparece em blocos de 4 e o CNPJ do emitente sai dela.
    expect(field("accessKey")).toHaveValue(
      "2326 1012 3456 7800 0195 5500 1000 0045 1214 8213 9073",
    );
    expect(
      screen.getByText("OrderShipping.invoice.issuerCnpj"),
    ).toBeInTheDocument();

    await fillSenderAndRecipient(user);
    await user.click(
      screen.getByRole("button", { name: "OrderShipping.invoice.submit" }),
    );

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      pdfBase64: btoa(PDF),
      accessKey: KEY,
      valueMinor: 77980,
      sender: {
        company_document: "12345678000195",
        postal_code: "60160230",
        state_abbr: "CE",
        phone: "8532241100",
        email: "expedicao@conecta.com.br",
      },
      recipientDocument: "11222333000181",
    });
  });

  it("recusa um arquivo que não é PDF sem enviar", async () => {
    const { user, onSubmit } = renderInvoice();

    fireEvent.change(document.getElementById("order-invoice-file")!, {
      target: { files: [new File(["<html></html>"], "nf.html")] },
    });
    await user.type(field("accessKey"), KEY);
    await fillSenderAndRecipient(user);
    await user.click(
      screen.getByRole("button", { name: "OrderShipping.invoice.submit" }),
    );

    expect(
      await screen.findByText("OrderShipping.errors.pdf.notPdf"),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe("FormOrderTracking", () => {
  it("valida o formato e envia o código", async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(
      <FormOrderTracking
        isSubmitting={false}
        onCancel={vi.fn()}
        onSubmit={onSubmit}
      />,
    );
    const input = screen.getByLabelText(/OrderShipping\.tracking\.label/);
    const submit = screen.getByRole("button", {
      name: "OrderShipping.tracking.submit",
    });

    await user.type(input, "AD 28");
    await user.click(submit);
    expect(
      await screen.findByText("OrderShipping.errors.trackingInvalid"),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    await user.clear(input);
    await user.type(input, "AD284719305BR");
    await user.click(submit);
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { code: "AD284719305BR" },
        expect.anything(),
      ),
    );
  });
});
