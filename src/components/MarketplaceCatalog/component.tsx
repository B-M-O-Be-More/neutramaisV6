"use client";

import { Box, Grid } from "@chakra-ui/react";

import MarketplaceBuyerCard from "@/components/MarketplaceBuyerCard";
import MarketplaceSellerCard from "@/components/MarketplaceSellerCard";

import { MarketplaceCatalogProps } from "./interface";

/**
 * Seção de entrada do catálogo: um card para compradores e outro para
 * vendedores, lado a lado em telas médias e empilhados no mobile.
 */
export function MarketplaceCatalog({
  buyerHref,
  catalogHref,
  sellerHref,
}: MarketplaceCatalogProps) {
  return (
    <Box as="section">
      <Grid
        templateColumns={{
          base: "minmax(0, 1fr)",
          md: "minmax(0, 1.2fr) minmax(0, 1fr)",
        }}
        gap="20px"
      >
        <Box minW={0}>
          <MarketplaceBuyerCard href={buyerHref} catalogHref={catalogHref} />
        </Box>
        <Box minW={0}>
          <MarketplaceSellerCard href={sellerHref} />
        </Box>
      </Grid>
    </Box>
  );
}
