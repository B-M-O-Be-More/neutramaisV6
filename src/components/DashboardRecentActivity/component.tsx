"use client";

import { Box, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import type { IconType } from "react-icons";
import { useTranslation } from "react-i18next";
import {
  LuBell,
  LuCircleAlert,
  LuCircleCheckBig,
  LuClock,
  LuMessageSquare,
} from "react-icons/lu";

import {
  DashboardActivityTone,
  DashboardRecentActivityProps,
} from "./interface";

const TONES: Record<
  DashboardActivityTone,
  { icon: IconType; color: string; bg: string }
> = {
  success: { icon: LuCircleCheckBig, color: "#10B981", bg: "#EDFBF5" },
  warning: { icon: LuClock, color: "#D97706", bg: "#FFFBEB" },
  danger: { icon: LuCircleAlert, color: "#EF4444", bg: "#FEF2F2" },
  message: { icon: LuMessageSquare, color: "#8B5CF6", bg: "#F3EEFF" },
  info: { icon: LuCircleCheckBig, color: "#1F5AFF", bg: "#EEF3FF" },
};

/** Seção "Atividade recente": linha do tempo curta dos últimos eventos. */
export function DashboardRecentActivity({
  activities,
}: DashboardRecentActivityProps) {
  const { t } = useTranslation();

  return (
    <Stack as="section" gap="16px">
      <Flex align="center" justify="space-between">
        <Text
          as="h2"
          color="#0F1729"
          fontSize="16px"
          fontWeight={700}
          lineHeight="24px"
        >
          {t("Dashboard.recentActivity.title")}
        </Text>
        <Icon as={LuBell} boxSize="14px" color="#A0ABB8" aria-hidden />
      </Flex>

      <Box
        bg="white"
        borderWidth="1px"
        borderColor="#E5E8EE"
        rounded="14px"
        overflow="hidden"
      >
        {activities.map((activity) => {
          const tone = TONES[activity.tone];
          return (
            <Flex
              key={activity.id}
              align="flex-start"
              gap="10px"
              px="16px"
              pt="14px"
              pb="15px"
              borderBottomWidth="1px"
              borderColor="#F4F6F9"
              _last={{ borderBottomWidth: 0, pb: "14px" }}
            >
              <Flex
                boxSize="28px"
                align="center"
                justify="center"
                bg={tone.bg}
                rounded="10px"
                flexShrink={0}
              >
                <Icon as={tone.icon} boxSize="13px" color={tone.color} />
              </Flex>
              <Stack flex="1" minW={0} gap={0}>
                <Text color="#0F1729" fontSize="12px" lineHeight="16.5px">
                  {activity.message}
                </Text>
                <Text
                  pt="2px"
                  color="#A0ABB8"
                  fontSize="10px"
                  lineHeight="15px"
                >
                  {activity.timeAgo}
                </Text>
              </Stack>
            </Flex>
          );
        })}
      </Box>
    </Stack>
  );
}
