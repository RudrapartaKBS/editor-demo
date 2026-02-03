
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    lib: {
      entry: "src/index.ts",
      name: "MyEditor",
      fileName: (format) => `myeditor.${format === 'umd' ? 'cdn' : format}.js`,
      formats: ["umd", "es"],
    },
    rollupOptions: {
      // Keep dependencies bundled for CDN usage
      external: [],
      output: {
        // Global variables for UMD build
        globals: {},
        // Ensure styles are included
        assetFileNames: "myeditor.[ext]"
      }
    },
  },
});

// this is live test 
// import { defineConfig } from "vite";

// export default defineConfig({
//   build: {
//     outDir: "dist",
//     emptyOutDir: true,
//     lib: {
//       entry: "src/index.ts",
//       name: "MyEditor",
//       fileName: (format) => `myeditor.${format}.js`,
//       formats: ["umd", "es"],
//     },
//     rollupOptions: {
//       // ProseMirror deps ko external mat karo agar tum CDN single-file chahte ho.
//       // Agar external karoge to users ko separate scripts chahiye honge.
//       // external: [],
//     },
//   },
// });