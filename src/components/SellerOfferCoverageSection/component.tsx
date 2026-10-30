"use client";

import { Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuCircleAlert, LuCircleCheck, LuLink } from "react-icons/lu";

import CoverageMap, { type CoverageGeoJson } from "@/components/CoverageMap";
import CoverageScopeDialog from "@/components/CoverageScopeDialog";
import KmzVersionPicker from "@/components/KmzVersionPicker";
import { toaster } from "@/components/ui/toaster";
import { mergeVersions } from "@/functions/mergeCoverageVersions";
import { useCoverageFiles } from "@/hooks/useCoverageFiles";
import { useCoverageGeometry } from "@/hooks/useCoverageGeometry";
import { useCoverageVersion } from "@/hooks/useCoverageVersion";
import { useKmzUpload } from "@/hooks/useKmzUpload";
import type { CoverageVersionSummary } from "@/services/geoCoverage.service";

import { SellerOfferCoverageSectionProps } from "./interface";

const NOTICE_STYLES = {
  success: { bg: "#EDFBF5", border: "#A7F3D0", color: "#047857" },
  error: { bg: "#FEF2F2", border: "#FECACA", color: "#B91C1C" },
} as const;

/**
 * Área de cobertura da oferta já criada (Conectividade e Infra Física): mapa,
 * KMZ da organização (ou um novo envio), recorte público e o botão próprio
 * "Confirmar cobertura", que vincula na hora — com as localidades de
 * atendimento (`coverageNetworkPoints`). "Salvar alterações" não leva a cobertura.
 *
 * As versões vêm dos arquivos da organização na geo-api (`/coverageFile`,
 * `activeVersionId` de cada um) e dos KMZs enviados aqui. A geo-api não
 * devolve a geometria: o mapa lê o KMZ enviado ou, para os anteriores, o
 * original baixado.
 */
export function SellerOfferCoverageSection({
  editor,
  organizationId,
  mapLocations,
  locale,
}: SellerOfferCoverageSectionProps) {
  const { t } = useTranslation();
  const { versionId, boundVersionId, scope, notice, isDirty, isConfirming } =
    editor;
  const noticeStyle = notice ? NOTICE_STYLES[notice.tone] : null;

  const { upload, isUploading } = useKmzUpload(organizationId);
  const [uploadError, setUploadError] = React.useState<string>();
  // KMZs enviados nesta tela, com a geometria lida do arquivo.
  const [uploaded, setUploaded] = React.useState<
    { version: CoverageVersionSummary; geometry: CoverageGeoJson | null }[]
  >([]);
  // KMZs já enviados pela organização (sobrevivem ao recarregar).
  const files = useCoverageFiles(organizationId);
  const listed = React.useMemo(
    () => mergeVersions(uploaded, files.versions),
    [uploaded, files.versions],
  );
  const [isScopeOpen, setIsScopeOpen] = React.useState(false);

  // A versão vinculada segue no seletor, mesmo quando não é mais a ativa do
  // arquivo.
  const boundListed = listed.some((version) => version.id === boundVersionId);
  const bound = useCoverageVersion(
    boundVersionId && !boundListed ? boundVersionId : null,
  );
  const selectable =
    bound.version && !boundListed ? [...listed, bound.version] : listed;

  // Mapa: a geometria do KMZ enviado aqui ou a do original baixado.
  const selectedVersion =
    selectable.find((version) => version.id === versionId) ?? null;
  const selectedUpload = uploaded.find((item) => item.version.id === versionId);
  const preview = useCoverageGeometry(
    organizationId,
    selectedVersion,
    selectedUpload ? selectedUpload.geometry : undefined,
  );
  const geometry = preview.geometry;
  // Tamanho e contagens do original baixado entram no item escolhido.
  const versions = preview.info
    ? selectable.map((version) =>
        version.id === versionId ? { ...version, ...preview.info } : version,
      )
    : selectable;

  const status = isDirty
    ? { color: "#D97706", text: t("SellerOfferCoverage.pending") }
    : boundVersionId
      ? { color: "#8A9AB5", text: t("SellerOfferCoverage.upToDate") }
      : { color: "#D97706", text: t("SellerOfferCoverage.missing") };

  return (
    <Stack
      as="section"
      aria-labelledby="offer-coverage-title"
      gap="16px"
      p="17px"
      bg="#F8FAFF"
      borderWidth="1px"
      borderColor="#DCE6FF"
      rounded="14px"
    >
      <Flex align="flex-start" justify="space-between" gap="12px" wrap="wrap">
        <Stack gap="2px">
          <Text
            id="offer-coverage-title"
            as="h3"
            color="#0F1729"
            fontSize="15px"
            fontWeight={700}
            lineHeight="22px"
          >
            {t("SellerOfferCoverage.title")}
          </Text>
          <Text color="#8A9AB5" fontSize="12px" lineHeight="18px">
            {t("SellerOfferCoverage.subtitle")}
          </Text>
        </Stack>
        {/* O recorte é sobre a área de um KMZ: exige a versão escolhida e,
            com vínculo, o recorte salvo já carregado. */}
        <Button
          type="button"
          disabled={!versionId || isConfirming || editor.isLoadingScope}
          onClick={() => setIsScopeOpen(true)}
          h="40px"
          px="12px"
          rounded="14px"
          bg="#1F5AFF"
          color="white"
          fontSize="14px"
          fontWeight={700}
          _disabled={{ opacity: 0.6, cursor: "not-allowed" }}
        >
          {t("SellerOfferCreate.coverage.chooseCoverage")}
        </Button>
      </Flex>

      <CoverageMap
        geometry={geometry}
        locations={mapLocations}
        publicGeometry={scope.publicGeometry}
        label={t("SellerOfferCreate.coverage.mapTitle")}
        isLoading={!!versionId && !geometry && preview.isLoading}
      />
      {versionId && (
        <Text
          role={editor.isLoadingScope ? "status" : undefined}
          color={editor.scopeError ? "#EF4444" : "#5A6478"}
          fontSize="12px"
          lineHeight="18px"
        >
          {editor.isLoadingScope
            ? t("SellerOfferCoverage.loadingScope")
            : editor.scopeError
              ? t(editor.scopeError)
              : t(`SellerOfferCreate.coverageScope.selected.${scope.mode}`)}
        </Text>
      )}
      {editor.scopeLoadError && (
        <Text role="alert" color="#D97706" fontSize="12px" lineHeight="18px">
          {t(editor.scopeLoadError)}
        </Text>
      )}
      {versionId && !geometry && !preview.isLoading && (
        <Text role="status" color="#A0ABB8" fontSize="11px" lineHeight="16.5px">
          {t(preview.error ?? "SellerOfferCreate.coverage.previewUnavailable")}
        </Text>
      )}
      <CoverageScopeDialog
        open={isScopeOpen}
        coverage={geometry}
        value={scope}
        onClose={() => setIsScopeOpen(false)}
        onConfirm={(next) => {
          editor.setScope(next);
          setIsScopeOpen(false);
        }}
      />

      <KmzVersionPicker
        versions={versions}
        isLoadingList={files.isLoading}
        selectedId={versionId || null}
        boundId={boundVersionId}
        onSelect={editor.selectVersion}
        isUploading={isUploading}
        uploadError={uploadError}
        locale={locale}
        onUpload={async (file) => {
          setUploadError(undefined);
          const result = await upload(file);
          if (!result.ok) {
            setUploadError(t(result.errorKey));
            return;
          }
          setUploaded((current) => [
            result,
            ...current.filter((item) => item.version.id !== result.version.id),
          ]);
          files.reload();
          editor.selectVersion(result.version.id);
          toaster.create({
            type: "success",
            title: t("SellerOfferCreate.kmz.uploaded", { name: file.name }),
          });
        }}
      />

      {notice && noticeStyle && (
        <Stack
          gap="4px"
          px="14px"
          py="11px"
          bg={noticeStyle.bg}
          borderWidth="1px"
          borderColor={noticeStyle.border}
          rounded="12px"
          role={notice.tone === "success" ? "status" : "alert"}
        >
          {notice.messages.map((key) => (
            <Flex key={key} align="flex-start" gap="8px">
              <Icon
                as={notice.tone === "success" ? LuCircleCheck : LuCircleAlert}
                boxSize="13px"
                color={noticeStyle.color}
                mt="2px"
                flexShrink={0}
              />
              <Text color={noticeStyle.color} fontSize="12px" lineHeight="18px">
                {t(key)}
              </Text>
            </Flex>
          ))}
        </Stack>
      )}

      <Flex
        align={{ base: "stretch", sm: "center" }}
        direction={{ base: "column", sm: "row" }}
        justify="space-between"
        gap="12px"
      >
        <Stack gap="2px">
          <Text color={status.color} fontSize="12px" lineHeight="18px">
            {status.text}
          </Text>
          {editor.pointsError && (
            <Text
              role="alert"
              color="#EF4444"
              fontSize="12px"
              lineHeight="18px"
            >
              {t(editor.pointsError)}
            </Text>
          )}
        </Stack>
        <Button
          type="button"
          loading={isConfirming}
          loadingText={t("SellerOfferCoverage.confirming")}
          disabled={!editor.canConfirm}
          onClick={() => void editor.confirm()}
          h="40px"
          px="18px"
          gap="8px"
          rounded="12px"
          bg="#1F5AFF"
          color="white"
          fontSize="13px"
          fontWeight={700}
          flexShrink={0}
          _hover={{ bg: "#1A4FE0" }}
          _disabled={{ opacity: 0.5, cursor: "not-allowed" }}
        >
          <Icon as={LuLink} boxSize="14px" />
          {t("SellerOfferCoverage.confirm")}
        </Button>
      </Flex>
    </Stack>
  );
}
