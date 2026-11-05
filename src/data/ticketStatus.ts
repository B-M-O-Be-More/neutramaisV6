import type { IconType } from "react-icons";
import { LuCircleCheckBig, LuClock } from "react-icons/lu";

import type {
  TicketFilter,
  TicketPriority,
  TicketStatus,
} from "@/types/tickets";

/** Cor e SLA de cada prioridade (Figma 3108-101473). */
export const TICKET_PRIORITY_STYLES: Record<
  TicketPriority,
  { bg: string; color: string; slaHours: number }
> = {
  P1: { bg: "#FEF2F2", color: "#EF4444", slaHours: 4 },
  P2: { bg: "#FFFBEB", color: "#D97706", slaHours: 24 },
  P3: { bg: "#EEF3FF", color: "#1F5AFF", slaHours: 48 },
  P4: { bg: "#F3EEFF", color: "#8B5CF6", slaHours: 72 },
};

/** Selo de status do ticket (Figma 3108-102296). */
export const TICKET_STATUS_STYLES: Record<
  TicketStatus,
  { bg: string; color: string; icon: IconType }
> = {
  open: { bg: "#FFFBEB", color: "#D97706", icon: LuClock },
  inProgress: { bg: "#EEF3FF", color: "#1F5AFF", icon: LuClock },
  awaitingSeller: { bg: "#F3EEFF", color: "#8B5CF6", icon: LuClock },
  resolved: { bg: "#EDFBF5", color: "#10B981", icon: LuCircleCheckBig },
  closed: { bg: "#F4F6F9", color: "#8A9AB5", icon: LuCircleCheckBig },
};

/** Ainda em atendimento: conta em "Abertos" e mostra o SLA. */
export const TICKET_ACTIVE_STATUSES: readonly TicketStatus[] = [
  "open",
  "inProgress",
  "awaitingSeller",
];

/** Status de cada aba; "all" e "mine" não filtram por status. */
export const TICKET_FILTER_STATUSES: Record<
  Exclude<TicketFilter, "all" | "mine">,
  readonly TicketStatus[]
> = {
  open: ["open", "awaitingSeller"],
  inProgress: ["inProgress"],
  resolved: ["resolved", "closed"],
};

/** Até esse número de horas o SLA aparece em vermelho; depois, em âmbar. */
export const TICKET_SLA_URGENT_HOURS = 12;
