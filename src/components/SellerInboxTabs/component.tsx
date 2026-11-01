"use client";

import { Button, Flex, Icon, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";
import { LuMessageSquare, LuPackage } from "react-icons/lu";

import { SellerInboxTab, SellerInboxTabsProps } from "./interface";

const TABS: { key: SellerInboxTab; icon: IconType }[] = [
  { key: "orders", icon: LuPackage },
  { key: "rfq", icon: LuMessageSquare },
];

/**
 * Alternância entre "Pedidos Recebidos" e "RFQs Recebidas" na caixa de
 * entrada do seller (Figma 2943-40708). As duas abas dividem a largura.
 */
export function SellerInboxTabs({
  value,
  counts,
  onChange,
}: SellerInboxTabsProps) {
  const { t } = useTranslation();

  return (
    <Flex
      role="tablist"
      aria-label={t("SellerOrders.tabs.label")}
      gap="4px"
      p="6px"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="12px"
    >
      {TABS.map(({ key, icon }) => {
        const isActive = key === value;
        const count = counts[key];
        return (
          <Button
            key={key}
            role="tab"
            aria-selected={isActive}
            variant="plain"
            flex="1"
            minW={0}
            h="41px"
            px="12px"
            gap="8px"
            rounded="8px"
            bg={isActive ? "#8B5CF6" : "transparent"}
            color={isActive ? "white" : "#8A9AB5"}
            fontSize="14px"
            fontWeight={isActive ? 700 : 400}
            lineHeight="21px"
            boxShadow={
              isActive
                ? "0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)"
                : undefined
            }
            _hover={{ bg: isActive ? "#8B5CF6" : "#F4F6F9" }}
            onClick={() => onChange(key)}
          >
            <Icon as={icon} boxSize="16px" aria-hidden />
            <Text as="span" truncate>
              {t(`SellerOrders.tabs.${key}`)}
            </Text>
            {count ? (
              <Text
                as="span"
                px="8px"
                py="2px"
                rounded="full"
                bg={isActive ? "rgba(255,255,255,0.2)" : "#8B5CF6"}
                color="white"
                fontSize="11px"
                fontWeight={700}
                lineHeight="16.5px"
              >
                {count}
              </Text>
            ) : null}
          </Button>
        );
      })}
    </Flex>
  );
}
