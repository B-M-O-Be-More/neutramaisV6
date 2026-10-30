"use client";

import React from "react";

import { placeholderDirectProposals } from "@/data/proposalsPlaceholder";
import {
  DIRECT_PROPOSAL_STATUSES,
  type DirectProposal,
  type DirectProposalRevision,
  type DirectProposalStatus,
} from "@/types/proposals";

import type { UseDirectProposalsReturn } from "./interface";

const DAY = 24 * 60 * 60 * 1000;

/** Revisar e cancelar só valem enquanto não houve aceite (BR §7). */
export function isDirectProposalOpen(status: DirectProposalStatus): boolean {
  return status === "awaiting" || status === "revisionRequested";
}

/**
 * Propostas diretas do buyer. A rfq-api ainda não existe: a lista nasce dos
 * dados do design e as ações alteram o estado local, com a mesma assinatura
 * assíncrona que as chamadas à API terão.
 */
export function useDirectProposals(): UseDirectProposalsReturn {
  const [proposals, setProposals] = React.useState<DirectProposal[]>(() =>
    placeholderDirectProposals(),
  );
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const counts = React.useMemo(() => {
    const result = Object.fromEntries(
      DIRECT_PROPOSAL_STATUSES.map((status) => [status, 0]),
    ) as Record<DirectProposalStatus, number>;
    for (const proposal of proposals) result[proposal.status] += 1;
    return result;
  }, [proposals]);

  const revise = React.useCallback(
    async (id: string, revision: DirectProposalRevision) => {
      const current = proposals.find((proposal) => proposal.id === id);
      if (!current || !isDirectProposalOpen(current.status)) return null;

      setPendingId(id);
      // A revisão vira a nova versão: o seller recebe de novo e a análise
      // recomeça; a validade conta a partir do reenvio.
      const now = Date.now();
      const revised: DirectProposal = {
        ...current,
        ...revision,
        price: { ...current.price, amount: revision.price },
        notes: revision.notes || undefined,
        version: current.version + 1,
        status: "awaiting",
        progress: 0,
        sellerMessage: undefined,
        sentAt: new Date(now).toISOString(),
        expiresAt: new Date(now + current.validityDays * DAY).toISOString(),
      };
      setProposals((list) =>
        list.map((proposal) => (proposal.id === id ? revised : proposal)),
      );
      setPendingId(null);
      return revised;
    },
    [proposals],
  );

  // Motivo e observações vão para a API (métricas comerciais); localmente só
  // o status muda.
  const cancel = React.useCallback(
    async (id: string) => {
      const current = proposals.find((proposal) => proposal.id === id);
      if (!current || !isDirectProposalOpen(current.status)) return false;

      setPendingId(id);
      setProposals((list) =>
        list.map((proposal) =>
          proposal.id === id
            ? { ...proposal, status: "cancelled", progress: undefined }
            : proposal,
        ),
      );
      setPendingId(null);
      return true;
    },
    [proposals],
  );

  return { proposals, counts, pendingId, revise, cancel };
}
