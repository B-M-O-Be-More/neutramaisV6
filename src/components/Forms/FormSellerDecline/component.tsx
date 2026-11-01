"use client";

import { Button, Flex, Stack, Text, Textarea } from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { proposalFieldDescribedBy } from "@/components/ProposalFormField";
import { sellerDeclineSchema } from "@/schemas/sellerInbox";

import { FormSellerDeclineProps, SellerDeclineValues } from "./interface";

/**
 * Motivo da recusa de um pedido ou de uma RFQ, aberto no próprio card
 * (Figma 2948-50812): obrigatório e auditável.
 */
export function FormSellerDecline({
  id,
  title,
  placeholder,
  confirmLabel,
  isSubmitting,
  onCancel,
  onSubmit,
}: FormSellerDeclineProps) {
  const { t } = useTranslation();
  const fieldId = `${id}-reason`;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SellerDeclineValues>({
    resolver: yupResolver(sellerDeclineSchema),
    mode: "onSubmit",
    defaultValues: { reason: "" },
  });

  const error = errors.reason?.message;

  return (
    <Stack
      asChild
      gap="12px"
      p="16px"
      bg="#FEF2F2"
      borderWidth="1px"
      borderColor="#FECACA"
      rounded="8px"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Text
          asChild
          color="#EF4444"
          fontSize="13px"
          fontWeight={700}
          lineHeight="19.5px"
        >
          <label htmlFor={fieldId}>{title}</label>
        </Text>

        <Stack gap="4px">
          <Textarea
            id={fieldId}
            minH="84.5px"
            px="12px"
            py="12px"
            bg="white"
            borderWidth="1px"
            borderColor="#FECACA"
            rounded="8px"
            color="#0F1729"
            fontSize="13px"
            lineHeight="19.5px"
            resize="vertical"
            maxLength={2000}
            focusRingColor="#EF4444"
            _placeholder={{ color: "rgba(15,23,41,0.5)" }}
            placeholder={placeholder}
            aria-invalid={!!error}
            aria-describedby={proposalFieldDescribedBy(fieldId, { error })}
            {...register("reason")}
          />
          {error && (
            <Text
              id={`${fieldId}-error`}
              color="#EF4444"
              fontSize="12px"
              lineHeight="18px"
            >
              {t(error)}
            </Text>
          )}
        </Stack>

        <Flex gap="8px" wrap="wrap">
          <Button
            type="button"
            variant="plain"
            h="auto"
            px="16px"
            py="8px"
            rounded="8px"
            borderWidth="1px"
            borderColor="#E5E8EE"
            bg="white"
            color="#5A6478"
            fontSize="13px"
            fontWeight={400}
            lineHeight="19.5px"
            _hover={{ bg: "#F4F6F9" }}
            disabled={isSubmitting}
            onClick={onCancel}
          >
            {t("SellerOrders.actions.cancel")}
          </Button>
          <Button
            type="submit"
            h="auto"
            px="16px"
            py="8px"
            rounded="8px"
            bg="#EF4444"
            color="white"
            fontSize="13px"
            fontWeight={700}
            lineHeight="19.5px"
            _hover={{ bg: "#DC2626" }}
            loading={isSubmitting}
          >
            {confirmLabel}
          </Button>
        </Flex>
      </form>
    </Stack>
  );
}
