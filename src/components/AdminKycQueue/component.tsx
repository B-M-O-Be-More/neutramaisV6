"use client";

import {
  Button,
  Flex,
  Icon,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import React from "react";
import { Trans, useTranslation } from "react-i18next";
import type { IconType } from "react-icons";
import { LuCircleAlert, LuCircleX, LuClock, LuFileText } from "react-icons/lu";

import AdminOrganizationCard from "@/components/AdminOrganizationCard";
import AdminOrganizationFilters from "@/components/AdminOrganizationFilters";

import { AdminKycQueueProps } from "./interface";

interface SummaryItem {
  key: "total" | "pending" | "rejected";
  icon: IconType;
  color: string;
}

const SUMMARY: SummaryItem[] = [
  { key: "total", icon: LuFileText, color: "#0F1729" },
  { key: "pending", icon: LuClock, color: "#D97706" },
  { key: "rejected", icon: LuCircleX, color: "#EF4444" },
];

/**
 * Aba KYC / Compliance do painel administrativo: aviso de SLA, indicadores e
 * a fila de solicitações (`GET /admin/kyc/queue`) com filtros.
 */
export function AdminKycQueue({
  filters,
  onFiltersChange,
  queue,
}: AdminKycQueueProps) {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const {
    items,
    total,
    indicators,
    isLoading,
    isLoadingMore,
    error,
    loadMore,
    refetch,
  } = queue;

  return (
    <Stack gap="16px">
      <Flex
        align="flex-start"
        gap="12px"
        px="20px"
        py="14px"
        bg="#FFFBEB"
        borderWidth="1px"
        borderColor="#FDE68A"
        rounded="14px"
      >
        <Icon
          as={LuCircleAlert}
          boxSize="15px"
          color="#D97706"
          mt="2px"
          flexShrink={0}
        />
        <Text color="#92400E" fontSize="12px" lineHeight="18px">
          <Trans
            i18nKey="Admin.kyc.slaNotice"
            components={{ strong: <Text as="span" fontWeight={700} /> }}
          />
        </Text>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap="16px">
        {SUMMARY.map((item) => (
          <Stack
            key={item.key}
            gap={0}
            px="20px"
            py="16px"
            bg="white"
            borderWidth="1px"
            borderColor="#E5E8EE"
            rounded="14px"
          >
            <Flex align="center" gap="6px" color={item.color}>
              <Icon as={item.icon} boxSize="14px" />
              <Text fontSize="12px" fontWeight={600} lineHeight="18px">
                {t(`Admin.kyc.summary.${item.key}.title`)}
              </Text>
            </Flex>
            <Text
              pt="4px"
              color={item.color}
              fontSize="26px"
              fontWeight={800}
              lineHeight="39px"
            >
              {indicators ? indicators[item.key] : "—"}
            </Text>
            <Text color="#A0ABB8" fontSize="11px" lineHeight="16.5px">
              {t(`Admin.kyc.summary.${item.key}.caption`)}
            </Text>
          </Stack>
        ))}
      </SimpleGrid>

      <AdminOrganizationFilters
        value={filters}
        onChange={(next) => {
          onFiltersChange(next);
          setExpandedId(null);
        }}
        shown={items.length}
        total={total}
      />

      {isLoading ? (
        <Flex justify="center" py="48px">
          <Spinner
            color="#1F5AFF"
            size="lg"
            aria-label={t("Admin.kyc.loading")}
          />
        </Flex>
      ) : error ? (
        <Stack
          align="center"
          gap="12px"
          py="40px"
          bg="white"
          borderWidth="1px"
          borderColor="#E5E8EE"
          rounded="14px"
          textAlign="center"
        >
          <Text color="#0F1729" fontSize="14px" fontWeight={600}>
            {t(
              error === "forbidden"
                ? "Admin.kyc.errors.forbidden"
                : "Admin.kyc.errors.failed",
            )}
          </Text>
          {error === "failed" && (
            <Button
              variant="outline"
              h="36px"
              px="14px"
              rounded="10px"
              borderColor="#E5E8EE"
              color="#1F5AFF"
              fontSize="13px"
              fontWeight={600}
              onClick={refetch}
            >
              {t("Admin.kyc.retry")}
            </Button>
          )}
        </Stack>
      ) : items.length === 0 ? (
        <Text
          py="40px"
          bg="white"
          borderWidth="1px"
          borderColor="#E5E8EE"
          rounded="14px"
          textAlign="center"
          color="#8A9AB5"
          fontSize="13px"
        >
          {t("Admin.kyc.empty")}
        </Text>
      ) : (
        <Stack gap="12px">
          {items.map((request) => (
            <AdminOrganizationCard
              key={request.organization_id}
              request={request}
              expanded={expandedId === request.organization_id}
              onToggle={() =>
                setExpandedId((current) =>
                  current === request.organization_id
                    ? null
                    : request.organization_id,
                )
              }
            />
          ))}
        </Stack>
      )}

      {!isLoading && !error && items.length < total && (
        <Button
          alignSelf="center"
          variant="outline"
          h="38px"
          px="16px"
          rounded="10px"
          borderColor="#E5E8EE"
          color="#1F5AFF"
          fontSize="13px"
          fontWeight={600}
          loading={isLoadingMore}
          onClick={loadMore}
        >
          {t("Admin.kyc.loadMore", { loaded: items.length, total })}
        </Button>
      )}
    </Stack>
  );
}
