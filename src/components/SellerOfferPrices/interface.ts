export interface SellerOfferPricesProps {
  offeringId: string;
  /** Moeda da oferta (uma só para todos os preços ativos). */
  currency: string;
  /** Locale dos valores e datas (ex.: "pt-BR"). */
  locale: string;
  /** `price:change` e oferta não arquivada. */
  canEdit: boolean;
  /** Um preço mudou: a oferta (preço projetado) precisa ser relida. */
  onChanged?: () => void;
}
