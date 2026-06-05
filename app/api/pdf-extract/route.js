import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { createCanvas } from "canvas";

/**
 * Helper: convert PDF.js text items into simple blocks
 */
function extractTextFromItems(items, viewport, rect) {
  return items
    .filter((item) => {
      const x = item.transform[4];
      const y = viewport.height - item.transform[5];

      return (
        x >= rect.x1 &&
        x <= rect.x2 &&
        y >= rect.y1 &&
        y <= rect.y2
      );
    })
    .map((item) => ({
      text: item.str,
      x: item.transform[4],
      y: viewport.height - item.transform[5],
    }));
}

/**
 * Main handler
 */
export default async function handler(req, res) {
  try {
    const { pdfBase64, pageNumber, rect } = req.body;

    if (!pdfBase64) {
      return res.status(400).json({ error: "Missing pdfBase64" });
    }

    const pdfData = Buffer.from(pdfBase64, "base64");

    const loadingTask = pdfjsLib.getDocument({ data: pdfData });
    const pdf = await loadingTask.promise;

    const page = await pdf.getPage(pageNumber + 1);
    const viewport = page.getViewport({ scale: 1 });

    // -------------------------
    // TEXT EXTRACTION
    // -------------------------
    const textContent = await page.getTextContent();

    const textBlocks = extractTextFromItems(
      textContent.items,
      viewport,
      rect
    );

    const text = textBlocks.map((b) => b.text).join(" ");

    // -------------------------
    // IMAGE EXTRACTION (RENDER + CROP)
    // -------------------------
    const canvas = createCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext("2d");

    await page.render({
      canvasContext: ctx,
      viewport,
    }).promise;

    // Crop selected area
    const cropWidth = rect.x2 - rect.x1;
    const cropHeight = rect.y2 - rect.y1;

    const imageData = ctx.getImageData(
      rect.x1,
      rect.y1,
      cropWidth,
      cropHeight
    );

    const croppedCanvas = createCanvas(cropWidth, cropHeight);
    const croppedCtx = croppedCanvas.getContext("2d");

    croppedCtx.putImageData(imageData, 0, 0);

    const imageBase64 = croppedCanvas.toDataURL("image/png");

    // -------------------------
    // RESPONSE
    // -------------------------
    return res.status(200).json({
      text,
      text_json: {
        blocks: textBlocks,
      },
      image: imageBase64,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Failed to extract PDF region",
      details: err.message,
    });
  }
}
