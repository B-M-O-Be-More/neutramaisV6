import type { DirectProposalValues } from "@/schemas/directProposal";

/** Proposta direta já enviada ao seller da oferta. */
export interface SentDirectProposal {
  /** Ex.: PROP-706542. */
  id: string;
  version: number;
  /** Prazo do seller para aceitar. */
  responseHours: number;
  /** Validade da proposta depois de enviada. */
  validityDays: number;
}

export interface UseSendDirectProposalReturn {
  send: (
    offeringId: string,
    values: DirectProposalValues,
  ) => Promise<SentDirectProposal>;
}
