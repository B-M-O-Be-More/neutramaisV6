"use client";

import { Button, Flex, Icon, Stack, Text, Textarea } from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { LuSend } from "react-icons/lu";

import { proposalFieldDescribedBy } from "@/components/ProposalFormField";
import {
  SELLER_COMPLEMENT_MIN,
  sellerComplementSchema,
} from "@/schemas/sellerInbox";

import { FormSellerComplementProps, SellerComplementValues } from "./interface";

/** Sugestões rápidas do design, na ordem dele. */
const SUGGESTIONS = ["address", "duct", "floorPlan", "visit"] as const;

const FIELD_ID = "seller-complement-message";

/**
 * Corpo e rodapé do "Pedir complemento" (Figma 3009-73738): aviso ao
 * comprador, sugestões que entram no texto e a solicitação com o mínimo de
 * caracteres.
 */
export function FormSellerComplement({
  isSubmitting,
  onCancel,
  onSubmit,
}: FormSellerComplementProps) {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    control,
    formState: { errors, isSubmitted },
  } = useForm<SellerComplementValues>({
    resolver: yupResolver(sellerComplementSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: { message: "" },
  });

  const length = (useWatch({ control, name: "message" }) ?? "").trim().length;
  const error = errors.message?.message;
  const counterId = `${FIELD_ID}-counter`;

  // A sugestão vai para o fim do texto, numa linha própria.
  const addSuggestion = (text: string) => {
    const current = getValues("message").trimEnd();
    setValue("message", current ? `${current}\n${text}` : text, {
      shouldValidate: isSubmitted,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack gap="16px" px="24px" py="20px">
        <Text
          px="16px"
          py="12px"
          bg="#EEF3FF"
          borderWidth="1px"
          borderColor="#C7D8FF"
          rounded="12px"
          color="#1F5AFF"
          fontSize="12px"
          lineHeight="18px"
        >
          {t("SellerOrders.complement.notice")}
        </Text>

        <Stack gap="8px">
          <Text
            id={`${FIELD_ID}-suggestions`}
            color="#5A6478"
            fontSize="12px"
            fontWeight={600}
            lineHeight="18px"
          >
            {t("SellerOrders.complement.suggestionsTitle")}
          </Text>
          <Stack
            gap="6px"
            role="group"
            aria-labelledby={`${FIELD_ID}-suggestions`}
          >
            {SUGGESTIONS.map((key) => {
              const text = t(`SellerOrders.complement.suggestions.${key}`);
              return (
                <Button
                  key={key}
                  type="button"
                  variant="plain"
                  h="auto"
                  minH="33px"
                  px="12px"
                  py="7px"
                  justifyContent="flex-start"
                  textAlign="left"
                  whiteSpace="normal"
                  rounded="8px"
                  borderWidth="1px"
                  borderColor="#E5E8EE"
                  color="#5A6478"
                  fontSize="12px"
                  fontWeight={400}
                  lineHeight="18px"
                  _hover={{ bg: "#F4F6F9" }}
                  onClick={() => addSuggestion(text)}
                >
                  {text}
                </Button>
              );
            })}
          </Stack>
        </Stack>

        <Stack gap={0}>
          <Text
            asChild
            pb="6px"
            color="#5A6478"
            fontSize="12px"
            fontWeight={600}
            lineHeight="18px"
          >
            <label htmlFor={FIELD_ID}>
              {t("SellerOrders.complement.label")} *
            </label>
          </Text>
          <Textarea
            id={FIELD_ID}
            minH="112px"
            p="16px"
            bg="#F8F9FB"
            borderWidth="1px"
            borderColor="#E5E8EE"
            rounded="12px"
            color="#0F1729"
            fontSize="13px"
            lineHeight="19.5px"
            resize="vertical"
            maxLength={2000}
            focusRingColor="#1F5AFF"
            _placeholder={{ color: "rgba(9,9,11,0.5)" }}
            placeholder={t("SellerOrders.complement.placeholder")}
            aria-invalid={!!error}
            aria-describedby={[
              proposalFieldDescribedBy(FIELD_ID, { error }),
              counterId,
            ]
              .filter(Boolean)
              .join(" ")}
            {...register("message")}
          />
          {error && (
            <Text
              id={`${FIELD_ID}-error`}
              pt="4px"
              color="#EF4444"
              fontSize="12px"
              lineHeight="18px"
            >
              {t(error)}
            </Text>
          )}
          <Text
            id={counterId}
            pt="4px"
            color="#A0ABB8"
            fontSize="11px"
            lineHeight="16.5px"
          >
            {t("SellerOrders.complement.counter", {
              count: length,
              min: SELLER_COMPLEMENT_MIN,
            })}
          </Text>
        </Stack>
      </Stack>

      <Flex
        justify="flex-end"
        gap="8px"
        px="24px"
        py="16px"
        borderTopWidth="1px"
        borderColor="#F4F6F9"
        direction={{ base: "column-reverse", sm: "row" }}
      >
        <Button
          type="button"
          variant="plain"
          h="auto"
          px="20px"
          py="10px"
          rounded="12px"
          borderWidth="1px"
          borderColor="#E5E8EE"
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
          px="20px"
          py="10px"
          gap="8px"
          rounded="12px"
          bg="#1F5AFF"
          color="white"
          fontSize="13px"
          fontWeight={700}
          lineHeight="19.5px"
          _hover={{ bg: "#1646CC" }}
          loading={isSubmitting}
        >
          <Icon as={LuSend} boxSize="14px" />
          {t("SellerOrders.complement.submit")}
        </Button>
      </Flex>
    </form>
  );
}
