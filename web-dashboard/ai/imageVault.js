const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');

const HEADER = Buffer.from('SECUREIMGv1'); // custom signature for .encimg files

// Deterministic shuffle based on key (reversible)
function shuffleBuffer(buf, key) {
    const out = Buffer.from(buf);
    const seed = crypto.createHash('sha256').update(key).digest();

    for (let i = 0; i < out.length; i++) {
        const j = seed[i % seed.length] % out.length;
        const tmp = out[i];
        out[i] = out[j];
        out[j] = tmp;
    }
    return out;
}

function unshuffleBuffer(buf, key) {
    // Reverse shuffle by running swaps in reverse order
    const out = Buffer.from(buf);
    const seed = crypto.createHash('sha256').update(key).digest();

    for (let i = out.length - 1; i >= 0; i--) {
        const j = seed[i % seed.length] % out.length;
        const tmp = out[i];
        out[i] = out[j];
        out[j] = tmp;
    }
    return out;
}

// Add noise/distortion to image buffer
async function distortImage(buffer, key) {
    try {
        // Convert to sharp instance, apply distortion
        const image = sharp(buffer);
        const metadata = await image.metadata();

        // Apply multiple distortions: blur, noise, pixel manipulation
        const distorted = await image
            .blur(2) // slight blur
            .modulate({ brightness: 0.9, saturation: 1.1 }) // color shift
            .jpeg({ quality: 80 }) // compression
            .toBuffer();

        // Add pixel scrambling
        return shuffleBuffer(distorted, key);
    } catch (e) {
        // If not a valid image, just shuffle the buffer
        return shuffleBuffer(buffer, key);
    }
}

// Remove distortion (reverse operations)
async function undistortImage(buffer, key) {
    try {
        // Reverse shuffle first
        const unshuffled = unshuffleBuffer(buffer, key);

        // Attempt to restore image (this is approximate since compression is lossy)
        const image = sharp(unshuffled);
        const restored = await image
            .sharpen() // attempt to sharpen
            .jpeg({ quality: 95 }) // higher quality
            .toBuffer();

        return restored;
    } catch (e) {
        // If not a valid image, just unshuffle
        return unshuffleBuffer(buffer, key);
    }
}

async function encryptImage(inputPath, outputPath, password) {
    const raw = fs.readFileSync(inputPath);

    // Step 1: Visual distortion
    const distorted = await distortImage(raw, password);

    // Step 2: Generate distorted preview (low quality JPEG)
    const previewPath = outputPath + '.preview.jpg';
    let previewGenerated = false;
    try {
        await sharp(distorted)
            .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 30 })
            .toFile(previewPath);
        previewGenerated = true;
    } catch (e) {
        // Skip preview if distortion makes it unreadable
    }

    // Step 3: AES-256-GCM encryption
    const iv = crypto.randomBytes(12);
    const key = crypto.createHash('sha256').update(password).digest();

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(distorted), cipher.final()]);
    const tag = cipher.getAuthTag();

    // Step 4: Add custom header and save
    const final = Buffer.concat([HEADER, iv, tag, encrypted]);
    fs.writeFileSync(outputPath, final);

    return { previewPath: previewGenerated ? previewPath : null };
}

async function decryptImage(inputPath, outputPath, password) {
    const file = fs.readFileSync(inputPath);

    // Verify header
    const header = file.slice(0, 12).toString();
    if (header !== 'SECUREIMGv1') {
        throw new Error('Invalid file format - not a .encimg file');
    }

    // Extract components
    const iv = file.slice(12, 24);
    const tag = file.slice(24, 40);
    const encrypted = file.slice(40);

    // Decrypt AES
    const key = crypto.createHash('sha256').update(password).digest();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
    ]);

    // Reverse distortion
    const original = await undistortImage(decrypted, password);

    fs.writeFileSync(outputPath, original);
}

// Face detection and blurring (placeholder - would need face-api.js in frontend)
async function blurFaces(buffer) {
    // This would be implemented in frontend with face-api.js
    // For now, return buffer unchanged
    return buffer;
}

module.exports = { encryptImage, decryptImage, blurFaces };