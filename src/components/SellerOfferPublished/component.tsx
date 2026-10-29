"use client";

import { Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useTranslation } from "react-i18next";
import { LuArrowLeft, LuCircleCheck, LuTriangleAlert } from "react-icons/lu";

import { SellerOfferPublishedProps } from "./interface";

/**
 * Confirmação depois de publicar a oferta (Figma 2074-55740): selo de
 * sucesso, resumo da oferta e atalho para Minhas Ofertas. Avisos da
 * publicação (ex.: patrocínio não aplicado) aparecem abaixo do resumo.
 */
export function SellerOfferPublished({ offer }: SellerOfferPublishedProps) {
  const { t } = useTranslation();

  const rows = [
    { key: "offer", value: offer.name },
    { key: "category", value: offer.categoryLabel },
    { key: "price", value: offer.price },
    { key: "status", value: t("SellerOfferCreate.published.statusValue") },
    { key: "acceptanceSla", value: offer.acceptanceSla },
  ];

  return (
    <Stack
      as="section"
      aria-labelledby="offer-published-title"
      align="center"
      gap="24px"
      px={{ base: "20px", md: "1px" }}
      py="49px"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="16px"
      textAlign="center"
    >
      <Flex
        align="center"
        justify="center"
        boxSize="80px"
        bg="#EDFBF5"
        borderWidth="2px"
        borderColor="#10B981"
        rounded="full"
      >
        <Icon as={LuCircleCheck} boxSize="38px" color="#10B981" />
      </Flex>

      <Stack gap="8px" maxW="560px">
        <Text
          id="offer-published-title"
          as="h2"
          color="#0F1729"
          fontSize="24px"
          fontWeight={800}
          lineHeight="36px"
        >
          {t("SellerOfferCreate.published.title")}
        </Text>
        <Text color="#8A9AB5" fontSize="14px" lineHeight="21px" role="status">
          {t("SellerOfferCreate.published.subtitle")}
        </Text>
      </Stack>

      <Stack
        as="dl"
        gap={0}
        w="full"
        maxW="448px"
        bg="#F8F9FB"
        borderWidth="1px"
        borderColor="#E5E8EE"
        rounded="14px"
        overflow="hidden"
        textAlign="start"
      >
        {rows.map((row, index) => (
          <Flex
            key={row.key}
            align="center"
            justify="space-between"
            gap="16px"
            px="20px"
            py="12px"
            borderBottomWidth={index < rows.length - 1 ? "1px" : 0}
            borderColor="#F4F6F9"
          >
            <Text as="dt" color="#8A9AB5" fontSize="12px" lineHeight="18px">
              {t(`SellerOfferCreate.published.fields.${row.key}`)}
            </Text>
            <Text
              as="dd"
              color="#0F1729"
              fontSize="13px"
              fontWeight={700}
              lineHeight="19.5px"
              textAlign="end"
              wordBreak="break-word"
            >
              {row.value || "—"}
            </Text>
          </Flex>
        ))}
      </Stack>

      {offer.warnings.length > 0 && (
        <Flex
          align="flex-start"
          gap="10px"
          w="full"
          maxW="448px"
          px="17px"
          py="13px"
          bg="#FFFBEB"
          borderWidth="1px"
          borderColor="#FDE68A"
          rounded="14px"
          textAlign="start"
          role="alert"
        >
          <Icon
            as={LuTriangleAlert}
            boxSize="13px"
            color="#D97706"
            mt="3px"
            flexShrink={0}
          />
          <Stack gap="4px" color="#92400E" fontSize="12px" lineHeight="18px">
            {offer.warnings.map((warning) => (
              <Text key={warning}>{warning}</Text>
            ))}
          </Stack>
        </Flex>
      )}

      <Button
        asChild
        h="45px"
        px="32px"
        gap="8px"
        rounded="14px"
        bg="#8B5CF6"
        color="white"
        fontSize="14px"
        fontWeight={700}
        _hover={{ bg: "#7C4DEB" }}
      >
        <NextLink href="/seller/offers">
          <Icon as={LuArrowLeft} boxSize="15px" />
          {t("SellerOfferCreate.published.backToOffers")}
        </NextLink>
      </Button>
    </Stack>
  );
}
