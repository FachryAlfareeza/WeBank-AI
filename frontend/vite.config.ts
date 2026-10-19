import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    // Fail loudly instead of silently drifting to 5174+ when 5173 is taken.
    // A drifting port breaks the backend CORS allow-list and is confusing.
    strictPort: true,
  },
});
