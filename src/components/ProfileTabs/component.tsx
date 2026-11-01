"use client";

import { chakra, Flex, Icon } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";
import {
  LuBell,
  LuBuilding2,
  LuCircleHelp,
  LuLock,
  LuShield,
  LuUser,
} from "react-icons/lu";

import { PROFILE_TABS, ProfileTab, ProfileTabsProps } from "./interface";

const ICONS: Record<ProfileTab, IconType> = {
  personal: LuUser,
  company: LuBuilding2,
  access: LuShield,
  security: LuLock,
  preferences: LuBell,
  support: LuCircleHelp,
};

/** Abas do Meu Perfil (Figma 2205-18411). */
export function ProfileTabs({ value, onChange }: ProfileTabsProps) {
  const { t } = useTranslation();

  return (
    <Flex
      role="tablist"
      aria-label={t("Profile.tabs.label")}
      gap="4px"
      p="4px"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="14px"
      overflowX="auto"
    >
      {PROFILE_TABS.map((tab) => {
        const isActive = tab === value;
        return (
          <chakra.button
            key={tab}
            type="button"
            role="tab"
            id={`profile-tab-${tab}`}
            aria-selected={isActive}
            aria-controls={`profile-panel-${tab}`}
            onClick={() => onChange(tab)}
            display="flex"
            alignItems="center"
            gap="6px"
            flexShrink={0}
            px="16px"
            py="8px"
            bg={isActive ? "#EEF3FF" : "transparent"}
            rounded="10px"
            boxShadow={
              isActive
                ? "0 1px 1.5px rgba(0,0,0,0.1), 0 1px 1px rgba(0,0,0,0.1)"
                : undefined
            }
            color={isActive ? "#1F5AFF" : "#8A9AB5"}
            fontSize="13px"
            fontWeight={isActive ? 700 : 400}
            lineHeight="19.5px"
            cursor="pointer"
            _hover={isActive ? undefined : { color: "#5A6478" }}
            _focusVisible={{
              outline: "2px solid #1F5AFF",
              outlineOffset: "2px",
            }}
          >
            <Icon as={ICONS[tab]} boxSize="14px" />
            {t(`Profile.tabs.${tab}`)}
          </chakra.button>
        );
      })}
    </Flex>
  );
}
