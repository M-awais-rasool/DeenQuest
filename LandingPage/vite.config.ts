import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    tanstackStart({
      server: {
        entry: "./src/server.ts",
      },
    }),
    tailwindcss(),
    tsconfigPaths(),
  ],
  server: {
    port: 3000,
    strictPort: true,
  },
});
