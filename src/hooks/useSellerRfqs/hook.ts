"use client";

import React from "react";

import { placeholderSellerRfqs } from "@/data/sellerRfqsPlaceholder";
import {
  SELLER_RFQ_STATUSES,
  type SellerRfq,
  type SellerRfqProposalDraft,
  type SellerRfqStatus,
} from "@/types/sellerRfqs";

import type { UseSellerRfqsReturn } from "./interface";

/** A proposta pode ser enviada ou atualizada enquanto a RFQ está aberta. */
export function isSellerRfqOpen(status: SellerRfqStatus): boolean {
  return status === "awaiting" || status === "proposalSent";
}

/**
 * RFQs recebidas pelo seller. A rfq-api ainda não tem as regras de negócio:
 * a lista nasce dos dados do design e enviar proposta/recusar alteram o
 * estado local, com a mesma assinatura assíncrona que as chamadas à API
 * terão.
 */
export function useSellerRfqs(): UseSellerRfqsReturn {
  const [rfqs, setRfqs] = React.useState<SellerRfq[]>(() =>
    placeholderSellerRfqs(),
  );

  const counts = React.useMemo(() => {
    const result = Object.fromEntries(
      SELLER_RFQ_STATUSES.map((status) => [status, 0]),
    ) as Record<SellerRfqStatus, number>;
    for (const rfq of rfqs) result[rfq.status] += 1;
    return result;
  }, [rfqs]);

  const monthReceived = React.useMemo(() => {
    const now = new Date();
    return rfqs.filter((rfq) => {
      const received = new Date(rfq.receivedAt);
      return (
        received.getFullYear() === now.getFullYear() &&
        received.getMonth() === now.getMonth()
      );
    }).length;
  }, [rfqs]);

  const sendProposal = React.useCallback(
    async (id: string, draft: SellerRfqProposalDraft) => {
      const target = rfqs.find((rfq) => rfq.id === id);
      if (!target || !isSellerRfqOpen(target.status)) return null;
      // Atualizar a proposta gera a próxima versão (v1, v2...).
      const updated: SellerRfq = {
        ...target,
        status: "proposalSent",
        proposal: { ...draft, version: (target.proposal?.version ?? 0) + 1 },
      };
      setRfqs((list) => list.map((rfq) => (rfq.id === id ? updated : rfq)));
      return updated;
    },
    [rfqs],
  );

  const decline = React.useCallback(
    async (id: string, reason: string) => {
      const target = rfqs.find((rfq) => rfq.id === id);
      if (!target || target.status !== "awaiting") return false;
      setRfqs((list) =>
        list.map((rfq) =>
          rfq.id === id
            ? { ...rfq, status: "declined", declineReason: reason }
            : rfq,
        ),
      );
      return true;
    },
    [rfqs],
  );

  return { rfqs, counts, monthReceived, sendProposal, decline };
}
