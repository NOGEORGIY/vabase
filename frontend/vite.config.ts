import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const runtimeEnv =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

const proxyTarget = runtimeEnv.VITE_PROXY_TARGET ?? "http://127.0.0.1:8001";
const hmrClientPort = Number(runtimeEnv.VITE_HMR_CLIENT_PORT ?? "5173");
const usePolling = runtimeEnv.VITE_USE_POLLING === "1";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": proxyTarget,
      "/healthz": proxyTarget,
    },
    hmr: {
      clientPort: hmrClientPort,
    },
    watch: {
      usePolling,
      interval: 300,
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
