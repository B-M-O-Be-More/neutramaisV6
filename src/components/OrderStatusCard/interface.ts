import type { OrderStage } from "@/functions/orderStage";

export interface OrderStatusCardProps {
  stage: OrderStage;
  /** Texto abaixo do status (ex.: cancelamento em andamento). */
  caption: string;
}
