"use client";

import { useTranslation } from "react-i18next";

import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import WalletTransactions from "@/components/WalletTransactions";
import { ProfileSessionProvider } from "@/contexts/ProfileSessionContext";
import { currencyLocale } from "@/functions/currencyLocale";

function TransactionsContent() {
  const { i18n } = useTranslation();
  return (
    <WalletTransactions
      backHref="/wallet"
      locale={currencyLocale(i18n.language)}
    />
  );
}

// Histórico completo da carteira do buyer (Figma 2208-35170), com o token do
// perfil Buyer.
export default function WalletTransactionsPage() {
  return (
    <AuthenticatedLayout>
      <ProfileSessionProvider profile="buyer">
        <TransactionsContent />
      </ProfileSessionProvider>
    </AuthenticatedLayout>
  );
}
