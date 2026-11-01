import type {
  ReturnFreightPayer,
  ReturnReason,
  ReturnStatus,
} from "@/types/returns";

export interface ReturnStatusStyle {
  bg: string;
  color: string;
}

/** Selo de status da devolução (Figma 2943-31366). */
export const RETURN_STATUS_STYLES: Record<ReturnStatus, ReturnStatusStyle> = {
  awaitingSeller: { bg: "#FFFBEB", color: "#D97706" },
  receivedBySeller: { bg: "#FFFBEB", color: "#D97706" },
  contested: { bg: "#FEF2F2", color: "#EF4444" },
  rejected: { bg: "#FEF2F2", color: "#EF4444" },
  inMediation: { bg: "#F3EEFF", color: "#8B5CF6" },
  returning: { bg: "#EEF3FF", color: "#1F5AFF" },
  returnInTransit: { bg: "#EEF3FF", color: "#1F5AFF" },
};

/** O seller ainda tem prazo para responder: mostra o SLA. */
export const RETURN_SLA_STATUSES: readonly ReturnStatus[] = [
  "awaitingSeller",
  "receivedBySeller",
  "contested",
];

/** Contestada ou recusada: o buyer pode pedir a mediação da Neutra+. */
export const RETURN_MEDIATION_STATUSES: readonly ReturnStatus[] = [
  "contested",
  "rejected",
];

/** Item a caminho do seller (contador "Em retorno"). */
export const RETURN_RETURNING_STATUSES: readonly ReturnStatus[] = [
  "returning",
  "returnInTransit",
];

/**
 * Quem paga o frete de retorno pelo motivo (Figma 2943-31588): problema do
 * produto é do seller, avaria é da transportadora, arrependimento é do buyer.
 */
export const RETURN_FREIGHT_PAYER: Record<ReturnReason, ReturnFreightPayer> = {
  defect: "seller",
  wrongProduct: "seller",
  notAsDescribed: "seller",
  transportDamage: "carrier",
  regret: "buyer",
  other: "toBeDefined",
};

/** Até esse número de horas o SLA aparece em vermelho; depois, em âmbar. */
export const RETURN_SLA_URGENT_HOURS = 12;
