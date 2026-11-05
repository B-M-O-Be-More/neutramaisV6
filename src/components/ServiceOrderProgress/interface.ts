import type { ServiceOrderItem } from "@/types/serviceOrders";

export interface ServiceOrderProgressProps {
  item: ServiceOrderItem;
  /** Idioma para as datas. */
  locale: string;
  /** Instante de referência do SLA (Date.now()). */
  now: number;
}
