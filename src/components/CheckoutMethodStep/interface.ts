export interface CheckoutMethodStepProps {
  /** Saldo disponível do crédito Neutra+ (null quando não há). */
  availableCreditMinor: number | null;
  useCredit: boolean;
  onUseCreditChange: (useCredit: boolean) => void;
  creditMinor: number;
  cardMinor: number;
  totalMinor: number;
  formatMinor: (minor: number) => string;
}
