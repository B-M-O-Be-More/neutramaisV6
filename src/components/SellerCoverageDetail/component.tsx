"use client";

import { Button, Grid, Skeleton, Stack, Text } from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";

import CoverageArchiveConfirm from "@/components/CoverageArchiveConfirm";
import type { CoverageGeoJson } from "@/components/CoverageMap";
import CoveragePrivacyNotice from "@/components/CoveragePrivacyNotice";
import CoverageStorageBar from "@/components/CoverageStorageBar";
import CoverageVersionHistory, {
  type CoverageVersionHistoryItem,
} from "@/components/CoverageVersionHistory";
import CoverageVersionMapCard from "@/components/CoverageVersionMapCard";
import CoverageVersionStats from "@/components/CoverageVersionStats";
import CoverageVersionUpload from "@/components/CoverageVersionUpload";
import { toaster } from "@/components/ui/toaster";
import { coverageGeometryStats } from "@/functions/coverageGeometryStats";
import { kmzFileName } from "@/functions/kmzFileNames";
import { useCoverageFileDetail } from "@/hooks/useCoverageFileDetail";
import { useCoverageFileLifecycle } from "@/hooks/useCoverageFileLifecycle";
import { useCoverageGeometry } from "@/hooks/useCoverageGeometry";
import { useCoverageVersionDownload } from "@/hooks/useCoverageVersionDownload";
import { useOrganizationStorage } from "@/hooks/useOrganizationStorage";

import { SellerCoverageDetailProps } from "./interface";

/** KMZ enviado nesta tela: a geometria lida no envio dispensa baixá-lo. */
interface UploadedVersion {
  versionId: string;
  geometry: CoverageGeoJson | null;
  sizeBytes: number;
}

const versionLabel = (versionId: string) =>
  kmzFileName(versionId) ?? `KMZ ${versionId.slice(0, 8)}`;

/**
 * Detalhe de uma cobertura (Figma 2074-63275; vazio 2074-64220): mapa e
 * regiões da versão ativa, histórico de versões (baixar, usar uma anterior,
 * excluir), upload de nova versão e estatísticas do KMZ atual.
 */
export function SellerCoverageDetail({
  organizationId,
  fileId,
  canUpload,
  locale,
  onBack,
}: SellerCoverageDetailProps) {
  const { t } = useTranslation();
  const detail = useCoverageFileDetail(organizationId, fileId);
  const storage = useOrganizationStorage(organizationId);
  const lifecycle = useCoverageFileLifecycle(organizationId, fileId);
  const downloads = useCoverageVersionDownload(organizationId, fileId);
  const [uploaded, setUploaded] = React.useState<UploadedVersion | null>(null);

  const { preview, activeVersion } = detail;
  const uploadedActive =
    uploaded && uploaded.versionId === activeVersion?.id ? uploaded : null;
  const geometry = useCoverageGeometry(
    organizationId,
    activeVersion,
    uploadedActive ? uploadedActive.geometry : undefined,
  );

  const stats = React.useMemo(
    () => (geometry.geometry ? coverageGeometryStats(geometry.geometry) : null),
    [geometry.geometry],
  );
  const activeSize = geometry.info?.sizeBytes ?? uploadedActive?.sizeBytes;
  const canManage = canUpload && !!preview && !preview.archived;

  const items: CoverageVersionHistoryItem[] = detail.versions.map(
    (version, index) => {
      const isActive = version.versionId === preview?.activeVersionId;
      return {
        versionId: version.versionId,
        number: detail.versions.length - index,
        label: versionLabel(version.versionId),
        createdAt: version.createdAt,
        isActive,
        sizeBytes: isActive ? activeSize : undefined,
        stats: isActive ? stats : undefined,
        offerCount: detail.offerCounts.get(version.versionId) ?? 0,
      };
    },
  );
  const activeItem = items.find((item) => item.isActive) ?? null;

  const handleRestore = async (versionId: string) => {
    if (!preview) return;
    const result = await lifecycle.restore(versionId, preview.previewRevision);
    if (result.ok) {
      toaster.create({
        type: "success",
        title: t("SellerCoverage.detail.toasts.restored", {
          name: versionLabel(versionId),
        }),
      });
      detail.reload();
    } else {
      toaster.create({ type: "error", title: t(result.errorKey) });
      // Preview velho: lê de novo para a próxima tentativa.
      detail.reload();
    }
  };

  const handleDownload = async (item: CoverageVersionHistoryItem) => {
    const name = /\.kmz$/i.test(item.label) ? item.label : `${item.label}.kmz`;
    const failure = await downloads.download(item.versionId, name);
    if (failure) toaster.create({ type: "error", title: t(failure) });
  };

  const handleArchive = async (replacementFileId?: string) => {
    if (!preview) return "SellerCoverage.detail.errors.actionFailed";
    const result = await lifecycle.archive(
      preview.previewRevision,
      replacementFileId,
    );
    if (!result.ok) {
      detail.reload();
      return result.errorKey;
    }
    toaster.create({
      type: "success",
      title: t("SellerCoverage.detail.toasts.archived", {
        name: activeItem?.label ?? "",
      }),
    });
    storage.reload();
    onBack();
    return null;
  };

  const header = (
    <Stack gap="20px">
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
          {t("SellerCoverage.detail.subtitle")}
        </Text>
      </Stack>
      <CoveragePrivacyNotice />
      <CoverageStorageBar storage={storage.storage} locale={locale} />
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
      {preview?.archived && (
        <Text
          role="note"
          px="16px"
          py="12px"
          bg="#FEF2F2"
          borderWidth="1px"
          borderColor="#FECACA"
          rounded="12px"
          color="#B91C1C"
          fontSize="12px"
          lineHeight="18px"
        >
          {t("SellerCoverage.detail.archivedNotice")}
        </Text>
      )}
    </Stack>
  );

  if (detail.isLoading || (!preview && !detail.error)) {
    return (
      <Stack gap="20px" aria-busy="true">
        {header}
        <Grid
          templateColumns={{ base: "1fr", lg: "minmax(0, 1fr) 551px" }}
          gap="26px"
        >
          <Skeleton h="320px" rounded="14px" />
          <Skeleton h="320px" rounded="14px" />
        </Grid>
      </Stack>
    );
  }

  if (!preview) {
    return (
      <Stack gap="20px">
        {header}
        <Stack
          align="center"
          gap="10px"
          py="32px"
          px="16px"
          bg="#FEF2F2"
          borderWidth="1px"
          borderColor="#FECACA"
          rounded="14px"
          textAlign="center"
        >
          <Text
            role="alert"
            color="#B91C1C"
            fontSize="13px"
            lineHeight="19.5px"
          >
            {t(detail.error ?? "SellerCoverage.detail.errors.failed")}
          </Text>
          <Stack direction="row" gap="8px">
            <Button
              variant="outline"
              size="xs"
              rounded="8px"
              borderColor="#FECACA"
              color="#B91C1C"
              onClick={detail.reload}
            >
              {t("SellerCoverage.list.retry")}
            </Button>
            <Button variant="plain" size="xs" color="#1F5AFF" onClick={onBack}>
              {t("SellerCoverage.detail.back")}
            </Button>
          </Stack>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack gap="20px">
      {header}
      <Grid
        templateColumns={{ base: "1fr", lg: "minmax(0, 1fr) 551px" }}
        gap="26px"
        alignItems="start"
      >
        <Stack gap="20px" minW={0}>
          <CoverageVersionMapCard
            geometry={geometry.geometry}
            isLoading={geometry.isLoading}
            error={geometry.error}
            regions={stats?.regions ?? []}
          />
          <CoverageVersionHistory
            items={items}
            locale={locale}
            canManage={canManage}
            restoringId={
              lifecycle.pending !== "archive" ? lifecycle.pending : null
            }
            downloadingId={downloads.downloadingId}
            onRestore={handleRestore}
            onDownload={handleDownload}
            archiveAction={
              canManage && activeItem ? (
                <CoverageArchiveConfirm
                  organizationId={organizationId}
                  fileId={fileId}
                  label={activeItem.label}
                  linkedOfferCount={preview.linkedOfferCount}
                  isPending={lifecycle.pending === "archive"}
                  onConfirm={handleArchive}
                />
              ) : undefined
            }
          />
        </Stack>
        <Stack gap="20px" minW={0}>
          <CoverageVersionUpload
            organizationId={organizationId}
            predecessorId={canManage ? preview.activeVersionId : null}
            canUpload={canManage}
            locale={locale}
            onUploaded={(result) => {
              setUploaded({
                versionId: result.version.id,
                geometry: result.geometry,
                sizeBytes: result.version.sizeBytes ?? 0,
              });
              toaster.create({
                type: "success",
                title: t("SellerCoverage.detail.toasts.uploaded", {
                  name: result.version.fileName ?? "",
                }),
              });
              detail.reload();
              storage.reload();
            }}
          />
          <CoverageVersionStats
            versionNumber={activeItem?.number ?? null}
            sizeBytes={activeSize}
            stats={stats}
            offerCount={detail.offerCounts.get(preview.activeVersionId) ?? 0}
            locale={locale}
          />
        </Stack>
      </Grid>
    </Stack>
  );
}
