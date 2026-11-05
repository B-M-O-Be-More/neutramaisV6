import type { Control, FieldErrors } from "react-hook-form";

import type { SellerOfferValues } from "@/schemas/sellerOffer";

export interface SellerOfferLocationFieldProps {
  control: Control<SellerOfferValues>;
  errors: FieldErrors<SellerOfferValues>;
}
