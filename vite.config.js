import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { defineConfig } from "vite";

// The theme is picked from the URL path at runtime. Emit a copy of the page at
// dist/dark/index.html so /dark also works on plain static hosting.
function darkRoute() {
  let outDir;
  return {
    name: "dark-route",
    apply: "build",
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      await mkdir(resolve(outDir, "dark"), { recursive: true });
      await copyFile(resolve(outDir, "index.html"), resolve(outDir, "dark/index.html"));
    },
  };
}

export default defineConfig({
  plugins: [darkRoute()],
});
