/** Áreas do catálogo do seller: ofertas ou cobertura (KMZ). */
export type SellerCatalogTab = "catalog" | "coverage";

export interface SellerCatalogTabsProps {
  value: SellerCatalogTab;
  /** Abas já construídas; as demais aparecem desabilitadas. */
  available: SellerCatalogTab[];
  onChange: (tab: SellerCatalogTab) => void;
}
