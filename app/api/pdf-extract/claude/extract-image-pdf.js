/**
 * Node.js equivalent of the Python PDF image extraction script.
 *
 * Python dependencies replaced with:
 *   - pdf2image + cv2  →  pdf2pic (PDF page → image) + sharp (crop/resize/threshold)
 *   - fitz (PyMuPDF)   →  pdfjs-dist (text extraction)
 *   - numpy            →  sharp / jimp (pixel manipulation)
 *
 * Install dependencies:
 *   npm install sharp pdf2pic pdfjs-dist canvas uuid
 *
 * Usage (same interface as the Python script — called from a Next.js API route):
 *   const result = await extractImageFromPdf(inputData);
 */

const sharp = require('sharp');
const { fromPath } = require('pdf2pic');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// ---------------------------------------------------------------------------
// Constants (mirrors the Python globals)
// ---------------------------------------------------------------------------
const CROPPED_IMAGES_PATH = './public/cropped_images/';
const IMAGE_QUALITY = 80;
const DPI = 300;
const MULTIPLY = 4.16;
const MAX_WIDTH = 1200;

// ---------------------------------------------------------------------------
// PDF text extraction using pdfjs-dist
// ---------------------------------------------------------------------------
async function extractTextFromPdfArea(pdfPath, pageNumber, textRect) {
  // Lazy-require so the heavy pdfjs bundle is only loaded when needed
  //const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
  pdfjsLib.GlobalWorkerOptions.workerSrc = false; // disable web worker in Node

  const [x1, y1, x2, y2] = textRect;

  const data = new Uint8Array(fs.readFileSync('.' + pdfPath));
  const pdfDocument = await pdfjsLib.getDocument({ data }).promise;
  const page = await pdfDocument.getPage(pageNumber); // 1-indexed in pdfjs
  const textContent = await page.getTextContent();
  const viewport = page.getViewport({ scale: 1 });

  // Filter text items whose bounding boxes overlap the selection rect
  const lines = textContent.items
    .filter((item) => {
      // item.transform = [scaleX, skewX, skewY, scaleY, translateX, translateY]
      const tx = item.transform[4];
      const ty = viewport.height - item.transform[5]; // flip Y axis
      return tx >= x1 && tx <= x2 && ty >= y1 && ty <= y2;
    })
    .map((item) => item.str);

  return lines.join(' ');
}

// ---------------------------------------------------------------------------
// Convert a single PDF page to a JPEG Buffer using pdf2pic
// ---------------------------------------------------------------------------
async function convertPdfPageToBuffer(pdfPath, pageNumber) {
  const options = {
    density: DPI,
    saveFilename: `page_${pageNumber}_${Date.now()}`,
    savePath: CROPPED_IMAGES_PATH,
    format: 'jpeg',
    width: 0,   // 0 = use density-based sizing
    height: 0,
  };

  const converter = fromPath('.' + pdfPath, options);
  const result = await converter(pageNumber); // 1-indexed
  // result.path is the saved JPEG; read it back as a Buffer
  const buffer = fs.readFileSync(result.path);
  // Clean up the temp file
  fs.unlinkSync(result.path);
  return buffer;
}

// ---------------------------------------------------------------------------
// Whitespace removal — approximates the OpenCV contour approach:
//   1. Convert to greyscale
//   2. Threshold (invert: background white → 0, content → 255)
//   3. Find the bounding box of all non-zero pixels (equivalent to the
//      largest contour's bounding rect when there is one main content block)
// ---------------------------------------------------------------------------
async function cropToContent(imageBuffer) {
  // Use sharp to get raw greyscale pixel data
  const { data, info } = await sharp(imageBuffer)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const THRESHOLD = 230; // pixels brighter than this are considered background

  let minX = width, minY = height, maxX = 0, maxY = 0;
  let foundContent = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixel = data[y * width + x];
      if (pixel <= THRESHOLD) {          // "content" pixel (dark)
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        foundContent = true;
      }
    }
  }

  if (!foundContent) {
    // Nothing to crop — return the original
    return { buffer: imageBuffer, width, height };
  }

  // Add a small padding so we don't clip the very edge of the content
  const PADDING = 4;
  minX = Math.max(0, minX - PADDING);
  minY = Math.max(0, minY - PADDING);
  maxX = Math.min(width - 1, maxX + PADDING);
  maxY = Math.min(height - 1, maxY + PADDING);

  const cropWidth  = maxX - minX;
  const cropHeight = maxY - minY;

  const croppedBuffer = await sharp(imageBuffer)
    .extract({ left: minX, top: minY, width: cropWidth, height: cropHeight })
    .jpeg({ quality: IMAGE_QUALITY })
    .toBuffer();

  return { buffer: croppedBuffer, width: cropWidth, height: cropHeight };
}

// ---------------------------------------------------------------------------
// Resize to MAX_WIDTH maintaining aspect ratio (mirrors Python resize())
// ---------------------------------------------------------------------------
async function resizeToMaxWidth(imageBuffer, originalWidth, originalHeight) {
  const scalingFactor = MAX_WIDTH / originalWidth;
  const newWidth  = Math.round(originalWidth  * scalingFactor);
  const newHeight = Math.round(originalHeight * scalingFactor);

  const resizedBuffer = await sharp(imageBuffer)
    .resize(newWidth, newHeight, { fit: 'fill' })
    .jpeg({ quality: IMAGE_QUALITY })
    .toBuffer();

  return { buffer: resizedBuffer, width: newWidth, height: newHeight };
}

// ---------------------------------------------------------------------------
// Main function — mirrors extract_image_from_area() + __main__ block
// ---------------------------------------------------------------------------
async function extractImageFromPdf(inputData) {
  const {
    pdfPath,
    selectionArea,
    pageNumber,
    removeWhiteSpace = false,
  } = inputData;

  // Scale selection coords from canvas space → DPI-rendered image space
  const x1 = Math.round(selectionArea.startX * MULTIPLY);
  const y1 = Math.round(selectionArea.startY * MULTIPLY);
  const x2 = Math.round(selectionArea.endX   * MULTIPLY);
  const y2 = Math.round(selectionArea.endY   * MULTIPLY);

  // Text coords stay in canvas space (pdfjs uses the same coordinate system)
  const textRect = [
    selectionArea.startX,
    selectionArea.startY,
    selectionArea.endX,
    selectionArea.endY,
  ];

  // Ensure output directory exists
  if (!fs.existsSync(CROPPED_IMAGES_PATH)) {
    fs.mkdirSync(CROPPED_IMAGES_PATH, { recursive: true });
  }

  const ts = Date.now();

  // 1. Render the PDF page to an image buffer
  const pageBuffer = await convertPdfPageToBuffer(pdfPath, parseInt(pageNumber));

  // 2. Extract the selected rectangular region
  const cropW = x2 - x1;
  const cropH = y2 - y1;

  let selectedAreaBuffer = await sharp(pageBuffer)
    .extract({ left: x1, top: y1, width: cropW, height: cropH })
    .jpeg({ quality: IMAGE_QUALITY })
    .toBuffer();

  // 3. Extract text from the same area
  const captionText = await extractTextFromPdfArea(pdfPath, parseInt(pageNumber), textRect);

  // 4. Optionally remove whitespace (find content bounding box)
  if (removeWhiteSpace) {
    const { buffer: contentBuffer, width: contentW, height: contentH }
      = await cropToContent(selectedAreaBuffer);

    if (contentW > MAX_WIDTH) {
      // Resize down to MAX_WIDTH
      const { buffer: resizedBuffer, width: rW, height: rH }
        = await resizeToMaxWidth(contentBuffer, contentW, contentH);

      const filename = `resized_cropped_image_${ts}.jpg`;
      const fullPath = path.join(CROPPED_IMAGES_PATH, filename);
      fs.writeFileSync(fullPath, resizedBuffer);

      return {
        path: `/cropped_images/${filename}`,
        width: rW,
        height: rH,
        caption: captionText,
      };
    } else {
      const filename = `cropped_image_${ts}.jpg`;
      const fullPath = path.join(CROPPED_IMAGES_PATH, filename);
      fs.writeFileSync(fullPath, contentBuffer);

      return {
        path: `/cropped_images/${filename}`,
        width: contentW,
        height: contentH,
        caption: captionText,
      };
    }
  } else {
    // No whitespace removal — save the raw selected area
    const filename = `selected_image_area_${ts}.jpg`;
    const fullPath = path.join(CROPPED_IMAGES_PATH, filename);
    fs.writeFileSync(fullPath, selectedAreaBuffer);

    const meta = await sharp(selectedAreaBuffer).metadata();

    return {
      path: `/cropped_images/${filename}`,
      width: meta.width,
      height: meta.height,
      caption: captionText,
    };
  }
}

// ---------------------------------------------------------------------------
// CLI entry point (mirrors Python __main__ block)
// node extract-image-pdf.js '{"pdfPath":"/uploads/test.pdf","pageNumber":1,...}'
// ---------------------------------------------------------------------------
if (require.main === module) {
  const inputData = JSON.parse(process.argv[2]);
  extractImageFromPdf(inputData)
    .then((result) => {
      process.stdout.write(JSON.stringify(result) + '\n');
    })
    .catch((err) => {
      process.stderr.write(err.message + '\n');
      process.exit(1);
    });
}

module.exports = { extractImageFromPdf };
