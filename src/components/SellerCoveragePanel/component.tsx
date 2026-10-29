"use client";

import { Flex, Grid, Icon, Stack, Text } from "@chakra-ui/react";
import React from "react";
import { Trans, useTranslation } from "react-i18next";
import { LuEye, LuLock } from "react-icons/lu";

import type { CoverageGeoJson } from "@/components/CoverageMap";
import CoverageStorageUsage from "@/components/CoverageStorageUsage";
import FormSellerCoverage from "@/components/Forms/FormSellerCoverage";
import SellerCoverageDetailsDialog from "@/components/SellerCoverageDetailsDialog";
import SellerCoverageList from "@/components/SellerCoverageList";
import { toaster } from "@/components/ui/toaster";
import { coverageVersionLabel } from "@/functions/coverageVersionLabel";
import { mergeVersions } from "@/functions/mergeCoverageVersions";
import { useCoverageFiles } from "@/hooks/useCoverageFiles";
import { useCoverageGeometry } from "@/hooks/useCoverageGeometry";
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
  // Enviadas nesta tela, com o nome e a geometria lidos do KMZ — dispensam
  // baixar o original para o mapa.
  const [saved, setSaved] = React.useState<
    { version: CoverageVersionSummary; geometry: CoverageGeoJson | null }[]
  >([]);
  const [openId, setOpenId] = React.useState<string | null>(null);
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

  const openVersion = versions.find((version) => version.id === openId) ?? null;
  const openSaved = saved.find((item) => item.version.id === openId);
  // Fora das enviadas nesta tela, o mapa vem do KMZ original baixado.
  const preview = useCoverageGeometry(
    organizationId,
    openVersion,
    openSaved ? openSaved.geometry : undefined,
  );

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

      <Flex
        align="flex-start"
        gap="12px"
        px="21px"
        py="17px"
        bg="#F3EEFF"
        borderWidth="1px"
        borderColor="#D3BFFD"
        rounded="14px"
      >
        <Icon as={LuEye} boxSize="15px" color="#8B5CF6" mt="2px" />
        <Stack gap="2px">
          <Text
            color="#8B5CF6"
            fontSize="13px"
            fontWeight={700}
            lineHeight="19.5px"
          >
            {t("SellerCoverage.privacy.title")}
          </Text>
          <Text color="#5B21B6" fontSize="12px" lineHeight="18px">
            <Trans
              i18nKey="SellerCoverage.privacy.text"
              components={{ strong: <strong /> }}
            />
          </Text>
        </Stack>
      </Flex>

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
          onDetails={(version) => setOpenId(version.id)}
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
                coverage,
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

      <SellerCoverageDetailsDialog
        version={
          openVersion && preview.info
            ? { ...openVersion, ...preview.info }
            : openVersion
        }
        geometry={preview.geometry}
        isLoadingMap={preview.isLoading}
        mapError={preview.error}
        offerCount={
          openVersion && offerCounts
            ? (offerCounts.get(openVersion.id) ?? 0)
            : null
        }
        locale={locale}
        onClose={() => setOpenId(null)}
      />
    </Stack>
  );
}
