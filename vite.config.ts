
import { defineConfig } from "vite";
import { copyFileSync, existsSync } from "fs";
import { resolve } from "path";

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
  plugins: [
    {
      name: 'copy-examples',
      writeBundle() {
        // Copy CDN example to dist folder
        const srcPath = resolve(__dirname, 'cdn-example.html');
        const destPath = resolve(__dirname, 'dist/cdn-example.html');
        
        if (existsSync(srcPath)) {
          copyFileSync(srcPath, destPath);
          console.log('✅ Copied cdn-example.html to dist/');
        }
        
        // Copy main demo index.html to dist folder as well
        const demoSrcPath = resolve(__dirname, 'demo/index.html');
        const demoDestPath = resolve(__dirname, 'dist/index.html');
        
        if (existsSync(demoSrcPath)) {
          copyFileSync(demoSrcPath, demoDestPath);
          console.log('✅ Copied demo/index.html to dist/index.html');
        }
      }
    }
  ]
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