// Regras de exibição dos contratos de pedido (lista e detalhe).

import { orderDate } from "@/functions/orderStage";
import { isCheckoutOrder, type ProductOrder } from "@/services/orders.service";
import type {
  ContractEntry,
  ContractStatus,
  ContractsSummary,
  OrderContract,
} from "@/types/contracts";

/** Contador do topo em que cada status entra. */
export function contractStatusGroup(
  status: ContractStatus,
): keyof ContractsSummary {
  switch (status) {
    case "awaiting_signer":
    case "awaiting_signatures":
      return "awaitingSignature";
    case "signed":
      return "signed";
    case "cancelled":
      return "cancelled";
    default:
      return "processing";
  }
}

export function summarizeContracts(entries: ContractEntry[]): ContractsSummary {
  const summary: ContractsSummary = {
    awaitingSignature: 0,
    processing: 0,
    signed: 0,
    cancelled: 0,
  };
  entries.forEach(({ contract }) => {
    summary[contractStatusGroup(contract.status)] += 1;
  });
  return summary;
}

/**
 * sign: o contrato espera o primeiro signatário do Buyer.
 * open: o usuário já está vinculado; o link sai de novo pelo /sign.
 * boundToOther: outro usuário do Buyer está vinculado (o /sign daria 409).
 * none: nada a fazer (sem `contract:sign`, em processamento ou final).
 */
export type ContractSignAction = "sign" | "open" | "boundToOther" | "none";

export function contractSignAction(
  contract: OrderContract,
  { userId, canSign }: { userId: string | null; canSign: boolean },
): ContractSignAction {
  if (!canSign) return "none";
  const [signer] = contract.signatures;
  if (contract.status === "awaiting_signer" && !signer) return "sign";
  if (contract.status !== "awaiting_signatures" || !signer) return "none";
  return signer.subject === userId ? "open" : "boundToOther";
}

/** Os 8 primeiros caracteres do UUID, como nos pedidos: "BF382907". */
export function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

/** Nome dos itens do pedido, na ordem do checkout. */
export function orderItemNames(order: ProductOrder): string[] {
  return isCheckoutOrder(order)
    ? order.items.map((item) => item.catalog.name)
    : order.items.map((item) => item.offeringName);
}

/**
 * Total do pedido: do checkout em centavos da moeda; o antigo em reais por
 * mês (`monthly`).
 */
export function orderTotal(
  order: ProductOrder,
  locale: string,
): { value: string; monthly: boolean } {
  return isCheckoutOrder(order)
    ? {
        value: new Intl.NumberFormat(locale, {
          style: "currency",
          currency: order.currency,
        }).format(order.totalMinor / 100),
        monthly: false,
      }
    : {
        value: new Intl.NumberFormat(locale, {
          style: "currency",
          currency: "BRL",
        }).format(order.totalMonthly),
        monthly: true,
      };
}

/** Data do pedido que originou o contrato; null sem pedido ou sem data. */
export function contractDate(entry: ContractEntry): Date | null {
  return orderDate(entry.order?.createdAt);
}

/**
 * Do pedido mais novo ao mais antigo: a API ordena pelo contractId, que é
 * aleatório. Sem data, vai para o fim.
 */
export function sortContractEntries(entries: ContractEntry[]): ContractEntry[] {
  const time = (entry: ContractEntry) =>
    contractDate(entry)?.getTime() ?? -Infinity;
  return [...entries].sort((a, b) => time(b) - time(a));
}

// Hosts do link de assinatura que a contracts-api devolve.
const SIGNING_HOSTS = new Set([
  "assina.ae",
  "autentique.com.br",
  "app.autentique.com.br",
]);

/** O link abre só em https e nos hosts da Autentique. */
export function isSigningUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && SIGNING_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}
