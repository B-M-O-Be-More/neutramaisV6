"use client";

import { Box, Button, Flex, Icon, Input, Stack, Text } from "@chakra-ui/react";
import React from "react";
import { Controller, useController, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { LuFileText, LuShield } from "react-icons/lu";

import CoverageMap, { type CoverageGeoJson } from "@/components/CoverageMap";
import CoverageScopeDialog from "@/components/CoverageScopeDialog";
import KmzVersionPicker from "@/components/KmzVersionPicker";
import OfferCategoryPicker from "@/components/OfferCategoryPicker";
import SellerOfferLocationField from "@/components/SellerOfferLocationField";
import { toaster } from "@/components/ui/toaster";
import { offerCategory } from "@/data/offerCategories";
import { mergeVersions } from "@/functions/mergeCoverageVersions";
import { parseDecimal } from "@/functions/parseDecimal";
import { useCoverageFiles } from "@/hooks/useCoverageFiles";
import { useCoverageGeometry } from "@/hooks/useCoverageGeometry";
import { useCoverageVersion } from "@/hooks/useCoverageVersion";
import { useKmzUpload } from "@/hooks/useKmzUpload";
import type { CoverageVersionSummary } from "@/services/geoCoverage.service";

import { SellerOfferCoverageStepProps } from "./interface";

/**
 * Etapa 1 da criação de oferta: categoria e cobertura.
 * - Conectividade e Infra Física: mapa, versão de KMZ e localidade de
 *   atendimento (endereço do Mapbox + raio, com pin e círculo no mapa). A
 *   versão escolhida é vinculada à oferta depois de criada
 *   (`PUT /productOffering/{id}/coverageVersion`).
 * - Demais categorias: "Cobertura não aplicável" (Figma 2074-57991), com o
 *   campo de região quando a categoria pede (Figma 2074-59081).
 *
 * As versões vêm dos arquivos da organização na geo-api (`/coverageFile`) e
 * dos KMZs enviados aqui. A geo-api não devolve a geometria: o mapa lê o KMZ
 * enviado ou, para os anteriores, o original baixado.
 */
export function SellerOfferCoverageStep({
  control,
  register,
  errors,
  organizationId,
  boundVersionId = null,
  locale,
}: SellerOfferCoverageStepProps) {
  const { t } = useTranslation();
  const category = useWatch({ control, name: "category" });
  const selectedId = useWatch({ control, name: "coverageVersionId" });
  const locations = useWatch({ control, name: "locations" });
  // Pins e raios das localidades de atendimento no mapa — memorizados para o
  // mapa só reenquadrar quando um ponto ou raio muda.
  const mapLocations = React.useMemo(
    () =>
      (locations ?? []).flatMap(({ longitude, latitude, radiusKm }) =>
        typeof longitude === "number" && typeof latitude === "number"
          ? [{ longitude, latitude, radiusKm: parseDecimal(radiusKm) }]
          : [],
      ),
    [locations],
  );
  const definition = offerCategory(category);
  const requiresCoverage = !!definition?.requiresCoverage;
  // Só Conectividade e Infra Física têm cobertura geográfica; as demais
  // mostram o aviso no lugar do mapa e do KMZ. A versão já escolhida fica no
  // formulário (para não se perder ao trocar de categoria), mas só é
  // vinculada à oferta quando a categoria exige cobertura.
  const coverageNotApplicable = !!definition && !requiresCoverage;

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

  // Recorte da cobertura ("Escolher cobertura").
  const coverageMode = useController({ control, name: "coverageMode" });
  const publicGeometry = useController({ control, name: "publicGeometry" });
  const [isScopeOpen, setIsScopeOpen] = React.useState(false);
  const resetScope = () => {
    coverageMode.field.onChange("full");
    publicGeometry.field.onChange(null);
  };

  // Edição: a versão vinculada segue no seletor, mesmo após enviar outra ou
  // quando não é mais a ativa do arquivo.
  const boundListed = listed.some((version) => version.id === boundVersionId);
  const bound = useCoverageVersion(
    boundVersionId && !boundListed ? boundVersionId : null,
  );
  const selectable =
    bound.version && !boundListed ? [...listed, bound.version] : listed;

  // Mapa: a geometria do KMZ enviado aqui ou a do original baixado.
  const selectedVersion =
    selectable.find((version) => version.id === selectedId) ?? null;
  const selectedUpload = uploaded.find(
    (item) => item.version.id === selectedId,
  );
  const preview = useCoverageGeometry(
    organizationId,
    selectedVersion,
    selectedUpload ? selectedUpload.geometry : undefined,
  );
  const geometry = preview.geometry;
  // Tamanho e contagens do original baixado entram no item escolhido.
  const versions = preview.info
    ? selectable.map((version) =>
        version.id === selectedId ? { ...version, ...preview.info } : version,
      )
    : selectable;

  const tError = (message?: string) => (message ? t(message) : undefined);

  return (
    <Stack gap="24px">
      <Flex
        align="flex-start"
        gap="12px"
        px="21px"
        py="17px"
        bg="#EEF3FF"
        borderWidth="1px"
        borderColor="#C7D8FF"
        rounded="14px"
      >
        <Icon as={LuShield} boxSize="15px" color="#1F5AFF" mt="2px" />
        <Stack gap="2px">
          <Text
            color="#1F5AFF"
            fontSize="13px"
            fontWeight={700}
            lineHeight="19.5px"
          >
            {t("SellerOfferCreate.coverage.infoTitle")}
          </Text>
          <Text color="#5A7CE0" fontSize="12px" lineHeight="18px">
            {t("SellerOfferCreate.coverage.infoText")}
          </Text>
        </Stack>
      </Flex>

      <Controller
        control={control}
        name="category"
        render={({ field }) => (
          <OfferCategoryPicker
            value={field.value || null}
            onChange={field.onChange}
            error={tError(errors.category?.message)}
          />
        )}
      />

      {coverageNotApplicable ? (
        <Box p={{ base: 0, md: "28px" }}>
          <Stack
            align="center"
            gap="16px"
            p={{ base: "24px", md: "41px" }}
            bg="#F8F9FB"
            borderWidth="1px"
            borderColor="#E5E8EE"
            rounded="14px"
            textAlign="center"
          >
            <Flex
              align="center"
              justify="center"
              boxSize="56px"
              bg="white"
              borderWidth="1px"
              borderColor="#E5E8EE"
              rounded="14px"
            >
              <Icon as={LuFileText} boxSize="22px" color="#8A9AB5" />
            </Flex>
            <Stack gap="4px">
              <Text
                color="#0F1729"
                fontSize="16px"
                fontWeight={700}
                lineHeight="24px"
              >
                {t("SellerOfferCreate.coverage.notApplicableTitle")}
              </Text>
              <Text
                id="offer-coverage-region-hint"
                color="#8A9AB5"
                fontSize="13px"
                lineHeight="19.5px"
              >
                {t(`SellerOfferCreate.coverage.notApplicable.${category}`)}
              </Text>
            </Stack>
            {/* Abrangência sem KMZ (ex.: LACNIC, ANATEL). A marketplace-api
                ainda não tem campo para ela: fica no assistente e não é
                enviada. */}
            {definition?.asksRegion && (
              <Stack gap="6px" w="full" maxW="384px">
                <Input
                  {...register("coverageRegion")}
                  maxLength={120}
                  aria-label={t("SellerOfferCreate.coverage.regionLabel")}
                  aria-describedby="offer-coverage-region-hint"
                  aria-invalid={!!errors.coverageRegion}
                  placeholder={t(
                    "SellerOfferCreate.coverage.regionPlaceholder",
                  )}
                  h="47px"
                  px="17px"
                  bg="white"
                  borderWidth="1px"
                  borderColor={errors.coverageRegion ? "#EF4444" : "#E5E8EE"}
                  rounded="14px"
                  fontSize="14px"
                  color="#0F1729"
                  _placeholder={{ color: "rgba(15,23,41,0.5)" }}
                />
                {errors.coverageRegion && (
                  <Text color="#EF4444" fontSize="12px" lineHeight="18px">
                    {tError(errors.coverageRegion.message)}
                  </Text>
                )}
              </Stack>
            )}
          </Stack>
        </Box>
      ) : (
        <>
          <Stack gap="16px" px={{ base: 0, md: "20px" }} py="20px">
            <Flex align="center" justify="space-between" gap="12px" wrap="wrap">
              <Text
                color="#0F1729"
                fontSize="15px"
                fontWeight={700}
                lineHeight="22.5px"
              >
                {t("SellerOfferCreate.coverage.mapTitle")}
                {requiresCoverage && (
                  <Text as="span" color="#CC0000">
                    {" *"}
                  </Text>
                )}
              </Text>
              {/* O recorte é sobre a área de um KMZ: exige a versão escolhida. */}
              <Button
                disabled={!selectedId}
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
              publicGeometry={publicGeometry.field.value}
              label={t("SellerOfferCreate.coverage.mapTitle")}
            />
            {selectedId && (
              <Text
                color={errors.publicGeometry ? "#EF4444" : "#5A6478"}
                fontSize="12px"
                lineHeight="18px"
              >
                {errors.publicGeometry
                  ? tError(errors.publicGeometry.message)
                  : t(
                      `SellerOfferCreate.coverageScope.selected.${coverageMode.field.value}`,
                    )}
              </Text>
            )}
            <CoverageScopeDialog
              open={isScopeOpen}
              coverage={geometry}
              value={{
                mode: coverageMode.field.value,
                publicGeometry: publicGeometry.field.value,
              }}
              onClose={() => setIsScopeOpen(false)}
              onConfirm={(scope) => {
                coverageMode.field.onChange(scope.mode);
                publicGeometry.field.onChange(scope.publicGeometry);
                setIsScopeOpen(false);
              }}
            />
            {selectedId && !geometry && (
              <Text
                role="status"
                color="#A0ABB8"
                fontSize="11px"
                lineHeight="16.5px"
              >
                {t(
                  preview.isLoading
                    ? "SellerOfferCreate.coverage.preview.loading"
                    : (preview.error ??
                        "SellerOfferCreate.coverage.previewUnavailable"),
                )}
              </Text>
            )}
          </Stack>

          <Controller
            control={control}
            name="coverageVersionId"
            render={({ field }) => (
              <KmzVersionPicker
                versions={versions}
                isLoadingList={files.isLoading}
                selectedId={field.value || null}
                boundId={boundVersionId}
                onSelect={(id) => {
                  // O polígono foi desenhado sobre a área do KMZ anterior.
                  if (id !== field.value) resetScope();
                  field.onChange(id);
                }}
                isUploading={isUploading}
                uploadError={uploadError}
                error={tError(errors.coverageVersionId?.message)}
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
                    ...current.filter(
                      (item) => item.version.id !== result.version.id,
                    ),
                  ]);
                  files.reload();
                  if (result.version.id !== field.value) resetScope();
                  field.onChange(result.version.id);
                  toaster.create({
                    type: "success",
                    title: t("SellerOfferCreate.kmz.uploaded", {
                      name: file.name,
                    }),
                  });
                }}
              />
            )}
          />

          <SellerOfferLocationField control={control} errors={errors} />
        </>
      )}
    </Stack>
  );
}
