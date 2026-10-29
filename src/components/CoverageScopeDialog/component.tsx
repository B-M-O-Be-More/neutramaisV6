"use client";

import {
  Box,
  Button,
  CloseButton,
  Dialog,
  Flex,
  Icon,
  Portal,
  RadioGroup,
  Stack,
  Text,
} from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuInfo, LuPentagon } from "react-icons/lu";

import AddressAutocomplete from "@/components/AddressAutocomplete";
import CoverageDrawMap from "@/components/CoverageDrawMap";
import CoverageShapeCard from "@/components/CoverageShapeCard";
import CoverageShapeList, {
  type CoverageShapeIssue,
  type CoverageShapeSummary,
} from "@/components/CoverageShapeList";
import {
  closedPolygon,
  hasArea,
  polygonWithinArea,
  shapeAreaKm2,
  shapeIsInvalid,
  shapesOf,
  shapesOverlap,
  toPublicGeometry,
  type LngLat,
} from "@/functions/geoShapes";
import { KMZ_COLORS, kmzGeometryKinds } from "@/functions/kmzLayers";
import {
  COVERAGE_SCOPE_MODES,
  type CoverageScopeMode,
} from "@/schemas/sellerOffer";

import { CoverageScopeDialogProps } from "./interface";

/** Ordem dos avisos — do problema mais básico ao que depende do KMZ. */
const SHAPE_ISSUES: CoverageShapeIssue[] = ["invalid", "overlap", "outside"];

/** Amostra da legenda no formato de cada geometria. */
const SWATCH = {
  area: (color: string) => ({
    boxSize: "10px",
    bg: `${color}4D`,
    borderWidth: "1px",
    borderColor: color,
    rounded: "2px",
  }),
  line: (color: string) => ({
    w: "14px",
    h: "3px",
    bg: color,
    rounded: "full",
  }),
  point: (color: string) => ({
    boxSize: "9px",
    bg: color,
    borderWidth: "1.5px",
    borderColor: "white",
    rounded: "full",
  }),
} as const;

/**
 * Modal "Escolher cobertura" (Figma 2697-43374 / 2697-43449): usa toda a
 * cobertura do KMZ ou desenha no mapa um ou mais polígonos públicos da
 * oferta. A escolha só vai para o formulário ao confirmar.
 */
export function CoverageScopeDialog({
  open,
  coverage,
  value,
  onConfirm,
  onClose,
}: CoverageScopeDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        if (!details.open) onClose();
      }}
      // Desmonta ao fechar: reabrir parte do valor do formulário.
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            maxW="1040px"
            w="calc(100% - 32px)"
            h="auto"
            maxH="calc(100dvh - 32px)"
            overflowY="auto"
            rounded="16px"
            boxShadow="0 16px 48px rgba(15,23,41,0.12)"
          >
            <CoverageScopeBody
              coverage={coverage}
              value={value}
              onConfirm={onConfirm}
            />
            <Dialog.CloseTrigger asChild top="20px" insetEnd="20px">
              <CloseButton
                size="sm"
                aria-label={t("SellerOfferCreate.coverageScope.cancel")}
              />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

function CoverageScopeBody({
  coverage,
  value,
  onConfirm,
}: Pick<CoverageScopeDialogProps, "coverage" | "value" | "onConfirm">) {
  const { t, i18n } = useTranslation();
  const [mode, setMode] = React.useState<CoverageScopeMode>(value.mode);
  const [shapes, setShapes] = React.useState<LngLat[][]>(() =>
    shapesOf(value.publicGeometry),
  );
  const [draft, setDraft] = React.useState<LngLat[]>([]);
  const [selected, setSelected] = React.useState<number | null>(null);
  const [place, setPlace] = React.useState<{
    label: string;
    longitude: number;
    latitude: number;
  } | null>(null);

  // Sem a geometria do KMZ não dá para conferir a área aqui — a geo-api
  // confere. Cruzamento e sobreposição não dependem dela.
  const checkable = hasArea(coverage);
  const summaries = React.useMemo<CoverageShapeSummary[]>(
    () =>
      shapes.map((shape, index) => {
        let issue: CoverageShapeIssue | null = null;
        if (shapeIsInvalid(shape)) issue = "invalid";
        else if (
          shapes.some(
            (other, otherIndex) =>
              otherIndex !== index && shapesOverlap(shape, other),
          )
        )
          issue = "overlap";
        else if (
          checkable &&
          !polygonWithinArea(closedPolygon(shape), coverage)
        )
          issue = "outside";
        return {
          number: index + 1,
          areaKm2: shapeAreaKm2(shape),
          vertices: shape.length,
          issue,
        };
      }),
    [shapes, checkable, coverage],
  );
  const issues = SHAPE_ISSUES.filter((issue) =>
    summaries.some((shape) => shape.issue === issue),
  );
  const drawing = draft.length > 0;
  const canConfirm =
    mode === "full" || (shapes.length > 0 && !issues.length && !drawing);
  const selectedShape = selected === null ? null : summaries[selected];

  const kinds = React.useMemo(() => kmzGeometryKinds(coverage), [coverage]);
  const legend = [
    // Sem geometria conhecida, a mancha continua como referência.
    ...(kinds.has("area") || !kinds.size
      ? [{ key: "full", shape: "area", color: KMZ_COLORS.area } as const]
      : []),
    ...(kinds.has("line")
      ? [{ key: "lines", shape: "line", color: KMZ_COLORS.line } as const]
      : []),
    ...(kinds.has("point")
      ? [{ key: "points", shape: "point", color: KMZ_COLORS.point } as const]
      : []),
    ...(mode === "custom"
      ? [{ key: "custom", shape: "area", color: "#1F5AFF" } as const]
      : []),
  ];

  const removeShape = (index: number) => {
    setShapes((current) => current.filter((_, i) => i !== index));
    setSelected((current) =>
      current === null || current === index
        ? null
        : current > index
          ? current - 1
          : current,
    );
  };

  const clearShapes = () => {
    setShapes([]);
    setDraft([]);
    setSelected(null);
  };

  const status =
    mode === "full"
      ? t("SellerOfferCreate.coverageScope.status.full")
      : drawing
        ? t("SellerOfferCreate.coverageScope.status.closing")
        : shapes.length
          ? t("SellerOfferCreate.coverageScope.status.custom", {
              count: shapes.length,
            })
          : t("SellerOfferCreate.coverageScope.status.drawing");

  return (
    <>
      <Dialog.Header
        flexDirection="column"
        alignItems="flex-start"
        gap="4px"
        px="24px"
        pt="24px"
        pb="16px"
        pe="56px"
        borderBottomWidth="1px"
        borderColor="#E5E8EE"
      >
        <Dialog.Title
          color="#0F1729"
          fontSize="20px"
          fontWeight={700}
          lineHeight="30px"
        >
          {t("SellerOfferCreate.coverageScope.title")}
        </Dialog.Title>
        <Dialog.Description color="#5A6478" fontSize="13px" lineHeight="19.5px">
          {t("SellerOfferCreate.coverageScope.subtitle")}
        </Dialog.Description>
      </Dialog.Header>

      <Dialog.Body px="24px" pt="12px" pb="24px">
        <Flex direction={{ base: "column", lg: "row" }} gap="24px" pt="12px">
          <Stack gap="20px" w={{ base: "full", lg: "300px" }} flexShrink={0}>
            <RadioGroup.Root
              value={mode}
              onValueChange={(details) =>
                setMode(details.value as CoverageScopeMode)
              }
              aria-labelledby="coverage-scope-type"
            >
              <Text
                id="coverage-scope-type"
                pb="12px"
                color="#0F1729"
                fontSize="14px"
                fontWeight={700}
                lineHeight="21px"
              >
                {t("SellerOfferCreate.coverageScope.typeLabel")}
              </Text>
              <Stack gap="12px">
                {COVERAGE_SCOPE_MODES.map((option) => {
                  const selected = option === mode;
                  return (
                    <RadioGroup.Item
                      key={option}
                      value={option}
                      alignItems="flex-start"
                      gap="12px"
                      p="16px"
                      bg={selected ? "#EEF3FF" : "white"}
                      borderWidth={selected ? "2px" : "1px"}
                      borderColor={selected ? "#1F5AFF" : "#E5E8EE"}
                      rounded="14px"
                      cursor="pointer"
                    >
                      <RadioGroup.ItemHiddenInput />
                      <RadioGroup.ItemIndicator
                        boxSize="15px"
                        mt="2px"
                        borderColor={selected ? "#1F5AFF" : "#C4CDD8"}
                        _checked={{ bg: "#1F5AFF", borderColor: "#1F5AFF" }}
                      />
                      <Stack gap="2px">
                        <RadioGroup.ItemText
                          color={selected ? "#1F5AFF" : "#0F1729"}
                          fontSize="14px"
                          fontWeight={700}
                          lineHeight="21px"
                        >
                          {t(`SellerOfferCreate.coverageScope.mode.${option}`)}
                        </RadioGroup.ItemText>
                        <Text color="#5A6478" fontSize="12px" lineHeight="18px">
                          {t(
                            `SellerOfferCreate.coverageScope.modeDescription.${option}`,
                          )}
                        </Text>
                      </Stack>
                    </RadioGroup.Item>
                  );
                })}
              </Stack>
            </RadioGroup.Root>

            {mode === "full" ? (
              <Flex
                gap="10px"
                p="16px"
                bg="#F8F9FB"
                borderWidth="1px"
                borderColor="#E5E8EE"
                rounded="12px"
              >
                <Icon as={LuInfo} boxSize="15px" color="#5A6478" mt="2px" />
                <Stack gap="2px">
                  <Text
                    color="#0F1729"
                    fontSize="13px"
                    fontWeight={700}
                    lineHeight="19.5px"
                  >
                    {t("SellerOfferCreate.coverageScope.fullInfoTitle")}
                  </Text>
                  <Text color="#5A6478" fontSize="12px" lineHeight="18px">
                    {t("SellerOfferCreate.coverageScope.fullInfoText")}
                  </Text>
                </Stack>
              </Flex>
            ) : (
              <>
                <AddressAutocomplete
                  id="coverage-scope-location"
                  label={t("SellerOfferCreate.coverageScope.locationLabel")}
                  placeholder={t(
                    "SellerOfferCreate.coverageScope.locationPlaceholder",
                  )}
                  hint={t("SellerOfferCreate.coverageScope.locationHint")}
                  inputValue={place?.label ?? ""}
                  portalled={false}
                  onInputChange={() => undefined}
                  onSelect={(result) =>
                    setPlace({
                      label: result.label,
                      longitude: result.longitude,
                      latitude: result.latitude,
                    })
                  }
                />
                <Flex gap="12px" p="16px" bg="#EEF3FF" rounded="12px">
                  <Icon
                    as={LuPentagon}
                    boxSize="16px"
                    color="#1F5AFF"
                    mt="2px"
                  />
                  <Stack gap="2px">
                    <Text
                      color="#1F5AFF"
                      fontSize="13px"
                      fontWeight={700}
                      lineHeight="19.5px"
                    >
                      {t("SellerOfferCreate.coverageScope.drawTitle")}
                    </Text>
                    <Text color="#5A6478" fontSize="12px" lineHeight="18px">
                      {t("SellerOfferCreate.coverageScope.drawText")}
                    </Text>
                  </Stack>
                </Flex>
                <CoverageShapeList
                  shapes={summaries}
                  selected={selected}
                  onSelect={setSelected}
                  onRemove={removeShape}
                  locale={i18n.language}
                />
              </>
            )}
          </Stack>

          <Stack gap="12px" flex="1" minW={0}>
            <Flex align="baseline" justify="space-between" gap="12px">
              <Text
                color="#0F1729"
                fontSize="14px"
                fontWeight={700}
                lineHeight="21px"
              >
                {t("SellerOfferCreate.coverageScope.mapTitle")}
              </Text>
              {mode === "custom" && place && (
                <Text
                  color="#5A6478"
                  fontSize="12px"
                  lineHeight="18px"
                  truncate
                >
                  {place.label}
                </Text>
              )}
            </Flex>
            <Box position="relative">
              <CoverageDrawMap
                coverage={coverage}
                mode={mode}
                shapes={shapes}
                draft={draft}
                selected={selected}
                focus={mode === "custom" ? place : null}
                onAddPoint={(point) => {
                  setSelected(null);
                  setDraft((current) => [...current, point]);
                }}
                onCloseShape={() => {
                  setShapes((current) => [...current, draft]);
                  setDraft([]);
                }}
                onSelect={setSelected}
                onCancelDraft={() => setDraft([])}
                onClear={clearShapes}
                label={t("SellerOfferCreate.coverageScope.mapTitle")}
              />
              {mode === "custom" && selected !== null && selectedShape && (
                <Box position="absolute" bottom="16px" right="16px">
                  <CoverageShapeCard
                    shape={selectedShape}
                    onRemove={() => removeShape(selected)}
                    onClose={() => setSelected(null)}
                    locale={i18n.language}
                  />
                </Box>
              )}
            </Box>
            <Flex
              as="ul"
              align="center"
              columnGap="16px"
              rowGap="4px"
              wrap="wrap"
            >
              {legend.map((item) => (
                <Flex as="li" key={item.key} align="center" gap="8px">
                  <Flex boxSize="14px" align="center" justify="center">
                    <Box flexShrink={0} {...SWATCH[item.shape](item.color)} />
                  </Flex>
                  <Text color="#5A6478" fontSize="12px" lineHeight="18px">
                    {t(`SellerOfferCreate.coverageScope.legend.${item.key}`)}
                  </Text>
                </Flex>
              ))}
            </Flex>
            {mode === "custom" && issues.length > 0 && (
              <Stack role="alert" gap="2px">
                {issues.map((issue) => (
                  <Text
                    key={issue}
                    color="#EF4444"
                    fontSize="12px"
                    lineHeight="18px"
                  >
                    {t(`SellerOfferCreate.coverageScope.issues.${issue}`)}
                  </Text>
                ))}
              </Stack>
            )}
          </Stack>
        </Flex>
      </Dialog.Body>

      <Dialog.Footer
        justifyContent="space-between"
        flexWrap="wrap"
        gap="12px"
        px="24px"
        py="20px"
        borderTopWidth="1px"
        borderColor="#E5E8EE"
      >
        <Text
          color="#5A6478"
          fontSize="13px"
          lineHeight="19.5px"
          aria-live="polite"
        >
          {status}
        </Text>
        <Flex gap="12px">
          <Dialog.ActionTrigger asChild>
            <Button
              variant="outline"
              h="45px"
              px="20px"
              rounded="18px"
              borderColor="#E5E8EE"
              color="#5A6478"
              fontSize="15px"
              fontWeight={600}
            >
              {t("SellerOfferCreate.coverageScope.cancel")}
            </Button>
          </Dialog.ActionTrigger>
          <Button
            h="45px"
            px="20px"
            rounded="14px"
            bg="#1646CC"
            color="white"
            fontSize="15px"
            fontWeight={700}
            disabled={!canConfirm}
            _disabled={{ opacity: 0.5, cursor: "not-allowed" }}
            onClick={() =>
              onConfirm({
                mode,
                publicGeometry:
                  mode === "custom" ? toPublicGeometry(shapes) : null,
              })
            }
          >
            {t("SellerOfferCreate.coverageScope.confirm")}
          </Button>
        </Flex>
      </Dialog.Footer>
    </>
  );
}
