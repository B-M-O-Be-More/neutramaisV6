"use client";

import { useTranslation } from "react-i18next";

import BuyerOrders from "@/components/BuyerOrders";
import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import { ProfileSessionProvider } from "@/contexts/ProfileSessionContext";
import { currencyLocale } from "@/functions/currencyLocale";

function BuyerOrdersContent() {
  const { i18n } = useTranslation();
  return <BuyerOrders locale={currencyLocale(i18n.language)} />;
}

// "Meus Pedidos" do buyer, aberto pelo atalho do dashboard. A orders-api
// recebe o token do perfil Buyer (POST /auth/context), como no detalhe.
export default function BuyerOrdersPage() {
  return (
    <AuthenticatedLayout>
      <ProfileSessionProvider profile="buyer">
        <BuyerOrdersContent />
      </ProfileSessionProvider>
    </AuthenticatedLayout>
  );
}
