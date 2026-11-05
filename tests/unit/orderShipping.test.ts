import { describe, expect, it } from "vitest";

import {
  invoiceValueMinor,
  minorToDecimalText,
  originPostalCode,
  sellerShippingActions,
  toAttachInvoiceInput,
} from "@/functions/orderShipping";
import { orderInvoiceSchema } from "@/schemas/orderShipping";
import type {
  CheckoutOrder,
  CheckoutOrderItem,
  LegacyOrder,
  OrderShipping,
} from "@/services/orders.service";

const PHYSICAL_ITEM: CheckoutOrderItem = {
  catalog: {
    offeringId: "offer-1",
    name: "Roteador Wi-Fi 6",
    productType: "physical",
    shippingPolicy: { automaticTracking: false },
    shippingPackage: { originPostalCode: "60160-230" },
  },
  quantity: 2,
  totalMinor: 85980,
  productSubtotalMinor: 77980,
  shippingMode: "delivery",
};

const ORDER: CheckoutOrder = {
  id: "1a5e9c3f-7b2d-4e8a-9c4f-6b1d8e3a7c25",
  orderId: "1a5e9c3f-7b2d-4e8a-9c4f-6b1d8e3a7c25",
  checkoutId: "7a1c9e3b-5d2f-4e8a-b4c6-0d9f2a7e1b53",
  createdAt: 1793368931,
  buyerOrganizationId: "3f6d2a8e-1c4b-4e7a-9b1d-5a2c8e7f4b10",
  sellerOrganizationId: "8b2e4c1a-7d3f-4a9e-b6c2-1e5f9a3d7c28",
  status: "accepted",
  items: [PHYSICAL_ITEM],
  totalMinor: 85980,
  walletMinor: 0,
  cardMinor: 85980,
  platformFeeMinor: 9000,
  currency: "BRL",
  contractId: null,
  executionReleased: false,
  paidMinor: 85980,
  creditedMinor: 0,
  reservationStatus: "not_required",
  cancellationStatus: "not_requested",
  compensationStatus: "not_required",
};

const SHIPPING: OrderShipping = {
  orderId: ORDER.id,
  revision: 1,
  accepted: false,
  invoiceAttached: false,
  invoiceKey: null,
  received: false,
  tracking: null,
  labels: [],
};

describe("ações de envio do Seller", () => {
  it("pedido pago e ainda não aceito: só aceitar", () => {
    expect(sellerShippingActions(ORDER, SHIPPING)).toEqual({
      canAccept: true,
      canAttachInvoice: false,
      canInformTracking: false,
      printableLabels: [],
    });
  });

  it("aceito: anexar a NF; com NF e rastreio manual: informar rastreio", () => {
    const accepted = sellerShippingActions(ORDER, {
      ...SHIPPING,
      accepted: true,
    });
    expect(accepted.canAccept).toBe(false);
    expect(accepted.canAttachInvoice).toBe(true);
    expect(accepted.canInformTracking).toBe(false);

    const withInvoice = sellerShippingActions(ORDER, {
      ...SHIPPING,
      accepted: true,
      invoiceAttached: true,
    });
    expect(withInvoice.canAttachInvoice).toBe(true);
    expect(withInvoice.canInformTracking).toBe(true);
  });

  it("a NF não pode ser trocada depois que a compra da etiqueta começou", () => {
    const ready = { id: "l1", status: "ready", tracking: null };
    const actions = sellerShippingActions(ORDER, {
      ...SHIPPING,
      accepted: true,
      invoiceAttached: true,
      labels: [ready, { id: "l2", status: "paid", tracking: null }],
    });

    expect(actions.canAttachInvoice).toBe(false);
    expect(actions.printableLabels).toEqual([ready]);
  });

  it("rastreio automático (ou sem a política) não oferece rastreio manual", () => {
    const automatic: CheckoutOrder = {
      ...ORDER,
      items: [
        {
          ...PHYSICAL_ITEM,
          catalog: {
            ...PHYSICAL_ITEM.catalog,
            shippingPolicy: { automaticTracking: true },
          },
        },
      ],
    };
    const noPolicy: CheckoutOrder = {
      ...ORDER,
      items: [
        {
          ...PHYSICAL_ITEM,
          catalog: { ...PHYSICAL_ITEM.catalog, shippingPolicy: null },
        },
      ],
    };
    const ready = { ...SHIPPING, accepted: true, invoiceAttached: true };

    expect(sellerShippingActions(automatic, ready).canInformTracking).toBe(
      false,
    );
    expect(sellerShippingActions(noPolicy, ready).canInformTracking).toBe(
      false,
    );
  });

  it.each([
    ["aguardando pagamento", { ...ORDER, status: "awaitingPayment" as const }],
    [
      "em cancelamento",
      { ...ORDER, cancellationStatus: "barrierPending" as const },
    ],
    ["cancelado", { ...ORDER, status: "cancelled" as const }],
  ])("pedido %s não tem ações", (_case, order) => {
    expect(sellerShippingActions(order, SHIPPING).canAccept).toBe(false);
  });

  it("recebido pelo comprador ou sem envio não tem ações", () => {
    expect(
      sellerShippingActions(ORDER, { ...SHIPPING, received: true }).canAccept,
    ).toBe(false);
    expect(sellerShippingActions(ORDER, null).canAccept).toBe(false);
  });

  it("pedido de serviço ou antigo não tem ações de envio", () => {
    const service: CheckoutOrder = {
      ...ORDER,
      items: [
        {
          ...PHYSICAL_ITEM,
          catalog: { ...PHYSICAL_ITEM.catalog, productType: "service" },
        },
      ],
    };
    const legacy: LegacyOrder = {
      id: "legacy-1",
      buyerOrganizationId: ORDER.buyerOrganizationId,
      sellerOrganizationId: ORDER.sellerOrganizationId,
      status: "accepted",
      items: [],
      totalMonthly: 100,
      totalInstallation: 0,
      createdAt: null,
    };

    expect(sellerShippingActions(service, SHIPPING).canAccept).toBe(false);
    expect(sellerShippingActions(legacy, SHIPPING).canAccept).toBe(false);
  });
});

describe("dados da NF a partir do pedido", () => {
  it("valor dos produtos das linhas físicas, sem frete", () => {
    expect(invoiceValueMinor(ORDER)).toBe(77980);
    expect(minorToDecimalText(77980)).toBe("779,80");
  });

  it("sem o subtotal de uma linha, não sugere valor", () => {
    expect(
      invoiceValueMinor({
        ...ORDER,
        items: [{ ...PHYSICAL_ITEM, productSubtotalMinor: undefined }],
      }),
    ).toBeNull();
  });

  it("CEP de origem da cotação, só com dígitos", () => {
    expect(originPostalCode(ORDER)).toBe("60160230");
  });

  it("monta o corpo da orders-api: sem máscara, em centavos e com o CNPJ da chave", () => {
    const values = {
      ...orderInvoiceSchema.getDefault(),
      file: new File(["%PDF-"], "nf.pdf"),
      accessKey: "2326 1012 3456 7800 0195 5500 1000 0045 1214 8213 9073",
      value: "779,80",
      senderName: " Conecta Distribuidora ",
      stateRegister: "069876543",
      postalCode: "60160-230",
      address: "Avenida Dom Luís",
      number: "500",
      district: "Meireles",
      city: "Fortaleza",
      stateAbbr: "ce",
      senderPhone: "(85) 3224-1100",
      senderEmail: "expedicao@conecta.com.br",
      complement: "",
      economicActivityCode: "4652-4/00",
      recipientDocument: "11.222.333/0001-81",
      recipientEmail: "compras@clinica.com.br",
      recipientPhone: "(85) 98877-6655",
    };

    expect(toAttachInvoiceInput(values, "JVBERi0=")).toEqual({
      pdfBase64: "JVBERi0=",
      accessKey: "23261012345678000195550010000045121482139073",
      valueMinor: 77980,
      sender: {
        name: "Conecta Distribuidora",
        company_document: "12345678000195",
        state_register: "069876543",
        postal_code: "60160230",
        address: "Avenida Dom Luís",
        number: "500",
        district: "Meireles",
        city: "Fortaleza",
        state_abbr: "CE",
        phone: "8532241100",
        email: "expedicao@conecta.com.br",
        economic_activity_code: "4652400",
      },
      recipientDocument: "11222333000181",
      recipientEmail: "compras@clinica.com.br",
      recipientPhone: "85988776655",
    });
  });
});
