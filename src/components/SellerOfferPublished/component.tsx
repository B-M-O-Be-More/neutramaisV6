"use client";

import { Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useTranslation } from "react-i18next";
import {
  LuArrowLeft,
  LuCircleCheck,
  LuImagePlus,
  LuMapPinned,
  LuTriangleAlert,
} from "react-icons/lu";

import { SellerOfferPublishedProps } from "./interface";

const BUTTON_STYLES = {
  h: "45px",
  px: "32px",
  gap: "8px",
  rounded: "14px",
  fontSize: "14px",
} as const;
const PRIMARY_STYLES = {
  ...BUTTON_STYLES,
  bg: "#8B5CF6",
  color: "white",
  fontWeight: 700,
  _hover: { bg: "#7C4DEB" },
} as const;
const OUTLINE_STYLES = {
  ...BUTTON_STYLES,
  variant: "outline",
  borderColor: "#E5E8EE",
  color: "#5A6478",
  fontWeight: 600,
} as const;

/**
 * Confirmação depois de criar a oferta (Figma 2074-55740): selo de sucesso,
 * resumo da oferta e atalhos para o que só existe depois da oferta criada —
 * fotos e, nas categorias com KMZ, a cobertura — e para Minhas Ofertas.
 * Sem cobertura a oferta não publica: fica rascunho e o atalho principal
 * leva à área de cobertura. Avisos (ex.: patrocínio não aplicado) aparecem
 * abaixo do resumo.
 */
export function SellerOfferPublished({ offer }: SellerOfferPublishedProps) {
  const { t } = useTranslation();
  const texts = offer.needsCoverage
    ? "SellerOfferCreate.created"
    : "SellerOfferCreate.published";
  const editHref = `/seller/offers/${encodeURIComponent(offer.offeringId)}/edit`;

  const rows = [
    { key: "offer", value: offer.name },
    { key: "category", value: offer.categoryLabel },
    { key: "price", value: offer.price },
    { key: "status", value: t(`${texts}.statusValue`) },
    { key: "acceptanceSla", value: offer.acceptanceSla },
  ];

  const photosLink = (
    <NextLink href={`${editHref}?section=photos`}>
      <Icon as={LuImagePlus} boxSize="15px" />
      {t("SellerOfferCreate.published.addPhotos")}
    </NextLink>
  );

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
          {t(`${texts}.title`)}
        </Text>
        <Text color="#8A9AB5" fontSize="14px" lineHeight="21px" role="status">
          {t(`${texts}.subtitle`)}
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

      <Flex
        direction={{ base: "column", sm: "row" }}
        justify="center"
        gap="12px"
        w={{ base: "full", sm: "auto" }}
      >
        {offer.needsCoverage ? (
          <>
            <Button asChild {...PRIMARY_STYLES}>
              <NextLink href={`${editHref}?section=coverage`}>
                <Icon as={LuMapPinned} boxSize="15px" />
                {t("SellerOfferCreate.created.addCoverage")}
              </NextLink>
            </Button>
            <Button asChild {...OUTLINE_STYLES}>
              {photosLink}
            </Button>
          </>
        ) : (
          <Button asChild {...PRIMARY_STYLES}>
            {photosLink}
          </Button>
        )}
        <Button asChild {...OUTLINE_STYLES}>
          <NextLink href="/seller/offers">
            <Icon as={LuArrowLeft} boxSize="15px" />
            {t("SellerOfferCreate.published.backToOffers")}
          </NextLink>
        </Button>
      </Flex>
    </Stack>
  );
}
