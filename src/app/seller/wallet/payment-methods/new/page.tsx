"use client";

import React from "react";

import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import WalletAddPaymentMethod from "@/components/WalletAddPaymentMethod";
import { SellerSessionProvider } from "@/contexts/SellerSessionContext";
import { PAYMENT_METHOD_TYPES } from "@/schemas/paymentMethod";

interface SellerNewPaymentMethodPageProps {
  searchParams: Promise<{ type?: string }>;
}

// Novo método de pagamento ou conta de recebimento (PIX) da carteira do
// seller. `?type=pix|card` escolhe o tipo ao abrir.
export default function SellerNewPaymentMethodPage({
  searchParams,
}: SellerNewPaymentMethodPageProps) {
  const { type } = React.use(searchParams);
  const initialType = PAYMENT_METHOD_TYPES.find((key) => key === type);

  return (
    <AuthenticatedLayout>
      <SellerSessionProvider>
        <WalletAddPaymentMethod
          backHref="/seller/wallet"
          initialType={initialType}
        />
      </SellerSessionProvider>
    </AuthenticatedLayout>
  );
}
