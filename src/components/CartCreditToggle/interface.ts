export interface CartCreditToggleProps {
  /** Saldo livre na moeda do carrinho (centavos); null sem saldo lido. */
  availableMinor: number | null;
  currency: string;
  locale: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}
