"use client";

import { Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { LuSend } from "react-icons/lu";

import Input from "@/components/FormControl/Input";
import { orderTrackingSchema } from "@/schemas/orderShipping";

import { FormOrderTrackingProps, OrderTrackingValues } from "./interface";

/**
 * "Informar rastreio" (rastreio manual): o código da transportadora. Depois
 * dele, a orders-api não deixa mais cancelar o pedido — o aviso diz isso.
 */
export function FormOrderTracking({
  defaultCode = "",
  isSubmitting,
  onCancel,
  onSubmit,
}: FormOrderTrackingProps) {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrderTrackingValues>({
    resolver: yupResolver(orderTrackingSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: { code: defaultCode },
  });

  const error = errors.code?.message;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack gap="16px" px="24px" py="20px">
        <Text
          px="16px"
          py="12px"
          bg="#FFF7E6"
          borderWidth="1px"
          borderColor="#FDDCA4"
          rounded="12px"
          color="#A15C07"
          fontSize="12px"
          lineHeight="18px"
        >
          {t("OrderShipping.tracking.notice")}
        </Text>
        <Input
          id="order-tracking-code"
          label={`${t("OrderShipping.tracking.label")} *`}
          placeholder={t("OrderShipping.tracking.placeholder")}
          autoComplete="off"
          maxLength={64}
          error={error ? t(error) : undefined}
          {...register("code")}
        />
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
          {t("OrderShipping.cancel")}
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
          {t("OrderShipping.tracking.submit")}
        </Button>
      </Flex>
    </form>
  );
}
