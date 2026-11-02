"use client";

import React from "react";

import type {
  SentDirectProposal,
  UseSendDirectProposalReturn,
} from "./interface";

/** Prazo do seller para aceitar e validade da proposta (Figma 2456-35186). */
export const DIRECT_PROPOSAL_RESPONSE_HOURS = 72;
export const DIRECT_PROPOSAL_VALIDITY_DAYS = 7;

/**
 * Envio de proposta direta a partir de uma oferta. A rfq-api (propostas e
 * RFQs) ainda não existe: o envio devolve o protocolo da v1 sem chamar o
 * backend, com a mesma assinatura assíncrona que a chamada à API terá — como
 * o `useRfqs` na área de Propostas.
 */
export function useSendDirectProposal(): UseSendDirectProposalReturn {
  const send = React.useCallback(async (): Promise<SentDirectProposal> => {
    const sequence = Math.floor(100_000 + Math.random() * 900_000);
    return {
      id: `PROP-${sequence}`,
      version: 1,
      responseHours: DIRECT_PROPOSAL_RESPONSE_HOURS,
      validityDays: DIRECT_PROPOSAL_VALIDITY_DAYS,
    };
  }, []);

  return { send };
}
