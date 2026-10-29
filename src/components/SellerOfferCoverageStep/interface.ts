import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";

import type { SellerOfferValues } from "@/schemas/sellerOffer";

export interface SellerOfferCoverageStepProps {
  control: Control<SellerOfferValues>;
  register: UseFormRegister<SellerOfferValues>;
  errors: FieldErrors<SellerOfferValues>;
  /** Organização do seller — dona das versões de KMZ. */
  organizationId: string | null;
  /**
   * Versão já vinculada à oferta (edição). A geo-api não lista versões: ela
   * é buscada pelo id para continuar visível no seletor.
   */
  boundVersionId?: string | null;
  /** Idioma para datas e tamanhos (ex.: "pt-BR"). */
  locale: string;
}
