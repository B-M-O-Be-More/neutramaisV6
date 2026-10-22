"use client";

import { Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";
import {
  LuArrowRight,
  LuBadgeCheck,
  LuBan,
  LuCircleX,
  LuClock,
  LuShieldCheck,
} from "react-icons/lu";

import { KycStatusProps, KycStatusVariant } from "./interface";

const VARIANTS: Record<
  KycStatusVariant,
  { icon: IconType; bg: string; fg: string }
> = {
  review: { icon: LuClock, bg: "#FFFBEB", fg: "#D97706" },
  approved: { icon: LuBadgeCheck, bg: "#EDFBF5", fg: "#10B981" },
  complete: { icon: LuShieldCheck, bg: "#EDFBF5", fg: "#10B981" },
  rejected: { icon: LuCircleX, bg: "#FEF2F2", fg: "#EF4444" },
  suspended: { icon: LuBan, bg: "#FEF2F2", fg: "#EF4444" },
};

/**
 * Situação do KYC quando não há documento a enviar: em análise, aprovado,
 * completo, recusado ou suspenso. Segue o cabeçalho da tela de documentos
 * (KycDocuments).
 */
export function KycStatus({
  variant,
  onContinue,
  onCorrection,
}: KycStatusProps) {
  const { t } = useTranslation();
  const style = VARIANTS[variant];

  return (
    <Stack gap="24px" w="full" align="center">
      <Stack gap={0} align="center">
        <Flex
          align="center"
          justify="center"
          boxSize="56px"
          rounded="16px"
          bg={style.bg}
        >
          <Icon as={style.icon} boxSize="26px" color={style.fg} />
        </Flex>

        <Text
          as="h1"
          pt="12px"
          fontSize="20px"
          fontWeight={800}
          lineHeight="30px"
          color="fg.default"
          textAlign="center"
        >
          {t(`Kyc.screens.${variant}.title`)}
        </Text>

        <Text
          pt="4px"
          fontSize="14px"
          lineHeight="21px"
          color="fg.muted"
          textAlign="center"
        >
          {t(`Kyc.screens.${variant}.subtitle`)}
        </Text>
      </Stack>

      <Button
        type="button"
        onClick={onContinue}
        w="full"
        h="50px"
        rounded="14px"
        bg="brand.500"
        color="white"
        fontSize="14px"
        fontWeight={700}
        gap="8px"
        _hover={{ bg: "brand.600" }}
      >
        {t("Kyc.screens.continue")}
        <Icon as={LuArrowRight} boxSize="15px" />
      </Button>

      {variant === "review" && onCorrection && (
        <Button
          type="button"
          variant="ghost"
          onClick={onCorrection}
          h="auto"
          py="6px"
          color="brand.500"
          fontSize="13px"
          fontWeight={600}
        >
          {t("Kyc.screens.review.correction")}
        </Button>
      )}
    </Stack>
  );
}
