import { fileURLToPath } from "node:url"
import { mergeConfig, defineConfig } from "vitest/config.js"
import viteConfig from "./vite.config"

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      root: fileURLToPath(new URL("./", import.meta.url)),
    },
  })
)
