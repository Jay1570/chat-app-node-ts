import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
    js.configs.recommended,
    ...tseslint.configs.strict,
    {
        files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
        languageOptions: {
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
    },
    {
        files: ["**/*.{ts,mts,cts}"],
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
    {
        ignores: ["dist/", "node_modules/", "drizzle.config.ts"],
    },
]);
