"use client";

import React from "react";

import {
  productCatalogService,
  type ProductCategory,
} from "@/services/productCatalog.service";

import type { UseCategoryTemplateReturn } from "./interface";

// O template muda pouco e o assistente troca de categoria várias vezes: uma
// leitura por categoria e por carregamento da página basta.
const cache = new Map<string, ProductCategory>();

/** Esvazia o cache (testes). */
export function clearCategoryTemplateCache() {
  cache.clear();
}

/**
 * Template e regras da categoria (`GET /category/{id}`). Sem `categoryId`
 * não chama a API.
 */
export function useCategoryTemplate(
  categoryId: string | null | undefined,
): UseCategoryTemplateReturn {
  const [attempt, setAttempt] = React.useState(0);
  const [result, setResult] = React.useState<{
    key: string;
    category: ProductCategory | null;
    hasError: boolean;
  } | null>(null);
  const key = `${categoryId ?? ""}:${attempt}`;
  const cached = categoryId ? cache.get(categoryId) : undefined;

  React.useEffect(() => {
    if (!categoryId || cache.has(categoryId)) return;
    const controller = new AbortController();

    productCatalogService
      .getCategory(categoryId, { signal: controller.signal })
      .then((category) => {
        if (category) cache.set(categoryId, category);
        setResult({ key, category: category ?? null, hasError: !category });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setResult({ key, category: null, hasError: true });
      });

    return () => controller.abort();
  }, [categoryId, key]);

  const refetch = React.useCallback(() => setAttempt((n) => n + 1), []);
  const current = result?.key === key ? result : null;
  const category = cached ?? current?.category ?? null;

  return {
    category,
    template: category?.template ?? [],
    rules: category?.rules ?? [],
    isLoading: !!categoryId && !cached && !current,
    hasError: !cached && !!current?.hasError,
    refetch,
  };
}
