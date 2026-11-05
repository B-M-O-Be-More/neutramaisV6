"use client";

import { chakra, Flex, Input, NativeSelect, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuChevronDown } from "react-icons/lu";

import { SELLER_ORDER_STATUSES } from "@/types/sellerOrders";

import {
  SellerOrdersFiltersProps,
  SellerOrdersStatusFilter,
} from "./interface";

const STATUS_FILTERS: SellerOrdersStatusFilter[] = [
  "all",
  ...SELLER_ORDER_STATUSES,
];

/**
 * Busca, categoria e abas de status da fila de pedidos do seller (Figma
 * 2948-51188).
 */
export function SellerOrdersFilters({
  value,
  onChange,
  specifications,
  counts,
}: SellerOrdersFiltersProps) {
  const { t } = useTranslation();

  const update = (patch: Partial<typeof value>) =>
    onChange({ ...value, ...patch });

  return (
    <Flex align="center" gap="12px" wrap="wrap">
      <Input
        id="seller-orders-search"
        type="search"
        value={value.search}
        maxLength={255}
        onChange={(event) => update({ search: event.target.value })}
        placeholder={t("SellerOrders.filters.searchPlaceholder")}
        aria-label={t("SellerOrders.filters.search")}
        flex={{ base: "1 1 100%", md: "1 1 240px" }}
        minW={0}
        h="42px"
        px="17px"
        bg="white"
        borderWidth="1px"
        borderColor="#E5E8EE"
        rounded="14px"
        fontSize="13px"
        color="#0F1729"
        _placeholder={{ color: "rgba(10,10,10,0.5)" }}
      />

      <NativeSelect.Root w="auto" flexShrink={0}>
        <NativeSelect.Field
          id="seller-orders-category"
          aria-label={t("SellerOrders.filters.category")}
          value={value.specificationId}
          onChange={(event) => update({ specificationId: event.target.value })}
          h="43px"
          ps="13px"
          pe="36px"
          bg="white"
          borderWidth="1px"
          borderColor="#E5E8EE"
          rounded="14px"
          fontSize="14px"
          fontWeight={500}
          color={value.specificationId ? "#5A6478" : "#98A6B3"}
        >
          <option value="">{t("SellerOrders.filters.filterBy")}</option>
          {specifications.map((specification) => (
            <option key={specification.id} value={specification.id}>
              {specification.name}
            </option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator>
          <LuChevronDown color="#98A6B3" />
        </NativeSelect.Indicator>
      </NativeSelect.Root>

      <Flex
        role="tablist"
        aria-label={t("SellerOrders.filters.statusLabel")}
        gap="8px"
        wrap="wrap"
      >
        {STATUS_FILTERS.map((status) => {
          const isActive = status === value.status;
          const count = status === "all" ? undefined : counts?.[status];
          return (
            <chakra.button
              key={status}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => update({ status })}
              display="flex"
              alignItems="center"
              gap="8px"
              h="41px"
              px="17px"
              py="7px"
              rounded="10px"
              borderWidth="1px"
              borderColor={isActive ? "#1F5AFF" : "#E5E8EE"}
              bg={isActive ? "#1F5AFF" : "white"}
              color={isActive ? "white" : "#5A6478"}
              cursor="pointer"
              flexShrink={0}
              _hover={isActive ? undefined : { bg: "#F4F6F9" }}
              _focusVisible={{
                outline: "2px solid #1F5AFF",
                outlineOffset: "2px",
              }}
            >
              <Text
                fontSize="13px"
                fontWeight={isActive ? 700 : 400}
                lineHeight="19.5px"
                whiteSpace="nowrap"
              >
                {t(`SellerOrders.filters.statuses.${status}`)}
              </Text>
              {count ? (
                <Text
                  as="span"
                  px="6px"
                  rounded="full"
                  bg={isActive ? "rgba(255,255,255,0.2)" : "#F4F6F9"}
                  color={isActive ? "white" : "#8A9AB5"}
                  fontSize="10px"
                  fontWeight={700}
                  lineHeight="16px"
                >
                  {count}
                </Text>
              ) : null}
            </chakra.button>
          );
        })}
      </Flex>
    </Flex>
  );
}
