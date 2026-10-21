"use client";

import { Stack } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import React from "react";

import AdminKycReview from "@/components/AdminKycReview";
import AuthenticatedLayout from "@/components/Layouts/Authenticated";

interface AdminKycReviewPageProps {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ start?: string }>;
}

// Revisão de KYC de uma organização (compliance-api). Chega da fila do /admin:
// "Ver documentos" abre só a solicitação; "Iniciar Revisão" chega com
// `?start=1` e inicia a revisão ao abrir.
export default function AdminKycReviewPage({
  params,
  searchParams,
}: AdminKycReviewPageProps) {
  const { organizationId } = React.use(params);
  const { start } = React.use(searchParams);
  const router = useRouter();
  const autoStart = start === "1";

  // Tira o `?start=1` da URL: recarregar a página não deve repetir a ação.
  const onAutoStartHandled = React.useCallback(() => {
    if (autoStart) router.replace(`/admin/kyc/${organizationId}`);
  }, [autoStart, organizationId, router]);

  return (
    <AuthenticatedLayout>
      <Stack
        maxW="1280px"
        px={{ base: 4, md: "32px" }}
        py={{ base: 6, md: "32px" }}
      >
        <AdminKycReview
          organizationId={organizationId}
          autoStart={autoStart}
          onAutoStartHandled={onAutoStartHandled}
        />
      </Stack>
    </AuthenticatedLayout>
  );
}
