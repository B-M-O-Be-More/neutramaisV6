"use client";

import { Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

import AdminStats from "@/components/AdminStats";
import AdminTabs, { type AdminTabKey } from "@/components/AdminTabs";

import { AdminPanelHeaderProps } from "./interface";

// Valores do design, usados até existirem os endpoints de sellers ativos,
// volume e disputas. A fila de KYC e seus indicadores já vêm da API.
const PLACEHOLDER_STATS = {
  activeSellers: "2.418",
  volume30d: "R$ 12,4M",
  openDisputes: "7",
};

// Abas com conteúdo pronto; as demais aparecem desabilitadas.
export const ADMIN_AVAILABLE_TABS: AdminTabKey[] = ["kyc", "users"];

/**
 * Topo do painel administrativo: título, indicadores e abas. Comum ao painel
 * (`/admin`) e às páginas que abrem dentro de uma aba, como a da organização.
 */
export function AdminPanelHeader({
  pendingKyc,
  active,
  onTabChange,
}: AdminPanelHeaderProps) {
  const { t } = useTranslation();

  return (
    <>
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

      <AdminStats data={{ ...PLACEHOLDER_STATS, kycQueue: pendingKyc }} />

      <AdminTabs
        active={active}
        available={ADMIN_AVAILABLE_TABS}
        onChange={onTabChange}
        kycCount={pendingKyc}
      />
    </>
  );
}
