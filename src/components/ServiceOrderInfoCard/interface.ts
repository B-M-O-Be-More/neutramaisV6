import type { ServiceOrderItem } from "@/types/serviceOrders";

export interface ServiceOrderInfoCardProps {
  item: ServiceOrderItem;
  /** Idioma para as datas. */
  locale: string;
}
