"use client";

import { Flex, Icon, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";
import {
  LuCircleCheck,
  LuCircleHelp,
  LuCircleX,
  LuTriangleAlert,
} from "react-icons/lu";

import { formatDateTime } from "@/functions/formatDateTime";
import type { KycAutomaticCheck } from "@/services/adminKycReview.service";

import { AdminKycChecksProps } from "./interface";

const CHECK_STYLES: Record<
  KycAutomaticCheck["status"],
  { icon: IconType; fg: string; bg: string; border: string }
> = {
  passed: {
    icon: LuCircleCheck,
    fg: "#10B981",
    bg: "#EDFBF5",
    border: "#AAECD5",
  },
  failed: { icon: LuCircleX, fg: "#EF4444", bg: "#FEF2F2", border: "#FECACA" },
  error: {
    icon: LuTriangleAlert,
    fg: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
  },
  not_verified: {
    icon: LuCircleHelp,
    fg: "#5A6478",
    bg: "#F4F6F9",
    border: "#E5E8EE",
  },
};

/**
 * Checagens automáticas da solicitação (situação cadastral e sanções). Com a
 * política `advisory`, só `failed` bloqueia a aprovação.
 */
export function AdminKycChecks({ checks }: AdminKycChecksProps) {
  const { t, i18n } = useTranslation();

  return (
    <Stack gap="8px">
      {checks.map((check) => {
        const style = CHECK_STYLES[check.status] ?? CHECK_STYLES.not_verified;
        const details = [
          check.expired ? t("Admin.review.checks.expired") : null,
          check.source,
          check.checked_at
            ? t("Admin.review.checks.checkedAt", {
                date: formatDateTime(check.checked_at, i18n.language),
              })
            : null,
          check.policy !== "advisory" ? t("Admin.review.checks.strict") : null,
        ].filter(Boolean);

        return (
          <Flex
            key={check.check_type}
            align="flex-start"
            gap="10px"
            px="14px"
            py="10px"
            rounded="12px"
            bg={style.bg}
            borderWidth="1px"
            borderColor={style.border}
          >
            <Icon
              as={check.alert ? LuTriangleAlert : style.icon}
              boxSize="14px"
              color={style.fg}
              mt="2px"
              flexShrink={0}
            />
            <Stack gap={0} minW={0}>
              <Text color="#0F1729" fontSize="13px" fontWeight={600}>
                {t(`Admin.review.checks.types.${check.check_type}`, {
                  defaultValue: check.check_type,
                })}
                <Text as="span" color={style.fg} fontWeight={700}>
                  {" · "}
                  {t(`Admin.review.checks.status.${check.status}`, {
                    defaultValue: check.status,
                  })}
                </Text>
              </Text>
              {details.length > 0 && (
                <Text color="#8A9AB5" fontSize="11.5px" lineHeight="17px">
                  {details.join(" · ")}
                </Text>
              )}
            </Stack>
          </Flex>
        );
      })}
    </Stack>
  );
}
