"use client";

import { Flex, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

import { formatFileSize } from "@/functions/formatFileSize";

import { CoverageVersionStatsProps } from "./interface";

/**
 * "KMZ Atual · Estatísticas" (Figma 2074-65162): versão, tamanho, contagens
 * de geometria e ofertas da versão ativa. Sem o KMZ lido, o vazio do Figma
 * 2451-29486.
 */
export function CoverageVersionStats({
  versionNumber,
  sizeBytes,
  stats,
  offerCount,
  locale,
}: CoverageVersionStatsProps) {
  const { t } = useTranslation();
  const numbers = new Intl.NumberFormat(locale);

  const rows = stats
    ? [
        {
          key: "version",
          value: versionNumber ? `v${versionNumber}` : "—",
        },
        {
          key: "size",
          value:
            sizeBytes !== undefined ? formatFileSize(sizeBytes, locale) : "—",
        },
        { key: "polygons", value: numbers.format(stats.polygons) },
        { key: "lines", value: numbers.format(stats.lines) },
        { key: "points", value: numbers.format(stats.points) },
        { key: "offers", value: numbers.format(offerCount) },
      ]
    : [];

  const title = (
    <Text
      as="h2"
      color="#0F1729"
      fontSize="14px"
      fontWeight={700}
      lineHeight="21px"
    >
      {t("SellerCoverage.detail.stats.title")}
    </Text>
  );

  if (!rows.length) {
    return (
      <Stack
        gap={0}
        bg="white"
        borderWidth="1px"
        borderColor="#E5E8EE"
        rounded="14px"
        overflow="hidden"
      >
        <Flex px="20px" py="16px" borderBottomWidth="1px" borderColor="#F4F6F9">
          {title}
        </Flex>
        <Text
          px="20px"
          py="16px"
          color="#0F1729"
          fontSize="13px"
          fontWeight={700}
          lineHeight="20px"
          textAlign="center"
        >
          {t("SellerCoverage.detail.stats.empty")}
        </Text>
      </Stack>
    );
  }

  return (
    <Stack
      gap="12px"
      p="21px"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="14px"
    >
      {title}
      <Stack as="dl" gap={0}>
        {rows.map((row, index) => (
          <Flex
            key={row.key}
            align="center"
            justify="space-between"
            gap="16px"
            py="8px"
            borderBottomWidth={index < rows.length - 1 ? "1px" : 0}
            borderColor="#F4F6F9"
          >
            <Text as="dt" color="#8A9AB5" fontSize="12px" lineHeight="18px">
              {t(`SellerCoverage.detail.stats.${row.key}`)}
            </Text>
            <Text
              as="dd"
              color="#0F1729"
              fontSize="13px"
              fontWeight={700}
              lineHeight="19.5px"
            >
              {row.value}
            </Text>
          </Flex>
        ))}
      </Stack>
    </Stack>
  );
}
