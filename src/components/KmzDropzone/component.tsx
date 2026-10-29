"use client";

import { Box, Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuFileArchive, LuUpload, LuX } from "react-icons/lu";

import { formatFileSize } from "@/functions/formatFileSize";

import { KmzDropzoneProps } from "./interface";

/** Geometrias que a geo-api lê do KML. */
const SUPPORTED_GEOMETRIES = ["Point", "LineString", "Polygon"];

/**
 * Área de envio do KMZ: arrastar e soltar ou clicar para escolher. Só
 * guarda o arquivo — a leitura e o envio acontecem ao salvar.
 */
export function KmzDropzone({
  id,
  file,
  onChange,
  disabled = false,
  error,
  locale,
}: KmzDropzoneProps) {
  const { t } = useTranslation();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const pick = (files: FileList | null) => {
    const next = files?.[0];
    if (next) onChange(next);
  };

  const describedBy = error ? `${id}-error` : `${id}-hint`;

  return (
    <Stack gap="4px">
      <Stack
        asChild
        align="center"
        gap="12px"
        p="20px"
        bg={isDragging ? "#EEF3FF" : "#F8F9FB"}
        borderWidth="2px"
        borderStyle="dashed"
        borderColor={error ? "#EF4444" : isDragging ? "#1F5AFF" : "#C4CDD8"}
        rounded="14px"
        textAlign="center"
        cursor={disabled ? "not-allowed" : "pointer"}
        opacity={disabled ? 0.6 : 1}
        _focusWithin={{ outline: "2px solid #1F5AFF", outlineOffset: "2px" }}
        onDragOver={(event: React.DragEvent) => {
          event.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event: React.DragEvent) => {
          event.preventDefault();
          setIsDragging(false);
          if (!disabled) pick(event.dataTransfer.files);
        }}
      >
        <label htmlFor={id}>
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept=".kmz,application/vnd.google-earth.kmz"
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            // Visualmente oculto, mas focável: o clique chega pelo rótulo.
            style={{
              position: "absolute",
              width: 1,
              height: 1,
              overflow: "hidden",
              clip: "rect(0 0 0 0)",
              whiteSpace: "nowrap",
            }}
            onChange={(event) => {
              pick(event.target.files);
              // Permite escolher o mesmo arquivo de novo depois de remover.
              event.target.value = "";
            }}
          />
          <Flex
            align="center"
            justify="center"
            boxSize="56px"
            bg="#F4F6F9"
            rounded="16px"
          >
            <Icon as={LuUpload} boxSize="22px" color="#5A6478" />
          </Flex>
          <Stack gap="4px" align="center">
            <Text
              color="#0F1729"
              fontSize="14px"
              fontWeight={600}
              lineHeight="21px"
            >
              {t("SellerCoverage.form.dropTitle")}
            </Text>
            <Text
              id={`${id}-hint`}
              color="#8A9AB5"
              fontSize="12px"
              lineHeight="18px"
            >
              {t("SellerCoverage.form.dropHint")}
            </Text>
          </Stack>
          <Flex gap="8px" wrap="wrap" justify="center" aria-hidden="true">
            {SUPPORTED_GEOMETRIES.map((geometry) => (
              <Box
                key={geometry}
                px="13px"
                py="7px"
                bg="white"
                borderWidth="1px"
                borderColor="#E5E8EE"
                rounded="full"
                color="#5A6478"
                fontSize="12px"
                lineHeight="18px"
              >
                {geometry} ✓
              </Box>
            ))}
          </Flex>
        </label>
      </Stack>

      {file && (
        <Flex
          align="center"
          gap="10px"
          px="12px"
          py="10px"
          bg="white"
          borderWidth="1px"
          borderColor="#E5E8EE"
          rounded="12px"
        >
          <Icon as={LuFileArchive} boxSize="16px" color="#1F5AFF" />
          <Stack gap={0} flex="1" minW={0}>
            <Text
              color="#0F1729"
              fontSize="13px"
              fontWeight={600}
              lineHeight="19.5px"
              truncate
            >
              {file.name}
            </Text>
            <Text color="#8A9AB5" fontSize="11px" lineHeight="16.5px">
              {formatFileSize(file.size, locale)}
            </Text>
          </Stack>
          <Button
            variant="plain"
            boxSize="32px"
            minW="32px"
            p={0}
            rounded="10px"
            color="#8A9AB5"
            disabled={disabled}
            aria-label={t("SellerCoverage.form.removeFile")}
            _hover={{ bg: "#F4F6F9", color: "#0F1729" }}
            onClick={() => {
              onChange(null);
              inputRef.current?.focus();
            }}
          >
            <Icon as={LuX} boxSize="14px" />
          </Button>
        </Flex>
      )}

      {error && (
        <Text
          id={`${id}-error`}
          color="#EF4444"
          fontSize="12px"
          lineHeight="18px"
        >
          {error}
        </Text>
      )}
    </Stack>
  );
}
