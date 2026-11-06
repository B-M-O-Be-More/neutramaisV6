"use client";

import { Box, Grid } from "@chakra-ui/react";

import MarketplaceBuyerCard from "@/components/MarketplaceBuyerCard";
import MarketplaceSellerCard from "@/components/MarketplaceSellerCard";

import { MarketplaceCatalogProps } from "./interface";
import { s } from "./scale";

/**
 * Seção de entrada do catálogo: um card para compradores e outro para
 * vendedores, lado a lado em telas médias e empilhados no mobile.
 *
 * Medidas do Figma (Neutra+ MP, nó 3300:58901): grade de 5 colunas, comprador
 * ocupando 3 e vendedor 2. A partir de 1536px a seção usa os valores do Figma
 * 1:1 (--cat-s = 1,2316 sobre a base escrita aqui); abaixo disso, a mesma
 * proporção reduzida.
 */
export function MarketplaceCatalog({
  buyerHref,
  catalogHref,
  sellerHref,
}: MarketplaceCatalogProps) {
  return (
    <Box
      as="section"
      css={{
        "--cat-s": "1",
        "@media (min-width: 1536px)": { "--cat-s": "1.2316" },
      }}
    >
      <Grid
        templateColumns={{
          base: "minmax(0, 1fr)",
          md: "minmax(0, 1.2fr) minmax(0, 1fr)",
          lg: "repeat(5, minmax(0, 1fr))",
        }}
        gap={s(20)}
      >
        <Box minW={0} gridColumn={{ lg: "span 3" }}>
          <MarketplaceBuyerCard href={buyerHref} catalogHref={catalogHref} />
        </Box>
        <Box minW={0} gridColumn={{ lg: "span 2" }}>
          <MarketplaceSellerCard href={sellerHref} />
        </Box>
      </Grid>
    </Box>
  );
}
