"use client";

import { Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuCamera, LuFileText, LuX } from "react-icons/lu";

import { formatFileSize } from "@/functions/formatFileSize";

import {
  RETURN_EVIDENCE_ACCEPT,
  RETURN_EVIDENCE_MAX_FILES,
  ReturnEvidencePickerProps,
} from "./interface";

const ACCEPTED_TYPES = RETURN_EVIDENCE_ACCEPT.split(",");

/**
 * Fotos e comprovações da devolução (Figma 2943-31789): arrastar e soltar ou
 * clicar para escolher. Só guarda os arquivos — o envio acontece ao enviar a
 * solicitação.
 */
export function ReturnEvidencePicker({
  id,
  files,
  onChange,
  locale,
  disabled = false,
  error,
}: ReturnEvidencePickerProps) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = React.useState(false);
  const isFull = files.length >= RETURN_EVIDENCE_MAX_FILES;
  const isBlocked = disabled || isFull;

  // Ignora tipos fora da lista e o que passar do limite de arquivos.
  const add = (list: FileList | null) => {
    if (!list) return;
    const accepted = Array.from(list).filter((file) =>
      ACCEPTED_TYPES.includes(file.type),
    );
    onChange([...files, ...accepted].slice(0, RETURN_EVIDENCE_MAX_FILES));
  };

  const describedBy = error ? `${id}-error` : `${id}-hint`;

  return (
    <Stack gap="8px">
      <Stack
        asChild
        align="center"
        gap="8px"
        p="32px"
        bg={isDragging ? "#EEF3FF" : "#F8FAFF"}
        borderWidth="2px"
        borderStyle="dashed"
        borderColor={error ? "#EF4444" : isDragging ? "#1F5AFF" : "#C7D8FF"}
        rounded="12px"
        textAlign="center"
        cursor={isBlocked ? "not-allowed" : "pointer"}
        opacity={isBlocked ? 0.6 : 1}
        _focusWithin={{ outline: "2px solid #1F5AFF", outlineOffset: "2px" }}
        onDragOver={(event: React.DragEvent) => {
          event.preventDefault();
          if (!isBlocked) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event: React.DragEvent) => {
          event.preventDefault();
          setIsDragging(false);
          if (!isBlocked) add(event.dataTransfer.files);
        }}
      >
        <label htmlFor={id}>
          <input
            id={id}
            type="file"
            multiple
            accept={RETURN_EVIDENCE_ACCEPT}
            disabled={isBlocked}
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
              add(event.target.files);
              // Permite escolher o mesmo arquivo de novo depois de remover.
              event.target.value = "";
            }}
          />
          <Icon as={LuCamera} boxSize="24px" color="#1F5AFF" />
          <Text
            color="#1F5AFF"
            fontSize="13px"
            fontWeight={700}
            lineHeight="19.5px"
          >
            {t("Returns.form.evidenceTitle")}
          </Text>
          <Text
            id={`${id}-hint`}
            color="#8A9AB5"
            fontSize="10px"
            lineHeight="15px"
          >
            {t("Returns.form.evidenceHint", {
              count: RETURN_EVIDENCE_MAX_FILES,
            })}
          </Text>
        </label>
      </Stack>

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

      {files.length > 0 && (
        <Stack as="ul" gap="8px" listStyleType="none">
          {files.map((file, index) => (
            <Flex
              as="li"
              key={`${file.name}-${index}`}
              align="center"
              gap="10px"
              px="12px"
              py="8px"
              bg="#F8F9FB"
              borderWidth="1px"
              borderColor="#E5E8EE"
              rounded="10px"
            >
              <Icon
                as={file.type === "application/pdf" ? LuFileText : LuCamera}
                boxSize="14px"
                flexShrink={0}
                color="#8A9AB5"
                aria-hidden
              />
              <Text
                flex="1"
                minW={0}
                truncate
                color="#0F1729"
                fontSize="12px"
                fontWeight={600}
                lineHeight="18px"
              >
                {file.name}
              </Text>
              <Text color="#A0ABB8" fontSize="11px" flexShrink={0}>
                {formatFileSize(file.size, locale)}
              </Text>
              <Button
                variant="plain"
                size="xs"
                minW="24px"
                h="24px"
                p={0}
                color="#8A9AB5"
                _hover={{ color: "#EF4444" }}
                aria-label={t("Returns.form.removeFile", { name: file.name })}
                disabled={disabled}
                onClick={() => onChange(files.filter((_, i) => i !== index))}
              >
                <Icon as={LuX} boxSize="14px" />
              </Button>
            </Flex>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
