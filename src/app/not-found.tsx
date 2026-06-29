"use client";

import { Button, Heading, Stack, Text } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const MotionStack = motion(Stack);

export default function NotFound() {
  const router = useRouter();

  return (
    <MotionStack
      minH="100vh"
      w="full"
      justify="center"
      align="center"
      px={4}
      gap={6}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Heading size="4xl" color="brand.500">
        404
      </Heading>

      <Text fontSize="lg" textAlign="center" maxW="420px" color="fg.muted">
        A pagina que voce procura nao existe.
      </Text>

      <Button colorPalette="brand" onClick={() => router.push("/")}>
        Voltar para a Home
      </Button>
    </MotionStack>
  );
}
