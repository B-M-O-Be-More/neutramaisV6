"use client";

import { Flex, Icon, Link, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { LuChevronLeft } from "react-icons/lu";

import FormPaymentMethod from "@/components/Forms/FormPaymentMethod";
import { toaster } from "@/components/ui/toaster";

import { WalletAddPaymentMethodProps } from "./interface";

/**
 * Tela "Adicionar método de pagamento" (Figma 2208-37661 / 2215-20243).
 *
 * O serviço de pagamentos ainda não tem rota para cadastrar métodos: o
 * formulário valida e avisa que o cadastro não está disponível. Nenhum dado
 * sai do browser — o cartão, quando integrado, deve ir direto ao provedor de
 * pagamento (tokenização), nunca pelo BFF.
 */
export function WalletAddPaymentMethod({
  backHref,
  initialType,
}: WalletAddPaymentMethodProps) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Stack
      maxW="1280px"
      px={{ base: 4, md: "32px" }}
      py={{ base: 6, md: "28px" }}
      gap="24px"
    >
      <Flex align="center" gap="12px" wrap="wrap">
        <Link
          asChild
          gap="6px"
          color="#8A9AB5"
          fontSize="13px"
          fontWeight={500}
          lineHeight="19.5px"
        >
          <NextLink href={backHref}>
            <Icon as={LuChevronLeft} boxSize="16px" />
            {t("Wallet.back")}
          </NextLink>
        </Link>
        <Text color="#C4CDD8" fontSize="16px" lineHeight="24px" aria-hidden>
          /
        </Text>
        <Text
          color="#0F1729"
          fontSize="13px"
          fontWeight={600}
          lineHeight="19.5px"
        >
          {t("Wallet.addMethod.title")}
        </Text>
      </Flex>

      <Stack gap="4px">
        <Text
          as="h1"
          color="#0F1729"
          fontSize="22px"
          fontWeight={800}
          lineHeight="33px"
        >
          {t("Wallet.addMethod.title")}
        </Text>
        <Text color="#8A9AB5" fontSize="13px" lineHeight="19.5px">
          {t("Wallet.addMethod.subtitle")}
        </Text>
      </Stack>

      <FormPaymentMethod
        initialType={initialType}
        onCancel={() => router.push(backHref)}
        onSubmit={() =>
          toaster.create({
            type: "warning",
            title: t("Wallet.addMethod.unavailable.title"),
            description: t("Wallet.addMethod.unavailable.description"),
          })
        }
      />
    </Stack>
  );
}
