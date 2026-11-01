/** Pedidos pagos aguardando aceite ou cotações (RFQ) de compradores. */
export type SellerInboxTab = "orders" | "rfq";

export interface SellerInboxTabsProps {
  value: SellerInboxTab;
  /** Itens pendentes por aba; zero ou ausente = contador oculto. */
  counts: Partial<Record<SellerInboxTab, number>>;
  onChange: (tab: SellerInboxTab) => void;
}
