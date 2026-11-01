"use client";

import { Stack } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import React from "react";
import { useTranslation } from "react-i18next";

import AdminOrganizationDetail from "@/components/AdminOrganizationDetail";
import AdminPanelHeader from "@/components/AdminPanelHeader";
import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import RequirePermission from "@/components/RequirePermission";
import { useAdminKycQueue } from "@/hooks/useAdminKycQueue";

interface AdminOrganizationPageProps {
  params: Promise<{ organizationId: string }>;
}

interface AdminOrganizationAreaProps {
  organizationId: string;
  /** Pendentes da fila, para o contador da sidebar (fora desta árvore). */
  onPendingChange: (pending: number | undefined) => void;
}

// Só os indicadores da fila importam aqui (cards, aba e sidebar).
const NO_FILTERS = {
  search: "",
  status: "",
  type: "",
  dateFrom: "",
  dateTo: "",
} as const;

// A fila só é consultada aqui dentro, depois do RequirePermission: quem não é
// admin não chega a disparar o GET /admin/kyc/queue.
function AdminOrganizationArea({
  organizationId,
  onPendingChange,
}: AdminOrganizationAreaProps) {
  const { i18n } = useTranslation();
  const router = useRouter();
  const queue = useAdminKycQueue(NO_FILTERS);
  const pending = queue.indicators?.pending ?? null;

  React.useEffect(() => {
    onPendingChange(pending ?? undefined);
  }, [onPendingChange, pending]);

  return (
    <Stack
      maxW="1280px"
      px={{ base: 4, md: "32px" }}
      py={{ base: 6, md: "32px" }}
      gap="24px"
    >
      <AdminPanelHeader
        pendingKyc={pending}
        active="users"
        onTabChange={(tab) =>
          router.push(tab === "kyc" ? "/admin" : `/admin?tab=${tab}`)
        }
      />
      <AdminOrganizationDetail
        organizationId={organizationId}
        locale={i18n.language}
      />
    </Stack>
  );
}

// Página de uma organização, aberta pela ação da aba Usuários. Fica dentro
// do painel: trocar de aba volta para o `/admin` na aba escolhida. Só para
// admin da plataforma.
export default function AdminOrganizationPage({
  params,
}: AdminOrganizationPageProps) {
  const { organizationId } = React.use(params);
  const [pending, setPending] = React.useState<number | undefined>();

  return (
    <AuthenticatedLayout badges={{ kyc: pending }}>
      <RequirePermission role="admin">
        <AdminOrganizationArea
          organizationId={organizationId}
          onPendingChange={setPending}
        />
      </RequirePermission>
    </AuthenticatedLayout>
  );
}
