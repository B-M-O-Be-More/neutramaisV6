"use client";

import { Flex, Icon, Image, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuCircleAlert, LuPackage, LuStar } from "react-icons/lu";

import { offerCategory } from "@/data/offerCategories";

import { SellerOfferPreviewProps } from "./interface";

// Sem categoria escolhida, o cabeçalho fica neutro.
const NEUTRAL_TONE = { fg: "#8A9AB5", bg: "#F4F6F9", border: "#E5E8EE" };

/**
 * Como a oferta vai aparecer no marketplace, atualizado a cada etapa do
 * assistente. Oferta nova ainda não tem avaliações; o botão de compra é só
 * ilustrativo. Abaixo, o aviso de moderação reativa.
 */
export function SellerOfferPreview({
  category,
  name,
  description,
  imageUrl,
  monthlyPrice,
  currency = "BRL",
  priceSuffix,
  technicalSla,
  acceptanceSla,
  locale,
}: SellerOfferPreviewProps) {
  const { t } = useTranslation();
  const definition = offerCategory(category);
  const tone = definition?.tone ?? NEUTRAL_TONE;
  const CategoryIcon = definition?.icon ?? LuPackage;
  const categoryLabel = definition
    ? t(`SellerOfferCreate.categories.${definition.key}.label`)
    : t("SellerOfferCreate.preview.noCategory");

  const price = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "code",
  }).format(monthlyPrice ?? 0);

  const slas = [
    { key: "technicalSla", value: technicalSla || "—" },
    { key: "acceptanceSla", value: acceptanceSla || "—" },
  ];

  return (
    <Stack gap="16px">
      <Stack gap="12px">
        <Text
          color="#A0ABB8"
          fontSize="10px"
          fontWeight={700}
          lineHeight="15px"
          letterSpacing="0.5px"
          textTransform="uppercase"
        >
          {t("SellerOfferCreate.preview.title")}
        </Text>

        <Stack
          as="article"
          aria-label={t("SellerOfferCreate.preview.title")}
          gap={0}
          bg="white"
          borderWidth="1px"
          borderColor="#E5E8EE"
          rounded="16px"
          overflow="hidden"
          boxShadow="0px 1px 3px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)"
        >
          <Flex
            position="relative"
            h="128px"
            align="center"
            justify="center"
            bg={tone.bg}
          >
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt=""
                position="absolute"
                inset={0}
                w="full"
                h="full"
                objectFit="cover"
              />
            ) : (
              // Sem imagem: o ícone da categoria ocupa o lugar.
              <Stack align="center" gap="8px" opacity={0.4}>
                <Icon as={CategoryIcon} boxSize="16px" color={tone.fg} />
                <Text color="#A0ABB8" fontSize="11px" lineHeight="16.5px">
                  {t("SellerOfferCreate.preview.noImage")}
                </Text>
              </Stack>
            )}
            <Flex
              position="absolute"
              top="12px"
              left="12px"
              align="center"
              gap="4px"
              px="9px"
              py="3px"
              bg={tone.bg}
              borderWidth="1px"
              borderColor={tone.border}
              rounded="8px"
            >
              <Icon as={CategoryIcon} boxSize="12px" color={tone.fg} />
              <Text
                color={tone.fg}
                fontSize="9px"
                fontWeight={700}
                lineHeight="13.5px"
              >
                {categoryLabel}
              </Text>
            </Flex>
          </Flex>

          <Stack gap="12px" p="16px">
            <Stack gap="2px">
              <Text
                color="#0F1729"
                fontSize="14px"
                fontWeight={800}
                lineHeight="19.25px"
              >
                {name?.trim() || t("SellerOfferCreate.preview.untitled")}
              </Text>
              <Flex
                align="center"
                gap="6px"
                aria-label={t("SellerOfferCreate.preview.noReviews")}
              >
                {Array.from({ length: 5 }, (_, index) => (
                  <Icon
                    key={index}
                    as={LuStar}
                    boxSize="10px"
                    color="#C4CDD8"
                  />
                ))}
                <Text
                  color="#5A6478"
                  fontSize="11px"
                  fontWeight={600}
                  lineHeight="16.5px"
                >
                  0 (0)
                </Text>
              </Flex>
              <Text
                pt="4px"
                color="#8A9AB5"
                fontSize="12px"
                lineHeight="16.5px"
                lineClamp={3}
              >
                {description?.trim() ||
                  t("SellerOfferCreate.preview.noDescription")}
              </Text>
            </Stack>

            <Text
              pt="13px"
              borderTopWidth="1px"
              borderColor="#F4F6F9"
              color="#8B5CF6"
              fontSize="20px"
              fontWeight={800}
              lineHeight="30px"
            >
              {price}
              {priceSuffix && (
                <Text
                  as="span"
                  ms="4px"
                  color="#8A9AB5"
                  fontSize="12px"
                  fontWeight={400}
                >
                  {priceSuffix}
                </Text>
              )}
            </Text>

            <SimpleGrid columns={2} gap="8px">
              {slas.map((sla) => (
                <Stack
                  key={sla.key}
                  gap={0}
                  px="12px"
                  py="8px"
                  bg="#F8F9FB"
                  rounded="10px"
                >
                  <Text
                    color="#A0ABB8"
                    fontSize="8px"
                    fontWeight={700}
                    lineHeight="12px"
                    letterSpacing="0.4px"
                    textTransform="uppercase"
                  >
                    {t(`SellerOfferCreate.preview.${sla.key}`)}
                  </Text>
                  <Text
                    color="#5A6478"
                    fontSize="12px"
                    fontWeight={600}
                    lineHeight="18px"
                  >
                    {sla.value}
                  </Text>
                </Stack>
              ))}
            </SimpleGrid>

            {/* Só ilustra o botão do marketplace — não é interativo. */}
            <Flex
              aria-hidden="true"
              h="40px"
              align="center"
              justify="center"
              rounded="14px"
              bg="#8B5CF6"
              color="white"
              fontSize="13px"
              fontWeight={700}
              lineHeight="19.5px"
            >
              {t("SellerOfferCreate.preview.buyNow")}
            </Flex>
          </Stack>
        </Stack>
      </Stack>

      <Stack
        gap="4px"
        px="14px"
        py="12px"
        bg="#FFFBEB"
        borderWidth="1px"
        borderColor="#FDE68A"
        rounded="14px"
      >
        <Flex align="center" gap="6px">
          <Icon as={LuCircleAlert} boxSize="12px" color="#D97706" />
          <Text
            color="#D97706"
            fontSize="11px"
            fontWeight={700}
            lineHeight="16.5px"
          >
            {t("SellerOfferCreate.preview.moderationTitle")}
          </Text>
        </Flex>
        <Text color="#92400E" fontSize="11px" lineHeight="16.5px">
          {t("SellerOfferCreate.preview.moderationText")}
        </Text>
      </Stack>
    </Stack>
  );
}
