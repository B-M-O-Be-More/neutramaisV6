"use client";

import {
  Button,
  Checkbox,
  Flex,
  Icon,
  Input,
  InputGroup,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuSearch } from "react-icons/lu";

import { COVERAGE_AREAS_MAX } from "@/functions/coverageAreas";
import { formatArea } from "@/functions/formatArea";

import { CoverageAreaListProps } from "./interface";

/** Com mais áreas que isso, aparece a busca por nome. */
const SEARCH_FROM = 6;

const linkButton = {
  variant: "plain",
  h: "auto",
  minW: "auto",
  p: 0,
  color: "#1F5AFF",
  fontSize: "12px",
  fontWeight: 600,
  _disabled: { color: "#A0ABB8", cursor: "not-allowed" },
} as const;

/**
 * Áreas do KMZ no modal "Escolher cobertura" (modo por áreas): cada área com
 * polígono vira uma caixa de seleção, com nome, pasta e tamanho. A busca
 * filtra por nome ou pasta; "Selecionar todas" e "Limpar" valem para as
 * áreas filtradas. O mapa ao lado mostra as escolhidas em azul.
 */
export function CoverageAreaList({
  areas,
  selected,
  onChange,
  isLoading,
  error,
  truncated,
  locale,
}: CoverageAreaListProps) {
  const { t } = useTranslation();
  const [query, setQuery] = React.useState("");

  const chosen = React.useMemo(() => new Set(selected), [selected]);
  const term = query.trim().toLocaleLowerCase(locale);
  const visible = term
    ? areas.filter((area) =>
        `${area.name} ${area.folder}`.toLocaleLowerCase(locale).includes(term),
      )
    : areas;
  const allVisibleChosen =
    visible.length > 0 && visible.every((area) => chosen.has(area.index));

  const toggle = (index: number, checked: boolean) =>
    onChange(
      checked
        ? [...selected, index]
        : selected.filter((current) => current !== index),
    );

  if (isLoading) {
    return (
      <Flex role="status" align="center" gap="8px" py="8px">
        <Spinner size="sm" color="#1F5AFF" />
        <Text color="#5A6478" fontSize="12px" lineHeight="18px">
          {t("SellerOfferCreate.coverageScope.areas.loading")}
        </Text>
      </Flex>
    );
  }
  if (error) {
    return (
      <Text role="alert" color="#EF4444" fontSize="12px" lineHeight="18px">
        {t(error)}
      </Text>
    );
  }
  if (!areas.length) {
    return (
      <Text color="#5A6478" fontSize="12px" lineHeight="18px">
        {t("SellerOfferCreate.coverageScope.areas.empty")}
      </Text>
    );
  }

  return (
    <Stack gap="10px">
      <Flex align="baseline" justify="space-between" gap="8px">
        <Text
          id="coverage-areas-title"
          color="#0F1729"
          fontSize="13px"
          fontWeight={700}
          lineHeight="19.5px"
        >
          {t("SellerOfferCreate.coverageScope.areas.title", {
            count: areas.length,
          })}
        </Text>
        <Text color="#5A6478" fontSize="12px" lineHeight="18px">
          {t("SellerOfferCreate.coverageScope.areas.selectedCount", {
            count: selected.length,
          })}
        </Text>
      </Flex>

      {areas.length > SEARCH_FROM && (
        <InputGroup
          startElement={<Icon as={LuSearch} boxSize="14px" color="#8A9AB5" />}
        >
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("SellerOfferCreate.coverageScope.areas.search")}
            aria-label={t("SellerOfferCreate.coverageScope.areas.search")}
            h="38px"
            bg="#F8F9FB"
            borderColor="#E5E8EE"
            rounded="10px"
            fontSize="13px"
            color="#0F1729"
            focusRingColor="#1F5AFF"
            _placeholder={{ color: "rgba(15,23,41,0.5)" }}
          />
        </InputGroup>
      )}

      <Flex gap="16px">
        <Button
          {...linkButton}
          disabled={!visible.length || allVisibleChosen}
          onClick={() =>
            onChange([
              ...selected,
              ...visible
                .map((area) => area.index)
                .filter((index) => !chosen.has(index)),
            ])
          }
        >
          {t("SellerOfferCreate.coverageScope.areas.selectAll")}
        </Button>
        <Button
          {...linkButton}
          disabled={!visible.some((area) => chosen.has(area.index))}
          onClick={() => {
            const hidden = new Set(visible.map((area) => area.index));
            onChange(selected.filter((index) => !hidden.has(index)));
          }}
        >
          {t("SellerOfferCreate.coverageScope.areas.clear")}
        </Button>
      </Flex>

      <Stack
        as="ul"
        aria-labelledby="coverage-areas-title"
        gap="6px"
        maxH="300px"
        overflowY="auto"
        pe="2px"
      >
        {visible.map((area) => {
          const checked = chosen.has(area.index);
          const name =
            area.name ||
            t("SellerOfferCreate.coverageScope.areas.unnamed", {
              number: area.index + 1,
            });
          return (
            <Flex
              as="li"
              key={area.index}
              px="10px"
              py="8px"
              bg={checked ? "#EEF3FF" : "white"}
              borderWidth="1px"
              borderColor={checked ? "#1F5AFF" : "#E5E8EE"}
              rounded="12px"
            >
              <Checkbox.Root
                checked={checked}
                onCheckedChange={(details) =>
                  toggle(area.index, details.checked === true)
                }
                alignItems="flex-start"
                gap="10px"
                w="full"
                minW={0}
                cursor="pointer"
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control
                  mt="2px"
                  borderColor={checked ? "#1F5AFF" : "#C4CDD8"}
                  _checked={{ bg: "#1F5AFF", borderColor: "#1F5AFF" }}
                />
                <Stack gap={0} minW={0}>
                  <Checkbox.Label
                    color="#0F1729"
                    fontSize="13px"
                    fontWeight={600}
                    lineHeight="19.5px"
                    truncate
                  >
                    {name}
                  </Checkbox.Label>
                  <Text
                    color="#5A6478"
                    fontSize="11px"
                    lineHeight="16.5px"
                    truncate
                  >
                    {[area.folder, formatArea(area.areaKm2, locale)]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                </Stack>
              </Checkbox.Root>
            </Flex>
          );
        })}
        {!visible.length && (
          <Text as="li" color="#5A6478" fontSize="12px" lineHeight="18px">
            {t("SellerOfferCreate.coverageScope.areas.noMatch")}
          </Text>
        )}
      </Stack>

      {selected.length > COVERAGE_AREAS_MAX && (
        <Text role="alert" color="#EF4444" fontSize="12px" lineHeight="18px">
          {t("SellerOfferCreate.coverageScope.areas.tooMany", {
            max: COVERAGE_AREAS_MAX,
          })}
        </Text>
      )}
      {truncated && (
        <Text color="#D97706" fontSize="11px" lineHeight="16.5px">
          {t("SellerOfferCreate.coverageScope.areas.truncated")}
        </Text>
      )}
    </Stack>
  );
}
