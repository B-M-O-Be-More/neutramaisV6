"use client";

import { chakra, Flex, Icon, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";
import { LuFileText, LuPercent, LuShieldCheck, LuUsers } from "react-icons/lu";

import { AdminTabKey, AdminTabsProps } from "./interface";

const TABS: { key: AdminTabKey; icon: IconType }[] = [
  { key: "kyc", icon: LuShieldCheck },
  { key: "users", icon: LuUsers },
  { key: "feeSchedule", icon: LuPercent },
  { key: "audit", icon: LuFileText },
];

/** Abas do painel administrativo: KYC, usuários, fee schedule e auditoria. */
export function AdminTabs({
  active,
  available,
  onChange,
  kycCount,
}: AdminTabsProps) {
  const { t } = useTranslation();

  return (
    <Flex
      role="tablist"
      aria-label={t("Admin.tabs.label")}
      gap="10px"
      p="5px"
      overflowX="auto"
    >
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        const isAvailable = available.includes(tab.key);
        const count = tab.key === "kyc" ? kycCount : undefined;

        return (
          <chakra.button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={!isAvailable}
            onClick={() => onChange(tab.key)}
            display="flex"
            alignItems="center"
            gap="6px"
            flexShrink={0}
            px={isActive ? "10px" : "16px"}
            py={isActive ? "6.5px" : "8px"}
            rounded="10px"
            bg={isActive ? "#1F5AFF" : "transparent"}
            color={isActive ? "white" : "#8A9AB5"}
            cursor={isAvailable ? "pointer" : "not-allowed"}
            opacity={isAvailable ? 1 : 0.6}
            _hover={isAvailable && !isActive ? { bg: "#F4F6F9" } : undefined}
            _focusVisible={{
              outline: "2px solid #1F5AFF",
              outlineOffset: "2px",
            }}
          >
            <Icon as={tab.icon} boxSize="13px" />
            <Text
              fontSize="13px"
              fontWeight={isActive ? 700 : 400}
              lineHeight="19.5px"
              whiteSpace="nowrap"
            >
              {t(`Admin.tabs.${tab.key}`)}
            </Text>
            {count ? (
              <Text
                as="span"
                ms="2px"
                px="6px"
                py="2px"
                rounded="full"
                bg="#EF4444"
                color="white"
                fontSize="9px"
                fontWeight={700}
                lineHeight="13.5px"
              >
                {count}
              </Text>
            ) : null}
          </chakra.button>
        );
      })}
    </Flex>
  );
}
