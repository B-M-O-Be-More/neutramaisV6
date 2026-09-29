/**
 * Natureza do evento — define ícone e cor:
 * success (aceite), warning (prazo), danger (crítico), message (proposta
 * recebida) e info (conclusão).
 */
export type DashboardActivityTone =
  | "success"
  | "warning"
  | "danger"
  | "message"
  | "info";

export interface DashboardActivity {
  id: string;
  tone: DashboardActivityTone;
  /** Texto do evento já pronto para exibição. */
  message: string;
  /** Tempo relativo já formatado — ex.: "2 min atrás". */
  timeAgo: string;
}

export interface DashboardRecentActivityProps {
  activities: DashboardActivity[];
}
