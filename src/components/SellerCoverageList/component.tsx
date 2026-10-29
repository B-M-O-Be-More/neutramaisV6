"use client";

import { Button, Flex, Icon, Spinner, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuArrowRight, LuMap } from "react-icons/lu";

import { coverageVersionLabel } from "@/functions/coverageVersionLabel";

import { SellerCoverageListProps } from "./interface";

function formatDate(iso: string, locale: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : new Intl.DateTimeFormat(locale, { dateStyle: "short" }).format(date);
}

/**
 * "Coberturas cadastradas" (Figma 2664-56660): uma linha por arquivo de KMZ
 * da organização (versão ativa), com as ofertas vinculadas e o acesso aos
 * detalhes.
 */
export function SellerCoverageList({
  versions,
  isLoading = false,
  error = null,
  onRetry,
  offerCounts,
  locale,
  onDetails,
}: SellerCoverageListProps) {
  const { t } = useTranslation();

  let content: React.ReactNode;
  if (isLoading && !versions.length) {
    content = (
      <Flex
        align="center"
        justify="center"
        gap="8px"
        py="32px"
        bg="#F8F9FB"
        borderWidth="1px"
        borderColor="#E5E8EE"
        rounded="12px"
        role="status"
      >
        <Spinner size="sm" color="#1F5AFF" />
        <Text color="#5A6478" fontSize="12px">
          {t("SellerCoverage.list.loading")}
        </Text>
      </Flex>
    );
  } else if (error && !versions.length) {
    content = (
      <Stack
        align="center"
        gap="10px"
        py="32px"
        px="16px"
        bg="#FEF2F2"
        borderWidth="1px"
        borderColor="#FECACA"
        rounded="12px"
        textAlign="center"
      >
        <Text role="alert" color="#B91C1C" fontSize="12px" lineHeight="18px">
          {error}
        </Text>
        {onRetry && (
          <Button
            variant="outline"
            size="xs"
            rounded="8px"
            borderColor="#FECACA"
            color="#B91C1C"
            onClick={onRetry}
          >
            {t("SellerCoverage.list.retry")}
          </Button>
        )}
      </Stack>
    );
  } else if (!versions.length) {
    content = (
      <Stack
        align="center"
        gap="10px"
        py="32px"
        px="16px"
        bg="#F8F9FB"
        borderWidth="1px"
        borderColor="#E5E8EE"
        rounded="12px"
        textAlign="center"
      >
        <Icon as={LuMap} boxSize="20px" color="#A0ABB8" />
        <Text color="#5A6478" fontSize="13px" fontWeight={600}>
          {t("SellerCoverage.list.empty")}
        </Text>
        <Text color="#A0ABB8" fontSize="11px" lineHeight="16.5px">
          {t("SellerCoverage.list.emptyHint")}
        </Text>
      </Stack>
    );
  } else {
    content = (
      <Stack as="ul" gap="12px" listStyleType="none">
        {versions.map((version) => {
          const label = coverageVersionLabel(version);
          const count = offerCounts?.get(version.id) ?? 0;
          const meta = version.createdAt
            ? t("SellerCoverage.list.updatedAt", {
                date: formatDate(version.createdAt, locale),
              })
            : null;

          return (
            <Flex
              as="li"
              key={version.id}
              align="center"
              justify="space-between"
              gap="12px"
              p="16px"
              bg="#F8F9FB"
              borderWidth="1px"
              borderColor="#E5E8EE"
              rounded="12px"
            >
              <Stack gap="4px" minW={0}>
                <Text
                  color="#0F1729"
                  fontSize="14px"
                  fontWeight={700}
                  lineHeight="21px"
                  truncate
                >
                  {label}
                </Text>
                <Flex align="flex-end" gap="10px" wrap="wrap">
                  <Text color="#8A9AB5" fontSize="12px" lineHeight="18px">
                    {offerCounts
                      ? t("SellerCoverage.list.offers", { count })
                      : "—"}
                  </Text>
                  {meta && (
                    <Text color="#5A6478" fontSize="11px" lineHeight="16.5px">
                      {meta}
                    </Text>
                  )}
                </Flex>
              </Stack>
              <Button
                variant="plain"
                h="32px"
                px="8px"
                gap="12px"
                flexShrink={0}
                color="#1F5AFF"
                fontSize="11px"
                fontWeight={700}
                aria-label={t("SellerCoverage.list.detailsOf", {
                  name: label,
                })}
                onClick={() => onDetails(version)}
              >
                {t("SellerCoverage.list.details")}
                <Icon as={LuArrowRight} boxSize="15px" />
              </Button>
            </Flex>
          );
        })}
      </Stack>
    );
  }

  return (
    <Stack
      gap="20px"
      p="20px"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="14px"
    >
      <Stack gap="4px">
        <Text
          as="h2"
          color="#0F1729"
          fontSize="15px"
          fontWeight={700}
          lineHeight="22.5px"
        >
          {t("SellerCoverage.list.title")}
        </Text>
        <Text color="#8A9AB5" fontSize="12px" lineHeight="18px">
          {t("SellerCoverage.list.subtitle")}
        </Text>
      </Stack>
      {content}
    </Stack>
  );
}
