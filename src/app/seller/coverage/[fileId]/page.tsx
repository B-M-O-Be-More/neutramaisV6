"use client";

import { Stack } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import React from "react";
import { useTranslation } from "react-i18next";

import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import SellerCatalogTabs, {
  type SellerCatalogTab,
} from "@/components/SellerCatalogTabs";
import SellerCoverageDetail from "@/components/SellerCoverageDetail";
import {
  SellerSessionProvider,
  useSellerSession,
} from "@/contexts/SellerSessionContext";
import { currencyLocale } from "@/functions/currencyLocale";
import { canUploadCoverage } from "@/functions/rolesToPersonas";

const AVAILABLE_TABS: SellerCatalogTab[] = ["catalog", "coverage"];

// A lista de coberturas é a aba "Cobertura" do catálogo.
const TAB_HREFS: Record<SellerCatalogTab, string> = {
  catalog: "/seller/offers",
  coverage: "/seller/offers?tab=coverage",
};

function SellerCoverageDetailContent({ fileId }: { fileId: string }) {
  const { i18n } = useTranslation();
  const router = useRouter();
  const { organizationId, context } = useSellerSession();

  return (
    <Stack
      maxW="1280px"
      px={{ base: 4, md: "32px" }}
      py={{ base: 6, md: "28px" }}
      gap="20px"
    >
      <SellerCatalogTabs
        value="coverage"
        available={AVAILABLE_TABS}
        onChange={(tab) => router.push(TAB_HREFS[tab])}
      />
      <SellerCoverageDetail
        organizationId={organizationId}
        fileId={fileId}
        canUpload={canUploadCoverage(context?.roles ?? [])}
        locale={currencyLocale(i18n.language)}
        onBack={() => router.push(TAB_HREFS.coverage)}
      />
    </Stack>
  );
}

// Detalhe de uma cobertura do seller (Figma 2074-63275): versões do KMZ,
// upload de nova versão e estatísticas.
export default function SellerCoverageDetailPage({
  params,
}: {
  params: Promise<{ fileId: string }>;
}) {
  const { fileId } = React.use(params);

  return (
    <AuthenticatedLayout>
      <SellerSessionProvider>
        <SellerCoverageDetailContent fileId={fileId} />
      </SellerSessionProvider>
    </AuthenticatedLayout>
  );
}
