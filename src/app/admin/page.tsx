"use client";

import { Stack, Text } from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";

import AdminKycQueue from "@/components/AdminKycQueue";
import AdminStats from "@/components/AdminStats";
import AdminTabs, { type AdminTabKey } from "@/components/AdminTabs";
import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import {
  useAdminKycQueue,
  type AdminKycQueueFilters,
  type UseAdminKycQueueReturn,
} from "@/hooks/useAdminKycQueue";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

// Valores do design, usados até existirem os endpoints de sellers ativos,
// volume e disputas. A fila de KYC e seus indicadores já vêm da API.
const PLACEHOLDER_STATS = {
  activeSellers: "2.418",
  volume30d: "R$ 12,4M",
  openDisputes: "7",
};

// Abas com conteúdo pronto; as demais aparecem desabilitadas.
const AVAILABLE_TABS: AdminTabKey[] = ["kyc"];

const INITIAL_FILTERS: AdminKycQueueFilters = {
  search: "",
  status: "",
  type: "",
  dateFrom: "",
  dateTo: "",
};

interface AdminContentProps {
  filters: AdminKycQueueFilters;
  onFiltersChange: (filters: AdminKycQueueFilters) => void;
  queue: UseAdminKycQueueReturn;
}

function AdminContent({ filters, onFiltersChange, queue }: AdminContentProps) {
  const { t } = useTranslation();
  const [tab, setTab] = React.useState<AdminTabKey>("kyc");
  const pending = queue.indicators?.pending ?? null;

  return (
    <Stack
      maxW="1280px"
      px={{ base: 4, md: "32px" }}
      py={{ base: 6, md: "32px" }}
      gap="24px"
    >
      <Stack gap="4px">
        <Text
          as="h1"
          color="#0F1729"
          fontSize="24px"
          fontWeight={800}
          lineHeight="34px"
        >
          {t("Admin.title")}
        </Text>
        <Text color="#8A9AB5" fontSize="13px" lineHeight="20px">
          {t("Admin.subtitle")}
        </Text>
      </Stack>

      <AdminStats data={{ ...PLACEHOLDER_STATS, kycQueue: pending }} />

      <AdminTabs
        active={tab}
        available={AVAILABLE_TABS}
        onChange={setTab}
        kycCount={pending}
      />

      {tab === "kyc" && (
        <AdminKycQueue
          filters={filters}
          onFiltersChange={onFiltersChange}
          queue={queue}
        />
      )}
    </Stack>
  );
}

// Painel administrativo: destino do login para `admin_neutra` e `super_admin`.
// A fila fica no nível da página porque os indicadores dela alimentam também
// o card "KYC em fila", a aba e o contador da sidebar.
export default function AdminPage() {
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
        filters={filters}
        onFiltersChange={setFilters}
        queue={queue}
      />
    </AuthenticatedLayout>
  );
}
