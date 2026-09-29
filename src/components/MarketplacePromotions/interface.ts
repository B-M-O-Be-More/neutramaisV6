/** Chaves das campanhas em destaque — casam com as chaves de i18n. */
export type MarketplacePromotionKey = "flashSale" | "news" | "highlight";

export interface MarketplacePromotionsProps {
  /** Destino do atalho "Ver todas". */
  seeAllHref?: string;
}
