"use client";

import {
  Flex,
  Icon,
  Input,
  InputGroup,
  NativeSelect,
  Text,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuChevronDown, LuSearch } from "react-icons/lu";

import type { AdminKycQueueFilters } from "@/hooks/useAdminKycQueue";
import {
  KYC_QUEUE_STATUS_FILTERS,
  type AdminOrganizationType,
  type KycQueueStatusFilter,
} from "@/services/admin.service";

import { AdminOrganizationFiltersProps } from "./interface";

const TYPES: AdminOrganizationType[] = ["seller", "buyer"];

const FIELD_STYLES = {
  h: "40px",
  bg: "white",
  borderWidth: "1px",
  borderColor: "#E5E8EE",
  rounded: "10px",
  fontSize: "12.5px",
  color: "#5A6478",
} as const;

/**
 * Busca e filtros da fila de KYC. Todos vão para a API
 * (`GET /admin/kyc/queue`); a página atrasa a busca enquanto se digita.
 */
export function AdminOrganizationFilters({
  value,
  onChange,
  shown,
  total,
}: AdminOrganizationFiltersProps) {
  const { t } = useTranslation();

  const update = (patch: Partial<AdminKycQueueFilters>) =>
    onChange({ ...value, ...patch });

  return (
    <Flex align="center" gap="8px" wrap={{ base: "wrap", lg: "nowrap" }}>
      <InputGroup
        flex="1"
        minW={{ base: "full", lg: "220px" }}
        startElement={<Icon as={LuSearch} boxSize="13px" color="#A0ABB8" />}
        startElementProps={{ ps: "12px" }}
      >
        <Input
          id="admin-organizations-search"
          type="search"
          value={value.search}
          maxLength={100}
          onChange={(event) => update({ search: event.target.value })}
          placeholder={t("Admin.filters.searchPlaceholder")}
          aria-label={t("Admin.filters.search")}
          ps="33px"
          _placeholder={{ color: "#C0C9D8" }}
          {...FIELD_STYLES}
        />
      </InputGroup>

      <NativeSelect.Root w="auto" flexShrink={0}>
        <NativeSelect.Field
          id="admin-organizations-status"
          aria-label={t("Admin.filters.statusLabel")}
          value={value.status}
          onChange={(event) =>
            update({ status: event.target.value as KycQueueStatusFilter | "" })
          }
          ps="12px"
          pe="32px"
          {...FIELD_STYLES}
        >
          <option value="">
            {t("Admin.filters.status", { value: t("Admin.filters.all") })}
          </option>
          {KYC_QUEUE_STATUS_FILTERS.map((status) => (
            <option key={status} value={status}>
              {t("Admin.filters.status", {
                value: t(`Admin.filters.statuses.${status}`),
              })}
            </option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator>
          <LuChevronDown color="#A0ABB8" />
        </NativeSelect.Indicator>
      </NativeSelect.Root>

      <NativeSelect.Root w="auto" flexShrink={0}>
        <NativeSelect.Field
          id="admin-organizations-type"
          aria-label={t("Admin.filters.typeLabel")}
          value={value.type}
          onChange={(event) =>
            update({ type: event.target.value as AdminOrganizationType | "" })
          }
          ps="12px"
          pe="32px"
          {...FIELD_STYLES}
        >
          <option value="">
            {t("Admin.filters.type", { value: t("Admin.filters.all") })}
          </option>
          {TYPES.map((type) => (
            <option key={type} value={type}>
              {t("Admin.filters.type", {
                value: t(`Admin.organization.types.${type}`),
              })}
            </option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator>
          <LuChevronDown color="#A0ABB8" />
        </NativeSelect.Indicator>
      </NativeSelect.Root>

      <Flex
        align="center"
        gap="6px"
        h="40px"
        px="10px"
        bg="white"
        borderWidth="1px"
        borderColor="#E5E8EE"
        rounded="10px"
        flexShrink={0}
      >
        <Input
          id="admin-organizations-from"
          type="date"
          aria-label={t("Admin.filters.from")}
          value={value.dateFrom}
          max={value.dateTo || undefined}
          onChange={(event) => update({ dateFrom: event.target.value })}
          h="30px"
          w="128px"
          px="4px"
          border="none"
          fontSize="12.5px"
          color="#5A6478"
        />
        <Text color="#C0C9D8" fontSize="11.5px">
          {t("Admin.filters.until")}
        </Text>
        <Input
          id="admin-organizations-to"
          type="date"
          aria-label={t("Admin.filters.to")}
          value={value.dateTo}
          min={value.dateFrom || undefined}
          onChange={(event) => update({ dateTo: event.target.value })}
          h="30px"
          w="128px"
          px="4px"
          border="none"
          fontSize="12.5px"
          color="#5A6478"
        />
      </Flex>

      <Text
        color="#C0C9D8"
        fontSize="11.5px"
        lineHeight="17px"
        flexShrink={0}
        aria-live="polite"
        css={{ fontVariantNumeric: "tabular-nums" }}
      >
        {shown}/{total}
      </Text>
    </Flex>
  );
}
