import type { OrderPerspective } from "@/components/OrderDetail";

export interface OrderDetailScreenProps {
  orderId: string;
  perspective: OrderPerspective;
  backHref: string;
  backLabel: string;
  contractsHref?: string;
}
