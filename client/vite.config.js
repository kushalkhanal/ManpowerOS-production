import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = (p) => path.resolve(__dirname, "src", p);

export default defineConfig(({ mode }) => {
  // Load .env, .env.local, .env.[mode], .env.[mode].local from this client dir.
  // The empty prefix means ALL keys (not just VITE_*) are exposed to this
  // config file — Vite still only ships VITE_* keys to the client bundle.
  const env = loadEnv(mode, __dirname, "");

  // Proxy target rules:
  //   - `vite dev` (mode === 'development')  → http://localhost:5000   (your local API)
  //   - any other mode (e.g. `vite --mode production`) → https://kushalkhanal.com.np
  //   - explicit override via client/.env.local: VITE_DEV_PROXY_TARGET=...
  //
  // Note: this proxy only runs under `vite dev`. Production users of the
  // built bundle never hit it — their API calls go to the same origin that
  // serves the bundle (kushalkhanal.com.np in your case).
  const proxyTarget =
    env.VITE_DEV_PROXY_TARGET ||
    (mode === "development" ? "http://localhost:5000" : "https://kushalkhanal.com.np");

  return {
  plugins: [react()],
  resolve: {
    // In npm workspaces, packages are hoisted to the root node_modules.
    // preserveSymlinks lets Vite follow workspace symlinks correctly.
    preserveSymlinks: true,
    alias: {
      "@": src(""),
      "@app": src("app"),
      "@api": src("api"),
      "@components": src("components"),
      "@context": src("context"),
      "@domain": src("domain"),
      "@hooks": src("hooks"),
      "@lib": src("lib"),
      "@pages": src("pages"),
      "@utils": src("utils"),
    },
  },
  server: {
    port: 5173,
    fs: {
      // Allow Vite's dev server to serve files from the workspace root
      // so it can reach root-level node_modules (hoisted by npm workspaces).
      allow: [".."],
    },
    proxy: {
      "/api": {
        target: proxyTarget,
        changeOrigin: true,
      },
      "/uploads": {
        target: proxyTarget,
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes("node_modules/react") ||
            id.includes("react-dom") ||
            id.includes("react-router-dom")
          ) {
            return "react";
          }
          if (
            id.includes("node_modules/axios") ||
            id.includes("socket.io-client") ||
            id.includes("lucide-react")
          ) {
            return "vendor";
          }
          return undefined;
        },
      },
    },
  },
  };
});
