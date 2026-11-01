"use client";

import {
  Box,
  Flex,
  Grid,
  Icon,
  Link,
  Spinner,
  Stack,
  Text,
  VisuallyHidden,
} from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuCamera, LuCircleCheck, LuDownload, LuUpload } from "react-icons/lu";

import { serviceOrderEvidenceProgress } from "@/functions/serviceOrders";

import { ServiceOrderEvidencesProps } from "./interface";

/** Foto, vídeo ou PDF de relatório/teste técnico (regras §11). */
const ACCEPT = "image/*,video/*,application/pdf";

/**
 * "Evidências de conclusão" (Figma 2968-72516): quantas foram registradas, a
 * barra de progresso e um slot por evidência obrigatória — registrada com
 * "Ver arquivo", pendente com "Registrar" enquanto a OS está em execução.
 */
export function ServiceOrderEvidences({
  item,
  canRegister,
  registeringIndex,
  onRegister,
}: ServiceOrderEvidencesProps) {
  const { t } = useTranslation();
  const progress = serviceOrderEvidenceProgress(item);
  const inputId = React.useId();

  return (
    <Stack
      as="section"
      aria-labelledby={`${inputId}-title`}
      gap={0}
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="12px"
      overflow="hidden"
    >
      <Flex
        align="center"
        justify="space-between"
        gap="12px"
        wrap="wrap"
        px="20px"
        py="16px"
        borderBottomWidth="1px"
        borderColor="#F4F6F9"
      >
        <Flex align="center" gap="8px">
          <Icon as={LuCamera} boxSize="14px" color="#1F5AFF" aria-hidden />
          <Text
            id={`${inputId}-title`}
            as="h2"
            color="#0F1729"
            fontSize="13px"
            fontWeight={700}
            lineHeight="19.5px"
          >
            {t("ServiceOrders.detail.evidences.title")}
          </Text>
          <Text
            px="8px"
            py="2px"
            bg="#EEF3FF"
            rounded="6px"
            color="#1F5AFF"
            fontSize="11px"
            fontWeight={700}
            lineHeight="16.5px"
          >
            {progress.done}/{progress.total}
          </Text>
        </Flex>
        <Flex align="center" gap="8px">
          <Box
            w="128px"
            h="8px"
            bg="#F4F6F9"
            rounded="full"
            overflow="hidden"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress.percent}
            aria-label={t("ServiceOrders.detail.evidences.title")}
          >
            <Box
              h="full"
              w={`${progress.percent}%`}
              bg="#1F5AFF"
              rounded="full"
            />
          </Box>
          <Text color="#A0ABB8" fontSize="11px" lineHeight="16.5px">
            {progress.percent}%
          </Text>
        </Flex>
      </Flex>

      <Grid
        templateColumns={{ base: "1fr", sm: "repeat(3, 1fr)" }}
        gap="12px"
        p="20px"
      >
        {item.evidences.map((evidence, index) => {
          const isRegistered = !!evidence.fileName;
          const slotId = `${inputId}-${index}`;
          const label = t("ServiceOrders.detail.evidences.slot", {
            index: index + 1,
          });
          return (
            <Stack
              key={index}
              align="center"
              justify="center"
              gap="12px"
              minH="155px"
              p="20px"
              bg={isRegistered ? "#EDFBF5" : "#F8F9FB"}
              borderWidth="2px"
              borderStyle="dashed"
              borderColor={isRegistered ? "#10B981" : "#C4CDD8"}
              rounded="12px"
              textAlign="center"
            >
              <Icon
                as={isRegistered ? LuCircleCheck : LuCamera}
                boxSize="24px"
                color={isRegistered ? "#10B981" : "#A0ABB8"}
                aria-hidden
              />
              <Stack gap={0}>
                <Text
                  color={isRegistered ? "#10B981" : "#A0ABB8"}
                  fontSize="12px"
                  fontWeight={isRegistered ? 700 : 600}
                  lineHeight="18px"
                >
                  {label}
                </Text>
                <Text
                  color={isRegistered ? "#10B981" : "#C4CDD8"}
                  opacity={isRegistered ? 0.7 : 1}
                  fontSize="11px"
                  lineHeight="16.5px"
                >
                  {t(
                    isRegistered
                      ? "ServiceOrders.detail.evidences.registered"
                      : "ServiceOrders.detail.evidences.pending",
                  )}
                </Text>
              </Stack>

              {isRegistered && evidence.url && (
                <Link
                  href={evidence.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  display="flex"
                  alignItems="center"
                  gap="4px"
                  color="#10B981"
                  fontSize="11px"
                  lineHeight="16.5px"
                  _hover={{ textDecoration: "underline" }}
                >
                  <Icon as={LuDownload} boxSize="11px" aria-hidden />
                  {t("ServiceOrders.detail.evidences.view")}
                  <VisuallyHidden>{evidence.fileName}</VisuallyHidden>
                </Link>
              )}

              {!isRegistered && canRegister && (
                <Box asChild>
                  <label htmlFor={slotId}>
                    <Flex
                      as="span"
                      align="center"
                      gap="6px"
                      px="12px"
                      py="6px"
                      bg="#1F5AFF"
                      rounded="8px"
                      color="white"
                      fontSize="11px"
                      fontWeight={700}
                      lineHeight="16.5px"
                      cursor="pointer"
                      _hover={{ bg: "#1646CC" }}
                      _focusWithin={{
                        outline: "2px solid #1F5AFF",
                        outlineOffset: "2px",
                      }}
                    >
                      {registeringIndex === index ? (
                        <Spinner size="xs" />
                      ) : (
                        <Icon as={LuUpload} boxSize="12px" aria-hidden />
                      )}
                      {t("ServiceOrders.detail.evidences.register")}
                      <VisuallyHidden>{label}</VisuallyHidden>
                      <VisuallyHidden asChild>
                        <input
                          id={slotId}
                          type="file"
                          accept={ACCEPT}
                          disabled={registeringIndex !== null}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            event.target.value = "";
                            if (file) onRegister(index, file);
                          }}
                        />
                      </VisuallyHidden>
                    </Flex>
                  </label>
                </Box>
              )}
            </Stack>
          );
        })}
      </Grid>
    </Stack>
  );
}
