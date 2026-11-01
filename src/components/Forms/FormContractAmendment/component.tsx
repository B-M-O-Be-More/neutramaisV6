"use client";

import { Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { LuSend } from "react-icons/lu";

import Textarea from "@/components/FormControl/Textarea";
import { contractAmendmentSchema } from "@/schemas/contracts";

import {
  ContractAmendmentValues,
  FormContractAmendmentProps,
} from "./interface";

/**
 * Pedido de aditivo (change request) de um contrato. `inline`: bloco dentro
 * do card da lista (Figma 2084-12767). `section`: corpo da seção "Change
 * Requests" do detalhe (Figma 2190-14304).
 */
export function FormContractAmendment({
  id,
  variant,
  isSubmitting,
  onSubmit,
  onCancel,
}: FormContractAmendmentProps) {
  const { t } = useTranslation();
  const isInline = variant === "inline";
  const fieldId = `${id}-description`;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContractAmendmentValues>({
    resolver: yupResolver(contractAmendmentSchema),
    mode: "onSubmit",
    defaultValues: { description: "" },
  });

  const error = errors.description?.message;

  return (
    <Stack
      gap="12px"
      p={isInline ? "21px" : "20px"}
      bg="#F3EEFF"
      borderWidth={isInline ? "1px" : 0}
      borderColor="#D3BFFD"
      rounded={isInline ? "14px" : 0}
      asChild
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {isInline && (
          <Text
            as="h3"
            color="#8B5CF6"
            fontSize="14px"
            fontWeight={700}
            lineHeight="21px"
          >
            {t("Contracts.amendment.title")}
          </Text>
        )}
        <Text color="#5B21B6" fontSize="12px" lineHeight="18px">
          {t(
            isInline
              ? "Contracts.amendment.description"
              : "Contracts.amendment.sectionDescription",
          )}
        </Text>

        <Textarea
          id={fieldId}
          minH="84.5px"
          px={isInline ? "13px" : "16px"}
          py={isInline ? "13px" : "12px"}
          bg="white"
          borderColor="#D3BFFD"
          rounded="10px"
          color="#0F1729"
          fontSize="13px"
          lineHeight="19.5px"
          maxLength={2000}
          _placeholder={{ color: "rgba(10, 10, 10, 0.5)" }}
          _focus={{ borderColor: "#8B5CF6" }}
          placeholder={t(
            isInline
              ? "Contracts.amendment.placeholder"
              : "Contracts.amendment.sectionPlaceholder",
          )}
          aria-label={t("Contracts.amendment.label")}
          error={error ? t(error) : undefined}
          {...register("description")}
        />

        <Flex gap="8px" wrap="wrap">
          <Button
            type="button"
            variant="plain"
            h="38px"
            minW="90px"
            px="12px"
            bg="white"
            borderWidth="1px"
            borderColor="#E5E8EE"
            rounded={isInline ? "18px" : "15px"}
            color="#5A6478"
            fontSize={isInline ? "13px" : "14px"}
            fontWeight={600}
            disabled={isSubmitting}
            onClick={onCancel}
          >
            {t("Contracts.amendment.cancel")}
          </Button>
          <Button
            type="submit"
            h={isInline ? "40px" : "38px"}
            px="12px"
            gap="6px"
            bg="#8B5CF6"
            rounded="10px"
            color="white"
            fontSize="13px"
            fontWeight={700}
            lineHeight="19.5px"
            _hover={{ bg: "#7C4DEB" }}
            loading={isSubmitting}
          >
            {t(
              isInline
                ? "Contracts.amendment.submit"
                : "Contracts.amendment.sectionSubmit",
            )}
            {!isInline && <Icon as={LuSend} boxSize="12px" />}
          </Button>
        </Flex>
      </form>
    </Stack>
  );
}
