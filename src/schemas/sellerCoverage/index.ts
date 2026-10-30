import * as yup from "yup";

/* ---------------------------------------------------------------------------
 * Cadastro de cobertura na aba Cobertura do catálogo (Figma 2664-56660).
 * As mensagens são CHAVES de tradução (SellerCoverage.errors.*).
 *
 * O upload da geo-api só recebe o arquivo (e a versão anterior): o Figma
 * pedia nome, descrição e informações adicionais, mas o contrato não os
 * guarda — ficaram fora do formulário.
 * ------------------------------------------------------------------------- */

export const sellerCoverageSchema = yup.object({
  // O conteúdo do KMZ (extensão, 50 MB, geometria) é validado no envio
  // (`parseKmz`), com mensagens próprias.
  file: yup
    .mixed<File>()
    .nullable()
    .default(null)
    .test(
      "file-required",
      "SellerCoverage.errors.fileRequired",
      (file) => !!file,
    ),
});

export type SellerCoverageValues = yup.InferType<typeof sellerCoverageSchema>;

export const SELLER_COVERAGE_DEFAULTS: SellerCoverageValues = {
  file: null,
};
