import sharp from 'sharp';
import path from 'path';
import fs from 'fs-extra';

async function generateOGImage() {
    try {
        await sharp(path.join(process.cwd(), 'static', 'favicon.svg'))
            .resize(1200, 630, {
                fit: 'contain',
                background: { r: 38, g: 38, b: 38, alpha: 1 } // #262626 background
            })
            .png()
            .toFile(path.join(process.cwd(), 'static', 'og-image.png'));
        
        console.log('OG image generated successfully!');
    } catch (error) {
        console.error('Error generating OG image:', error);
    }
}

async function generatePwaIcons() {
    const baseSvg = path.join(process.cwd(), 'static', 'favicon.svg');
    const outDir = path.join(process.cwd(), 'static', 'pwa');
    const paddingRatio = Number(process.env.ICON_PADDING_RATIO || '0.2');
    const iconPaddingBg = { r: 38, g: 38, b: 38, alpha: 1 }; // #262626

    await fs.ensureDir(outDir);

    const sizes = [
        { size: 192, file: '192x192.png' },
        { size: 512, file: '512x512.png' }
    ];

    for (const { size, file } of sizes) {
        const target = path.join(outDir, file);
        await sharp(baseSvg)
            .resize(size, size, { fit: 'contain', background: iconPaddingBg })
            .flatten({ background: iconPaddingBg })
            .png()
            .toFile(target);
        console.log(`Icon generated: ${target}`);

        // Create maskable with padding: keep final size exactly `size`x`size`
        const pad = Math.round(size * paddingRatio);
        const inner = size - pad * 2;
        const leftTop = Math.max(0, Math.floor((size - inner) / 2));
        const maskable = path.join(outDir, file.replace('.png', '-maskable.png'));
        const innerBuffer = await sharp(baseSvg)
            .resize(inner, inner, { fit: 'contain', background: iconPaddingBg })
            .png()
            .toBuffer();

        const composite = await sharp({
            create: { width: size, height: size, channels: 4, background: iconPaddingBg }
        })
            .composite([{ input: innerBuffer, left: leftTop, top: leftTop }])
            .flatten({ background: iconPaddingBg })
            .png()
            .toBuffer();
        await fs.writeFile(maskable, composite);
        console.log(`Maskable icon generated: ${maskable}`);
    }
}

async function runAll() {
    await generateOGImage();
    await generatePwaIcons();
}

runAll();