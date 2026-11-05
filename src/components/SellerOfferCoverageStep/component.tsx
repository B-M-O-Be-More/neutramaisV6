"use client";

import { Box, Flex, Icon, NativeSelect, Stack, Text } from "@chakra-ui/react";
import React from "react";
import { useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  LuChevronDown,
  LuFileText,
  LuMapPinned,
  LuShield,
} from "react-icons/lu";

import type { CoverageMapLocation } from "@/components/CoverageMap";
import OfferCategoryPicker from "@/components/OfferCategoryPicker";
import SellerOfferCoverageSection from "@/components/SellerOfferCoverageSection";
import SellerOfferLocationField from "@/components/SellerOfferLocationField";
import { offerCategory } from "@/data/offerCategories";
import {
  descendantsOf,
  selectionOf,
  type OfferCategoryNode,
} from "@/functions/offerCategoryTree";
import { parseDecimal } from "@/functions/parseDecimal";
import { NUMBERING_REGISTRIES } from "@/schemas/sellerOffer";

import { SellerOfferCoverageStepProps } from "./interface";

/**
 * Etapa 1 da oferta: categoria e cobertura.
 * - A categoria raiz vem da árvore da API; com filhas, aparece a escolha da
 *   subcategoria. A escolha grava a família (telas próprias), o
 *   `categoryId` e as flags da categoria na API.
 * - Categorias com `requiresCoverage` (Conectividade e Infra Física, ou
 *   outra que a API marcar): precisam de cobertura (KMZ) para publicar,
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
  setValue,
  categories,
  organizationId,
  coverageEditor,
  locale,
}: SellerOfferCoverageStepProps) {
  const { t } = useTranslation();
  const [category, categoryId, requiresCoverage] = useWatch({
    control,
    name: ["category", "categoryId", "requiresCoverage"],
  });
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
  // Sem cobertura geográfica (flag da API), o aviso fica no lugar do mapa e
  // do KMZ.
  const coverageNotApplicable = !!definition && !requiresCoverage;

  // Raiz da categoria escolhida: pela árvore ou, sem ela, pela família.
  const selected = categoryId ? categories.byId.get(categoryId) : undefined;
  const rootId = selected?.rootId ?? (definition?.categoryId || null);
  const root = rootId ? categories.byId.get(rootId) : undefined;
  const subcategories = root ? descendantsOf(root) : [];

  const familyLabel = (node: OfferCategoryNode) =>
    node.family === "custom"
      ? undefined
      : t(`SellerOfferCreate.categories.${node.family}.label`);

  const choose = (node: OfferCategoryNode, isRootChange: boolean) => {
    const selection = selectionOf(node, familyLabel(node));
    const options = { shouldDirty: true };
    setValue("category", selection.category, {
      ...options,
      shouldValidate: !!errors.category,
    });
    setValue("categoryId", selection.categoryId, options);
    setValue("categoryLabel", selection.categoryLabel, options);
    setValue("requiresCoverage", selection.requiresCoverage, options);
    setValue("hasNumericStock", selection.hasNumericStock, options);
    // Outra raiz, outro template: os campos genéricos recomeçam. Entre
    // subcategorias da mesma raiz, os campos herdados mantêm o valor.
    if (isRootChange) {
      setValue("templateValues", {}, options);
      setValue("rulesEnabled", {}, options);
      setValue("ruleValues", {}, options);
    }
  };

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

      <OfferCategoryPicker
        options={categories.roots}
        value={rootId}
        onChange={(node) => choose(node, node.id !== rootId)}
        error={tError(errors.category?.message ?? errors.categoryId?.message)}
      />

      {root && subcategories.length > 0 && (
        <Stack gap="6px">
          <Text
            asChild
            color="#0F1729"
            fontSize="14px"
            fontWeight={700}
            lineHeight="21px"
          >
            <label htmlFor="offer-subcategory">
              {t("SellerOfferCreate.coverage.subcategoryLabel")}
            </label>
          </Text>
          <NativeSelect.Root>
            <NativeSelect.Field
              id="offer-subcategory"
              value={selected && selected.id !== root.id ? selected.id : ""}
              onChange={(event) => {
                const node = event.target.value
                  ? categories.byId.get(event.target.value)
                  : root;
                if (node) choose(node, false);
              }}
              aria-describedby="offer-subcategory-hint"
              h="47px"
              ps="17px"
              pe="32px"
              bg="white"
              borderWidth="1px"
              borderColor="#E5E8EE"
              rounded="14px"
              fontSize="14px"
              color="#0F1729"
            >
              <option value="">
                {t("SellerOfferCreate.coverage.subcategoryNone")}
              </option>
              {subcategories.map((node) => (
                <option key={node.id} value={node.id}>
                  {`${"— ".repeat(node.depth - 1)}${node.name}`}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator>
              <LuChevronDown color="#98A6B3" />
            </NativeSelect.Indicator>
          </NativeSelect.Root>
          <Text
            id="offer-subcategory-hint"
            color="#8A9AB5"
            fontSize="12px"
            lineHeight="18px"
          >
            {t("SellerOfferCreate.coverage.subcategoryHint")}
          </Text>
        </Stack>
      )}

      {categories.hasError && (
        <Text color="#B45309" fontSize="12px" lineHeight="18px" role="status">
          {t("SellerOfferCreate.coverage.categoriesFallback")}
        </Text>
      )}

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
                {t([
                  `SellerOfferCreate.coverage.notApplicable.${category}`,
                  "SellerOfferCreate.coverage.notApplicable.custom",
                ])}
              </Text>
            </Stack>
            {/* Abrangência sem KMZ: o registro dos recursos numéricos
                (LACNIC, ANATEL...), `registry` do template da categoria. */}
            {definition?.asksRegion && (
              <Stack gap="6px" w="full" maxW="384px">
                <NativeSelect.Root>
                  <NativeSelect.Field
                    {...register("coverageRegion")}
                    aria-label={t("SellerOfferCreate.coverage.regionLabel")}
                    aria-describedby="offer-coverage-region-hint"
                    aria-invalid={!!errors.coverageRegion}
                    h="47px"
                    ps="17px"
                    pe="32px"
                    bg="white"
                    borderWidth="1px"
                    borderColor={errors.coverageRegion ? "#EF4444" : "#E5E8EE"}
                    rounded="14px"
                    fontSize="14px"
                    color="#0F1729"
                  >
                    <option value="">
                      {t("SellerOfferCreate.coverage.regionPlaceholder")}
                    </option>
                    {NUMBERING_REGISTRIES.map((registry) => (
                      <option key={registry} value={registry}>
                        {t(`SellerOfferCreate.coverage.registries.${registry}`)}
                      </option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator>
                    <LuChevronDown color="#98A6B3" />
                  </NativeSelect.Indicator>
                </NativeSelect.Root>
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
