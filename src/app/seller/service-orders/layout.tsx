"use client";

import type { ReactNode } from "react";

import { SellerServiceOrdersProvider } from "@/contexts/SellerServiceOrdersContext";

// O estado das ordens de serviço vive aqui para a lista, as demandas e o
// detalhe enxergarem a mesma OS ao navegar entre eles.
export default function SellerServiceOrdersLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <SellerServiceOrdersProvider>{children}</SellerServiceOrdersProvider>;
}
