import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig(({ isSsrBuild, isPreview }) => ({
  appType: isPreview ? "mpa" : "spa",
  plugins: [react()],
  build: {
    copyPublicDir: !isSsrBuild,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:8000/api",
        changeOrigin: true,
      },
    },
  },
}));
