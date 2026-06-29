import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

// Obs.: as regras de acessibilidade (jsx-a11y) já vêm habilitadas pelo
// eslint-config-next — não é preciso registrar o plugin novamente.
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Desativa regras de estilo que conflitam com o Prettier (deve vir por último).
  prettier,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
