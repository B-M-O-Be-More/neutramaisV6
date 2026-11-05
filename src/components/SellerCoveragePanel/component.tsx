"use client";

import { Flex, Grid, Icon, Stack, Text } from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuLock } from "react-icons/lu";

import CoveragePrivacyNotice from "@/components/CoveragePrivacyNotice";
import CoverageStorageUsage from "@/components/CoverageStorageUsage";
import FormSellerCoverage from "@/components/Forms/FormSellerCoverage";
import SellerCoverageList from "@/components/SellerCoverageList";
import { toaster } from "@/components/ui/toaster";
import { coverageVersionLabel } from "@/functions/coverageVersionLabel";
import { mergeVersions } from "@/functions/mergeCoverageVersions";
import { useCoverageFiles } from "@/hooks/useCoverageFiles";
import { useOrganizationOfferings } from "@/hooks/useOrganizationOfferings";
import { useOrganizationStorage } from "@/hooks/useOrganizationStorage";
import type { CoverageVersionSummary } from "@/services/geoCoverage.service";

import { SellerCoveragePanelProps } from "./interface";

// Teto da listagem de ofertas da marketplace-api: conta as vinculadas a cada
// cobertura numa só página.
const OFFERINGS_PAGE = { offset: 0, limit: 200 };

/**
 * Aba "Cobertura" do catálogo do seller (Figma 2664-56660): coberturas
 * cadastradas à esquerda e o cadastro de uma nova (upload de KMZ) à direita.
 * "Detalhes" abre a página da cobertura (`/seller/coverage/{fileId}`).
 */
export function SellerCoveragePanel({
  organizationId,
  canUpload,
  locale,
}: SellerCoveragePanelProps) {
  const { t } = useTranslation();
  const {
    offerings,
    isLoading: offeringsLoading,
    hasError: offeringsError,
  } = useOrganizationOfferings(OFFERINGS_PAGE);
  // Coberturas da organização na geo-api (sobrevivem ao recarregar).
  const files = useCoverageFiles(organizationId);
  // Enviadas nesta tela, com o nome e as contagens lidos do KMZ, até a
  // listagem da geo-api trazê-las.
  const [saved, setSaved] = React.useState<
    { version: CoverageVersionSummary }[]
  >([]);
  const storage = useOrganizationStorage(organizationId);

  const versions = React.useMemo(
    () => mergeVersions(saved, files.versions),
    [saved, files.versions],
  );

  const offerCounts = React.useMemo(() => {
    if (offeringsLoading || offeringsError) return null;
    const counts = new Map<string, number>();
    for (const offering of offerings) {
      if (!offering.coverageVersionId) continue;
      counts.set(
        offering.coverageVersionId,
        (counts.get(offering.coverageVersionId) ?? 0) + 1,
      );
    }
    return counts;
  }, [offerings, offeringsLoading, offeringsError]);

  return (
    <Stack gap="20px">
      <Flex
        align="flex-start"
        justify="space-between"
        direction={{ base: "column", md: "row" }}
        gap="12px"
      >
        <Stack gap="4px">
          <Text
            as="h1"
            color="#0F1729"
            fontSize="24px"
            fontWeight={800}
            lineHeight="36px"
          >
            {t("SellerCoverage.title")}
          </Text>
          <Text color="#8A9AB5" fontSize="14px" lineHeight="21px">
            {t("SellerCoverage.subtitle")}
          </Text>
        </Stack>
        <Flex
          align="center"
          gap="6px"
          px="17px"
          py="11px"
          flexShrink={0}
          bg="#EEF3FF"
          borderWidth="1px"
          borderColor="#C7D8FF"
          rounded="14px"
        >
          <Icon as={LuLock} boxSize="14px" color="#1F5AFF" />
          <Text
            color="#1F5AFF"
            fontSize="13px"
            fontWeight={700}
            lineHeight="19.5px"
          >
            {t("SellerCoverage.ownerOnly")}
          </Text>
        </Flex>
      </Flex>

      <CoveragePrivacyNotice />

      {!canUpload && (
        <Text
          role="note"
          px="16px"
          py="12px"
          bg="#FFFBEB"
          borderWidth="1px"
          borderColor="#FDE68A"
          rounded="12px"
          color="#92400E"
          fontSize="12px"
          lineHeight="18px"
        >
          {t("SellerCoverage.notOwner")}
        </Text>
      )}

      <Grid
        templateColumns={{ base: "1fr", lg: "minmax(0, 1fr) 551px" }}
        gap="26px"
        alignItems="start"
      >
        <SellerCoverageList
          versions={versions}
          isLoading={files.isLoading}
          error={files.error ? t(files.error) : null}
          onRetry={files.reload}
          offerCounts={offerCounts}
          locale={locale}
          detailsHref={(version) =>
            `/seller/coverage/${encodeURIComponent(version.logicalFileId)}`
          }
        />
        <Stack gap="20px">
          <CoverageStorageUsage
            storage={storage.storage}
            isLoading={storage.isLoading}
            error={storage.error}
            onReload={storage.reload}
            locale={locale}
          />
          <FormSellerCoverage
            organizationId={organizationId}
            canUpload={canUpload}
            locale={locale}
            onSaved={(coverage) => {
              setSaved((current) => [
                { version: coverage.version },
                ...current.filter(
                  (item) => item.version.id !== coverage.version.id,
                ),
              ]);
              // O KMZ novo entrou no consumo e na lista da geo-api.
              storage.reload();
              files.reload();
              toaster.create({
                type: "success",
                title: t("SellerCoverage.toasts.saved", {
                  name: coverageVersionLabel(coverage.version),
                }),
              });
            }}
          />
        </Stack>
      </Grid>
    </Stack>
  );
}
