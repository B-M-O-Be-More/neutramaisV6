"use client";

import { chakra, Flex, Icon, Input, InputGroup } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuSearch } from "react-icons/lu";

import { TICKET_FILTERS } from "@/types/tickets";

import { TicketsFiltersProps } from "./interface";

/** Busca por título/ID e abas de status (Figma 3108-101535). */
export function TicketsFilters({
  search,
  onSearchChange,
  filter,
  onFilterChange,
}: TicketsFiltersProps) {
  const { t } = useTranslation();

  return (
    <Flex
      direction={{ base: "column", md: "row" }}
      align={{ base: "stretch", md: "center" }}
      gap="12px"
    >
      <InputGroup
        flex="1"
        maxW={{ md: "384px" }}
        startElement={<Icon as={LuSearch} boxSize="13px" color="#A0ABB8" />}
        startElementProps={{ ps: "14px" }}
      >
        <Input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t("Tickets.searchPlaceholder")}
          aria-label={t("Tickets.searchLabel")}
          h="41.5px"
          ps="36px"
          pe="16px"
          bg="white"
          borderWidth="1px"
          borderColor="#E5E8EE"
          rounded="12px"
          color="#0F1729"
          fontSize="13px"
          _placeholder={{ color: "rgba(9, 9, 11, 0.5)" }}
          _focus={{ borderColor: "#8B5CF6" }}
        />
      </InputGroup>

      <Flex
        role="tablist"
        aria-label={t("Tickets.filters.label")}
        gap="4px"
        p="4px"
        bg="#F4F6F9"
        rounded="12px"
        overflowX="auto"
        alignSelf={{ base: "stretch", md: "auto" }}
      >
        {TICKET_FILTERS.map((option) => {
          const isActive = option === filter;
          return (
            <chakra.button
              key={option}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onFilterChange(option)}
              px="12px"
              py="6px"
              rounded="8px"
              bg={isActive ? "white" : "transparent"}
              boxShadow={
                isActive
                  ? "0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)"
                  : undefined
              }
              color={isActive ? "#0F1729" : "#8A9AB5"}
              fontSize="12px"
              fontWeight={isActive ? 700 : 400}
              lineHeight="18px"
              whiteSpace="nowrap"
              cursor="pointer"
              flexShrink={0}
              _hover={isActive ? undefined : { color: "#5A6478" }}
              _focusVisible={{
                outline: "2px solid #8B5CF6",
                outlineOffset: "2px",
              }}
            >
              {t(`Tickets.filters.${option}`)}
            </chakra.button>
          );
        })}
      </Flex>
    </Flex>
  );
}
