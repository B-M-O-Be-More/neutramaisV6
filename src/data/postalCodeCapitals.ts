/**
 * Faixas de CEP por UF (5 primeiros dígitos) e a capital de cada uma. Usado
 * na simulação de frete da etapa Logística: "capital mais próxima" da origem.
 */
const RANGES: [from: number, to: number, capital: string][] = [
  [1000, 19999, "São Paulo/SP"],
  [20000, 28999, "Rio de Janeiro/RJ"],
  [29000, 29999, "Vitória/ES"],
  [30000, 39999, "Belo Horizonte/MG"],
  [40000, 48999, "Salvador/BA"],
  [49000, 49999, "Aracaju/SE"],
  [50000, 56999, "Recife/PE"],
  [57000, 57999, "Maceió/AL"],
  [58000, 58999, "João Pessoa/PB"],
  [59000, 59999, "Natal/RN"],
  [60000, 63999, "Fortaleza/CE"],
  [64000, 64999, "Teresina/PI"],
  [65000, 65999, "São Luís/MA"],
  [66000, 68899, "Belém/PA"],
  [68900, 68999, "Macapá/AP"],
  [69000, 69299, "Manaus/AM"],
  [69300, 69399, "Boa Vista/RR"],
  [69400, 69899, "Manaus/AM"],
  [69900, 69999, "Rio Branco/AC"],
  [70000, 72799, "Brasília/DF"],
  [72800, 72999, "Goiânia/GO"],
  [73000, 73699, "Brasília/DF"],
  [73700, 76799, "Goiânia/GO"],
  [76800, 76999, "Porto Velho/RO"],
  [77000, 77999, "Palmas/TO"],
  [78000, 78899, "Cuiabá/MT"],
  [79000, 79999, "Campo Grande/MS"],
  [80000, 87999, "Curitiba/PR"],
  [88000, 89999, "Florianópolis/SC"],
  [90000, 99999, "Porto Alegre/RS"],
];

/** "60150-161" → "Fortaleza/CE"; CEP incompleto ou fora das faixas → null. */
export function nearestCapital(postalCode: string): string | null {
  const digits = postalCode.replace(/\D/g, "");
  if (digits.length !== 8) return null;
  const prefix = Number(digits.slice(0, 5));
  return (
    RANGES.find(([from, to]) => prefix >= from && prefix <= to)?.[2] ?? null
  );
}
