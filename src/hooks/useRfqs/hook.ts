"use client";

import React from "react";

import { placeholderRfqs } from "@/data/proposalsPlaceholder";
import {
  RFQ_STATUSES,
  type Rfq,
  type RfqDraft,
  type RfqStatus,
} from "@/types/proposals";

import type { UseRfqsReturn } from "./interface";

const HOUR = 60 * 60 * 1000;

/** Cancelar vale enquanto nenhuma proposta virou pedido (BR §7). */
export function isRfqCancellable(status: RfqStatus): boolean {
  return status === "proposalReceived" || status === "awaiting";
}

/** Próximo ID sequencial do ano: RFQ-2026-006. */
function buildNextId(rfqs: Rfq[]): string {
  const year = new Date().getFullYear();
  const prefix = `RFQ-${year}-`;
  const last = rfqs.reduce((max, rfq) => {
    if (!rfq.id.startsWith(prefix)) return max;
    const sequence = Number(rfq.id.slice(prefix.length));
    return Number.isFinite(sequence) ? Math.max(max, sequence) : max;
  }, 0);
  return `${prefix}${String(last + 1).padStart(3, "0")}`;
}

/**
 * RFQs do buyer. A rfq-api ainda não existe: a lista nasce dos dados do
 * design e criar/cancelar alteram o estado local, com a mesma assinatura
 * assíncrona que as chamadas à API terão.
 */
export function useRfqs(): UseRfqsReturn {
  const [rfqs, setRfqs] = React.useState<Rfq[]>(() => placeholderRfqs());

  const counts = React.useMemo(() => {
    const result = Object.fromEntries(
      RFQ_STATUSES.map((status) => [status, 0]),
    ) as Record<RfqStatus, number>;
    for (const rfq of rfqs) result[rfq.status] += 1;
    return result;
  }, [rfqs]);

  const nextId = React.useMemo(() => buildNextId(rfqs), [rfqs]);

  const create = React.useCallback(
    async (draft: RfqDraft) => {
      const now = Date.now();
      // Quem é elegível (categoria, cobertura, KYC) quem decide é a
      // plataforma: até a API responder, nenhum seller conta como notificado.
      const rfq: Rfq = {
        ...draft,
        id: nextId,
        createdAt: new Date(now).toISOString(),
        deadlineAt: new Date(now + draft.responseHours * HOUR).toISOString(),
        status: "awaiting",
        notifiedSellers: 0,
        proposalsReceived: 0,
      };
      setRfqs((list) => [rfq, ...list]);
      return rfq;
    },
    [nextId],
  );

  const cancel = React.useCallback(
    async (ids: string[]) => {
      const targets = new Set(
        rfqs
          .filter((rfq) => ids.includes(rfq.id) && isRfqCancellable(rfq.status))
          .map((rfq) => rfq.id),
      );
      setRfqs((list) =>
        list.map((rfq) =>
          targets.has(rfq.id) ? { ...rfq, status: "cancelled" } : rfq,
        ),
      );
      return targets.size;
    },
    [rfqs],
  );

  return { rfqs, counts, nextId, create, cancel };
}
