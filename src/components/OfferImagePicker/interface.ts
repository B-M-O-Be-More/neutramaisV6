export interface OfferImagePickerProps {
  value: File | null;
  onChange: (file: File | null) => void;
  /** Mensagem de erro (já traduzida). */
  error?: string;
}
