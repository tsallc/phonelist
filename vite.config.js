import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import fs from "fs";

// Custom plugin to copy canonical data file
const copyCanonicalData = () => {
  const srcFile = path.resolve('./src/data/canonicalContactData.json');
  const destFile = path.resolve('./public/data/canonicalContactData.json');
  
  // Ensure dest dir exists
  const destDir = path.dirname(destFile);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  return {
    name: 'copy-canonical-data',
    configResolved(config) {
      // Log the base URL being used
      console.log(`Vite configuration resolved. Base URL: ${config.base}`);
    },
    buildStart() {
      // Copy on build start
      try {
        const data = fs.readFileSync(srcFile);
        fs.writeFileSync(destFile, data);
        console.log('Copied canonical data file for development');
      } catch (error) {
        console.error('Error copying canonical data:', error);
      }
    },
    handleHotUpdate({ file }) {
      // Watch for changes to the source file during development
      if (file === srcFile) {
        try {
          const data = fs.readFileSync(srcFile);
          fs.writeFileSync(destFile, data);
          console.log('Hot updated canonical data file');
        } catch (error) {
          console.error('Error copying canonical data during HMR:', error);
        }
      }
      return [];
    }
  };
};

export default defineConfig({
  base: "/phonelist/", // 👈 MUST match your GitHub repo name
  plugins: [
    react(),
    copyCanonicalData()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    watch: {
      // Also watch the source data file
      include: ['src/**/*.json']
    }
  }
});
