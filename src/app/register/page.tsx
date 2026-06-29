"use client";

import FormRegister from "@/components/Forms/FormRegister";
import { Stack } from "@chakra-ui/react";

export default function RegisterPage() {
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
      <FormRegister />
    </Stack>
  );
}
