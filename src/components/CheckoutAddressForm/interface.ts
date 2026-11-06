import type {
  AddressField,
  ShippingAddressDraft,
} from "@/functions/checkoutBody";

export interface CheckoutAddressFormProps {
  address: ShippingAddressDraft;
  onChange: (field: AddressField, value: string) => void;
  /** Campos inválidos a destacar (vazio enquanto o Buyer não tentou seguir). */
  invalid: AddressField[];
}
