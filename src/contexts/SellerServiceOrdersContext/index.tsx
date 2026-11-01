"use client";

import React from "react";
import { useTranslation } from "react-i18next";

import {
  PLACEHOLDER_TECHNICIANS,
  placeholderServiceOrders,
} from "@/data/serviceOrdersPlaceholder";
import {
  canCompleteServiceOrderItem,
  canStartServiceOrderItem,
  remainingReschedules,
  serviceOrderEvidenceProgress,
} from "@/functions/serviceOrders";
import type {
  ServiceOrder,
  ServiceOrderItem,
  ServiceOrderMessage,
  ServiceOrderStatus,
} from "@/types/serviceOrders";

import {
  SellerServiceOrdersContextProps,
  SellerServiceOrdersProviderProps,
} from "./interface";

/**
 * Status da ordem acompanhando as demandas: em espera se alguma está em
 * espera, em execução se alguma executa, concluída quando todas concluíram.
 * Recusada e cancelada não mudam.
 */
function syncOrderStatus(order: ServiceOrder): ServiceOrderStatus {
  if (order.status === "rejected" || order.status === "cancelled") {
    return order.status;
  }
  const active = order.items.filter((item) => item.status !== "cancelled");
  if (!active.length) return order.status;
  if (active.every((item) => item.status === "completed")) return "completed";
  if (active.some((item) => item.status === "held")) return "held";
  if (active.some((item) => item.status === "inProgress")) return "inProgress";
  return order.status;
}

const SellerServiceOrdersContext =
  React.createContext<SellerServiceOrdersContextProps | null>(null);

/**
 * Ordens de serviço do seller, compartilhadas entre a lista, as demandas e o
 * detalhe (provido no layout de /seller/service-orders). A
 * service-ordering-api ainda não tem técnicos, agenda, evidências nem
 * mensagens: a lista nasce dos dados do design e as ações alteram o estado
 * local, com a mesma assinatura assíncrona que as chamadas à API terão.
 */
const SellerServiceOrdersProvider: React.FC<
  SellerServiceOrdersProviderProps
> = ({ children }) => {
  const { t, i18n } = useTranslation();
  const [now] = React.useState(() => Date.now());
  const [orders, setOrders] = React.useState<ServiceOrder[]>(() =>
    placeholderServiceOrders(now),
  );
  const [technicians, setTechnicians] = React.useState(PLACEHOLDER_TECHNICIANS);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  // Arquivos das evidências ficam no navegador (object URL) até a API de
  // anexos existir; liberados ao sair das ordens de serviço.
  const objectUrls = React.useRef<string[]>([]);
  React.useEffect(() => {
    const urls = objectUrls.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const findItem = React.useCallback(
    (orderId: string, itemId: string) => {
      const order = orders.find((entry) => entry.orderId === orderId);
      const item = order?.items.find((entry) => entry.id === itemId);
      return order && item ? { order, item } : null;
    },
    [orders],
  );

  const locate = React.useCallback(
    (itemId: string) => {
      for (const order of orders) {
        const item = order.items.find((entry) => entry.id === itemId);
        if (item) return { order, item };
      }
      return null;
    },
    [orders],
  );

  /** Troca a demanda pela atualizada e recalcula o status da ordem. */
  const commit = React.useCallback((next: ServiceOrderItem) => {
    setOrders((list) =>
      list.map((order) => {
        if (!order.items.some((item) => item.id === next.id)) return order;
        const updated = {
          ...order,
          items: order.items.map((item) => (item.id === next.id ? next : item)),
        };
        return { ...updated, status: syncOrderStatus(updated) };
      }),
    );
  }, []);

  const systemMessage = (text: string): ServiceOrderMessage => ({
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    author: "system",
    authorName: t("ServiceOrders.chat.system"),
    sentAt: new Date().toISOString(),
    text,
  });

  const assignTechnician: SellerServiceOrdersContextProps["assignTechnician"] =
    async (itemId, technician, start) => {
      const found = locate(itemId);
      if (
        !found ||
        found.item.status === "completed" ||
        found.item.status === "cancelled"
      ) {
        return null;
      }

      setPendingId(itemId);
      let chosen =
        typeof technician === "string"
          ? technicians.find((entry) => entry.id === technician)
          : undefined;
      if (typeof technician !== "string") {
        chosen = { ...technician, id: `tec-${Date.now()}` };
        const created = chosen;
        setTechnicians((list) => [...list, created]);
      }
      if (!chosen) {
        setPendingId(null);
        return null;
      }

      const shouldStart = start && found.item.status === "pending";
      const next: ServiceOrderItem = {
        ...found.item,
        technician: chosen,
        status: shouldStart ? "inProgress" : found.item.status,
        updatedAt: new Date().toISOString(),
        messages: [
          ...found.item.messages,
          systemMessage(
            t(
              shouldStart
                ? "ServiceOrders.chat.technicianStarted"
                : "ServiceOrders.chat.technicianAssigned",
              { name: chosen.name },
            ),
          ),
        ],
      };
      commit(next);
      setPendingId(null);
      return next;
    };

  const startItem: SellerServiceOrdersContextProps["startItem"] = async (
    itemId,
  ) => {
    const found = locate(itemId);
    if (!found || !canStartServiceOrderItem(found.item)) return null;

    setPendingId(itemId);
    const next: ServiceOrderItem = {
      ...found.item,
      status: "inProgress",
      postponedTo: undefined,
      updatedAt: new Date().toISOString(),
      messages: [
        ...found.item.messages,
        systemMessage(t("ServiceOrders.chat.started")),
      ],
    };
    commit(next);
    setPendingId(null);
    return next;
  };

  const completeItem: SellerServiceOrdersContextProps["completeItem"] = async (
    itemId,
  ) => {
    const found = locate(itemId);
    if (!found || !canCompleteServiceOrderItem(found.item)) return null;

    setPendingId(itemId);
    const nowIso = new Date().toISOString();
    const next: ServiceOrderItem = {
      ...found.item,
      status: "completed",
      completedAt: nowIso,
      updatedAt: nowIso,
      messages: [
        ...found.item.messages,
        systemMessage(t("ServiceOrders.chat.completed")),
      ],
    };
    commit(next);
    setPendingId(null);
    return next;
  };

  const postpone: SellerServiceOrdersContextProps["postpone"] = async (
    itemId,
    postponement,
  ) => {
    const found = locate(itemId);
    if (
      !found ||
      found.item.status === "completed" ||
      found.item.status === "cancelled"
    ) {
      return null;
    }
    // Reagendamento formal só dentro do limite permitido.
    if (postponement.reschedule && remainingReschedules(found.item) === 0) {
      return null;
    }

    setPendingId(itemId);
    const scheduledAt = new Date(postponement.scheduledAt).toISOString();
    const next: ServiceOrderItem = {
      ...found.item,
      scheduledAt,
      postponedTo: scheduledAt,
      reschedulesUsed:
        found.item.reschedulesUsed + (postponement.reschedule ? 1 : 0),
      updatedAt: new Date().toISOString(),
      messages: [
        ...found.item.messages,
        systemMessage(
          t("ServiceOrders.chat.postponed", {
            date: new Intl.DateTimeFormat(i18n.language, {
              dateStyle: "short",
              timeStyle: "short",
            }).format(new Date(scheduledAt)),
            reason: postponement.reason,
          }),
        ),
      ],
    };
    commit(next);
    setPendingId(null);
    return next;
  };

  const registerEvidence: SellerServiceOrdersContextProps["registerEvidence"] =
    async (itemId, index, file) => {
      const found = locate(itemId);
      if (
        !found ||
        found.item.status !== "inProgress" ||
        !found.item.evidences[index] ||
        found.item.evidences[index].fileName
      ) {
        return null;
      }

      setPendingId(itemId);
      const url = URL.createObjectURL(file);
      objectUrls.current.push(url);
      const nowIso = new Date().toISOString();
      const evidences = found.item.evidences.map((evidence, position) =>
        position === index
          ? { fileName: file.name, url, registeredAt: nowIso }
          : evidence,
      );
      const progress = serviceOrderEvidenceProgress({
        ...found.item,
        evidences,
      });
      const next: ServiceOrderItem = {
        ...found.item,
        evidences,
        updatedAt: nowIso,
        messages: [
          ...found.item.messages,
          systemMessage(
            t("ServiceOrders.chat.evidence", {
              done: progress.done,
              total: progress.total,
              time: new Intl.DateTimeFormat(i18n.language, {
                timeStyle: "short",
              }).format(new Date(nowIso)),
            }),
          ),
        ],
      };
      commit(next);
      setPendingId(null);
      return next;
    };

  const sendMessage: SellerServiceOrdersContextProps["sendMessage"] = async (
    itemId,
    text,
  ) => {
    const found = locate(itemId);
    const body = text.trim();
    if (!found || !body) return false;

    const nowIso = new Date().toISOString();
    commit({
      ...found.item,
      updatedAt: nowIso,
      messages: [
        ...found.item.messages,
        {
          id: `msg-${Date.now()}`,
          author: "seller",
          authorName: found.order.sellerName,
          sentAt: nowIso,
          text: body,
        },
      ],
    });
    return true;
  };

  return (
    <SellerServiceOrdersContext.Provider
      value={{
        orders,
        technicians,
        now,
        pendingId,
        findItem,
        assignTechnician,
        startItem,
        completeItem,
        postpone,
        registerEvidence,
        sendMessage,
      }}
    >
      {children}
    </SellerServiceOrdersContext.Provider>
  );
};

/**
 * Ordens de serviço do seller; exige o SellerServiceOrdersProvider (layout de
 * /seller/service-orders).
 */
function useSellerServiceOrders(): SellerServiceOrdersContextProps {
  const context = React.useContext(SellerServiceOrdersContext);
  if (!context) {
    throw new Error(
      "useSellerServiceOrders precisa estar dentro do SellerServiceOrdersProvider.",
    );
  }
  return context;
}

export { SellerServiceOrdersProvider, useSellerServiceOrders };
