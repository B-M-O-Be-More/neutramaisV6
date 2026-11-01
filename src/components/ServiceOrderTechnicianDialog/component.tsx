"use client";

import {
  chakra,
  Flex,
  Grid,
  Icon,
  RadioGroup,
  Stack,
  Text,
} from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuPlus, LuUser, LuUsers } from "react-icons/lu";

import FormServiceOrderTechnician from "@/components/Forms/FormServiceOrderTechnician";
import ProposalsDialogFrame from "@/components/ProposalsDialogFrame";
import ServiceOrderDialogActions from "@/components/ServiceOrderDialogActions";

import { ServiceOrderTechnicianDialogProps } from "./interface";

type TechnicianTab = "existing" | "new";

const TABS: { key: TechnicianTab; icon: typeof LuUsers }[] = [
  { key: "existing", icon: LuUsers },
  { key: "new", icon: LuPlus },
];

/**
 * "Adicionar técnico" (Figma 2968-69041 e 2968-70259): escolhe um
 * profissional da equipe do seller ou cadastra um novo. Na OS pendente, a
 * confirmação pergunta em seguida se a execução já começa.
 */
export function ServiceOrderTechnicianDialog({
  item,
  technicians,
  isPending,
  onClose,
  onConfirm,
}: ServiceOrderTechnicianDialogProps) {
  const { t } = useTranslation();
  const [tab, setTab] = React.useState<TechnicianTab>("existing");
  const [selected, setSelected] = React.useState<string | null>(
    item?.technician?.id ?? null,
  );

  const isChange = !!item?.technician;
  const confirmLabel = t(
    item?.status === "pending"
      ? "ServiceOrders.technician.confirmAdd"
      : "ServiceOrders.technician.confirmChange",
  );

  return (
    <ProposalsDialogFrame
      open={item !== null}
      onClose={onClose}
      isBusy={isPending}
      closeTone="filled"
      maxW="513px"
      title={t(
        isChange
          ? "ServiceOrders.technician.changeTitle"
          : "ServiceOrders.technician.title",
      )}
      subtitle={t("ServiceOrders.technician.subtitle")}
    >
      <Stack gap="20px">
        <Grid
          role="tablist"
          aria-label={t("ServiceOrders.technician.title")}
          templateColumns="1fr 1fr"
          gap="8px"
          p="4px"
          bg="#F4F6F9"
          rounded="12px"
        >
          {TABS.map(({ key, icon }) => {
            const isActive = tab === key;
            return (
              <chakra.button
                key={key}
                type="button"
                role="tab"
                id={`technician-tab-${key}`}
                aria-selected={isActive}
                aria-controls={`technician-panel-${key}`}
                onClick={() => setTab(key)}
                display="flex"
                alignItems="center"
                justifyContent="center"
                gap="8px"
                h="38px"
                bg={isActive ? "white" : "transparent"}
                rounded="8px"
                boxShadow={
                  isActive
                    ? "0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)"
                    : undefined
                }
                color={isActive ? "#1F5AFF" : "#8A9AB5"}
                fontSize="12px"
                fontWeight={700}
                lineHeight="18px"
                cursor="pointer"
                _focusVisible={{
                  outline: "2px solid #1F5AFF",
                  outlineOffset: "2px",
                }}
              >
                <Icon as={icon} boxSize="13px" aria-hidden />
                {t(`ServiceOrders.technician.tabs.${key}`)}
              </chakra.button>
            );
          })}
        </Grid>

        {tab === "existing" ? (
          <Stack
            role="tabpanel"
            id="technician-panel-existing"
            aria-labelledby="technician-tab-existing"
            gap="20px"
          >
            {technicians.length === 0 ? (
              <Text
                py="16px"
                color="#8A9AB5"
                fontSize="12px"
                lineHeight="18px"
                textAlign="center"
              >
                {t("ServiceOrders.technician.noneRegistered")}
              </Text>
            ) : (
              <RadioGroup.Root
                value={selected}
                onValueChange={(details) => setSelected(details.value)}
                aria-label={t("ServiceOrders.technician.tabs.existing")}
              >
                <Stack gap="8px">
                  {technicians.map((technician) => {
                    const isSelected = technician.id === selected;
                    return (
                      <RadioGroup.Item
                        key={technician.id}
                        value={technician.id}
                        display="flex"
                        alignItems="center"
                        gap="12px"
                        p="16px"
                        bg={isSelected ? "#EEF3FF" : "white"}
                        borderWidth="2px"
                        borderColor={isSelected ? "#1F5AFF" : "#E5E8EE"}
                        rounded="12px"
                        cursor="pointer"
                        _hover={
                          isSelected ? undefined : { borderColor: "#C4CDD8" }
                        }
                      >
                        <RadioGroup.ItemHiddenInput />
                        <Flex
                          align="center"
                          justify="center"
                          boxSize="40px"
                          flexShrink={0}
                          bg="#F4F6F9"
                          rounded="full"
                          aria-hidden
                        >
                          <Icon as={LuUser} boxSize="16px" color="#8A9AB5" />
                        </Flex>
                        <RadioGroup.ItemText flex="1" minW={0}>
                          <Text
                            as="span"
                            display="block"
                            color="#0F1729"
                            fontSize="13px"
                            fontWeight={700}
                            lineHeight="19.5px"
                          >
                            {technician.name}
                          </Text>
                          <Text
                            as="span"
                            display="block"
                            color="#8A9AB5"
                            fontSize="10px"
                            lineHeight="15px"
                          >
                            {technician.phone} · {technician.specialty}
                          </Text>
                        </RadioGroup.ItemText>
                        <RadioGroup.ItemIndicator
                          boxSize="16px"
                          borderWidth="2px"
                          borderColor="#C4CDD8"
                          _checked={{ bg: "#1F5AFF", borderColor: "#1F5AFF" }}
                        />
                      </RadioGroup.Item>
                    );
                  })}
                </Stack>
              </RadioGroup.Root>
            )}

            <ServiceOrderDialogActions
              confirmLabel={confirmLabel}
              isSubmitting={isPending}
              confirmDisabled={!selected || selected === item?.technician?.id}
              onCancel={onClose}
              onConfirm={() => {
                if (selected) onConfirm(selected);
              }}
            />
          </Stack>
        ) : (
          <Stack
            role="tabpanel"
            id="technician-panel-new"
            aria-labelledby="technician-tab-new"
          >
            <FormServiceOrderTechnician
              confirmLabel={confirmLabel}
              isSubmitting={isPending}
              onCancel={onClose}
              onSubmit={(values) =>
                onConfirm({
                  name: values.name,
                  phone: values.phone,
                  specialty: values.specialty,
                  ...(values.email ? { email: values.email } : {}),
                })
              }
            />
          </Stack>
        )}
      </Stack>
    </ProposalsDialogFrame>
  );
}
