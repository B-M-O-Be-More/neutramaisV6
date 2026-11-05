import type { SentDirectProposal } from "@/hooks/useSendDirectProposal";
import type { DirectProposalValues } from "@/schemas/directProposal";

/** Oferta que recebe a proposta, já pronta para exibir. */
export interface DirectProposalOffer {
  id: string;
  title: string;
  /** Linha abaixo do título no banner (ex.: "Russas/CE · R$ 109,99/mês"). */
  subtitle: string;
  /** Mínimo de portas da oferta. */
  minPorts: number;
  /** Vigência sugerida (meses), a da oferta. */
  contractMonths: number;
}

/**
 * Guarda a etapa e o rascunho: monte com uma `key` nova a cada oferta para
 * começar do zero.
 */
export interface DirectProposalCreateDialogProps {
  /** null: modal fechado. */
  offer: DirectProposalOffer | null;
  /** Organização (ou usuário) que compra — "Comprador" na revisão. */
  buyerName: string;
  /** Endereço de entrega sugerido (a sede da organização). */
  defaultAddress?: Pick<DirectProposalValues, "street" | "postalCode">;
  locale: string;
  /** "Ver propostas enviadas". */
  proposalsHref: string;
  onClose: () => void;
  onSend: (
    offeringId: string,
    values: DirectProposalValues,
  ) => Promise<SentDirectProposal>;
}
