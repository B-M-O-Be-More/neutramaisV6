"use client";

import { useTranslation } from "react-i18next";

import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import WalletOverview from "@/components/WalletOverview";
import { currencyLocale } from "@/functions/currencyLocale";

function WalletContent() {
  const { i18n } = useTranslation();
  return (
    <WalletOverview variant="buyer" locale={currencyLocale(i18n.language)} />
  );
}

// Carteira do buyer: saldo do crédito Neutra+, métodos de pagamento e
// histórico. A do seller (/seller/wallet) acrescenta os recebimentos.
export default function WalletPage() {
  return (
    <AuthenticatedLayout>
      <WalletContent />
    </AuthenticatedLayout>
  );
}
