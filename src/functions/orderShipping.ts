import type { OrderInvoiceValues } from "@/schemas/orderShipping";
import {
  isCheckoutOrder,
  type AttachInvoiceInput,
  type CheckoutOrderItem,
  type OrderShipping,
  type OrderShippingLabel,
  type ProductOrder,
} from "@/services/orders.service";

import { cnpjFromNfeAccessKey, onlyDigits } from "./nfeAccessKey";
import { orderHasPhysicalItems } from "./orderStage";
import { parseDecimal } from "./parseDecimal";

/** O que o Seller pode fazer no envio do pedido físico agora. */
export interface SellerShippingActions {
  canAccept: boolean;
  /** Anexar ou trocar a NF (até a compra da etiqueta começar). */
  canAttachInvoice: boolean;
  canInformTracking: boolean;
  /** Etiquetas `ready`, prontas para imprimir. */
  printableLabels: OrderShippingLabel[];
}

const NO_ACTIONS: SellerShippingActions = {
  canAccept: false,
  canAttachInvoice: false,
  canInformTracking: false,
  printableLabels: [],
};

function physicalItems(order: ProductOrder): CheckoutOrderItem[] {
  return isCheckoutOrder(order)
    ? order.items.filter((item) => item.catalog.productType === "physical")
    : [];
}

/**
 * Rastreio manual só quando todas as linhas com entrega têm a política
 * `automaticTracking: false` (sem a política, a tela não oferece).
 */
function allowsManualTracking(order: ProductOrder): boolean {
  const delivered = physicalItems(order).filter(
    (item) => item.shippingMode !== "pickup",
  );
  return (
    delivered.length > 0 &&
    delivered.every(
      (item) => item.catalog.shippingPolicy?.automaticTracking === false,
    )
  );
}

/**
 * Ações de envio do Seller (RN-LOG-02), na ordem da orders-api: aceitar o
 * pedido pago; anexar a NF depois do aceite e antes de a etiqueta começar a
 * ser comprada; imprimir as etiquetas prontas; informar o rastreio manual
 * com a NF anexada. Nada vale para pedido em cancelamento ou já recebido.
 */
export function sellerShippingActions(
  order: ProductOrder,
  shipping: OrderShipping | null,
): SellerShippingActions {
  if (
    !shipping ||
    !isCheckoutOrder(order) ||
    !orderHasPhysicalItems(order) ||
    order.status !== "accepted" ||
    order.cancellationStatus === "barrierPending" ||
    order.cancellationStatus === "cancelled" ||
    shipping.received
  ) {
    return NO_ACTIONS;
  }

  const labelPurchaseStarted = shipping.labels.some(
    (label) => label.status !== "pending",
  );

  return {
    canAccept: !shipping.accepted,
    canAttachInvoice: shipping.accepted && !labelPurchaseStarted,
    canInformTracking:
      shipping.accepted &&
      shipping.invoiceAttached &&
      allowsManualTracking(order),
    printableLabels: shipping.labels.filter(
      (label) => label.status === "ready",
    ),
  };
}

/**
 * Valor da NF que a orders-api espera: a soma dos produtos das linhas
 * físicas, sem frete e sem taxas. null quando o pedido não traz o subtotal.
 */
export function invoiceValueMinor(order: ProductOrder): number | null {
  const items = physicalItems(order);
  if (
    items.length === 0 ||
    items.some((item) => item.productSubtotalMinor === undefined)
  ) {
    return null;
  }
  return items.reduce((sum, item) => sum + (item.productSubtotalMinor ?? 0), 0);
}

/** Centavos em reais com vírgula, como o campo do formulário: 77980 → "779,80". */
export function minorToDecimalText(minor: number): string {
  return (minor / 100).toFixed(2).replace(".", ",");
}

/**
 * Corpo do "Anexar nota fiscal" a partir do formulário já validado: tira as
 * máscaras, converte o valor para centavos e usa o CNPJ da própria chave
 * (a orders-api exige que o remetente seja o emitente da chave).
 */
export function toAttachInvoiceInput(
  values: OrderInvoiceValues,
  pdfBase64: string,
): AttachInvoiceInput {
  const accessKey = onlyDigits(values.accessKey);
  const economicActivityCode = onlyDigits(values.economicActivityCode);
  const complement = values.complement.trim();

  return {
    pdfBase64,
    accessKey,
    valueMinor: Math.round((parseDecimal(values.value) ?? 0) * 100),
    sender: {
      name: values.senderName.trim(),
      company_document: cnpjFromNfeAccessKey(accessKey) ?? "",
      state_register: values.stateRegister.trim(),
      postal_code: onlyDigits(values.postalCode),
      address: values.address.trim(),
      number: values.number.trim(),
      district: values.district.trim(),
      city: values.city.trim(),
      state_abbr: values.stateAbbr.trim().toUpperCase(),
      phone: onlyDigits(values.senderPhone),
      email: values.senderEmail.trim(),
      ...(complement ? { complement } : {}),
      ...(economicActivityCode
        ? { economic_activity_code: economicActivityCode }
        : {}),
    },
    recipientDocument: onlyDigits(values.recipientDocument),
    recipientEmail: values.recipientEmail.trim(),
    recipientPhone: onlyDigits(values.recipientPhone),
  };
}

/** CEP de origem da cotação (o remetente da NF usa o mesmo). */
export function originPostalCode(order: ProductOrder): string | null {
  for (const item of physicalItems(order)) {
    const code = item.catalog.shippingPackage?.originPostalCode;
    if (code) return code.replace(/\D/g, "");
  }
  return null;
}
