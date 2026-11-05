export interface SellerPaymentAccountCardProps {
  /** Organização do perfil Seller. */
  organizationId: string | null;
  /** Só o `seller_owner` inicia ou atualiza a conta no Stripe. */
  isOwner: boolean;
  /** E-mail sugerido para a conta no Stripe (o do usuário logado). */
  defaultEmail: string;
}
