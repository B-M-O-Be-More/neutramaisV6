"use client";

import { chakra, Flex, Icon, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

import { OFFER_CATEGORIES } from "@/data/offerCategories";

import { OfferCategoryPickerProps } from "./interface";

/**
 * Escolha da categoria da oferta em cards (radio group). A categoria
 * escolhida assume as cores dela; as demais ficam neutras.
 */
export function OfferCategoryPicker({
  value,
  onChange,
  error,
}: OfferCategoryPickerProps) {
  const { t } = useTranslation();

  return (
    <Stack gap="8px">
      <Text
        id="offer-category-label"
        color="#0F1729"
        fontSize="14px"
        fontWeight={700}
        lineHeight="21px"
      >
        {t("SellerOfferCreate.coverage.categoriesLabel")}{" "}
        <Text as="span" color="#EF4444">
          *
        </Text>
      </Text>

      <SimpleGrid
        role="radiogroup"
        aria-labelledby="offer-category-label"
        aria-invalid={!!error}
        columns={{ base: 1, md: 2 }}
        gap="12px"
      >
        {OFFER_CATEGORIES.map((category) => {
          const isSelected = category.key === value;
          return (
            <chakra.button
              key={category.key}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(category.key)}
              display="flex"
              alignItems="flex-start"
              gap="12px"
              minH="106px"
              p="18px"
              textAlign="start"
              bg={isSelected ? category.tone.bg : "white"}
              borderWidth="2px"
              borderColor={
                isSelected
                  ? category.tone.border
                  : error
                    ? "#FECACA"
                    : "#E5E8EE"
              }
              rounded="14px"
              cursor="pointer"
              transition="border-color 0.15s, background 0.15s"
              _hover={isSelected ? undefined : { borderColor: "#C4CDD8" }}
              _focusVisible={{
                outline: "2px solid #1F5AFF",
                outlineOffset: "2px",
              }}
            >
              <Flex
                align="center"
                justify="center"
                boxSize="36px"
                flexShrink={0}
                bg={category.tone.bg}
                borderWidth="1px"
                borderColor={category.tone.border}
                rounded="10px"
              >
                <Icon
                  as={category.icon}
                  boxSize="16px"
                  color={category.tone.fg}
                />
              </Flex>
              <Stack gap={0} minW={0}>
                <Text
                  color={isSelected ? category.tone.fg : "#0F1729"}
                  fontSize="13px"
                  fontWeight={700}
                  lineHeight="19.5px"
                >
                  {t(`SellerOfferCreate.categories.${category.key}.label`)}
                </Text>
                <Text
                  color="#A0ABB8"
                  fontSize="11px"
                  fontWeight={500}
                  lineHeight="16.5px"
                >
                  {t(
                    `SellerOfferCreate.categories.${category.key}.description`,
                  )}
                </Text>
              </Stack>
            </chakra.button>
          );
        })}
      </SimpleGrid>

      {error && (
        <Text color="#EF4444" fontSize="12px" lineHeight="18px" role="alert">
          {error}
        </Text>
      )}
    </Stack>
  );
}
