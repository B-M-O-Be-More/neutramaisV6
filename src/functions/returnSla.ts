// Prazo do seller numa devolução: horas restantes e o tom de alerta.

import {
  RETURN_SLA_STATUSES,
  RETURN_SLA_URGENT_HOURS,
} from "@/data/returnStatus";
import { hoursUntil } from "@/functions/proposalFormat";
import type { ReturnRequest } from "@/types/returns";

/** Horas até o fim do prazo do seller; null quando não corre prazo. */
export function returnSlaHours(
  item: Pick<ReturnRequest, "status" | "slaDeadline">,
  now: number,
): number | null {
  if (!item.slaDeadline || !RETURN_SLA_STATUSES.includes(item.status)) {
    return null;
  }
  return hoursUntil(item.slaDeadline, now);
}

/** Vermelho até 12h; âmbar depois (Figma 2943-31520 e 2943-31633). */
export function isReturnSlaUrgent(hours: number): boolean {
  return hours <= RETURN_SLA_URGENT_HOURS;
}
