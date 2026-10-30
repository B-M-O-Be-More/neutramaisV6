import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";

import type { UseOfferingCoverageEditorReturn } from "@/hooks/useOfferingCoverageEditor";
import type { SellerOfferValues } from "@/schemas/sellerOffer";

export interface SellerOfferCoverageStepProps {
  control: Control<SellerOfferValues>;
  register: UseFormRegister<SellerOfferValues>;
  errors: FieldErrors<SellerOfferValues>;
  /** Organização do seller — dona dos KMZs. */
  organizationId: string | null;
  /**
   * Área de cobertura da oferta já criada (edição). Sem ela (criação), as
   * categorias com KMZ mostram o aviso de que a cobertura vem depois.
   */
  coverageEditor?: UseOfferingCoverageEditorReturn;
  /** Idioma para datas e tamanhos (ex.: "pt-BR"). */
  locale: string;
}
