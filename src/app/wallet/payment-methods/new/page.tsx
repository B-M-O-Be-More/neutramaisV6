"use client";

import React from "react";

import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import WalletAddPaymentMethod from "@/components/WalletAddPaymentMethod";
import { PAYMENT_METHOD_TYPES } from "@/schemas/paymentMethod";

interface NewPaymentMethodPageProps {
  searchParams: Promise<{ type?: string }>;
}

// Novo método de pagamento da carteira do buyer (Figma 2208-37661 /
// 2215-20243). `?type=card` abre no cartão; o padrão é PIX.
export default function NewPaymentMethodPage({
  searchParams,
}: NewPaymentMethodPageProps) {
  const { type } = React.use(searchParams);
  const initialType = PAYMENT_METHOD_TYPES.find((key) => key === type);

  return (
    <AuthenticatedLayout>
      <WalletAddPaymentMethod backHref="/wallet" initialType={initialType} />
    </AuthenticatedLayout>
  );
}
