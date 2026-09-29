"use client";

import {
  Button,
  Checkbox,
  Flex,
  Icon,
  Input,
  InputGroup,
  NativeSelect,
  Slider,
  Stack,
  Text,
} from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuChevronDown, LuSearch, LuSlidersHorizontal } from "react-icons/lu";

import { BRAZILIAN_UFS } from "@/data/brazilianStates";

import {
  DEFAULT_SEARCH_NETWORK_FILTERS,
  PRICE_MAX,
  PRICE_MIN,
  SERVICE_TYPE_KEYS,
  SLA_OPTIONS,
  SearchNetworkFiltersProps,
  SearchNetworkMinSla,
  SearchNetworkServiceType,
} from "./interface";

const FIELD_STYLES = {
  bg: "#F4F6F9",
  borderWidth: "1px",
  borderColor: "#E5E8EE",
  rounded: "10px",
  fontSize: "13px",
} as const;

function FilterLabel({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <Text
      asChild
      color="#8A9AB5"
      fontSize="10px"
      fontWeight={700}
      lineHeight="15px"
      letterSpacing="0.5px"
      textTransform="uppercase"
    >
      <label htmlFor={htmlFor}>{children}</label>
    </Text>
  );
}

/**
 * Painel de filtros da busca de redes: texto, tipos de serviço, faixa de
 * preço, SLA mínimo e UF. Componente controlado — a página guarda o valor e
 * decide como aplicá-lo à listagem.
 */
export function SearchNetworkFilters({
  value,
  onChange,
}: SearchNetworkFiltersProps) {
  const { t, i18n } = useTranslation();
  const money = new Intl.NumberFormat(
    i18n.language.startsWith("pt") ? "pt-BR" : i18n.language,
    { style: "currency", currency: "BRL", maximumFractionDigits: 0 },
  );

  const update = (patch: Partial<typeof value>) =>
    onChange({ ...value, ...patch });

  const toggleServiceType = (key: SearchNetworkServiceType, checked: boolean) =>
    update({
      serviceTypes: checked
        ? [...value.serviceTypes, key]
        : value.serviceTypes.filter((item) => item !== key),
    });

  return (
    <Stack
      as="aside"
      aria-label={t("SearchNetwork.filters.title")}
      gap="20px"
      p="21px"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="14px"
    >
      <Flex align="center" gap="8px">
        <Icon as={LuSlidersHorizontal} boxSize="15px" color="#1F5AFF" />
        <Text
          as="h3"
          color="#0F1729"
          fontSize="14px"
          fontWeight={700}
          lineHeight="21px"
        >
          {t("SearchNetwork.filters.title")}
        </Text>
      </Flex>

      {/* Buscar */}
      <Stack gap="8px">
        <FilterLabel htmlFor="search-network-filter-text">
          {t("SearchNetwork.filters.search")}
        </FilterLabel>
        <InputGroup
          startElement={<Icon as={LuSearch} boxSize="14px" color="#A0ABB8" />}
          startElementProps={{ ps: "12px" }}
        >
          <Input
            id="search-network-filter-text"
            value={value.search}
            onChange={(event) => update({ search: event.target.value })}
            placeholder={t("SearchNetwork.filters.searchPlaceholder")}
            h="37.5px"
            ps="33px"
            pe="13px"
            color="#0F1729"
            _placeholder={{ color: "#A0ABB8" }}
            {...FIELD_STYLES}
          />
        </InputGroup>
      </Stack>

      {/* Tipo de serviço */}
      <Stack as="fieldset" gap="8px">
        <Text
          as="legend"
          color="#8A9AB5"
          fontSize="10px"
          fontWeight={700}
          lineHeight="15px"
          letterSpacing="0.5px"
          textTransform="uppercase"
          pb="8px"
        >
          {t("SearchNetwork.filters.serviceType")}
        </Text>
        {SERVICE_TYPE_KEYS.map((key) => (
          <Checkbox.Root
            key={key}
            size="sm"
            gap="10px"
            checked={value.serviceTypes.includes(key)}
            onCheckedChange={(event) =>
              toggleServiceType(key, event.checked === true)
            }
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control
              boxSize="16px"
              rounded="4px"
              borderColor="#C4CDD8"
            />
            <Checkbox.Label
              color="#4A5568"
              fontSize="13px"
              fontWeight={500}
              lineHeight="19.5px"
            >
              {t(`SearchNetwork.filters.serviceTypes.${key}`)}
            </Checkbox.Label>
          </Checkbox.Root>
        ))}
      </Stack>

      {/* Faixa de preço */}
      <Stack gap="8px">
        <FilterLabel>{t("SearchNetwork.filters.priceRange")}</FilterLabel>
        <Text
          color="#0F1729"
          fontSize="13px"
          fontWeight={600}
          lineHeight="19.5px"
        >
          {money.format(value.priceRange[0])} –{" "}
          {money.format(value.priceRange[1])}
        </Text>
        <Slider.Root
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={100}
          minStepsBetweenThumbs={1}
          value={value.priceRange}
          onValueChange={(details) =>
            update({ priceRange: [details.value[0], details.value[1]] })
          }
          // O Slider (zag-js) espera um rótulo por alça — a regra do jsx-a11y
          // só conhece o aria-label de string do DOM.
          // eslint-disable-next-line jsx-a11y/aria-proptypes
          aria-label={[
            t("SearchNetwork.filters.priceMin"),
            t("SearchNetwork.filters.priceMax"),
          ]}
          size="sm"
        >
          <Slider.Control>
            <Slider.Track h="4px" bg="#C4CDD8">
              <Slider.Range bg="#1F5AFF" />
            </Slider.Track>
            <Slider.Thumbs boxSize="12px" bg="#1F5AFF" borderColor="#1F5AFF" />
          </Slider.Control>
        </Slider.Root>
        <Flex
          justify="space-between"
          color="#A0ABB8"
          fontSize="11px"
          lineHeight="16.5px"
        >
          <Text>{money.format(PRICE_MIN)}</Text>
          <Text>{money.format(PRICE_MAX)}</Text>
        </Flex>
      </Stack>

      {/* SLA mínimo */}
      <Stack gap="8px">
        <FilterLabel htmlFor="search-network-filter-sla">
          {t("SearchNetwork.filters.minSla")}
        </FilterLabel>
        <NativeSelect.Root>
          <NativeSelect.Field
            id="search-network-filter-sla"
            value={value.minSla}
            onChange={(event) =>
              update({ minSla: event.target.value as SearchNetworkMinSla })
            }
            h="37.5px"
            ps="13px"
            color="#5A6478"
            {...FIELD_STYLES}
          >
            {SLA_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {t(
                  `SearchNetwork.filters.slaOptions.${option.replace(".", "_")}`,
                )}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator>
            <LuChevronDown color="#A0ABB8" />
          </NativeSelect.Indicator>
        </NativeSelect.Root>
      </Stack>

      {/* Estado */}
      <Stack gap="8px">
        <FilterLabel htmlFor="search-network-filter-state">
          {t("SearchNetwork.filters.state")}
        </FilterLabel>
        <NativeSelect.Root>
          <NativeSelect.Field
            id="search-network-filter-state"
            value={value.stateCode}
            onChange={(event) => update({ stateCode: event.target.value })}
            h="37.5px"
            ps="13px"
            color="#5A6478"
            fontWeight={500}
            {...FIELD_STYLES}
          >
            <option value="">{t("SearchNetwork.filters.allStates")}</option>
            {BRAZILIAN_UFS.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator>
            <LuChevronDown color="#A0ABB8" />
          </NativeSelect.Indicator>
        </NativeSelect.Root>
      </Stack>

      <Button
        variant="plain"
        h="auto"
        py="9px"
        px="13px"
        borderWidth="1px"
        borderColor="#C7D8FF"
        rounded="10px"
        color="#1F5AFF"
        fontSize="13px"
        fontWeight={600}
        lineHeight="19.5px"
        _hover={{ bg: "#EEF3FF" }}
        onClick={() => onChange(DEFAULT_SEARCH_NETWORK_FILTERS)}
      >
        {t("SearchNetwork.filters.clear")}
      </Button>
    </Stack>
  );
}
