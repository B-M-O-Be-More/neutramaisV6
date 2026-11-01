"use client";

import {
  Combobox,
  Flex,
  Icon,
  Portal,
  Spinner,
  Stack,
  Text,
  useListCollection,
} from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuMapPin, LuSearch } from "react-icons/lu";

import {
  ADDRESS_SEARCH_MIN_LENGTH,
  useAddressSearch,
} from "@/hooks/useAddressSearch";
import type { GeocodingResult } from "@/services/mapboxGeocoding.service";

import { AddressAutocompleteProps } from "./interface";

/**
 * Campo de endereço com sugestões do Mapbox (combobox acessível: setas,
 * Enter e Esc). Digitar desfaz a escolha anterior; escolher um item devolve
 * o endereço com as coordenadas.
 */
export function AddressAutocomplete({
  id,
  label,
  labelHint,
  placeholder,
  inputValue,
  onInputChange,
  onSelect,
  error,
  hint,
  endAction,
  portalled = true,
}: AddressAutocompleteProps) {
  const { t } = useTranslation();
  // O texto do campo fica com o próprio combobox (não controlado): controlar
  // pelo formulário atrasa um render a cada tecla e o combobox volta ao valor
  // anterior, perdendo letras de quem digita rápido. Aqui só guardamos o que
  // foi digitado, para buscar.
  const [query, setQuery] = React.useState(inputValue);
  const search = useAddressSearch(query);

  const { collection, set } = useListCollection<GeocodingResult>({
    initialItems: [],
    itemToString: (item) => item.label,
    itemToValue: (item) => item.id,
  });

  // As sugestões vêm do servidor: a lista é trocada, nunca filtrada aqui.
  React.useEffect(() => {
    set(search.results);
  }, [search.results, set]);

  const helper = search.isUnavailable
    ? t("SellerOfferCreate.coverage.locationUnavailable")
    : search.hasError
      ? t("SellerOfferCreate.coverage.locationSearchError")
      : hint;
  const describedBy =
    [error && `${id}-error`, helper && `${id}-helper`]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <Stack gap={0}>
      <Combobox.Root
        collection={collection}
        defaultInputValue={inputValue}
        onInputValueChange={(details) => {
          // A seleção também muda o texto ("item-select"): só digitar ou
          // limpar busca de novo e desfaz a escolha.
          if (
            details.reason === "input-change" ||
            details.reason === "clear-trigger"
          ) {
            setQuery(details.inputValue);
            onInputChange(details.inputValue);
          }
        }}
        onValueChange={(details) => {
          const item = details.items[0];
          if (item) onSelect(item);
        }}
        inputBehavior="none"
        selectionBehavior="replace"
        allowCustomValue
        openOnClick={false}
        openOnChange={(details) =>
          details.inputValue.trim().length >= ADDRESS_SEARCH_MIN_LENGTH
        }
        disabled={search.isUnavailable}
        invalid={!!error}
        positioning={{ sameWidth: true, gutter: 4 }}
        ids={{ input: id }}
      >
        <Combobox.Label
          pb="6px"
          color="#0F1729"
          fontSize="14px"
          fontWeight={700}
          lineHeight="21px"
        >
          {label}
          {labelHint && (
            <Text
              as="span"
              ms="6px"
              color="#A0ABB8"
              fontSize="14px"
              fontWeight={400}
            >
              {labelHint}
            </Text>
          )}
        </Combobox.Label>

        {/* Ações na mesma linha do campo, alinhadas a ele (não ao rótulo). */}
        <Flex align="center" gap="8px">
          <Combobox.Control flex="1" minW={0}>
            <Combobox.Input
              placeholder={placeholder}
              aria-describedby={describedBy}
              h="47px"
              ps="40px"
              pe="40px"
              bg="#F8F9FB"
              borderWidth="1px"
              borderColor={error ? "#EF4444" : "#E5E8EE"}
              rounded="14px"
              fontSize="14px"
              color="#0F1729"
              focusRingColor="#8B5CF6"
              _placeholder={{ color: "rgba(15,23,41,0.5)" }}
            />
            <Flex
              position="absolute"
              insetStart="15px"
              top="0"
              h="47px"
              align="center"
              pointerEvents="none"
            >
              <Icon as={LuSearch} boxSize="14px" color="#A0ABB8" />
            </Flex>
            <Combobox.IndicatorGroup pe="12px">
              {search.isLoading && (
                <Spinner
                  size="xs"
                  color="#8B5CF6"
                  aria-label={t("SellerOfferCreate.coverage.locationSearching")}
                />
              )}
              <Combobox.ClearTrigger
                aria-label={t("SellerOfferCreate.coverage.locationClear")}
              />
            </Combobox.IndicatorGroup>
          </Combobox.Control>
          {endAction}
        </Flex>

        <Portal disabled={!portalled}>
          <Combobox.Positioner>
            <Combobox.Content rounded="12px" py="4px">
              <Combobox.Empty
                px="12px"
                py="10px"
                color="#8A9AB5"
                fontSize="13px"
              >
                {search.isLoading
                  ? t("SellerOfferCreate.coverage.locationSearching")
                  : t("SellerOfferCreate.coverage.locationNoResults")}
              </Combobox.Empty>
              {collection.items.map((item) => (
                <Combobox.Item
                  key={item.id}
                  item={item}
                  gap="10px"
                  px="12px"
                  py="9px"
                  rounded="8px"
                  cursor="pointer"
                  _highlighted={{ bg: "#F3EEFF" }}
                >
                  <Icon
                    as={LuMapPin}
                    boxSize="14px"
                    color="#8B5CF6"
                    flexShrink={0}
                  />
                  <Combobox.ItemText
                    color="#0F1729"
                    fontSize="13px"
                    lineHeight="19.5px"
                  >
                    {item.label}
                  </Combobox.ItemText>
                </Combobox.Item>
              ))}
            </Combobox.Content>
          </Combobox.Positioner>
        </Portal>
      </Combobox.Root>

      {error && (
        <Text
          id={`${id}-error`}
          pt="4px"
          color="#EF4444"
          fontSize="12px"
          lineHeight="18px"
        >
          {error}
        </Text>
      )}
      {helper && (
        <Text
          id={`${id}-helper`}
          pt="4px"
          color="#A0ABB8"
          fontSize="11px"
          lineHeight="16.5px"
        >
          {helper}
        </Text>
      )}
    </Stack>
  );
}
