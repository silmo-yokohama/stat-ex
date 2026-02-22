import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Prettierとの競合ルールを無効化
  prettierConfig,
  {
    rules: {
      // any の使用を禁止（unknown を使うこと）
      "@typescript-eslint/no-explicit-any": "error",
      // 未使用変数をエラーに（_ プレフィックスは許可）
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  // eslint-config-next のデフォルト ignores をオーバーライド
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
