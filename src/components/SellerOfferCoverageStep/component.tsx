"use client";

import { Box, Flex, Icon, Input, Stack, Text } from "@chakra-ui/react";
import React from "react";
import { Controller, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { LuFileText, LuMapPinned, LuShield } from "react-icons/lu";

import type { CoverageMapLocation } from "@/components/CoverageMap";
import OfferCategoryPicker from "@/components/OfferCategoryPicker";
import SellerOfferCoverageSection from "@/components/SellerOfferCoverageSection";
import SellerOfferLocationField from "@/components/SellerOfferLocationField";
import { offerCategory } from "@/data/offerCategories";
import { parseDecimal } from "@/functions/parseDecimal";

import { SellerOfferCoverageStepProps } from "./interface";

/**
 * Etapa 1 da oferta: categoria e cobertura.
 * - Conectividade e Infra Física: precisam de cobertura (KMZ) para publicar,
 *   mas ela só é vinculada à oferta já criada. Na criação, um aviso explica
 *   o passo seguinte; na edição, entra a área de cobertura
 *   (`SellerOfferCoverageSection`), com botão próprio. Nas duas, a
 *   localidade de atendimento (endereço do Mapbox + raio).
 * - Demais categorias: "Cobertura não aplicável" (Figma 2074-57991), com o
 *   campo de região quando a categoria pede (Figma 2074-59081).
 */
export function SellerOfferCoverageStep({
  control,
  register,
  errors,
  organizationId,
  coverageEditor,
  locale,
}: SellerOfferCoverageStepProps) {
  const { t } = useTranslation();
  const category = useWatch({ control, name: "category" });
  const locations = useWatch({ control, name: "locations" });
  // Pins e raios das localidades de atendimento no mapa. O `useWatch` devolve
  // um array novo a cada tecla (inclusive no endereço ainda sem ponto): a
  // lista só muda quando o conteúdo muda, senão o mapa redesenharia tudo —
  // KMZ, pins e enquadramento — a cada letra digitada.
  const mapLocationsKey = JSON.stringify(
    (locations ?? []).flatMap(({ longitude, latitude, radiusKm, label }) =>
      typeof longitude === "number" && typeof latitude === "number"
        ? [
            {
              longitude,
              latitude,
              radiusKm: parseDecimal(radiusKm),
              label: label?.trim() || undefined,
            },
          ]
        : [],
    ),
  );
  const mapLocations = React.useMemo(
    () => JSON.parse(mapLocationsKey) as CoverageMapLocation[],
    [mapLocationsKey],
  );
  const definition = offerCategory(category);
  const requiresCoverage = !!definition?.requiresCoverage;
  // Só Conectividade e Infra Física têm cobertura geográfica; as demais
  // mostram o aviso no lugar do mapa e do KMZ.
  const coverageNotApplicable = !!definition && !requiresCoverage;

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
        requiresCoverage && (
          <>
            {coverageEditor ? (
              <SellerOfferCoverageSection
                editor={coverageEditor}
                organizationId={organizationId}
                mapLocations={mapLocations}
                locale={locale}
              />
            ) : (
              <Flex
                align="flex-start"
                gap="12px"
                px="17px"
                py="15px"
                bg="#F8F9FB"
                borderWidth="1px"
                borderColor="#E5E8EE"
                rounded="14px"
                role="note"
              >
                <Icon
                  as={LuMapPinned}
                  boxSize="16px"
                  color="#1F5AFF"
                  mt="2px"
                  flexShrink={0}
                />
                <Stack gap="2px">
                  <Text
                    color="#0F1729"
                    fontSize="13px"
                    fontWeight={700}
                    lineHeight="19.5px"
                  >
                    {t("SellerOfferCreate.coverage.afterCreateTitle")}
                  </Text>
                  <Text color="#5A6478" fontSize="12px" lineHeight="18px">
                    {t("SellerOfferCreate.coverage.afterCreateText")}
                  </Text>
                </Stack>
              </Flex>
            )}

            <SellerOfferLocationField control={control} errors={errors} />
          </>
        )
      )}
    </Stack>
  );
}
