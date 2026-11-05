"use client";

import { Flex, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

import { TICKET_PRIORITY_STYLES } from "@/data/ticketStatus";
import { TICKET_PRIORITIES } from "@/types/tickets";

/** Prioridades e o SLA de cada uma (Figma 3108-101473). */
export function TicketPriorityGuide() {
  const { t } = useTranslation();

  return (
    <SimpleGrid
      as="ul"
      columns={{ base: 2, md: 4 }}
      gap="8px"
      listStyleType="none"
      aria-label={t("Tickets.priorities.label")}
    >
      {TICKET_PRIORITIES.map((priority) => {
        const style = TICKET_PRIORITY_STYLES[priority];
        return (
          <Stack
            as="li"
            key={priority}
            gap={0}
            p="16px"
            bg={style.bg}
            borderWidth="1px"
            borderColor="rgba(0, 0, 0, 0.1)"
            rounded="12px"
            minW={0}
          >
            <Flex align="center" gap="8px" color={style.color}>
              <Text
                fontFamily="mono"
                fontSize="11px"
                fontWeight={700}
                lineHeight="16.5px"
              >
                {priority}
              </Text>
              <Text fontSize="10px" lineHeight="15px">
                {t("Tickets.slaHours", { count: style.slaHours })}
              </Text>
            </Flex>
            <Text
              pt="4px"
              color="#0F1729"
              fontSize="12px"
              fontWeight={600}
              lineHeight="18px"
            >
              {t(`Tickets.priorities.${priority}.label`)}
            </Text>
            <Text pt="2px" color="#8A9AB5" fontSize="10px" lineHeight="15px">
              {t(`Tickets.priorities.${priority}.description`)}
            </Text>
          </Stack>
        );
      })}
    </SimpleGrid>
  );
}
