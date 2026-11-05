import type { FieldErrors, UseFormRegister } from "react-hook-form";

import type { SellerOfferValues } from "@/schemas/sellerOffer";

export interface SellerOfferInfraFieldsProps {
  register: UseFormRegister<SellerOfferValues>;
  errors: FieldErrors<SellerOfferValues>;
}
