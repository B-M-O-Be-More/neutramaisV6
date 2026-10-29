"use client";

import { Flex, Icon, Link, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import type { ReactNode } from "react";
import { useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";
import { LuCircleAlert, LuShield, LuTriangleAlert } from "react-icons/lu";

import { offerCategory } from "@/data/offerCategories";
import {
  formatHours,
  formatIsoDate,
  formatMoney,
  formatPercent,
} from "@/functions/offerFormat";

import { SellerOfferReviewStepProps } from "./interface";

interface NoticeProps {
  icon: IconType;
  tone: { bg: string; border: string; icon: string; text: string };
  role?: "alert" | "status";
  children: ReactNode;
}

function Notice({ icon, tone, role, children }: NoticeProps) {
  return (
    <Flex
      align="flex-start"
      gap="12px"
      px="17px"
      py="15px"
      bg={tone.bg}
      borderWidth="1px"
      borderColor={tone.border}
      rounded="14px"
      role={role}
    >
      <Icon
        as={icon}
        boxSize="13px"
        color={tone.icon}
        mt="3px"
        flexShrink={0}
      />
      <Stack gap="4px" color={tone.text} fontSize="12px" lineHeight="18px">
        {children}
      </Stack>
    </Flex>
  );
}

const AMBER = {
  bg: "#FFFBEB",
  border: "#FDE68A",
  icon: "#D97706",
  text: "#92400E",
};
const RED = {
  bg: "#FEF2F2",
  border: "#FECACA",
  icon: "#EF4444",
  text: "#991B1B",
};
const GREEN = {
  bg: "#EDFBF5",
  border: "#AAECD5",
  icon: "#10B981",
  text: "#065F46",
};

/**
 * Etapa 5 da criação de oferta (Figma 2074-54253): aviso de moderação,
 * resumo do que foi preenchido e a confirmação de veracidade. O botão
 * "Publicar oferta agora" fica no rodapé do assistente.
 */
export function SellerOfferReviewStep({
  control,
  locale,
  notice,
}: SellerOfferReviewStepProps) {
  const { t } = useTranslation();
  const values = useWatch({ control });

  const category = offerCategory(values.category);
  const dash = "—";

  // Ordem do design; os itens condicionais só aparecem quando preenchidos.
  const items: { key: string; value: string | undefined }[] = [
    { key: "name", value: values.name?.trim() },
    {
      key: "category",
      value: category
        ? t(`SellerOfferCreate.categories.${category.key}.label`)
        : undefined,
    },
    { key: "shortDescription", value: values.shortDescription?.trim() },
    {
      key: "pricingModel",
      value: values.pricingModel
        ? t(`SellerOfferCreate.pricing.pricingModels.${values.pricingModel}`)
        : undefined,
    },
    {
      key: "price",
      value: formatMoney(values.price ?? "", values.currency ?? "BRL", locale),
    },
    {
      key: "technicalSla",
      value: formatPercent(values.technicalSla ?? "", locale),
    },
    { key: "acceptanceSla", value: formatHours(values.acceptanceSla ?? "") },
    { key: "deliveryTime", value: values.deliveryTime?.trim() },
    { key: "cancellation", value: values.cancellationTerms?.trim() },
    {
      key: "validUntil",
      value: values.validUntil
        ? formatIsoDate(values.validUntil, locale)
        : t("SellerOfferCreate.review.validUntilOpen"),
    },
  ];

  if (category?.requiresCoverage) {
    items.push({
      key: "coverage",
      value: t(
        `SellerOfferCreate.coverageScope.mode.${values.coverageMode ?? "full"}`,
      ),
    });
  }
  if (values.speedValue && values.category !== "numberingResources") {
    items.push({
      key: "speed",
      value: `${values.speedValue} ${values.speedUnit ?? ""}`.trim(),
    });
  }
  if (values.setupFee) {
    items.push({
      key: "setup",
      value: formatMoney(values.setupFee, values.currency ?? "BRL", locale),
    });
  }
  if (values.stock) {
    items.push({ key: "stock", value: values.stock });
  }

  return (
    <Stack gap="24px">
      <Notice icon={LuCircleAlert} tone={AMBER}>
        <Text>{t("SellerOfferCreate.review.moderationNotice")}</Text>
      </Notice>

      <SimpleGrid as="dl" columns={{ base: 1, md: 2 }} gap="12px">
        {items.map((item) => (
          <Stack
            key={item.key}
            gap="4px"
            p="17px"
            bg="#F8F9FB"
            borderWidth="1px"
            borderColor="#E5E8EE"
            rounded="14px"
            minW={0}
          >
            <Text
              as="dt"
              color="#A0ABB8"
              fontSize="9px"
              fontWeight={700}
              lineHeight="13.5px"
              letterSpacing="0.45px"
              textTransform="uppercase"
            >
              {t(`SellerOfferCreate.review.fields.${item.key}`)}
            </Text>
            <Text
              as="dd"
              color="#0F1729"
              fontSize="14px"
              fontWeight={600}
              lineHeight="20px"
              wordBreak="break-word"
            >
              {item.value || dash}
            </Text>
          </Stack>
        ))}
      </SimpleGrid>

      <Notice icon={LuShield} tone={GREEN}>
        <Text>{t("SellerOfferCreate.review.truthfulnessNotice")}</Text>
      </Notice>

      {notice && (
        <Notice
          icon={notice.tone === "error" ? LuCircleAlert : LuTriangleAlert}
          tone={notice.tone === "error" ? RED : AMBER}
          role="alert"
        >
          {notice.messages.map((message) => (
            <Text key={message}>{message}</Text>
          ))}
          {notice.savedAsDraft && (
            <Link
              asChild
              color="inherit"
              fontWeight={700}
              textDecoration="underline"
            >
              <NextLink href="/seller/offers">
                {t("SellerOfferCreate.review.goToOffers")}
              </NextLink>
            </Link>
          )}
        </Notice>
      )}
    </Stack>
  );
}
