"use client";

import {
  Box,
  Button,
  CloseButton,
  Flex,
  Icon,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuTrash2 } from "react-icons/lu";

import { formatArea } from "@/functions/formatArea";

import { CoverageShapeCardProps } from "./interface";

/**
 * Detalhes do polígono clicado no mapa do modal "Escolher cobertura", com a
 * remoção só dele.
 */
export function CoverageShapeCard({
  shape,
  onRemove,
  onClose,
  locale,
}: CoverageShapeCardProps) {
  const { t } = useTranslation();
  const name = t("SellerOfferCreate.coverageScope.shapes.name", {
    number: shape.number,
  });

  const rows = [
    {
      key: "area",
      value: formatArea(shape.areaKm2, locale),
      color: "#0F1729",
    },
    { key: "vertices", value: String(shape.vertices), color: "#0F1729" },
    {
      key: "status",
      value: t(
        shape.issue
          ? `SellerOfferCreate.coverageScope.shapeInfo.issue.${shape.issue}`
          : "SellerOfferCreate.coverageScope.shapeInfo.inside",
      ),
      color: shape.issue ? "#EF4444" : "#16A34A",
    },
  ];

  return (
    <Stack
      role="group"
      aria-label={name}
      gap="12px"
      w="260px"
      maxW="calc(100% - 32px)"
      p="16px"
      bg="white"
      rounded="12px"
      boxShadow="0 8px 24px rgba(15,23,41,0.18)"
    >
      <Flex align="center" justify="space-between" gap="8px">
        <Flex align="center" gap="8px">
          <Box
            boxSize="12px"
            bg="rgba(31,90,255,0.3)"
            borderWidth="2px"
            borderColor="#1F5AFF"
            rounded="3px"
          />
          <Text
            color="#0F1729"
            fontSize="14px"
            fontWeight={700}
            lineHeight="21px"
          >
            {name}
          </Text>
        </Flex>
        <CloseButton
          size="2xs"
          aria-label={t("SellerOfferCreate.coverageScope.shapeInfo.close")}
          onClick={onClose}
        />
      </Flex>

      <Stack as="dl" gap="6px">
        {rows.map((row) => (
          <Flex key={row.key} justify="space-between" gap="12px">
            <Text as="dt" color="#5A6478" fontSize="12px" lineHeight="18px">
              {t(`SellerOfferCreate.coverageScope.shapeInfo.${row.key}`)}
            </Text>
            <Text
              as="dd"
              color={row.color}
              fontSize="12px"
              fontWeight={600}
              lineHeight="18px"
              textAlign="end"
            >
              {row.value}
            </Text>
          </Flex>
        ))}
      </Stack>

      <Button
        variant="outline"
        h="36px"
        gap="8px"
        rounded="12px"
        borderColor="#FCA5A5"
        color="#DC2626"
        fontSize="13px"
        fontWeight={600}
        _hover={{ bg: "#FEF2F2" }}
        onClick={onRemove}
      >
        <Icon as={LuTrash2} boxSize="14px" />
        {t("SellerOfferCreate.coverageScope.shapeInfo.remove")}
      </Button>
    </Stack>
  );
}
