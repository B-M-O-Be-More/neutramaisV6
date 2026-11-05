export interface SellerOfferLoadStateProps {
  /** `loading`: esqueleto; `notFound`/`error`: aviso (erro com "tentar de novo"). */
  status: "loading" | "notFound" | "error";
  onRetry: () => void;
}
