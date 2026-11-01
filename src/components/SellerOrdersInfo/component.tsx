"use client";

import { Flex, Icon, IconButton, Stack, Text } from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuChevronDown, LuPackage, LuX } from "react-icons/lu";

import { SellerOrdersInfoProps } from "./interface";

/**
 * Faixa "Caixa de Entrada Seller" no topo dos pedidos recebidos (Figma
 * 2943-40680): o que chega na caixa e os prazos de resposta. Recolhe e fecha.
 */
export function SellerOrdersInfo({ onDismiss }: SellerOrdersInfoProps) {
  const { t } = useTranslation();
  const [isExpanded, setExpanded] = React.useState(true);
  const descriptionId = React.useId();

  return (
    <Flex
      as="section"
      aria-label={t("SellerOrders.info.title")}
      gap="12px"
      align="flex-start"
      px="20px"
      py="16px"
      bg="#F3EEFF"
      borderWidth="1px"
      borderColor="#D3BFFD"
      rounded="12px"
    >
      <Flex
        align="center"
        justify="center"
        boxSize="32px"
        flexShrink={0}
        bg="#F3EEFF"
        borderWidth="1px"
        borderColor="#D3BFFD"
        rounded="8px"
      >
        <Icon as={LuPackage} boxSize="14px" color="#8B5CF6" aria-hidden />
      </Flex>

      <Stack gap="2px" flex="1" minW={0}>
        <Text
          color="#8B5CF6"
          fontSize="13px"
          fontWeight={700}
          lineHeight="19.5px"
        >
          {t("SellerOrders.info.title")}
        </Text>
        {isExpanded && (
          <Text
            id={descriptionId}
            color="#5B21B6"
            fontSize="12px"
            lineHeight="18px"
          >
            {t("SellerOrders.info.description")}
          </Text>
        )}
      </Stack>

      <Flex gap="4px" flexShrink={0}>
        <IconButton
          aria-label={t(
            isExpanded
              ? "SellerOrders.info.collapse"
              : "SellerOrders.info.expand",
          )}
          aria-expanded={isExpanded}
          aria-controls={isExpanded ? descriptionId : undefined}
          variant="plain"
          boxSize="22px"
          minW="22px"
          rounded="4px"
          color="#8B5CF6"
          _hover={{ bg: "rgba(139,92,246,0.08)" }}
          onClick={() => setExpanded((current) => !current)}
        >
          <Icon
            as={LuChevronDown}
            boxSize="14px"
            transform={isExpanded ? undefined : "rotate(-90deg)"}
            transition="transform 0.15s"
          />
        </IconButton>
        <IconButton
          aria-label={t("SellerOrders.info.dismiss")}
          variant="plain"
          boxSize="22px"
          minW="22px"
          rounded="4px"
          color="#8A9AB5"
          _hover={{ bg: "rgba(139,92,246,0.08)" }}
          onClick={onDismiss}
        >
          <Icon as={LuX} boxSize="13px" />
        </IconButton>
      </Flex>
    </Flex>
  );
}
