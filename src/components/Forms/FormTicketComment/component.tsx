"use client";

import { Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { LuSend } from "react-icons/lu";

import Textarea from "@/components/FormControl/Textarea";
import { ticketCommentSchema } from "@/schemas/tickets";

import { FormTicketCommentProps, TicketCommentValues } from "./interface";

/** "Adicionar comentário" no ticket aberto (Figma 3108-102318). */
export function FormTicketComment({
  id,
  isSubmitting,
  onSubmit,
}: FormTicketCommentProps) {
  const { t } = useTranslation();
  const fieldId = `${id}-comment`;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TicketCommentValues>({
    resolver: yupResolver(ticketCommentSchema),
    mode: "onSubmit",
    defaultValues: { comment: "" },
  });

  const submit = async ({ comment }: TicketCommentValues) => {
    if (await onSubmit(comment)) reset();
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate>
      <Stack gap="8px">
        <Text
          color="#0F1729"
          fontSize="13px"
          fontWeight={600}
          lineHeight="19.5px"
          asChild
        >
          <label htmlFor={fieldId}>{t("Tickets.comment.label")}</label>
        </Text>
        <Textarea
          id={fieldId}
          minH="84.5px"
          p="12px"
          bg="#F8F9FB"
          borderColor="#E5E8EE"
          rounded="8px"
          color="#0F1729"
          fontSize="13px"
          lineHeight="19.5px"
          maxLength={2000}
          _placeholder={{ color: "rgba(9, 9, 11, 0.5)" }}
          _focus={{ borderColor: "#8B5CF6" }}
          placeholder={t("Tickets.comment.placeholder")}
          error={
            errors.comment?.message ? t(errors.comment.message) : undefined
          }
          {...register("comment")}
        />
        <Flex>
          <Button
            type="submit"
            h="auto"
            px="16px"
            py="8px"
            gap="6px"
            bg="#8B5CF6"
            rounded="8px"
            color="white"
            fontSize="13px"
            fontWeight={700}
            lineHeight="19.5px"
            _hover={{ bg: "#7C4DEB" }}
            loading={isSubmitting}
          >
            <Icon as={LuSend} boxSize="12px" />
            {t("Tickets.comment.submit")}
          </Button>
        </Flex>
      </Stack>
    </form>
  );
}
