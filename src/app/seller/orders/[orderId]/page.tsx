"use client";

import React from "react";
import { useTranslation } from "react-i18next";

import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import OrderDetailScreen from "@/components/OrderDetailScreen";
import { SellerSessionProvider } from "@/contexts/SellerSessionContext";

function SellerOrderDetailContent({ orderId }: { orderId: string }) {
  const { t } = useTranslation();
  return (
    <OrderDetailScreen
      orderId={orderId}
      perspective="seller"
      backHref="/seller/orders"
      backLabel={t("OrderDetail.back.seller")}
    />
  );
}

// Detalhe de um pedido recebido (Figma 2191-17812), aberto pela caixa de
// entrada. A orders-api recebe o token do perfil Seller, como na lista.
export default function SellerOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = React.use(params);

  return (
    <AuthenticatedLayout>
      <SellerSessionProvider requiredPermission={null}>
        <SellerOrderDetailContent orderId={orderId} />
      </SellerSessionProvider>
    </AuthenticatedLayout>
  );
}
