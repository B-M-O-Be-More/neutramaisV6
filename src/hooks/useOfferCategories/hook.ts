"use client";

import React from "react";

import {
  buildCategoryIndex,
  staticCategoryIndex,
  type OfferCategoryIndex,
} from "@/functions/offerCategoryTree";
import { productCatalogService } from "@/services/productCatalog.service";

import type { UseOfferCategoriesReturn } from "./interface";

const STATIC_INDEX = staticCategoryIndex();

/**
 * Árvore de categorias da plataforma (`GET /category?tree=true`). Enquanto
 * carrega, e se a API falhar, devolve as famílias fixas sem subcategorias —
 * o assistente continua funcionando como antes da árvore existir.
 */
export function useOfferCategories(): UseOfferCategoriesReturn {
  const [attempt, setAttempt] = React.useState(0);
  const [state, setState] = React.useState<{
    index: OfferCategoryIndex;
    isLoading: boolean;
    hasError: boolean;
  }>({ index: STATIC_INDEX, isLoading: true, hasError: false });

  React.useEffect(() => {
    const controller = new AbortController();

    productCatalogService
      .listCategories({ signal: controller.signal })
      .then((tree) => {
        const index = buildCategoryIndex(tree ?? []);
        setState({
          index: index.roots.length ? index : STATIC_INDEX,
          isLoading: false,
          hasError: !index.roots.length,
        });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setState({ index: STATIC_INDEX, isLoading: false, hasError: true });
      });

    return () => controller.abort();
  }, [attempt]);

  const refetch = React.useCallback(() => setAttempt((n) => n + 1), []);

  return {
    roots: state.index.roots,
    byId: state.index.byId,
    isLoading: state.isLoading,
    hasError: state.hasError,
    refetch,
  };
}
