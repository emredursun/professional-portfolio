import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '../public');

const filesToOptimize = [
    { name: 'android-chrome-192x192.png', width: 192 },
    { name: 'android-chrome-512x512.png', width: 512 },
    { name: 'apple-touch-icon.png', width: 180 },
    { name: 'favicon-32x32.png', width: 32 },
    { name: 'favicon-16x16.png', width: 16 }
];

async function optimizeImages() {
    console.log('Starting image optimization...');
    
    for (const file of filesToOptimize) {
        const filePath = path.join(publicDir, file.name);
        
        if (fs.existsSync(filePath)) {
            const originalSize = fs.statSync(filePath).size;
            const tempPath = filePath + '.temp.png';

            try {
                await sharp(filePath)
                    .resize(file.width, file.width)
                    .png({ quality: 80, compressionLevel: 9 })
                    .toFile(tempPath);

                const newSize = fs.statSync(tempPath).size;
                fs.renameSync(tempPath, filePath);

                console.log(`✅ Optimized ${file.name}: ${(originalSize / 1024).toFixed(2)}KB -> ${(newSize / 1024).toFixed(2)}KB`);
            } catch (error) {
                console.error(`❌ Failed to optimize ${file.name}:`, error);
                if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
            }
        } else {
            console.warn(`⚠️ File not found: ${file.name}`);
        }
    }
    console.log('Optimization complete!');
}

optimizeImages();
