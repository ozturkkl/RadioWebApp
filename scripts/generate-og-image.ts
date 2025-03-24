import sharp from 'sharp';
import path from 'path';

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

generateOGImage(); 