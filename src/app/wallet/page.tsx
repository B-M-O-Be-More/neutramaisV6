"use client";

import { useTranslation } from "react-i18next";

import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import WalletOverview from "@/components/WalletOverview";
import { ProfileSessionProvider } from "@/contexts/ProfileSessionContext";
import { currencyLocale } from "@/functions/currencyLocale";

function WalletContent() {
  const { i18n } = useTranslation();
  return (
    <WalletOverview variant="buyer" locale={currencyLocale(i18n.language)} />
  );
}

// Carteira do buyer: saldo do crédito Neutra+, métodos de pagamento e
// histórico. A do seller (/seller/wallet) acrescenta os recebimentos. A
// wallet-api recebe o token do perfil Buyer (POST /auth/context), não o do
// login: o perfil não mistura permissões de Buyer e Seller.
export default function WalletPage() {
  return (
    <AuthenticatedLayout>
      <ProfileSessionProvider profile="buyer">
        <WalletContent />
      </ProfileSessionProvider>
    </AuthenticatedLayout>
  );
}
