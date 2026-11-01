import type { ServiceOrdersSummary } from "@/types/serviceOrders";

export interface ServiceOrderStatsProps {
  data: ServiceOrdersSummary;
  /** Ordens (lista) ou demandas de uma ordem: muda a explicação do "ⓘ". */
  scope: "orders" | "items";
  locale: string;
}
