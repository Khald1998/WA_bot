const Tesseract = require("tesseract.js");
const path = require("path");
const fs = require("fs");

// Magic byte signatures for supported image formats
const IMAGE_SIGNATURES = {
  jpg: { bytes: [0xff, 0xd8, 0xff], offset: 0 },
  png: { bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], offset: 0 },
  webp: { bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // "RIFF"
  bmp: { bytes: [0x42, 0x4d], offset: 0 },
  tiff_le: { bytes: [0x49, 0x49, 0x2a, 0x00], offset: 0 },
  tiff_be: { bytes: [0x4d, 0x4d, 0x00, 0x2a], offset: 0 },
};

/**
 * Validates image integrity by checking file size and magic bytes.
 *
 * @param {string} absolute_path - Absolute path to the image file.
 * @throws {Error} If the file is empty or has an unrecognized/corrupt header.
 */
function validate_image(absolute_path) {
  const stat = fs.statSync(absolute_path);

  // 1. Reject empty files
  if (stat.size === 0) {
    throw new Error(`Image file is empty (0 bytes): ${absolute_path}`);
  }

  // 2. Read enough bytes to check all magic signatures (max 8 bytes needed)
  const HEADER_SIZE = 12;
  const fd = fs.openSync(absolute_path, "r");
  const header = Buffer.alloc(HEADER_SIZE);
  const bytes_read = fs.readSync(fd, header, 0, HEADER_SIZE, 0);
  fs.closeSync(fd);

  if (bytes_read < 2) {
    throw new Error(`Image file is too small to be valid: ${absolute_path}`);
  }

  // 3. Match against known magic bytes
  const is_valid = Object.values(IMAGE_SIGNATURES).some(({ bytes, offset }) =>
    bytes.every((byte, i) => header[offset + i] === byte)
  );

  // Special case: WebP also needs "WEBP" at offset 8
  const is_webp =
    header.slice(0, 4).toString("ascii") === "RIFF" &&
    header.slice(8, 12).toString("ascii") === "WEBP";

  if (!is_valid && !is_webp) {
    throw new Error(
      `File does not appear to be a valid image (bad magic bytes): ${absolute_path}`
    );
  }
}

/**
 * OCRs an image file and returns the extracted text.
 *
 * @param {string} image_path - Absolute or relative path to the image file.
 * @returns {Promise<string>} - The extracted text from the image.
 */
async function ocr_image(image_path) {
  const absolute_path = path.resolve(image_path);

  // 1. Check the file exists
  if (!fs.existsSync(absolute_path)) {
    throw new Error(`Image file not found: ${absolute_path}`);
  }

  // 2. Validate size and magic bytes BEFORE calling Tesseract
  //    This prevents the unhandled crash from Leptonica on corrupt/empty files
  validate_image(absolute_path);

  // 3. Run OCR
  const worker = await Tesseract.createWorker("eng");
  try {
    const {
      data: { text },
    } = await worker.recognize(absolute_path);
    return text.trim();
  } finally {
    await worker.terminate();
  }
}

module.exports = { ocr_image };
