export interface UseCoverageVersionDownloadReturn {
  /** Versão cujo original está sendo baixado. */
  downloadingId: string | null;
  /**
   * Baixa o KMZ original retido da versão e o oferece com `fileName`.
   * Devolve a chave de tradução do erro, ou null quando deu certo.
   */
  download: (versionId: string, fileName: string) => Promise<string | null>;
}
