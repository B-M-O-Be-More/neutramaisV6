"use client";

import { Box, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuEye } from "react-icons/lu";

import { formatMegabytes } from "@/functions/formatMegabytes";

import { CoverageStorageBarProps } from "./interface";

// A partir daqui a barra fica vermelha (Figma 2879-92860).
const HIGH_USAGE = 80;

/**
 * "Armazenamento" no topo da cobertura (Figma 2879-92860 e 2879-92904): o
 * quanto da cota de KMZ já foi usado, numa barra. Detalhes por categoria
 * ficam na aba Cobertura.
 */
export function CoverageStorageBar({
  storage,
  locale,
}: CoverageStorageBarProps) {
  const { t } = useTranslation();
  if (!storage) return null;

  const percent =
    storage.quotaMb > 0
      ? Math.min(100, Math.round((storage.usedMb / storage.quotaMb) * 100))
      : 100;
  const isHigh = storage.overQuota || percent >= HIGH_USAGE;

  return (
    <Flex
      align="flex-start"
      gap="12px"
      px="21px"
      py="17px"
      bg="rgba(31,90,255,0.1)"
      borderWidth="1px"
      borderColor="#1F5AFF"
      rounded="14px"
    >
      <Icon as={LuEye} boxSize="15px" color="#1F5AFF" mt="2px" />
      <Stack gap="8px" flex="1" minW={0}>
        <Stack gap="2px">
          <Text
            color="#1F5AFF"
            fontSize="13px"
            fontWeight={700}
            lineHeight="19.5px"
          >
            {t("SellerCoverage.detail.storage.title")}
          </Text>
          <Text color="#002776" fontSize="12px" lineHeight="18px">
            {t("SellerCoverage.detail.storage.text", {
              percent,
              used: formatMegabytes(storage.usedMb, locale),
              quota: formatMegabytes(storage.quotaMb, locale),
            })}
          </Text>
        </Stack>
        <Box
          role="progressbar"
          aria-label={t("SellerCoverage.detail.storage.title")}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          h="4px"
          bg="#A6AFC2"
          rounded="full"
          overflow="hidden"
        >
          <Box
            h="full"
            w={`${percent}%`}
            bg={isHigh ? "#C9363E" : "linear-gradient(90deg, #1F5AFF, #8B5CF6)"}
            rounded="full"
          />
        </Box>
      </Stack>
    </Flex>
  );
}
