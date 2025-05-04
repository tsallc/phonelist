import fs from 'fs';
import path from 'path';
import { log, setVerbose } from '../lib/logger.js';

// Enable verbose logging
setVerbose(true);

// Try to read base URL from vite.config.js
const getBaseUrl = () => {
  try {
    // Read vite.config.js content
    const viteConfigPath = path.resolve('./vite.config.js');
    const viteConfigContent = fs.readFileSync(viteConfigPath, 'utf-8');
    
    log.verbose('Vite config content:', viteConfigContent);
    
    // Simple regex to extract the base value
    const baseMatch = viteConfigContent.match(/base\s*:\s*['"]([^'"]+)['"]/);
    if (baseMatch && baseMatch[1]) {
      log.verbose(`Found base URL in vite.config.js: ${baseMatch[1]}`);
      return baseMatch[1];
    }
  } catch (error) {
    log.warn('Could not read base URL from vite.config.js:', error.message);
  }
  
  log.verbose('Using default base URL: /');
  // Default fallback
  return '/';
};

// Configuration - improved with more explicit paths
const SOURCE_FILE = path.resolve('./src/data/canonicalContactData.json');
const DEST_FILE = path.resolve('./public/data/canonicalContactData.json');
const BASE_URL = getBaseUrl(); // Dynamically read from vite.config.js

log.verbose('Environment variables:');
log.verbose(`  NODE_ENV: ${process.env.NODE_ENV}`);
log.verbose(`  PWD: ${process.env.PWD}`);
log.verbose(`  Current directory: ${process.cwd()}`);
log.verbose(`  Script path: ${__dirname}`);
log.verbose(`  Source file absolute path: ${SOURCE_FILE}`);
log.verbose(`  Destination file absolute path: ${DEST_FILE}`);

// Ensure the destination directory exists
const destDir = path.dirname(DEST_FILE);
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
  log.info(`Created directory: ${destDir}`);
}

// Copy the file
try {
  // Read the source file
  const data = fs.readFileSync(SOURCE_FILE);
  
  // Write to the destination file
  fs.writeFileSync(DEST_FILE, data);
  
  log.info(`Successfully copied canonical data file:`);
  log.info(`  Source: ${SOURCE_FILE}`);
  log.info(`  Destination: ${DEST_FILE}`);
  log.info(`  Access URL: ${BASE_URL}data/canonicalContactData.json`);
  
  // Verify the file exists
  if (fs.existsSync(DEST_FILE)) {
    const stats = fs.statSync(DEST_FILE);
    log.info(`  File Size: ${stats.size} bytes`);
    log.info(`  File Updated: ${stats.mtime}`);
  }
} catch (error) {
  log.error('Error copying canonical data file:', error);
  process.exit(1);
} 