import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [vue()],
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return undefined;
          if (
            /[\\/]node_modules[\\/](firebase|@firebase|@grpc|vuefire)[\\/]/.test(
              id,
            )
          ) {
            return "firebase";
          }
          if (
            /[\\/]node_modules[\\/](sql\.js|codemirror|@codemirror|@lezer)/.test(
              id,
            )
          ) {
            return "sql-editor";
          }
          return undefined;
        },
      },
    },

    chunkSizeWarningLimit: 800,
  },
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts"],
  },
});
