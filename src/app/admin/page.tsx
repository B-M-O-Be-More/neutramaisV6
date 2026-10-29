"use client";

import { Stack } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import React from "react";
import { useTranslation } from "react-i18next";

import AdminKycQueue from "@/components/AdminKycQueue";
import AdminPanelHeader, {
  ADMIN_AVAILABLE_TABS,
} from "@/components/AdminPanelHeader";
import type { AdminTabKey } from "@/components/AdminTabs";
import AdminUsersTab from "@/components/AdminUsersTab";
import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import {
  useAdminKycQueue,
  type AdminKycQueueFilters,
  type UseAdminKycQueueReturn,
} from "@/hooks/useAdminKycQueue";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const INITIAL_FILTERS: AdminKycQueueFilters = {
  search: "",
  status: "",
  type: "",
  dateFrom: "",
  dateTo: "",
};

interface AdminPageProps {
  searchParams: Promise<{ tab?: string }>;
}

interface AdminContentProps {
  initialTab: AdminTabKey;
  filters: AdminKycQueueFilters;
  onFiltersChange: (filters: AdminKycQueueFilters) => void;
  queue: UseAdminKycQueueReturn;
}

function AdminContent({
  initialTab,
  filters,
  onFiltersChange,
  queue,
}: AdminContentProps) {
  const { i18n } = useTranslation();
  const router = useRouter();
  const [tab, setTab] = React.useState<AdminTabKey>(initialTab);

  // A aba fica na URL: voltar da página de uma organização reabre Usuários.
  const changeTab = (next: AdminTabKey) => {
    setTab(next);
    router.replace(next === "kyc" ? "/admin" : `/admin?tab=${next}`, {
      scroll: false,
    });
  };

  return (
    <Stack
      maxW="1280px"
      px={{ base: 4, md: "32px" }}
      py={{ base: 6, md: "32px" }}
      gap="24px"
    >
      <AdminPanelHeader
        pendingKyc={queue.indicators?.pending ?? null}
        active={tab}
        onTabChange={changeTab}
      />

      {tab === "kyc" && (
        <AdminKycQueue
          filters={filters}
          onFiltersChange={onFiltersChange}
          queue={queue}
        />
      )}

      {tab === "users" && <AdminUsersTab locale={i18n.language} />}
    </Stack>
  );
}

// Painel administrativo: destino do login para `admin_neutra` e `super_admin`.
// A fila fica no nível da página porque os indicadores dela alimentam também
// o card "KYC em fila", a aba e o contador da sidebar. `?tab=` abre uma aba.
export default function AdminPage({ searchParams }: AdminPageProps) {
  const { tab } = React.use(searchParams);
  const initialTab = ADMIN_AVAILABLE_TABS.find((key) => key === tab) ?? "kyc";
  const [filters, setFilters] =
    React.useState<AdminKycQueueFilters>(INITIAL_FILTERS);
  // A busca só vai para a API depois de uma pausa na digitação.
  const search = useDebouncedValue(filters.search, 300);
  const queue = useAdminKycQueue({ ...filters, search });

  return (
    <AuthenticatedLayout
      badges={{ kyc: queue.indicators?.pending ?? undefined }}
    >
      <AdminContent
        initialTab={initialTab}
        filters={filters}
        onFiltersChange={setFilters}
        queue={queue}
      />
    </AuthenticatedLayout>
  );
}
