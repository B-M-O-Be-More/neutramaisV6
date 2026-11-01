"use client";

import React from "react";
import { useTranslation } from "react-i18next";

import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import OrderDetailScreen from "@/components/OrderDetailScreen";
import { ProfileSessionProvider } from "@/contexts/ProfileSessionContext";

function BuyerOrderDetailContent({ orderId }: { orderId: string }) {
  const { t } = useTranslation();
  return (
    <OrderDetailScreen
      orderId={orderId}
      perspective="buyer"
      backHref="/dashboard"
      backLabel={t("OrderDetail.back.buyer")}
      contractsHref="/contracts"
    />
  );
}

// Detalhe de um pedido do buyer (Figma 2191-17812). A lista de pedidos do
// buyer ainda não existe: a volta é para o início. A orders-api recebe o
// token do perfil Buyer (POST /auth/context).
export default function BuyerOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = React.use(params);

  return (
    <AuthenticatedLayout>
      <ProfileSessionProvider profile="buyer">
        <BuyerOrderDetailContent orderId={orderId} />
      </ProfileSessionProvider>
    </AuthenticatedLayout>
  );
}
