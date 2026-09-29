"use client";

import { Box, Flex, Text } from "@chakra-ui/react";

import AuthBrandPanel from "@/components/AuthBrandPanel";

import { AuthLayoutProps } from "./interface";

/**
 * Layout base das telas de autenticação (login/registro).
 * Em telas grandes exibe a barra lateral de marca à esquerda e o formulário
 * centralizado à direita; em telas menores a barra é ocultada e um wordmark
 * compacto aparece no topo. O conteúdo (children) controla a própria largura.
 */
export function AuthLayout({ children, sidebar }: AuthLayoutProps) {
  return (
    <Flex minH="100dvh" w="full" bg="bg.page">
      {sidebar ?? <AuthBrandPanel />}

      <Box flex="1" overflowY="auto">
        <Flex
          minH="100dvh"
          direction="column"
          align="center"
          justify="center"
          px={{ base: 6, md: 10 }}
          py={12}
        >
          {/* Wordmark compacto — só aparece quando a barra lateral está oculta */}
          <Flex display={{ base: "flex", lg: "none" }} align="center" mb={8}>
            <Text fontSize="20px" fontWeight={800} color="fg.default">
              Neutra
              <Text as="span" color="brand.500">
                +
              </Text>
            </Text>
          </Flex>

          {children}
        </Flex>
      </Box>
    </Flex>
  );
}
