import { decimalToMinor } from "@/functions/cartPricing";
import type { CartLine } from "@/functions/cartView";
import type {
  CreateCheckoutBody,
  PhysicalCheckoutItem,
  ShippingAddress,
  ShippingOption,
} from "@/services/checkout.service";
import { ApiError, upstreamErrorCode } from "@/services/errors";

export const BRAZIL_STATES = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

const POSTAL_CODE = /^[0-9]{5}-?[0-9]{3}$/;

/** Endereço de entrega como o formulário guarda (tudo texto). */
export type ShippingAddressDraft = Omit<
  ShippingAddress,
  "country" | "complement"
> & {
  complement: string;
};

export const EMPTY_ADDRESS: ShippingAddressDraft = {
  recipient: "",
  postalCode: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "",
};

export type AddressField = keyof ShippingAddressDraft;

/** CEP com 8 dígitos, sem hífen; null fora do formato. */
export function normalizePostalCode(value: string): string | null {
  const trimmed = value.trim();
  return POSTAL_CODE.test(trimmed) ? trimmed.replace("-", "") : null;
}

/**
 * Campos do endereço fora do contrato da orders-api (tamanhos mínimo e
 * máximo, CEP e UF). Vazio quando o endereço pode ir ao checkout.
 */
export function addressErrors(address: ShippingAddressDraft): AddressField[] {
  const errors: AddressField[] = [];
  const within = (value: string, min: number, max: number) => {
    const length = value.trim().length;
    return length >= min && length <= max;
  };
  if (!within(address.recipient, 2, 150)) errors.push("recipient");
  if (!normalizePostalCode(address.postalCode)) errors.push("postalCode");
  if (!within(address.street, 2, 200)) errors.push("street");
  if (!within(address.number, 1, 20)) errors.push("number");
  if (address.complement.trim().length > 150) errors.push("complement");
  if (!within(address.district, 2, 100)) errors.push("district");
  if (!within(address.city, 2, 100)) errors.push("city");
  if (!(BRAZIL_STATES as readonly string[]).includes(address.state)) {
    errors.push("state");
  }
  return errors;
}

/** Frete escolhido em centavos (`buyerPrice` em decimal; null = indisponível). */
export function shippingMinor(option: ShippingOption): number | null {
  return option.buyerPrice === null ? null : decimalToMinor(option.buyerPrice);
}

export type CheckoutBodyProblem =
  /** Serviço precisa da evidência de viabilidade da Geo (D-01). */
  "serviceNeedsViability" | "invalidAddress" | "missingShipping";

/**
 * Corpo do POST /productOrder/checkout a partir das linhas do carrinho. Um
 * endereço vale para todos os produtos físicos; cada um leva o frete que o
 * Buyer escolheu. Serviço ainda não entra: falta a busca com prova de
 * viabilidade (D-01).
 */
export function buildCheckoutBody(
  lines: CartLine[],
  address: ShippingAddressDraft,
  shipping: Record<string, ShippingOption | undefined>,
  walletMinor: number,
): { body: CreateCheckoutBody } | { problem: CheckoutBodyProblem } {
  if (lines.some((line) => line.snapshot.productType !== "physical")) {
    return { problem: "serviceNeedsViability" };
  }
  if (addressErrors(address).length > 0) return { problem: "invalidAddress" };

  const shippingAddress: ShippingAddress = {
    recipient: address.recipient.trim(),
    postalCode: normalizePostalCode(address.postalCode)!,
    street: address.street.trim(),
    number: address.number.trim(),
    complement: address.complement.trim() || null,
    district: address.district.trim(),
    city: address.city.trim(),
    state: address.state,
    country: "BR",
  };

  const items: PhysicalCheckoutItem[] = [];
  for (const line of lines) {
    const option = shipping[line.entry.offeringId];
    const minor = option ? shippingMinor(option) : null;
    if (!option || minor === null) return { problem: "missingShipping" };
    items.push({
      offeringId: line.entry.offeringId,
      expectedSnapshotVersion: line.snapshot.snapshotVersion,
      quantity: line.entry.quantity,
      serviceId: option.serviceId,
      expectedShippingMinor: minor,
      shippingAddress,
    });
  }

  return { body: { items, walletMinor: Math.max(0, Math.round(walletMinor)) } };
}

/** Chave nova por tentativa de compra (o mesmo carrinho repete a mesma). */
export function newIdempotencyKey(prefix: "chk" | "pay"): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  return `${prefix}-${random}`;
}

/** A sessão precisa de MFA (orders-api `MFA_REQUIRED`, payment `mfa_required`). */
export function isMfaRequired(error: unknown): boolean {
  return upstreamErrorCode(error)?.toLowerCase() === "mfa_required";
}

/** Texto do `detail` do FastAPI, quando é uma frase. */
function upstreamDetail(error: unknown): string | undefined {
  if (!(error instanceof ApiError)) return undefined;
  const detail = (error.payload as { detail?: unknown } | null)?.detail;
  return typeof detail === "string" ? detail : undefined;
}

/**
 * Erro do checkout ou do pagamento → chave de tradução em `Checkout.errors`.
 * Os códigos `ORD_*` vêm no corpo; alguns 409 só têm o `detail` em inglês.
 */
export function checkoutErrorKey(error: unknown): string {
  const code = upstreamErrorCode(error);
  switch (code) {
    case "ORD_OFFER_OUT_OF_STOCK":
      return "Checkout.errors.outOfStock";
    case "ORD_PURCHASE_LIMIT_EXCEEDED":
      return "Checkout.errors.purchaseLimit";
    case "ORD_PRICE_NOT_AVAILABLE":
      return "Checkout.errors.priceNotAvailable";
    case "ORD_CHECKOUT_CURRENCY_MIXED":
      return "Checkout.errors.mixedCurrencies";
    case "ORD_APPROVAL_PENDING":
      return "Checkout.errors.approvalPending";
  }
  if (!(error instanceof ApiError)) return "Checkout.errors.failed";

  const detail = upstreamDetail(error) ?? "";
  if (error.status === 409) {
    if (/Catalog version changed|refresh checkout/i.test(detail)) {
      return "Checkout.errors.offerChanged";
    }
    if (/reservation|Wallet/i.test(detail)) {
      return "Checkout.errors.walletReservation";
    }
    if (/Separate physical products and services/i.test(detail)) {
      return "Checkout.errors.mixedTypes";
    }
    if (/Shipping cost exceeds/i.test(detail)) {
      return "Checkout.errors.shippingTooHigh";
    }
    if (/retry later|recovery is already active/i.test(detail)) {
      return "Checkout.errors.busy";
    }
    return "Checkout.errors.conflict";
  }
  if (error.status === 403) return "Checkout.errors.forbidden";
  if (error.status === 422) return "Checkout.errors.invalid";
  if (error.status >= 500) return "Checkout.errors.unavailable";
  return "Checkout.errors.failed";
}
