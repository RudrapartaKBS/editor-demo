
// this is loacl test 


// import { defineConfig } from "vite";

// export default defineConfig({
//   root: "demo",
//   build: {
//     outDir: "../dist",
//     emptyOutDir: true,
//     lib: {
//       // Multi-entry so CDN/NPM users can import JS and styles separately.
//       entry: {
//         index: "../src/index.ts",
//         styles: "../src/styles.ts",
//       },
//       name: "MyEditor",
//       fileName: (format, entryName) => `myeditor.${entryName}.${format}.js`,
//       formats: ["umd", "es"],
//     },
//   },
// });

// this is live test 
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    lib: {
      entry: "src/index.ts",
      name: "MyEditor",
      fileName: (format) => `myeditor.${format}.js`,
      formats: ["umd", "es"],
    },
    rollupOptions: {
      // ProseMirror deps ko external mat karo agar tum CDN single-file chahte ho.
      // Agar external karoge to users ko separate scripts chahiye honge.
      // external: [],
    },
  },
});