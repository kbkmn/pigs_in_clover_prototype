import { defineConfig } from "vite"

export default defineConfig({
  base: process.env.BASE_PATH ?? "/pigs_in_clover_prototype/",
  build: { target: "es2020", assetsInlineLimit: 100000 },
})
