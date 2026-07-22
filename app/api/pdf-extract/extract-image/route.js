import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.mjs';

import { v4 as uuidv4 } from 'uuid'

const { getDocument } = pdfjsLib;
import sharp from 'sharp';


import { createCanvas } from 'canvas';

//import { Path2D } from 'path2d';

//global.Path2D = Path2D;


export const runtime = 'nodejs'; // not 'edge'


pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  pdfjsWorker,
  import.meta.url
).toString();

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


async function extractImagesCanvas(rect, page, removeWhiteSpace, outputScale = 1){

  const scale = 3;


  const viewport = page.getViewport({ scale });

  const canvas = createCanvas(viewport.width, viewport.height);
  const ctx = canvas.getContext('2d');

  await page.render({
    canvasContext: ctx,
    viewport,
  }).promise;


  const cropX = rect.startX * scale;
  const cropY = rect.startY * scale;
  const cropWidth = (rect.endX * scale) - (rect.startX * scale)
  const cropHeight = (rect.endY * scale) - (rect.startY * scale)

  const croppedCanvas = createCanvas(cropWidth, cropHeight);
  const croppedCtx = croppedCanvas.getContext('2d');

  croppedCtx.drawImage(
    canvas,
    cropX, cropY, cropWidth, cropHeight,
    0, 0, cropWidth, cropHeight
  );


  if (removeWhiteSpace) {

    /*

    const imageData = croppedCtx.getImageData(
      0,
      0,
      cropWidth,
      cropHeight
    );

    const data = imageData.data;

    let minX = cropWidth;
    let minY = cropHeight;
    let maxX = 0;
    let maxY = 0;

    const threshold = 250; // treat near-white as white

    for (let y = 0; y < cropHeight; y++) {
      for (let x = 0; x < cropWidth; x++) {

        const i = (y * cropWidth + x) * 4;

        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        const isWhite =
          r >= threshold &&
          g >= threshold &&
          b >= threshold &&
          a > 0;

        if (!isWhite) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }

    const width = maxX - minX + 1;
    const height = maxY - minY + 1;

    const finalCanvas = createCanvas(width, height);
    const finalCtx = finalCanvas.getContext('2d');

    finalCtx.drawImage(
      croppedCanvas,
      minX, minY, width, height,
      0, 0, width, height
    );
    */


    const imageBuffer = croppedCanvas.toBuffer('image/png');


    const trimmedFile =  await sharp(imageBuffer)
    .trim({ threshold: 25, background: '#ffffff' })
    .toBuffer();


    return {
      id: uuidv4(),
      file_name: uuidv4()+'.png',
      file_type: 'image/png',
      width:cropWidth,
      height:cropWidth,
      file_url: `data:image/png;base64,${trimmedFile.toString('base64')}`
    }
  }else{

    const imageBuffer = croppedCanvas.toBuffer('image/png');
    return {
      id: uuidv4(),
      file_name: uuidv4()+'.png',
      file_type: 'image/png',
      width:cropWidth,
      height:cropHeight,
      file_url:`data:image/png;base64,${imageBuffer.toString('base64')}`
    };
  }
}

/**
 * Main handler
 */
export async function POST(req) {



  try {
    const { pdfUrl, rect, pageNumber, removeWhiteSpace } = await req.json();;

    if (!pdfUrl) {
        return  Response.json({error: "Missing pdf"},{status: 400});
    }

    pdfjsLib.GlobalWorkerOptions.workerPort = null;

    const loadingTask = pdfjsLib.getDocument({
      url: pdfUrl,
      useWorkerFetch: false,
      isEvalSupported: false,
    });

    const pdf = await loadingTask.promise;


    const page = await pdf.getPage(pageNumber);

    // -------------------------
    // IMAGE EXTRACTION
    // -------------------------

    const image = await extractImagesCanvas(rect, page, removeWhiteSpace)



    // TEXT EXTRACTION

    const viewport = page.getViewport({ scale: 1 });
    const textContent = await page.getTextContent();

    rect.endY = rect.endY+20

    const textBlocks = await extractTextFromItems(
      textContent.items,
      viewport,
      rect,
      page
    );

    const text = textBlocks.map((b) => b.text).join(" ");

    if (text){
      image.file_description = text
    }


    // -------------------------
    // RESPONSE
    // -------------------------
    return Response.json({
      image
    },{status: 200});
  } catch (err) {
    console.error(err);
    return Response.json({
      error: "Failed to extract PDF region",
      details: err.message,
    },{status: 500});
  }
}
