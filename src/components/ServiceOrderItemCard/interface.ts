import type { ServiceOrder, ServiceOrderItem } from "@/types/serviceOrders";

export interface ServiceOrderItemCardProps {
  item: ServiceOrderItem;
  /** Ordem da demanda: pedido, seller e buyer. */
  order: ServiceOrder;
  /** Idioma para datas. */
  locale: string;
  /** Instante de referência do SLA (Date.now()). */
  now: number;
  /** Destino de "Ver detalhes". */
  detailsHref: string;
  /** Fecha o card (volta ao resumo). */
  onCollapse: () => void;
  /** "Reagendar (n restantes)": abre o adiamento. */
  onReschedule: () => void;
  /** "Abrir disputa" da demanda em espera. */
  onOpenDispute: () => void;
}
