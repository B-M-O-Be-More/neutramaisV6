"use client";

import { Box, Button, chakra, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuTruck } from "react-icons/lu";

import { CartAddressCardProps } from "./interface";

type LocationStatus =
  | "idle"
  | "locating"
  | "located"
  | "denied"
  | "unsupported";

/**
 * "Escolha um Endereço" (Figma 2879-94537). A plataforma ainda não guarda os
 * endereços do buyer: a opção disponível é a localização atual do navegador,
 * o ponto que a viabilidade dos serviços usa.
 */
export function CartAddressCard({ onAddAddress }: CartAddressCardProps) {
  const { t } = useTranslation();
  const [status, setStatus] = React.useState<LocationStatus>("idle");
  const isSelected = status === "locating" || status === "located";

  const selectCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      setStatus("unsupported");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      () => setStatus("located"),
      () => setStatus("denied"),
      { enableHighAccuracy: false, timeout: 15_000 },
    );
  };

  return (
    <Stack
      as="section"
      aria-label={t("Cart.address.title")}
      gap="16px"
      p="20px"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="16px"
      boxShadow="0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)"
    >
      <Text
        as="h2"
        color="#0F1729"
        fontSize="14px"
        fontWeight={800}
        lineHeight="21px"
      >
        {t("Cart.address.title")}
      </Text>

      <Stack role="radiogroup" aria-label={t("Cart.address.title")} gap="8px">
        <chakra.button
          type="button"
          role="radio"
          aria-checked={isSelected}
          onClick={selectCurrentLocation}
          display="flex"
          alignItems="center"
          gap="10px"
          minH="40px"
          px="12px"
          py="8px"
          rounded="12px"
          borderWidth="2px"
          borderColor={isSelected ? "#1F5AFF" : "#E5E8EE"}
          bg={isSelected ? "#F5F8FF" : "white"}
          textAlign="left"
          cursor="pointer"
          _focusVisible={{ outline: "2px solid #1F5AFF", outlineOffset: "2px" }}
        >
          <Flex
            align="center"
            justify="center"
            boxSize="14px"
            flexShrink={0}
            rounded="full"
            borderWidth="2px"
            borderColor={isSelected ? "#1F5AFF" : "#C4CDD8"}
          >
            {isSelected && <Box boxSize="6px" rounded="full" bg="#1F5AFF" />}
          </Flex>
          <Text color="#0F1729" fontSize="13px" lineHeight="19.5px">
            {t("Cart.address.currentLocation")}
          </Text>
        </chakra.button>
        {status !== "idle" && (
          <Text
            role="status"
            color={
              status === "denied" || status === "unsupported"
                ? "#DC2626"
                : "#6F7B90"
            }
            fontSize="12px"
            lineHeight="18px"
          >
            {t(`Cart.address.status.${status}`)}
          </Text>
        )}
      </Stack>

      <Button
        h="40px"
        gap="8px"
        rounded="12px"
        bg="#1F5AFF"
        color="white"
        fontSize="13px"
        fontWeight={700}
        boxShadow="0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)"
        _hover={{ bg: "#1646CC" }}
        onClick={onAddAddress}
      >
        {t("Cart.address.add")}
        <Icon as={LuTruck} boxSize="14px" />
      </Button>
    </Stack>
  );
}
