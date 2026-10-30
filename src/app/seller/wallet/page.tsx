"use client";

import { useTranslation } from "react-i18next";

import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import WalletOverview from "@/components/WalletOverview";
import { SellerSessionProvider } from "@/contexts/SellerSessionContext";
import { currencyLocale } from "@/functions/currencyLocale";

function SellerWalletContent() {
  const { i18n } = useTranslation();
  return (
    <WalletOverview variant="seller" locale={currencyLocale(i18n.language)} />
  );
}

// Carteira do seller (Figma 2250-21984): a do buyer mais o aviso de
// recebimentos, antecipação/payout e as contas de recebimento.
export default function SellerWalletPage() {
  return (
    <AuthenticatedLayout>
      <SellerSessionProvider>
        <SellerWalletContent />
      </SellerSessionProvider>
    </AuthenticatedLayout>
  );
}
