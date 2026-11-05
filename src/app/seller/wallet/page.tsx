"use client";

import { useTranslation } from "react-i18next";

import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import SellerPaymentAccountCard from "@/components/SellerPaymentAccountCard";
import WalletOverview from "@/components/WalletOverview";
import {
  SellerSessionProvider,
  useSellerSession,
} from "@/contexts/SellerSessionContext";
import { useSession } from "@/contexts/SessionContext";
import { currencyLocale } from "@/functions/currencyLocale";

function SellerWalletContent() {
  const { i18n } = useTranslation();
  const { context, organizationId } = useSellerSession();
  const { profile } = useSession();
  return (
    <WalletOverview
      variant="seller"
      locale={currencyLocale(i18n.language)}
      // Conta Stripe da organização: o papel vem do perfil Seller; o e-mail
      // sugerido, do usuário logado.
      paymentAccount={
        <SellerPaymentAccountCard
          organizationId={organizationId}
          isOwner={!!context?.roles.includes("seller_owner")}
          defaultEmail={profile?.email ?? ""}
        />
      }
    />
  );
}

// Carteira do seller (Figma 2250-21984): a do buyer mais o aviso de
// recebimentos, antecipação/payout, a conta de recebimento Stripe e as
// contas de recebimento. A wallet-api recebe o token do perfil Seller; quem
// não tem `wallet:read` vê o aviso dela, sem exigir a permissão da geo-api.
export default function SellerWalletPage() {
  return (
    <AuthenticatedLayout>
      <SellerSessionProvider requiredPermission={null}>
        <SellerWalletContent />
      </SellerSessionProvider>
    </AuthenticatedLayout>
  );
}
