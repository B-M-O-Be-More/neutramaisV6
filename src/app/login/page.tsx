"use client";

import FormLogin from "@/components/Forms/FormLogin";
import { Stack } from "@chakra-ui/react";

export default function LoginPage() {
  return (
    <Stack
      w="full"
      minH="100dvh"
      align="center"
      justify="center"
      gap={6}
      p={{ base: 4, md: 6 }}
      bg="#010409"
    >
      <FormLogin />
    </Stack>
  );
}
