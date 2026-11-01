"use client";

import {
  Box,
  Button,
  Flex,
  Icon,
  Input,
  InputGroup,
  Stack,
} from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuFilter, LuSearch } from "react-icons/lu";

import ProposalsStatusFilter from "@/components/ProposalsStatusFilter";

import { ServiceOrdersToolbarProps } from "./interface";

/**
 * Busca e "Filtros" das listas de ordens de serviço (Figma 3108-94155). Os
 * filtros abrem os status em abas, com a contagem de cada um.
 */
export function ServiceOrdersToolbar<T extends string>({
  search,
  onSearchChange,
  filterLabel,
  options,
  status,
  onStatusChange,
}: ServiceOrdersToolbarProps<T>) {
  const { t } = useTranslation();
  const [showFilters, setShowFilters] = React.useState(false);
  const filtersId = React.useId();
  // Um filtro escolhido fica visível mesmo com o painel fechado.
  const isFiltered = status !== options[0]?.value;

  return (
    <Stack gap="12px">
      <Flex gap="12px">
        <InputGroup
          flex="1"
          startElement={<Icon as={LuSearch} boxSize="14px" color="#A0ABB8" />}
          startElementProps={{ ps: "14px" }}
        >
          <Input
            type="search"
            h="42px"
            ps="36px"
            pe="16px"
            bg="white"
            borderWidth="1px"
            borderColor="#E5E8EE"
            rounded="14px"
            color="#0F1729"
            fontSize="13px"
            focusRingColor="#1F5AFF"
            _placeholder={{ color: "#A0ABB8" }}
            placeholder={t("ServiceOrders.search")}
            aria-label={t("ServiceOrders.search")}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </InputGroup>
        <Button
          variant="plain"
          h="42px"
          px="12px"
          gap="8px"
          bg={showFilters || isFiltered ? "#EEF3FF" : "white"}
          borderWidth="1px"
          borderColor={showFilters || isFiltered ? "#C7D8FF" : "#E5E8EE"}
          rounded="15px"
          color="#5A6478"
          fontSize="13px"
          fontWeight={500}
          lineHeight="19.5px"
          aria-expanded={showFilters}
          aria-controls={filtersId}
          _hover={{ bg: "#F4F6F9" }}
          onClick={() => setShowFilters((current) => !current)}
        >
          <Icon as={LuFilter} boxSize="14px" />
          {t("ServiceOrders.filters")}
        </Button>
      </Flex>

      {(showFilters || isFiltered) && (
        <Box id={filtersId}>
          <ProposalsStatusFilter
            label={filterLabel}
            options={options}
            value={status}
            onChange={onStatusChange}
          />
        </Box>
      )}
    </Stack>
  );
}
