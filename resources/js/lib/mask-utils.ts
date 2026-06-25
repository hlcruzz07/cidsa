/**
 * Cleans a raw segmentation mask by:
 * 1. Morphological closing (dilate → erode) — fills holes/speckles INSIDE the subject
 * 2. Thresholding — removes low-confidence fringe pixels on edges
 * 3. Erosion — pulls edges inward to eliminate remaining fringe noise
 * 4. Gaussian blur — feathers the hard edge for natural blending
 */
export function cleanMask(
    maskImageData: ImageData,
    width: number,
    height: number,
    options: {
        threshold?: number; // 0–255, pixels below this alpha are set to 0. Default: 100
        closeRadius?: number; // morphological closing radius to fill interior holes. Default: 4
        erodeRadius?: number; // pixels to erode inward after closing. Default: 1
        blurRadius?: number; // feathering radius. Default: 2
    } = {},
): ImageData {
    const {
        threshold = 100,
        closeRadius = 4,
        erodeRadius = 1,
        blurRadius = 2,
    } = options;

    // Step 1: Extract alpha channel as a flat Float32 array
    const alpha = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++) {
        alpha[i] = maskImageData.data[i * 4 + 3];
    }

    // Step 2: Morphological CLOSING = dilate then erode
    // This fills interior holes (white dots on face/body) without shrinking the overall mask
    const dilated = dilateAlpha(alpha, width, height, closeRadius);
    const closed = erodeAlpha(dilated, width, height, closeRadius);

    // Step 3: Hard threshold — kills remaining low-confidence speckles on edges
    for (let i = 0; i < closed.length; i++) {
        if (closed[i] < threshold) closed[i] = 0;
    }

    // Step 4: Light erosion — trim fringe pixels at the boundary
    const eroded = erodeAlpha(closed, width, height, erodeRadius);

    // Step 5: Gaussian blur — feather edges for smooth compositing onto white bg
    const blurred = gaussianBlurAlpha(eroded, width, height, blurRadius);

    // Step 6: Write back into an ImageData (white RGB, cleaned alpha)
    const cleaned = new ImageData(width, height);
    for (let i = 0; i < width * height; i++) {
        cleaned.data[i * 4] = 255;
        cleaned.data[i * 4 + 1] = 255;
        cleaned.data[i * 4 + 2] = 255;
        cleaned.data[i * 4 + 3] = Math.max(
            0,
            Math.min(255, Math.round(blurred[i])),
        );
    }

    return cleaned;
}

function dilateAlpha(
    alpha: Float32Array,
    width: number,
    height: number,
    radius: number,
): Float32Array {
    const out = new Float32Array(alpha.length);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let maxVal = alpha[y * width + x];
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const ny = y + dy;
                    const nx = x + dx;
                    if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                        const v = alpha[ny * width + nx];
                        if (v > maxVal) maxVal = v;
                    }
                }
            }
            out[y * width + x] = maxVal;
        }
    }
    return out;
}

function erodeAlpha(
    alpha: Float32Array,
    width: number,
    height: number,
    radius: number,
): Float32Array {
    const out = new Float32Array(alpha.length);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let minVal = alpha[y * width + x];
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const ny = y + dy;
                    const nx = x + dx;
                    if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                        const v = alpha[ny * width + nx];
                        if (v < minVal) minVal = v;
                    }
                }
            }
            out[y * width + x] = minVal;
        }
    }
    return out;
}

function gaussianBlurAlpha(
    alpha: Float32Array,
    width: number,
    height: number,
    radius: number,
): Float32Array {
    const size = radius * 2 + 1;
    const kernel = new Float32Array(size * size);
    const sigma = radius / 2 || 1;
    let sum = 0;
    for (let ky = 0; ky < size; ky++) {
        for (let kx = 0; kx < size; kx++) {
            const dx = kx - radius;
            const dy = ky - radius;
            const val = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
            kernel[ky * size + kx] = val;
            sum += val;
        }
    }
    for (let i = 0; i < kernel.length; i++) kernel[i] /= sum;

    const out = new Float32Array(alpha.length);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let acc = 0;
            for (let ky = 0; ky < size; ky++) {
                for (let kx = 0; kx < size; kx++) {
                    const ny = y + ky - radius;
                    const nx = x + kx - radius;
                    if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                        acc += alpha[ny * width + nx] * kernel[ky * size + kx];
                    }
                }
            }
            out[y * width + x] = acc;
        }
    }
    return out;
}
