"use client";

import { Button, Flex, Grid, Icon, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuUserPlus } from "react-icons/lu";

import ProposalsNotice from "@/components/ProposalsNotice";

import { ServiceOrderTechniciansProps } from "./interface";

/**
 * "Técnicos" da OS (Figma 2968-72582; sem técnico: 2191-21596): o
 * responsável com telefone e especialidade, e "Alterar técnico". Sem ninguém,
 * avisa que a OS fica pendente até um técnico entrar.
 */
export function ServiceOrderTechnicians({
  technician,
  canChange,
  onChange,
}: ServiceOrderTechniciansProps) {
  const { t } = useTranslation();

  return (
    <Stack
      as="section"
      aria-labelledby="service-order-technicians"
      gap="12px"
      p="20px"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="12px"
    >
      <Flex align="center" justify="space-between" gap="12px" minH="34px">
        <Text
          id="service-order-technicians"
          as="h2"
          color="#0F1729"
          fontSize="14px"
          fontWeight={700}
          lineHeight="22px"
        >
          {t("ServiceOrders.detail.technicians.title")}
        </Text>
        {technician && canChange && (
          <Button
            variant="plain"
            h="34px"
            px="12px"
            gap="8px"
            bg="#F4F6F9"
            rounded="8px"
            color="#0F1729"
            fontSize="12px"
            fontWeight={600}
            lineHeight="18px"
            _hover={{ bg: "#E5E8EE" }}
            onClick={onChange}
          >
            <Icon as={LuUserPlus} boxSize="13px" />
            {t("ServiceOrders.detail.technicians.change")}
          </Button>
        )}
      </Flex>

      {technician ? (
        <Grid
          templateColumns={{ base: "1fr", sm: "repeat(3, 1fr)" }}
          alignItems="center"
          gap="4px 16px"
          px="20px"
          py="12px"
          borderWidth="1px"
          borderColor="#DCE2EC"
          rounded="12px"
        >
          <Text color="#0F1729" fontSize="14px" lineHeight="22px">
            {technician.name}
          </Text>
          <Text color="#0F1729" fontSize="14px" lineHeight="22px">
            {technician.phone}
          </Text>
          <Text color="#8A9AB5" fontSize="11px" lineHeight="22px">
            {technician.specialty}
          </Text>
        </Grid>
      ) : (
        <>
          <Flex
            align="center"
            justify="center"
            minH="52px"
            px="20px"
            py="14px"
            borderWidth="1px"
            borderColor="#DCE2EC"
            rounded="12px"
          >
            <Text
              color="#5A6478"
              fontSize="14px"
              lineHeight="22px"
              textAlign="center"
            >
              {t("ServiceOrders.detail.technicians.empty")}
            </Text>
          </Flex>
          <ProposalsNotice tone="warning">
            {t("ServiceOrders.detail.technicians.pendingNotice")}
          </ProposalsNotice>
        </>
      )}
    </Stack>
  );
}
