"use client";

import { Flex, Icon, Input, InputGroup, Stack, Text } from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuSearch } from "react-icons/lu";

import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import ReturnCard from "@/components/ReturnCard";
import ReturnsStats from "@/components/ReturnsStats";
import { useReturns } from "@/contexts/ReturnsContext";
import { currencyLocale } from "@/functions/currencyLocale";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

function ReturnsContent() {
  const { t, i18n } = useTranslation();
  const locale = currencyLocale(i18n.language);
  const { returns, summary, now } = useReturns();
  const [search, setSearch] = React.useState("");
  const query = useDebouncedValue(search.trim().toLowerCase(), 300);

  const visibleReturns = query
    ? returns.filter((item) =>
        [item.id, item.orderId, item.productName, item.sellerName].some(
          (value) => value.toLowerCase().includes(query),
        ),
      )
    : returns;

  return (
    <Stack
      maxW="1280px"
      px={{ base: 4, md: "32px" }}
      py={{ base: 6, md: "28px" }}
      gap="24px"
    >
      <Stack gap="4px">
        <Text
          as="h1"
          color="#0F1729"
          fontSize="24px"
          fontWeight={800}
          lineHeight="36px"
        >
          {t("Returns.title")}
        </Text>
        <Text color="#8A9AB5" fontSize="13px" lineHeight="19.5px">
          {t("Returns.subtitle")}
        </Text>
      </Stack>

      <ReturnsStats data={summary} locale={locale} />

      <InputGroup
        startElement={<Icon as={LuSearch} boxSize="14px" color="#5A6478" />}
        startElementProps={{ ps: "16px" }}
      >
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("Returns.searchPlaceholder")}
          aria-label={t("Returns.searchLabel")}
          h="44px"
          ps="38px"
          pe="16px"
          bg="white"
          borderWidth="1px"
          borderColor="#E5E8EE"
          rounded="12px"
          color="#0F1729"
          fontSize="12px"
          _placeholder={{ color: "rgba(9, 9, 11, 0.5)" }}
          _focus={{ borderColor: "#1F5AFF" }}
        />
      </InputGroup>

      {visibleReturns.length === 0 ? (
        <Flex
          align="center"
          justify="center"
          minH="121px"
          px="24px"
          py="20px"
          bg="white"
          borderWidth="1px"
          borderColor="#E5E8EE"
          rounded="12px"
          textAlign="center"
        >
          <Text
            color="#0F1729"
            fontSize="15px"
            fontWeight={700}
            lineHeight="22.5px"
          >
            {t(query ? "Returns.emptyFiltered" : "Returns.empty")}
          </Text>
        </Flex>
      ) : (
        <Stack gap="14px">
          {visibleReturns.map((item) => (
            <ReturnCard key={item.id} item={item} locale={locale} now={now} />
          ))}
        </Stack>
      )}
    </Stack>
  );
}

// Devoluções e trocas do buyer (Figma 2943-31366): contadores, busca e a
// fila com status, valor e prazo do seller. A API de devoluções ainda não
// existe — o ReturnsContext (layout) guarda os dados do design.
export default function ReturnsPage() {
  return (
    <AuthenticatedLayout>
      <ReturnsContent />
    </AuthenticatedLayout>
  );
}
