import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    build: { outDir: "dist" },
    server: {
        port: 3000,
        historyApiFallback: true, 
    },
    resolve: {
        alias: {
            "@": "/src",
        },
    },
    base: "/", // Ensure correct base path
});
