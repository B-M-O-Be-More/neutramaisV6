"use client";

import { Link, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useTranslation } from "react-i18next";
import { LuShoppingCart } from "react-icons/lu";

import OfferCover from "@/components/OfferCover";

import { OfferForYouCardProps } from "./interface";

/** "Para você": ofertas relacionadas ao histórico (Figma 2084-20450). */
export function OfferForYouCard({ items, href }: OfferForYouCardProps) {
  const { t } = useTranslation();

  return (
    <Stack
      as="article"
      gap="0"
      h="full"
      overflow="hidden"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="14px"
    >
      <OfferCover
        kind="forYou"
        badge={t("Offers.badges.forYou")}
        icon={LuShoppingCart}
        caption={t("Offers.covers.forYou")}
      />
      <Stack as="ul" gap="0" listStyleType="none">
        {items.map((item) => (
          <Stack as="li" key={item.id} gap="4px" px="16px" py="14px">
            <Text
              color="#A0ABB8"
              fontSize="10px"
              fontWeight={700}
              lineHeight="15px"
              letterSpacing="0.5px"
              textTransform="uppercase"
            >
              {t(`Offers.categories.${item.category}`)}
            </Text>
            <Link
              asChild
              color="#0F1729"
              fontSize="13px"
              fontWeight={600}
              lineHeight="19.5px"
              _hover={{ color: "#1F5AFF", textDecoration: "none" }}
            >
              <NextLink href={href}>{item.title}</NextLink>
            </Link>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
