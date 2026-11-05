"use client";

import { Button, Heading, Stack, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import React from "react";
import { useTranslation } from "react-i18next";

import { resolvePostLoginRoute } from "@/functions/postLoginRoute";

// Sem permissão (SDD §11.1): destino do RequirePermission quando o perfil da
// sessão não pode abrir a página pedida.
export default function ForbiddenPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [isLeaving, setIsLeaving] = React.useState(false);

  // Volta para o início de quem está logado (dashboard, KYC ou admin); sem
  // sessão, a área autenticada manda para o login.
  const goHome = async () => {
    setIsLeaving(true);
    router.replace(await resolvePostLoginRoute());
  };

  return (
    <Stack
      minH="100dvh"
      w="full"
      justify="center"
      align="center"
      px={4}
      gap={6}
      textAlign="center"
    >
      <Heading size="4xl" color="brand.500">
        403
      </Heading>

      <Stack gap={2} maxW="420px">
        <Text as="h1" fontSize="xl" fontWeight={700} color="fg.default">
          {t("Forbidden.title")}
        </Text>
        <Text fontSize="md" color="fg.muted">
          {t("Forbidden.description")}
        </Text>
      </Stack>

      <Button colorPalette="brand" loading={isLeaving} onClick={goHome}>
        {t("Forbidden.cta")}
      </Button>
    </Stack>
  );
}
