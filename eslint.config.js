import js from "@eslint/js";
import globals from "globals";
import tseslint, { parser } from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
    {
        files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
        plugins: { js },
        extends: ["js/recommended"],
        languageOptions: {
            parser,
            ecmaVersion: 2022,
            sourceType: "module", // Explicitly set source type to module
            globals: {
                ...globals.browser,
                ...globals.node,
                process: "readonly",
                __dirname: "readonly",
                __filename: "readonly",
            },
        },
        rules: {
            // Additional custom rules can be added here
            // Example: require "use strict" directives if needed in specific function scopes (optional in ESM)
            // "strict": ["error", "function"]
            "@typescript-eslint/no-non-null-assertion": "warn",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                },
            ],
        },
    },
    js.configs.recommended,
    tseslint.configs.strict,
    {
        ignores: ["dist", "node_modules", "drizzle.config.ts"],
    },
]);
