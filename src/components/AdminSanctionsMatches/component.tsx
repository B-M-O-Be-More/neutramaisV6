"use client";

import { Button, Flex, Icon, Skeleton, Stack, Text } from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuFileWarning, LuRefreshCw, LuShieldAlert } from "react-icons/lu";

import { formatDateTime } from "@/functions/formatDateTime";
import type {
  SanctionsDisposition,
  SanctionsMatch,
} from "@/services/admin.service";

import { AdminSanctionsMatchesProps } from "./interface";

// Score 100 = o documento da organização consta na lista (match exato); abaixo
// disso o motor compara a razão social por semelhança.
const EXACT_DOCUMENT_SCORE = 100;

const DISPOSITION_STYLES: Record<
  SanctionsDisposition,
  { bg: string; color: string }
> = {
  pending_review: { bg: "#FFFBEB", color: "#D97706" },
  confirmed: { bg: "#FEF2F2", color: "#EF4444" },
  false_positive: { bg: "#EDFBF5", color: "#10B981" },
};

/**
 * Ocorrências da organização nas listas de sanções (identity-api). Mostra em
 * qual lista bateu e o motivo — documento idêntico ou razão social parecida.
 * A checagem só compara a própria organização: não há sócio, representante
 * nem arquivo do KYC envolvido.
 */
export function AdminSanctionsMatches({
  matches,
  taxId,
  legalName,
  isLoading,
  error,
  onReload,
}: AdminSanctionsMatchesProps) {
  const { t, i18n } = useTranslation();

  const reason = (match: SanctionsMatch) =>
    match.match_score === EXACT_DOCUMENT_SCORE
      ? t("Admin.review.sanctionsMatches.reasons.document", { taxId })
      : match.match_score === null
        ? t("Admin.review.sanctionsMatches.reasons.unknown")
        : t("Admin.review.sanctionsMatches.reasons.name", {
            name: legalName,
            score: match.match_score,
          });

  let content: React.ReactNode;

  if (isLoading) {
    content = (
      <Stack gap="8px" aria-busy="true">
        <Skeleton h="56px" rounded="10px" />
        <Skeleton h="56px" rounded="10px" />
      </Stack>
    );
  } else if (error) {
    content = (
      <Flex align="center" justify="space-between" gap="12px" wrap="wrap">
        <Text color="#991B1B" fontSize="12.5px" lineHeight="19px">
          {t(error)}
        </Text>
        <Button
          variant="outline"
          h="32px"
          px="12px"
          gap="6px"
          rounded="10px"
          borderColor="#E5E8EE"
          color="#5A6478"
          fontSize="12px"
          onClick={onReload}
        >
          <Icon as={LuRefreshCw} boxSize="12px" />
          {t("Admin.review.actions.reload")}
        </Button>
      </Flex>
    );
  } else if (matches.length === 0) {
    // Falhou sem ocorrência: alguma lista não respondeu ou está desatualizada
    // (RN-552 — sem todas as fontes, o resultado não é limpo).
    content = (
      <Text color="#5A6478" fontSize="12.5px" lineHeight="19px">
        {t("Admin.review.sanctionsMatches.empty")}
      </Text>
    );
  } else {
    content = (
      <Stack as="ul" gap="8px" listStyleType="none" m={0} p={0}>
        {matches.map((match) => {
          const disposition = DISPOSITION_STYLES[match.disposition];
          return (
            <Flex
              as="li"
              key={match.check_log_id}
              align={{ base: "flex-start", md: "center" }}
              direction={{ base: "column", md: "row" }}
              gap="12px"
              px="14px"
              py="10px"
              bg="#F8F9FB"
              borderWidth="1px"
              borderColor="#E5E8EE"
              rounded="10px"
            >
              <Text
                as="span"
                minW="64px"
                px="8px"
                py="2px"
                rounded="8px"
                bg="#0F1729"
                color="white"
                fontSize="10px"
                fontWeight={700}
                textAlign="center"
                textTransform="uppercase"
                flexShrink={0}
              >
                {t(`Admin.review.sanctionsMatches.sources.${match.source}`, {
                  defaultValue: match.source,
                })}
              </Text>

              <Stack gap="2px" flex="1" minW={0}>
                <Text
                  color="#0F1729"
                  fontSize="12.5px"
                  fontWeight={600}
                  lineHeight="19px"
                >
                  {reason(match)}
                </Text>
                <Text color="#8A9AB5" fontSize="11.5px" lineHeight="17px">
                  {t("Admin.review.sanctionsMatches.checkedAt", {
                    date: formatDateTime(match.checked_at, i18n.language),
                  })}
                  {match.stale
                    ? ` · ${t("Admin.review.sanctionsMatches.stale")}`
                    : ""}
                </Text>
              </Stack>

              <Text
                as="span"
                px="10px"
                py="3px"
                rounded="10px"
                bg={disposition.bg}
                color={disposition.color}
                fontSize="11px"
                fontWeight={600}
                whiteSpace="nowrap"
                flexShrink={0}
              >
                {t(
                  `Admin.review.sanctionsMatches.dispositions.${match.disposition}`,
                )}
              </Text>
            </Flex>
          );
        })}
      </Stack>
    );
  }

  return (
    <Stack
      as="section"
      gap="12px"
      p="16px"
      bg="white"
      borderWidth="1px"
      borderColor="#FECACA"
      rounded="14px"
      aria-labelledby="admin-sanctions-matches-title"
    >
      <Flex align="flex-start" gap="10px">
        <Icon
          as={matches.length ? LuShieldAlert : LuFileWarning}
          boxSize="15px"
          color="#EF4444"
          mt="2px"
          flexShrink={0}
        />
        <Stack gap="2px">
          <Text
            id="admin-sanctions-matches-title"
            as="h2"
            color="#0F1729"
            fontSize="13.5px"
            fontWeight={700}
            lineHeight="20px"
          >
            {t("Admin.review.sanctionsMatches.title")}
          </Text>
          <Text color="#8A9AB5" fontSize="11.5px" lineHeight="17px">
            {t("Admin.review.sanctionsMatches.subtitle")}
          </Text>
        </Stack>
      </Flex>
      {content}
    </Stack>
  );
}
