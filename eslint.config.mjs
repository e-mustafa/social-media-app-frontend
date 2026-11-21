import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    settings: {
      react: {
        version: '18.0',
      },
    },
    rules: {
      // react/display-name is incompatible with ESLint v10 (eslint-plugin-react v7.37.5
      // uses contextOrFilename.getFilename which was removed in ESLint v10).
      'react/display-name': 'off',
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
