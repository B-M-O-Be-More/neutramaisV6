export interface CoverageArchiveConfirmProps {
  organizationId: string | null;
  /** Arquivo que será excluído (arquivado). */
  fileId: string;
  /** Nome do KMZ, para o rótulo acessível da lixeira. */
  label: string;
  /** Ofertas vinculadas a alguma versão do arquivo. */
  linkedOfferCount: number;
  isPending?: boolean;
  disabled?: boolean;
  /**
   * Exclui; com ofertas, recebe o arquivo que passa a atendê-las. Devolve a
   * chave de tradução do erro, ou null quando deu certo.
   */
  onConfirm: (replacementFileId?: string) => Promise<string | null>;
}
