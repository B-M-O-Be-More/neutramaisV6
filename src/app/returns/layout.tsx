"use client";

import type { ReactNode } from "react";

import { ReturnsProvider } from "@/contexts/ReturnsContext";

// O estado das devoluções vive aqui para a lista, o detalhe e o formulário
// enxergarem a mesma solicitação ao navegar entre eles.
export default function ReturnsLayout({ children }: { children: ReactNode }) {
  return <ReturnsProvider>{children}</ReturnsProvider>;
}
