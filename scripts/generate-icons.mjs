/**
 * PWA Icon Generator Script
 * Generates app icons from custom SVG design
 */

import sharp from "sharp";
import { readFile, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");
const svgPath = join(__dirname, "..", "app", "assets", "css", "icons", "app-icon.svg");

async function generateIcon(svgBuffer, size, filename) {
  console.log(`Generating ${filename} (${size}x${size})...`);

  const pngBuffer = await sharp(svgBuffer).resize(size, size).png().toBuffer();

  const outputPath = join(publicDir, filename);
  await writeFile(outputPath, pngBuffer);

  console.log(`  ✓ Created ${outputPath}`);
}

async function generateFavicon(svgBuffer) {
  console.log("Generating favicon.ico...");

  // Use 32x32 for favicon (modern browsers accept PNG)
  const pngBuffer = await sharp(svgBuffer).resize(32, 32).png().toBuffer();

  const outputPath = join(publicDir, "favicon.ico");
  await writeFile(outputPath, pngBuffer);

  console.log(`  ✓ Created ${outputPath}`);
}

async function main() {
  console.log("🎨 PWA Icon Generator");
  console.log("=====================\n");
  console.log(`Source: ${svgPath}`);
  console.log("");

  try {
    // Read the custom SVG file
    const svgContent = await readFile(svgPath);
    console.log("✓ Loaded custom SVG icon\n");

    await generateIcon(svgContent, 192, "icon-192.png");
    await generateIcon(svgContent, 512, "icon-512.png");
    await generateFavicon(svgContent);

    console.log("\n✅ All icons generated successfully!");
    console.log("\nFiles created:");
    console.log("  - public/icon-192.png (192x192)");
    console.log("  - public/icon-512.png (512x512)");
    console.log("  - public/favicon.ico (32x32)");
  } catch (error) {
    console.error("❌ Error generating icons:", error);
    process.exit(1);
  }
}

main();
