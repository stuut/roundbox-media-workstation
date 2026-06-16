import * as pdfjsLib from 'pdfjs-dist';

// Wait for pdfjs NodePackages to initialize, then inject canvas
const { getDocument } = pdfjsLib;
import { fromPath } from 'pdf2pic';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';



pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/build/pdf.worker.min.mjs';

import { createCanvas } from 'canvas';

import { Path2D } from 'path2d';

global.Path2D = Path2D;


class CustomCanvasFactory {
  create(width, height) {
    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');
    return { canvas, context };
  }
  reset(canvasAndContext, width, height) {
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  }
  destroy(canvasAndContext) {
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  }
}

export const runtime = 'nodejs'; // not 'edge'

/**
 * Helper: convert PDF.js text items into simple blocks
 */
function extractTextFromItems(items, viewport, rect) {
  return items
    .filter((item) => {
      const x = item.transform[4];
      const y = viewport.height - item.transform[5];

      return (
        x >= rect.startX &&
          x <= rect.endX &&
        y >= rect.startY &&
        y <= rect.endY
      );
    })
    .map((item) => ({
      text: item.str,
      x: item.transform[4],
      y: viewport.height - item.transform[5],
    }));
}


async function extractImagesFromPdf(pdfUrl, rect, pageNumber){
  const pdfRes = await fetch(pdfUrl);
  const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());

  // Sharp can render PDFs directly via libvips (which uses poppler)
  const rendered = await sharp(pdfBuffer, { page: pageNumber})
    .png()
    .toBuffer();

  const metadata = await sharp(rendered).metadata();
  console.log('rendered size:', metadata.width, metadata.height);

  console.log('rect:', rect);

  const scaleX = metadata.width / 595;
  const scaleY = metadata.height / 841.499657301823;


  const croppedImage = await sharp(rendered)
    .extract({
      left: Math.round(rect.startX * scaleX),
      top: Math.round(rect.startY * scaleY),
      width: Math.round(cropWidth * scaleX),
      height: Math.round(cropHeight * scaleY),
    })
    .png()
    .toBuffer();

    const croppedMeta = await sharp(croppedImage).metadata();
    console.log('cropped dimensions:', croppedMeta.width, croppedMeta.height);
    console.log('expected crop:', Math.round(cropWidth * scaleX), Math.round(cropHeight * scaleY));

  const imageBase64 = `data:image/png;base64,${croppedImage.toString('base64')}`;

  // Cleanup temp files
  await fs.unlink(tmpPdf);
  await fs.unlink(result.path);

  return imageBase64

}


async function extractImagesCanvas(rect, page){

  const scale = 3;

  const viewport = page.getViewport({ scale });

  const canvas = createCanvas(viewport.width, viewport.height);
  const ctx = canvas.getContext('2d');

  await page.render({
    canvasContext: ctx,
    viewport,
  }).promise;

  // Crop the rect area
  const cropX = rect.startX * scale;
  const cropY = rect.startY * scale;
  const cropWidth = (rect.endX - rect.startX) * scale;
  const cropHeight = (rect.endY - rect.startY) * scale;

  const croppedCanvas = createCanvas(cropWidth, cropHeight);
  const croppedCtx = croppedCanvas.getContext('2d');

  croppedCtx.drawImage(
    canvas,
    cropX, cropY, cropWidth, cropHeight,
    0, 0, cropWidth, cropHeight
  );

  const imageBuffer = croppedCanvas.toBuffer('image/png');
  const imageBase64 = `data:image/png;base64,${imageBuffer.toString('base64')}`;

  return imageBase64
}

/**
 * Main handler
 */
export async function POST(req) {



  try {
    const { pdfUrl, rect, pageNumber } = await req.json();;

    if (!pdfUrl) {
        return  Response.json({error: "Missing pdf"},{status: 400});
    }

    //const pdfData = Buffer.from(pdfBase64, "base64");

    const loadingTask = pdfjsLib.getDocument({
      url: pdfUrl,
      CanvasFactory: CustomCanvasFactory,  // capital C, class not instance
    });

    const pdf = await loadingTask.promise;


    const page = await pdf.getPage(pageNumber);
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

    const imageBase64 = await extractImagesCanvas(rect, page)


    const ops = await page.getOperatorList();
    const commonObjs = page.commonObjs;
    const objs = page.objs;

    const OPS = pdfjsLib.OPS;
    const images = [];

    let currentTransform = [1, 0, 0, 1, 0, 0]; // identity matrix

    for (let i = 0; i < ops.fnArray.length; i++) {
      const fn = ops.fnArray[i];
      const args = ops.argsArray[i];

      if (fn === OPS.transform) {
        currentTransform = args;
      }

      if (fn === OPS.paintImageXObject || fn === OPS.paintInlineImageXObject) {
        const x = currentTransform[4];
        const y = viewport.height - currentTransform[5];

        if (x >= rect.startX && x <= rect.endX &&
            y >= rect.startY && y <= rect.endY) {

          const imgName = args[0];
          const img = safeGet(objs, imgName) || safeGet(commonObjs, imgName);

          if (!img) continue;

          const jpegBuffer = await sharp(Buffer.from(img.data), {
            raw: {
              width: img.width,
              height: img.height,
              channels: 3,
            },
          })
          .jpeg({ quality: 90 })
          .toBuffer();

          const base64 = jpegBuffer.toString('base64');

          if (img) {
            images.push({
              name: imgName,
              x,
              y,
              width: img.width,
              height: img.height,
              data: `data:image/jpeg;base64,${base64}`,
            });
          }
        }
      }
    }

    console.log('images', images)

    //const imageBase64 = await extractImagesFromPdf(pdfUrl, rect, pageNumber)

    // -------------------------
    // RESPONSE
    // -------------------------
    return Response.json({
      text,
      text_json: {
        blocks: textBlocks,
      },
      image: imageBase64,
    },{status: 200});
  } catch (err) {
    console.error(err);
    return Response.json({
      error: "Failed to extract PDF region",
      details: err.message,
    },{status: 500});
  }
}
