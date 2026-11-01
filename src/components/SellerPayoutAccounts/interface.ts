import type { PayoutAccount } from "@/services/withdrawal.service";

export interface SellerPayoutAccountsProps {
  /** Contas cadastradas; vazia enquanto não há API de contas. */
  accounts: PayoutAccount[];
  /** Cadastro de uma nova conta. */
  addHref: string;
}
