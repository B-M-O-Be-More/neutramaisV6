export interface SellerCoveragePanelProps {
  /** Organização do seller (dona das versões de KMZ e das ofertas). */
  organizationId: string | null;
  /** Só o Dono sobe KMZ. */
  canUpload: boolean;
  /** Idioma para datas e tamanhos (ex.: "pt-BR"). */
  locale: string;
}
