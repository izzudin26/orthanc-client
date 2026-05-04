import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  target: "es2020",
  external: ["reflect-metadata"],
  esbuildOptions(options) {
    options.define = {
      ...options.define,
      "Reflect.metadata": "Reflect.metadata",
    };
  },
});
