export interface CoverageReplacementOption {
  fileId: string;
  /** Nome do KMZ ativo do arquivo (lembrado no navegador) ou "KMZ {id}". */
  label: string;
}

export interface UseCoverageReplacementsReturn {
  /** Arquivos ativos que podem receber as ofertas do arquivo excluído. */
  options: CoverageReplacementOption[];
  isLoading: boolean;
  /** Chave de tradução quando a listagem falhou. */
  error: string | null;
}
