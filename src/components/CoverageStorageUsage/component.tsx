"use client";

import {
  Box,
  Button,
  Flex,
  Icon,
  Skeleton,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuHardDrive, LuTriangleAlert } from "react-icons/lu";

import { formatMegabytes } from "@/functions/formatMegabytes";

import { CoverageStorageUsageProps } from "./interface";

const CATEGORIES = [
  { key: "originals", field: "originalsMb" },
  { key: "geometries", field: "geometriesMb" },
  { key: "metadata", field: "metadataMb" },
] as const;

/**
 * Uso da cota de armazenamento de cobertura (KMZ): consumo, saldo e consumo
 * por categoria. Arquivar não libera espaço — o histórico também conta.
 */
export function CoverageStorageUsage({
  storage,
  isLoading,
  error,
  onReload,
  locale,
  action,
}: CoverageStorageUsageProps) {
  const { t } = useTranslation();
  const mb = (value: number) => formatMegabytes(value, locale);

  let content;
  if (error) {
    content = (
      <Flex align="center" justify="space-between" gap="12px" wrap="wrap">
        <Text color="#5A6478" fontSize="12px" lineHeight="18px">
          {t(error)}
        </Text>
        <Button
          variant="outline"
          h="30px"
          px="12px"
          rounded="10px"
          borderColor="#E5E8EE"
          color="#1F5AFF"
          fontSize="12px"
          fontWeight={600}
          onClick={onReload}
        >
          {t("CoverageStorage.retry")}
        </Button>
      </Flex>
    );
  } else if (isLoading || !storage) {
    content = (
      <Stack gap="8px" aria-busy="true">
        <Skeleton h="18px" w="60%" rounded="6px" />
        <Skeleton h="8px" rounded="full" />
      </Stack>
    );
  } else {
    // Cota zero: qualquer consumo já é 100%.
    const percent =
      storage.quotaMb > 0
        ? Math.min(100, (storage.usedMb / storage.quotaMb) * 100)
        : storage.usedMb > 0
          ? 100
          : 0;
    const barColor = storage.overQuota
      ? "#EF4444"
      : percent >= 90
        ? "#D97706"
        : "#1F5AFF";

    content = (
      <Stack gap="12px">
        <Stack gap="6px">
          <Flex justify="space-between" align="baseline" gap="8px" wrap="wrap">
            <Text color="#0F1729" fontSize="13px" fontWeight={600}>
              {t("CoverageStorage.used", {
                used: mb(storage.usedMb),
                quota: mb(storage.quotaMb),
              })}
            </Text>
            <Text color="#8A9AB5" fontSize="12px">
              {t("CoverageStorage.available", {
                available: mb(storage.availableMb),
              })}
            </Text>
          </Flex>
          <Box
            role="progressbar"
            aria-label={t("CoverageStorage.title")}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(percent)}
            h="8px"
            bg="#F4F6F9"
            rounded="full"
            overflow="hidden"
          >
            <Box h="full" w={`${percent}%`} bg={barColor} rounded="full" />
          </Box>
        </Stack>

        {storage.overQuota && (
          <Flex
            role="alert"
            align="flex-start"
            gap="8px"
            px="12px"
            py="10px"
            bg="#FEF2F2"
            borderWidth="1px"
            borderColor="#FECACA"
            rounded="10px"
          >
            <Icon
              as={LuTriangleAlert}
              boxSize="14px"
              color="#EF4444"
              mt="2px"
            />
            <Text color="#991B1B" fontSize="12px" lineHeight="18px">
              {t("CoverageStorage.overQuota")}
            </Text>
          </Flex>
        )}

        <Stack as="dl" gap="4px">
          {CATEGORIES.map((category) => (
            <Flex key={category.key} justify="space-between" gap="12px">
              <Text as="dt" color="#8A9AB5" fontSize="12px" lineHeight="18px">
                {t(`CoverageStorage.categories.${category.key}`)}
              </Text>
              <Text
                as="dd"
                color="#0F1729"
                fontSize="12px"
                fontWeight={600}
                lineHeight="18px"
              >
                {mb(storage[category.field])}
              </Text>
            </Flex>
          ))}
        </Stack>

        <Text color="#A0ABB8" fontSize="11px" lineHeight="16.5px">
          {t("CoverageStorage.hint")}
        </Text>
      </Stack>
    );
  }

  return (
    <Stack
      as="section"
      aria-labelledby="coverage-storage-title"
      gap="14px"
      p="20px"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="14px"
    >
      <Flex align="center" justify="space-between" gap="12px">
        <Flex align="center" gap="8px">
          <Icon as={LuHardDrive} boxSize="15px" color="#1F5AFF" />
          <Text
            id="coverage-storage-title"
            as="h2"
            color="#0F1729"
            fontSize="15px"
            fontWeight={700}
          >
            {t("CoverageStorage.title")}
          </Text>
        </Flex>
        {action}
      </Flex>
      {content}
    </Stack>
  );
}
