import type { Control, FieldErrors } from "react-hook-form";

import type { OfferCategoryPanelTone } from "@/components/OfferCategoryPanel";
import type { SellerOfferValues } from "@/schemas/sellerOffer";

export interface SellerOfferAttributesFieldsProps {
  control: Control<SellerOfferValues>;
  errors: FieldErrors<SellerOfferValues>;
  /** Cores da categoria escolhida (o comportamento é o mesmo em todas). */
  tone: OfferCategoryPanelTone;
}
