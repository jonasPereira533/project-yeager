import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";

export default tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**", "public/**"],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // `essential` e não `recommended`: o preset recomendado do plugin-vue adiciona
  // dezenas de regras de formatação (indentação, quebras de linha) que só
  // brigam com o estilo já existente no projeto. essential cobre correção real.
  ...pluginVue.configs["flat/essential"],

  {
    files: ["**/*.{ts,vue}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: [".vue"],
      },
    },
    rules: {
      // O projeto roda vue-tsc -b, que já cobre
      // noUnusedLocals/noUnusedParameters. Duplicar aqui só gera atrito.
      "@typescript-eslint/no-unused-vars": "off",

      // Componentes de página (main-page, case-page) seguem o nome da rota.
      "vue/multi-word-component-names": "off",

      // Controle real contra XSS no projeto.
      "vue/no-v-html": "error",
    },
  },
);