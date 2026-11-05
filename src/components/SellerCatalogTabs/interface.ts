/** Áreas do catálogo do seller: ofertas, cobertura (KMZ) e configurações de venda. */
export type SellerCatalogTab = "catalog" | "coverage" | "settings";

export interface SellerCatalogTabsProps {
  value: SellerCatalogTab;
  /** Abas já construídas; as demais aparecem desabilitadas. */
  available: SellerCatalogTab[];
  onChange: (tab: SellerCatalogTab) => void;
}
