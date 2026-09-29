"use client";

import { Box, Button, Flex } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

import {
  MarketplaceCategoryFilterProps,
  MarketplaceCategoryFilterValue,
} from "./interface";

// Opções na ordem do design. Os rótulos curtos ("Infra", "Recursos") vêm de
// Marketplace.offers.filter.<value>.
const OPTIONS: MarketplaceCategoryFilterValue[] = [
  "all",
  "connectivity",
  "infrastructure",
  "hardware",
  "numbering",
];

/**
 * Seletor segmentado de categoria do marketplace.
 * Trilho cinza com a opção ativa destacada em branco; rola na horizontal em
 * telas estreitas.
 */
export function MarketplaceCategoryFilter({
  value,
  onChange,
}: MarketplaceCategoryFilterProps) {
  const { t } = useTranslation();

  return (
    <Box maxW="full" overflowX="auto" alignSelf="flex-start">
      <Flex
        role="group"
        aria-label={t("Marketplace.offers.filter.label")}
        w="max-content"
        gap="4px"
        p="4.5px"
        rounded="14px"
        bg="#F4F6F9"
        borderWidth="0.5px"
        borderColor="rgba(0, 0, 0, 0.1)"
      >
        {OPTIONS.map((option) => {
          const isActive = option === value;

          return (
            <Button
              key={option}
              variant="plain"
              h="36px"
              px="16px"
              rounded="10px"
              aria-pressed={isActive}
              bg={isActive ? "white" : "transparent"}
              boxShadow={
                isActive
                  ? "0px 1px 1.5px rgba(0, 0, 0, 0.1), 0px 1px 1px rgba(0, 0, 0, 0.1)"
                  : "none"
              }
              color={isActive ? "#0F1729" : "#8A9AB5"}
              fontSize="13px"
              fontWeight={isActive ? 600 : 400}
              lineHeight="19.5px"
              _hover={isActive ? undefined : { color: "#5A6478" }}
              onClick={() => onChange(option)}
            >
              {t(`Marketplace.offers.filter.${option}`)}
            </Button>
          );
        })}
      </Flex>
    </Box>
  );
}
