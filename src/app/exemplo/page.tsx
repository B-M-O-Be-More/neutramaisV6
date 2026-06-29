"use client";

import { Button, Heading, Stack, Text } from "@chakra-ui/react";
import { useApp } from "@/contexts/AppContext";

export default function ExemploPage() {
  const { setLoadingPages } = useApp();

  const handleSimulateLoading = () => {
    setLoadingPages(true);
    setTimeout(() => setLoadingPages(false), 1500);
  };

  return (
    <Stack
      w="full"
      minH="100dvh"
      align="center"
      justify="center"
      gap={6}
      px={6}
      textAlign="center"
    >
      <Heading size="xl">Pagina de Exemplo</Heading>
      <Text color="fg.muted" maxW="520px">
        Use esta pagina como referencia para criar novas rotas. Ela ja consome o
        contexto generico (AppContext) e dispara o GlobalLoader.
      </Text>

      <Button colorPalette="brand" onClick={handleSimulateLoading}>
        Simular GlobalLoader (1.5s)
      </Button>
    </Stack>
  );
}
