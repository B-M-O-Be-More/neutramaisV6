"use client";

import { useTranslation } from "react-i18next";

import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import WalletTransactions from "@/components/WalletTransactions";
import { SellerSessionProvider } from "@/contexts/SellerSessionContext";
import { currencyLocale } from "@/functions/currencyLocale";

function SellerTransactionsContent() {
  const { i18n } = useTranslation();
  return (
    <WalletTransactions
      backHref="/seller/wallet"
      locale={currencyLocale(i18n.language)}
    />
  );
}

// Histórico completo da carteira do seller (Figma 2208-35170).
export default function SellerWalletTransactionsPage() {
  return (
    <AuthenticatedLayout>
      <SellerSessionProvider>
        <SellerTransactionsContent />
      </SellerSessionProvider>
    </AuthenticatedLayout>
  );
}
