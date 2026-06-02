import * as faceapi from 'face-api.js';

let faceDetectorPromise: Promise<void> | null = null;

const loadFaceDetectorModels = (): Promise<void> => {
    if (!faceDetectorPromise) {
        faceDetectorPromise =
            faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    }
    return faceDetectorPromise;
};

export const applyWhiteBackground = (blob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(blob);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                URL.revokeObjectURL(url);
                return reject('Canvas context error');
            }

            // Fill white background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw transparent image on top
            ctx.drawImage(img, 0, 0);

            URL.revokeObjectURL(url);
            canvas.toBlob(
                (jpgBlob) => {
                    if (!jpgBlob) reject('Failed to convert to JPEG');
                    else resolve(jpgBlob);
                },
                'image/jpeg',
                0.95,
            );
        };

        img.onerror = (error) => {
            URL.revokeObjectURL(url);
            reject(error);
        };
        img.src = url;
    });
};

export const resizeWithFaceCentering = async (
    blob: Blob,
    targetWidth: number,
    targetHeight: number,
): Promise<Blob> => {
    await loadFaceDetectorModels();

    return new Promise(async (resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(blob);

        img.onload = async () => {
            const detection = await faceapi.detectSingleFace(
                img,
                new faceapi.TinyFaceDetectorOptions(),
            );

            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                URL.revokeObjectURL(url);
                return reject('Canvas error');
            }

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, targetWidth, targetHeight);

            let srcX = 0;
            let srcY = 0;
            let srcW = img.width;
            let srcH = img.height;

            if (detection) {
                const box = detection.box;
                const centerX = box.x + box.width / 2;
                const centerY = box.y + box.height / 2;
                const cropSize = Math.max(box.width, box.height) * 2.2;

                srcX = centerX - cropSize / 2;
                srcY = centerY - cropSize / 2;
                srcW = cropSize;
                srcH = cropSize;

                if (srcX < 0) srcX = 0;
                if (srcY < 0) srcY = 0;
                if (srcX + srcW > img.width) srcW = img.width - srcX;
                if (srcY + srcH > img.height) srcH = img.height - srcY;
            }

            const ratio = Math.max(targetWidth / srcW, targetHeight / srcH);
            const newWidth = srcW * ratio;
            const newHeight = srcH * ratio;
            const offsetX = (targetWidth - newWidth) / 2;
            const offsetY = (targetHeight - newHeight) / 2;

            ctx.drawImage(
                img,
                srcX,
                srcY,
                srcW,
                srcH,
                offsetX,
                offsetY,
                newWidth,
                newHeight,
            );

            URL.revokeObjectURL(url);
            canvas.toBlob(
                (blobOut) => {
                    if (!blobOut) reject('Resize failed');
                    else resolve(blobOut);
                },
                'image/jpeg',
                0.95,
            );
        };

        img.onerror = (error) => {
            URL.revokeObjectURL(url);
            reject(error);
        };
        img.src = url;
    });
};
