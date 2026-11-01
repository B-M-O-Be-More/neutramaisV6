"use client";

import { useTranslation } from "react-i18next";

import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import SellerWithdraw from "@/components/SellerWithdraw";
import { SellerSessionProvider } from "@/contexts/SellerSessionContext";
import { currencyLocale } from "@/functions/currencyLocale";
import type { PayoutAccount } from "@/services/withdrawal.service";

// Nenhuma API lista as contas de recebimento ainda: o destino mostra o
// cadastro de uma nova conta.
const NO_ACCOUNTS: PayoutAccount[] = [];

function WithdrawContent() {
  const { i18n } = useTranslation();
  return (
    <SellerWithdraw
      accounts={NO_ACCOUNTS}
      walletHref="/seller/wallet"
      addAccountHref="/seller/wallet/payment-methods/new?type=pix"
      locale={currencyLocale(i18n.language)}
    />
  );
}

// Solicitar saque do seller (Figma 2215-23978): tela cheia, sem a navegação
// lateral, com o saldo da wallet-api no perfil Seller.
export default function SellerWithdrawPage() {
  return (
    <AuthenticatedLayout bare>
      <SellerSessionProvider requiredPermission={null}>
        <WithdrawContent />
      </SellerSessionProvider>
    </AuthenticatedLayout>
  );
}
