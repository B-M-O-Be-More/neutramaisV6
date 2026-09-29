"use client";

import { Button, Flex, Icon } from "@chakra-ui/react";
import type { IconType } from "react-icons";
import { useTranslation } from "react-i18next";
import { LuMapPin, LuZap } from "react-icons/lu";

import { SearchNetworkTab, SearchNetworkTabsProps } from "./interface";

const TABS: { value: SearchNetworkTab; icon: IconType }[] = [
  { value: "nearby", icon: LuMapPin },
  { value: "available", icon: LuZap },
];

/** Alternância entre "Redes Próximas" e "Redes Disponíveis". */
export function SearchNetworkTabs({ value, onChange }: SearchNetworkTabsProps) {
  const { t } = useTranslation();

  return (
    <Flex
      role="tablist"
      aria-label={t("SearchNetwork.tabs.label")}
      gap="12px"
      p="6.25px"
      bg="white"
      borderWidth="0.25px"
      borderColor="rgba(48,54,61,0.35)"
      rounded="14px"
      overflowX="auto"
    >
      {TABS.map((tab) => {
        const isActive = tab.value === value;
        return (
          <Button
            key={tab.value}
            role="tab"
            aria-selected={isActive}
            variant="plain"
            h="auto"
            gap="8px"
            px="12px"
            py="8px"
            rounded="10px"
            bg={isActive ? "#1F5AFF" : "transparent"}
            color={isActive ? "white" : "#8A9AB5"}
            fontSize="14px"
            fontWeight={isActive ? 600 : 400}
            lineHeight="21px"
            flexShrink={0}
            _hover={{ bg: isActive ? "#1F5AFF" : "#F4F6F9" }}
            onClick={() => onChange(tab.value)}
          >
            <Icon as={tab.icon} boxSize="16px" />
            {t(`SearchNetwork.tabs.${tab.value}`)}
          </Button>
        );
      })}
    </Flex>
  );
}
