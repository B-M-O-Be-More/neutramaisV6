"use client";

import { chakra, Flex, Icon, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuCircleCheck } from "react-icons/lu";

import { offerCategory } from "@/data/offerCategories";
import { QUOTE_CATEGORIES } from "@/types/proposals";

import { RfqCategoryPickerProps } from "./interface";

/**
 * Categoria da nova RFQ em cards (Figma 2073-40139). A escolhida assume as
 * cores dela e ganha o check; as demais ficam brancas.
 */
export function RfqCategoryPicker({ value, onChange }: RfqCategoryPickerProps) {
  const { t } = useTranslation();

  return (
    <Stack gap="16px">
      <Text
        id="rfq-category-label"
        color="#5A6478"
        fontSize="13px"
        lineHeight="19.5px"
      >
        {t("Proposals.rfq.create.categoryHint")}
      </Text>

      <SimpleGrid
        role="radiogroup"
        aria-labelledby="rfq-category-label"
        columns={{ base: 1, sm: 2 }}
        gap="12px"
      >
        {QUOTE_CATEGORIES.map((key) => {
          const category = offerCategory(key);
          if (!category) return null;
          const isSelected = key === value;
          return (
            <chakra.button
              key={key}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(key)}
              display="flex"
              alignItems="flex-start"
              gap="12px"
              minH="89px"
              p="18px"
              textAlign="start"
              bg={isSelected ? category.tone.bg : "white"}
              borderWidth="2px"
              borderColor={isSelected ? category.tone.border : "#E5E8EE"}
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
                boxSize="40px"
                flexShrink={0}
                bg={category.tone.bg}
                borderWidth="1px"
                borderColor={category.tone.border}
                rounded="10px"
              >
                <Icon
                  as={category.icon}
                  boxSize="20px"
                  color={category.tone.fg}
                />
              </Flex>
              <Stack gap="2px" flex="1" minW={0}>
                <Text
                  color={isSelected ? category.tone.fg : "#0F1729"}
                  fontSize="14px"
                  fontWeight={700}
                  lineHeight="21px"
                >
                  {t(`SellerOfferCreate.categories.${key}.label`)}
                </Text>
                <Text
                  color="#8A9AB5"
                  fontSize="11px"
                  fontWeight={500}
                  lineHeight="15px"
                >
                  {t(`Proposals.rfq.create.categories.${key}`)}
                </Text>
              </Stack>
              {isSelected && (
                <Icon
                  as={LuCircleCheck}
                  boxSize="16px"
                  mt="2px"
                  flexShrink={0}
                  color={category.tone.fg}
                  aria-hidden
                />
              )}
            </chakra.button>
          );
        })}
      </SimpleGrid>
    </Stack>
  );
}
