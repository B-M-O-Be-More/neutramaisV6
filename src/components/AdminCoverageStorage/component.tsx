"use client";

import { Button, Icon } from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuPencil } from "react-icons/lu";

import CoverageStorageUsage from "@/components/CoverageStorageUsage";
import StorageQuotaDialog from "@/components/StorageQuotaDialog";
import { useOrganizationStorage } from "@/hooks/useOrganizationStorage";

import { AdminCoverageStorageProps } from "./interface";

/**
 * Cota de armazenamento de cobertura de um Seller, na área admin. Só o
 * `super_admin` lê a cota de outra organização e a altera (até 1000 MB); a
 * geo-api registra quem alterou, quando, os valores e o motivo.
 */
export function AdminCoverageStorage({
  organizationId,
  organizationName,
  locale,
}: AdminCoverageStorageProps) {
  const { t } = useTranslation();
  const quota = useOrganizationStorage(organizationId);
  const [editing, setEditing] = React.useState(false);

  return (
    <>
      <CoverageStorageUsage
        storage={quota.storage}
        isLoading={quota.isLoading}
        error={quota.error}
        onReload={quota.reload}
        locale={locale}
        action={
          quota.storage && (
            <Button
              variant="outline"
              h="30px"
              px="12px"
              gap="6px"
              rounded="10px"
              borderColor="#C7D8FF"
              color="#1F5AFF"
              fontSize="12px"
              fontWeight={600}
              onClick={() => setEditing(true)}
            >
              <Icon as={LuPencil} boxSize="12px" />
              {t("CoverageStorage.quota.edit")}
            </Button>
          )
        }
      />

      <StorageQuotaDialog
        open={editing}
        onClose={() => setEditing(false)}
        quota={quota}
        organizationName={organizationName}
        locale={locale}
      />
    </>
  );
}
