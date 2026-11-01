import type { OrderShipping, ProductOrder } from "@/services/orders.service";

export interface SellerOrderCardProps {
  order: ProductOrder;
  /** Envio do pedido físico pago (diz se o Seller já aceitou). */
  shipping?: OrderShipping;
  locale: string;
  /** Detalhe do pedido ("Ver OS" e "Abrir pedido"). */
  href: string;
  isAccepting: boolean;
  isRejecting: boolean;
  onAccept: () => void;
  /** Recusa com o motivo; true fecha o painel do motivo. */
  onReject: (reason: string) => Promise<boolean>;
  /** Abre o "Pedir complemento". */
  onRequestComplement: () => void;
}
