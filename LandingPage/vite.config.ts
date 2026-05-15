import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    tailwindcss(),
    tsconfigPaths(),
    react(),
    tanstackStart({
      server: {
        entry: "./src/server.ts",
      },
    }),
  ],
  server: {
    port: 3000,
    strictPort: true,
  },
});
