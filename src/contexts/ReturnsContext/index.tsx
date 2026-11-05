"use client";

import React from "react";

import {
  placeholderReturnableOrders,
  placeholderReturns,
} from "@/data/returnsPlaceholder";
import {
  RETURN_MEDIATION_STATUSES,
  RETURN_RETURNING_STATUSES,
} from "@/data/returnStatus";
import type {
  ReturnAttachmentKind,
  ReturnRequest,
  ReturnRequestDraft,
  ReturnsSummary,
} from "@/types/returns";

import { ReturnsContextProps, ReturnsProviderProps } from "./interface";

const HOUR = 60 * 60 * 1000;

/** Prazo do seller para responder a uma nova solicitação. */
const SELLER_SLA_HOURS = 48;

/** Próximo ID sequencial do ano: DEV-2026-019. */
function buildNextId(returns: ReturnRequest[]): string {
  const prefix = `DEV-${new Date().getFullYear()}-`;
  const last = returns.reduce((max, item) => {
    if (!item.id.startsWith(prefix)) return max;
    const sequence = Number(item.id.slice(prefix.length));
    return Number.isFinite(sequence) ? Math.max(max, sequence) : max;
  }, 0);
  return `${prefix}${String(last + 1).padStart(3, "0")}`;
}

function attachmentKind(file: File): ReturnAttachmentKind {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "document";
}

const ReturnsContext = React.createContext<ReturnsContextProps | null>(null);

/**
 * Devoluções e trocas do buyer, compartilhadas entre a lista, o detalhe e o
 * formulário (provido no layout de /returns). A API de devoluções ainda não
 * existe: a lista nasce dos dados do design e as ações alteram o estado
 * local, com a mesma assinatura assíncrona que as chamadas à API terão.
 */
const ReturnsProvider: React.FC<ReturnsProviderProps> = ({ children }) => {
  const [now] = React.useState(() => Date.now());
  const [returns, setReturns] = React.useState<ReturnRequest[]>(() =>
    placeholderReturns(now),
  );
  const [returnableOrders] = React.useState(placeholderReturnableOrders);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const summary = React.useMemo<ReturnsSummary>(
    () => ({
      total: returns.length,
      awaitingAction: returns.filter((item) =>
        ["awaitingSeller", "receivedBySeller", "inMediation"].includes(
          item.status,
        ),
      ).length,
      contested: returns.filter((item) =>
        RETURN_MEDIATION_STATUSES.includes(item.status),
      ).length,
      returning: returns.filter((item) =>
        RETURN_RETURNING_STATUSES.includes(item.status),
      ).length,
    }),
    [returns],
  );

  const createReturn = React.useCallback(
    async (orderId: string, draft: ReturnRequestDraft) => {
      const order = returnableOrders.find((item) => item.id === orderId);
      if (!order) return null;

      setPendingId("new");
      const requestedAt = Date.now();
      // Os arquivos só ganham URL quando a API de anexos existir; por ora
      // ficam o nome e o tipo.
      const created: ReturnRequest = {
        id: buildNextId(returns),
        orderId: order.id,
        productName: order.productName,
        quantity: order.quantity,
        type: draft.type,
        reason: draft.reason,
        description: draft.description,
        buyerName: order.buyerName,
        sellerName: order.sellerName,
        amount: order.amount,
        status: "awaitingSeller",
        requestedAt: new Date(requestedAt).toISOString(),
        slaDeadline: new Date(
          requestedAt + SELLER_SLA_HOURS * HOUR,
        ).toISOString(),
        attachments: draft.files.map((file, index) => ({
          id: `${file.name}-${index}`,
          name: file.name,
          kind: attachmentKind(file),
        })),
      };
      setReturns((list) => [created, ...list]);
      setPendingId(null);
      return created;
    },
    [returnableOrders, returns],
  );

  const requestMediation = React.useCallback(
    async (id: string) => {
      const current = returns.find((item) => item.id === id);
      if (!current || !RETURN_MEDIATION_STATUSES.includes(current.status)) {
        return false;
      }

      setPendingId(id);
      setReturns((list) =>
        list.map((item) =>
          item.id === id
            ? { ...item, status: "inMediation", slaDeadline: null }
            : item,
        ),
      );
      setPendingId(null);
      return true;
    },
    [returns],
  );

  return (
    <ReturnsContext.Provider
      value={{
        returns,
        summary,
        returnableOrders,
        now,
        pendingId,
        createReturn,
        requestMediation,
      }}
    >
      {children}
    </ReturnsContext.Provider>
  );
};

/** Devoluções do buyer; exige o ReturnsProvider (layout de /returns). */
function useReturns(): ReturnsContextProps {
  const context = React.useContext(ReturnsContext);
  if (!context) {
    throw new Error("useReturns precisa estar dentro do ReturnsProvider.");
  }
  return context;
}

export { ReturnsProvider, useReturns };
