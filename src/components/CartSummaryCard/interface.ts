export interface CartSummaryCardProps {
  /** Total das linhas que podem seguir, por moeda (centavos). */
  subtotals: Map<string, number>;
  /** Crédito Neutra+ abatido (centavos, na moeda do carrinho). */
  creditMinor: number;
  /** Há produto físico: o frete é calculado no pagamento. */
  hasPhysical: boolean;
  locale: string;
  /** Aviso acima do botão (ex.: moedas diferentes, itens com problema). */
  notice?: string;
  canCheckout: boolean;
  onCheckout: () => void;
}
