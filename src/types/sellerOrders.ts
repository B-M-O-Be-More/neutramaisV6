// Pedidos recebidos pelo seller (caixa de entrada, Figma 2943-37970). Pedido
// pago fica em escrow aguardando o aceite dentro do SLA; sem resposta, expira
// (auto-recusa).

export const SELLER_ORDER_STATUSES = [
  "awaiting",
  "accepted",
  "rejected",
  "expired",
] as const;

export type SellerOrderStatus = (typeof SELLER_ORDER_STATUSES)[number];
