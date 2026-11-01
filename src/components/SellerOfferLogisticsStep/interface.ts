import type { Control, FieldErrors, UseFormSetValue } from "react-hook-form";

import type { SellerOfferValues } from "@/schemas/sellerOffer";

export interface SellerOfferLogisticsStepProps {
  control: Control<SellerOfferValues>;
  errors: FieldErrors<SellerOfferValues>;
  /** Preenche medidas e peso pelos tamanhos prontos e pelo peso cubado. */
  setValue: UseFormSetValue<SellerOfferValues>;
  locale: string;
}
