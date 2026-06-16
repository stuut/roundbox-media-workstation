import * as pdfjsLib from 'pdfjs-dist';
import { v4 as uuidv4 } from 'uuid'

// Wait for pdfjs NodePackages to initialize, then inject canvas
const { getDocument } = pdfjsLib;
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/build/pdf.worker.min.mjs';


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
async function extractTextFromItems(items, viewport, rect, page) {
  await page.getOperatorList();

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
    .map((item) => {

      let fontFace = page.commonObjs.get(item.fontName)??null;


      return{
        text: item.str,
        height:item.height,
        width:item.width,
        fontName:fontFace.name,
        x: item.transform[4],
        y: viewport.height - item.transform[5],
      }
    }
  );
}

function safeGet(obj, name) {
  try { return obj.get(name); } catch { return null; }
}

async function extractImagesFromPdf(page, rect){

  const viewport = page.getViewport({ scale: 1 });
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
            id: uuidv4(),
            name: imgName,
            x,
            y,
            width: img.width,
            height: img.height,
            file_url: `data:image/jpeg;base64,${base64}`,
          });
        }
      }
    }
  }
  return images
}


async function extractImagesFromPdfV2(page, rect){

  const viewport = page.getViewport({ scale: 1 });

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

    const imageRefs = [];


    if (fn === OPS.paintImageXObject || fn === OPS.paintInlineImageXObject) {
      const x = currentTransform[4];
      const y = viewport.height - currentTransform[5];

      if (x >= rect.startX && x <= rect.endX && y >= rect.startY && y <= rect.endY) {
          imageRefs.push({
            name: args[0],
            x: currentTransform[4],
            y: viewport.height - currentTransform[5],
          });
      }

      for (const ref of imageRefs) {
          const imgName = args[0];
          let img;

            try {
              const img = safeGet(objs, imgName) || safeGet(commonObjs, imgName);
            } catch {}

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

            images.push({
              id: uuidv4(),
              name: imgName,
              x,
              y,
              width: img.width,
              height: img.height,
              file_url: `data:image/jpeg;base64,${base64}`,
            });
        }
    }
  }

  return images

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


    const textBlocks = await extractTextFromItems(
      textContent.items,
      viewport,
      rect,
      page
    );




    const text = textBlocks.map((b) => b.text).join(" ");


    // -------------------------
    // IMAGE EXTRACTION
    // -------------------------

    const images = await extractImagesFromPdf(page, rect)


    // -------------------------
    // RESPONSE
    // -------------------------
    return Response.json({
      text,
      text_json: {
        blocks: textBlocks,
      },
      images: images,
    },{status: 200});
  } catch (err) {
    console.error(err);
    return Response.json({
      error: "Failed to extract PDF region",
      details: err.message,
    },{status: 500});
  }
}
