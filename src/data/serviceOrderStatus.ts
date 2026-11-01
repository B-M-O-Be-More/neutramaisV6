import type { IconType } from "react-icons";
import {
  LuBadgeCheck,
  LuCircleCheck,
  LuCircleX,
  LuClock,
  LuPackage,
  LuPause,
  LuPlay,
  LuTrendingDown,
} from "react-icons/lu";

import type {
  ServiceOrderItemStatus,
  ServiceOrderStatus,
} from "@/types/serviceOrders";

/** Tom dos cards resumidos (Figma 2191-24781): fundo, borda, selo e faixa. */
export interface ServiceOrderTone {
  bg: string;
  border: string;
  pillBg: string;
  pillBorder: string;
  color: string;
}

export const SERVICE_ORDER_TONES = {
  green: {
    bg: "rgba(234,248,242,0.36)",
    border: "rgba(21,150,106,0.28)",
    pillBg: "#EAF8F2",
    pillBorder: "rgba(21,150,106,0.25)",
    color: "#15966A",
  },
  amber: {
    bg: "rgba(255,247,230,0.36)",
    border: "rgba(217,119,6,0.28)",
    pillBg: "#FFF7E6",
    pillBorder: "rgba(217,119,6,0.25)",
    color: "#D97706",
  },
  blue: {
    bg: "rgba(238,244,255,0.36)",
    border: "rgba(37,99,235,0.28)",
    pillBg: "#EEF4FF",
    pillBorder: "rgba(37,99,235,0.25)",
    color: "#2563EB",
  },
  red: {
    bg: "rgba(255,240,240,0.36)",
    border: "rgba(220,59,59,0.28)",
    pillBg: "#FFF0F0",
    pillBorder: "rgba(220,59,59,0.25)",
    color: "#DC3B3B",
  },
  purple: {
    bg: "rgba(244,240,255,0.36)",
    border: "rgba(124,92,229,0.28)",
    pillBg: "#F4F0FF",
    pillBorder: "rgba(124,92,229,0.25)",
    color: "#7C5CE5",
  },
} satisfies Record<string, ServiceOrderTone>;

export interface ServiceOrderSummaryStyle {
  tone: ServiceOrderTone;
  icon: IconType;
}

/**
 * Ordem na lista "Ordem de Serviço" (Figma 2191-24614). Cancelada com crédito
 * aparece como "Creditado", em roxo.
 */
export const SERVICE_ORDER_STATUS_STYLES: Record<
  ServiceOrderStatus | "credited",
  ServiceOrderSummaryStyle
> = {
  acknowledged: { tone: SERVICE_ORDER_TONES.blue, icon: LuBadgeCheck },
  pending: { tone: SERVICE_ORDER_TONES.amber, icon: LuClock },
  inProgress: { tone: SERVICE_ORDER_TONES.green, icon: LuPackage },
  held: { tone: SERVICE_ORDER_TONES.amber, icon: LuPause },
  completed: { tone: SERVICE_ORDER_TONES.blue, icon: LuCircleCheck },
  rejected: { tone: SERVICE_ORDER_TONES.red, icon: LuCircleX },
  cancelled: { tone: SERVICE_ORDER_TONES.red, icon: LuCircleX },
  credited: { tone: SERVICE_ORDER_TONES.purple, icon: LuTrendingDown },
};

/** Status exibido da demanda: "Adiada" quando há nova previsão. */
export type ServiceOrderItemDisplayStatus =
  | ServiceOrderItemStatus
  | "postponed";

/** Demanda na lista "Demandas da Ordem" (Figma 3108-94102). */
export const SERVICE_ORDER_ITEM_SUMMARY_STYLES: Record<
  ServiceOrderItemDisplayStatus,
  ServiceOrderSummaryStyle
> = {
  pending: { tone: SERVICE_ORDER_TONES.amber, icon: LuClock },
  inProgress: { tone: SERVICE_ORDER_TONES.green, icon: LuPackage },
  held: { tone: SERVICE_ORDER_TONES.amber, icon: LuClock },
  postponed: { tone: SERVICE_ORDER_TONES.amber, icon: LuClock },
  completed: { tone: SERVICE_ORDER_TONES.blue, icon: LuBadgeCheck },
  cancelled: { tone: SERVICE_ORDER_TONES.red, icon: LuCircleX },
};

/**
 * Cores da demanda aberta ("Ver OS", Figma 2191-27226 e variações) e do
 * detalhe: ícone, selo, "Status atual" e barra de evidências.
 */
export interface ServiceOrderItemStyle {
  /** Texto, ícone e ponto do status. */
  color: string;
  /** Fundo do ícone, do selo e do card "Status atual". */
  bg: string;
  /** Borda do selo do título e do card "Status atual". */
  border: string;
  icon: IconType;
  /** Barra de evidências. */
  bar: string;
}

export const SERVICE_ORDER_ITEM_STYLES: Record<
  ServiceOrderItemStatus,
  ServiceOrderItemStyle
> = {
  pending: {
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
    icon: LuClock,
    bar: "#1F5AFF",
  },
  inProgress: {
    color: "#1F5AFF",
    bg: "#EEF3FF",
    border: "#C7D8FF",
    icon: LuPlay,
    bar: "#1F5AFF",
  },
  held: {
    color: "#EF4444",
    bg: "#FEF2F2",
    border: "#FECACA",
    icon: LuPause,
    bar: "#1F5AFF",
  },
  completed: {
    color: "#10B981",
    bg: "#EDFBF5",
    border: "#AAECD5",
    icon: LuCircleCheck,
    bar: "#10B981",
  },
  cancelled: {
    color: "#8A9AB5",
    bg: "#F4F6F9",
    border: "#E5E8EE",
    icon: LuCircleX,
    bar: "#8A9AB5",
  },
};
