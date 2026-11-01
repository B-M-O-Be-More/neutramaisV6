"use client";

import React from "react";

import { productCatalogService } from "@/services/productCatalog.service";

import type {
  ProductSpecification,
  UseProductSpecificationsReturn,
} from "./interface";

/**
 * Especificações de produto da organização do usuário logado — as
 * "categorias" do catálogo do seller. Carrega uma vez; em erro a lista fica
 * vazia (o filtro de categoria só perde as opções).
 */
export function useProductSpecifications(): UseProductSpecificationsReturn {
  const [specifications, setSpecifications] = React.useState<
    ProductSpecification[]
  >([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const controller = new AbortController();

    productCatalogService
      .listSpecifications({ signal: controller.signal })
      .then((data) => setSpecifications(data ?? []))
      .catch(() => {
        if (!controller.signal.aborted) setSpecifications([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  return { specifications, isLoading };
}
