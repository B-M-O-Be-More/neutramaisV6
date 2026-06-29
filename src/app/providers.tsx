"use client";

import { Provider } from "@/components/ui/provider";
import { Stack } from "@chakra-ui/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider>
      <Stack w="full" minH="100dvh">
        {children}
      </Stack>
    </Provider>
  );
}
