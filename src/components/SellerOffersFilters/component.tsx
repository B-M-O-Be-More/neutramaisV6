"use client";

import { chakra, Flex, Input, NativeSelect, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuChevronDown } from "react-icons/lu";

import {
  SellerOffersFiltersProps,
  SellerOffersStatusFilter,
} from "./interface";

// Ordem do design: Todas, Publicada, Pausadas, Rascunhos, Despublicadas,
// Arquivadas.
const STATUS_FILTERS: SellerOffersStatusFilter[] = [
  "all",
  "published",
  "paused",
  "draft",
  "unpublished",
  "archived",
];

/**
 * Busca por nome, categoria (especificação) e abas de status do catálogo do
 * seller. Todos vão para a API (`GET /productOffering`); a página atrasa a
 * busca enquanto se digita.
 */
export function SellerOffersFilters({
  value,
  onChange,
  specifications,
  counts,
}: SellerOffersFiltersProps) {
  const { t } = useTranslation();

  const update = (patch: Partial<typeof value>) =>
    onChange({ ...value, ...patch });

  return (
    <Flex align="center" gap="12px" wrap="wrap">
      <Input
        id="seller-offers-search"
        type="search"
        value={value.search}
        maxLength={255}
        onChange={(event) => update({ search: event.target.value })}
        placeholder={t("SellerOffers.filters.searchPlaceholder")}
        aria-label={t("SellerOffers.filters.search")}
        w={{ base: "full", md: "258px" }}
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
          id="seller-offers-category"
          aria-label={t("SellerOffers.filters.category")}
          value={value.specificationId}
          onChange={(event) => update({ specificationId: event.target.value })}
          h="38px"
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
          <option value="">{t("SellerOffers.filters.category")}</option>
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
        aria-label={t("SellerOffers.filters.statusLabel")}
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
                {t(`SellerOffers.filters.statuses.${status}`)}
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
