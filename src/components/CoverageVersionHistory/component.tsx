"use client";

import {
  Badge,
  Button,
  Flex,
  Icon,
  IconButton,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuDownload, LuGitBranch, LuMap } from "react-icons/lu";

import { formatDateTime } from "@/functions/formatDateTime";
import { formatFileSize } from "@/functions/formatFileSize";

import { CoverageVersionHistoryProps } from "./interface";

/**
 * "Histórico de versões" (Figma 2074-64962): as versões imutáveis do
 * arquivo, com a atual marcada. Cada uma pode ser baixada; as anteriores
 * podem voltar a ser a ativa ("Usar esta versão"). Sem versões, o vazio do
 * Figma 2074-65253.
 */
export function CoverageVersionHistory({
  items,
  locale,
  canManage,
  restoringId = null,
  downloadingId = null,
  onRestore,
  onDownload,
  archiveAction,
}: CoverageVersionHistoryProps) {
  const { t } = useTranslation();
  const numbers = new Intl.NumberFormat(locale);

  return (
    <Stack
      gap={0}
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="14px"
      overflow="hidden"
    >
      <Flex
        align="center"
        gap="8px"
        px="20px"
        pt="16px"
        pb="17px"
        borderBottomWidth="1px"
        borderColor="#F4F6F9"
      >
        <Icon as={LuGitBranch} boxSize="15px" color="#1F5AFF" />
        <Text
          as="h2"
          color="#0F1729"
          fontSize="15px"
          fontWeight={700}
          lineHeight="22.5px"
        >
          {t("SellerCoverage.detail.history.title")}
        </Text>
        <Text
          ms="auto"
          color="#A0ABB8"
          fontSize="12px"
          lineHeight="18px"
          textAlign="right"
        >
          {t("SellerCoverage.detail.history.immutable")}
        </Text>
      </Flex>

      {items.length === 0 ? (
        <Text
          px="20px"
          py="16px"
          color="#0F1729"
          fontSize="13px"
          fontWeight={700}
          lineHeight="20px"
          textAlign="center"
        >
          {t("SellerCoverage.detail.history.empty")}
        </Text>
      ) : (
        <Stack as="ul" gap={0} listStyleType="none">
          {items.map((item, index) => {
            const meta = [
              item.createdAt ? formatDateTime(item.createdAt, locale) : null,
              item.sizeBytes !== undefined
                ? formatFileSize(item.sizeBytes, locale)
                : null,
            ].filter(Boolean);
            const counts = item.stats
              ? t("SellerCoverage.detail.history.counts", {
                  polygons: numbers.format(item.stats.polygons),
                  lines: numbers.format(item.stats.lines),
                  points: numbers.format(item.stats.points),
                  regions: numbers.format(item.stats.regions.length),
                })
              : null;

            return (
              <Flex
                as="li"
                key={item.versionId}
                align="center"
                gap="12px"
                px="20px"
                pt="16px"
                pb="17px"
                borderBottomWidth={index < items.length - 1 ? "1px" : 0}
                borderColor="#F4F6F9"
                aria-current={item.isActive ? "true" : undefined}
              >
                <Flex
                  align="center"
                  justify="center"
                  boxSize="36px"
                  flexShrink={0}
                  bg="#EDFBF5"
                  borderWidth="1px"
                  borderColor="#AAECD5"
                  rounded="14px"
                >
                  <Icon as={LuMap} boxSize="14px" color="#10B981" />
                </Flex>

                <Stack gap="2px" flex="1" minW={0}>
                  <Flex align="center" gap="8px" wrap="wrap">
                    <Text
                      color="#0F1729"
                      fontSize="13px"
                      fontWeight={700}
                      lineHeight="19.5px"
                      truncate
                    >
                      {item.label}
                    </Text>
                    <Badge
                      px="8px"
                      py="2px"
                      bg="#EEF3FF"
                      color="#1F5AFF"
                      rounded="8px"
                      fontSize="9px"
                      fontWeight={700}
                      lineHeight="13.5px"
                    >
                      v{item.number}
                    </Badge>
                    {item.isActive && (
                      <Badge
                        px="9px"
                        py="3px"
                        bg="#EDFBF5"
                        borderWidth="1px"
                        borderColor="#AAECD5"
                        color="#10B981"
                        rounded="8px"
                        fontSize="9px"
                        fontWeight={700}
                        lineHeight="13.5px"
                        textTransform="uppercase"
                      >
                        {t("SellerCoverage.detail.history.current")}
                      </Badge>
                    )}
                  </Flex>
                  {meta.length > 0 && (
                    <Text color="#8A9AB5" fontSize="11px" lineHeight="16.5px">
                      {meta.join(" · ")}
                    </Text>
                  )}
                  <Flex align="center" gap="12px" wrap="wrap" pt="2px">
                    {counts && (
                      <Text color="#5A6478" fontSize="11px" lineHeight="16.5px">
                        {counts}
                      </Text>
                    )}
                    <Text color="#1F5AFF" fontSize="11px" lineHeight="16.5px">
                      {t("SellerCoverage.list.offers", {
                        count: item.offerCount,
                      })}
                    </Text>
                  </Flex>
                </Stack>

                {!item.isActive && canManage && (
                  <Button
                    h="36px"
                    px="13px"
                    flexShrink={0}
                    bg="#EEF3FF"
                    borderWidth="1px"
                    borderColor="#C7D8FF"
                    color="#1F5AFF"
                    rounded="10px"
                    fontSize="12px"
                    fontWeight={600}
                    loading={restoringId === item.versionId}
                    disabled={!!restoringId}
                    _hover={{ bg: "#E0E9FF" }}
                    onClick={() => onRestore(item.versionId)}
                  >
                    {t("SellerCoverage.detail.history.restore")}
                  </Button>
                )}

                <Flex align="center" gap="8px" flexShrink={0}>
                  <IconButton
                    variant="plain"
                    size="xs"
                    minW="24px"
                    h="24px"
                    color="#1F5AFF"
                    disabled={!!downloadingId}
                    aria-label={t("SellerCoverage.detail.history.download", {
                      name: item.label,
                    })}
                    onClick={() => onDownload(item)}
                  >
                    {downloadingId === item.versionId ? (
                      <Spinner size="xs" />
                    ) : (
                      <LuDownload />
                    )}
                  </IconButton>
                  {item.isActive && archiveAction}
                </Flex>
              </Flex>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
