"use client";

import { Box, Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuTrash2 } from "react-icons/lu";

import { formatArea } from "@/functions/formatArea";

import { CoverageShapeListProps } from "./interface";

/**
 * Polígonos desenhados no modal "Escolher cobertura": selecionar destaca no
 * mapa; a lixeira remove só aquele polígono. Os que a geo-api recusaria
 * aparecem em vermelho, com o motivo.
 */
export function CoverageShapeList({
  shapes,
  selected,
  onSelect,
  onRemove,
  locale,
}: CoverageShapeListProps) {
  const { t } = useTranslation();

  if (!shapes.length) return null;

  return (
    <Stack gap="8px">
      <Text
        id="coverage-shapes-title"
        color="#0F1729"
        fontSize="13px"
        fontWeight={700}
        lineHeight="19.5px"
      >
        {t("SellerOfferCreate.coverageScope.shapes.title", {
          count: shapes.length,
        })}
      </Text>
      <Stack as="ul" gap="8px" aria-labelledby="coverage-shapes-title">
        {shapes.map((shape, index) => {
          const isSelected = index === selected;
          const name = t("SellerOfferCreate.coverageScope.shapes.name", {
            number: shape.number,
          });
          return (
            <Flex
              as="li"
              key={shape.number}
              align="center"
              gap="4px"
              ps="4px"
              pe="6px"
              bg={isSelected ? "#EEF3FF" : "white"}
              borderWidth="1px"
              borderColor={
                shape.issue ? "#FCA5A5" : isSelected ? "#1F5AFF" : "#E5E8EE"
              }
              rounded="12px"
            >
              <Button
                variant="plain"
                flex="1"
                minW={0}
                h="auto"
                py="8px"
                px="8px"
                justifyContent="flex-start"
                gap="10px"
                aria-pressed={isSelected}
                onClick={() => onSelect(index)}
              >
                <Box
                  boxSize="12px"
                  flexShrink={0}
                  bg="rgba(31,90,255,0.3)"
                  borderWidth="2px"
                  borderColor="#1F5AFF"
                  rounded="3px"
                />
                <Stack gap={0} align="flex-start" minW={0}>
                  <Text
                    color="#0F1729"
                    fontSize="13px"
                    fontWeight={600}
                    lineHeight="19.5px"
                  >
                    {name}
                  </Text>
                  <Text
                    color={shape.issue ? "#EF4444" : "#5A6478"}
                    fontSize="11px"
                    fontWeight={400}
                    lineHeight="16.5px"
                    truncate
                  >
                    {shape.issue
                      ? t(
                          `SellerOfferCreate.coverageScope.shapeInfo.issue.${shape.issue}`,
                        )
                      : t("SellerOfferCreate.coverageScope.shapes.summary", {
                          area: formatArea(shape.areaKm2, locale),
                          vertices: shape.vertices,
                        })}
                  </Text>
                </Stack>
              </Button>
              <Button
                variant="plain"
                boxSize="32px"
                minW="32px"
                p={0}
                rounded="10px"
                color="#8A9AB5"
                aria-label={t("SellerOfferCreate.coverageScope.shapes.remove", {
                  name,
                })}
                _hover={{ bg: "#FEF2F2", color: "#EF4444" }}
                onClick={() => onRemove(index)}
              >
                <Icon as={LuTrash2} boxSize="14px" />
              </Button>
            </Flex>
          );
        })}
      </Stack>
    </Stack>
  );
}
