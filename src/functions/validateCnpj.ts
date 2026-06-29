/**
 * Validação local dos dígitos verificadores de um CNPJ (BR).
 * US-02 — validação de dígitos verificadores é local + servidor (Receita Federal).
 */
export function isValidCnpj(value: string): boolean {
  const cnpj = value.replace(/\D/g, "");

  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false; // todos os dígitos iguais

  const calcDigit = (length: number): number => {
    const weights =
      length === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += parseInt(cnpj[i], 10) * weights[i];
    }

    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  const digit1 = calcDigit(12);
  const digit2 = calcDigit(13);

  return digit1 === parseInt(cnpj[12], 10) && digit2 === parseInt(cnpj[13], 10);
}
