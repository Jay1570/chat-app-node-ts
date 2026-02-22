import * as eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
    // Apply the recommended ESLint and TypeScript ESLint strict rules
    eslint.configs.recommended,
    ...tseslint.configs.strict, // Includes "strict": "error" configuration

    // General configuration for Node.js ESM files
    {
        files: ["**/*.ts"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module", // Explicitly set source type to module
            globals: {
                // Define Node.js environment globals
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
        },
    },
    // Ignore output directory
    {
        ignores: ["dist", "node_modules", "drizzle.config.ts"],
    },
]);
