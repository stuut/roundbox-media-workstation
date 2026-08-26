import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.mjs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

import { v4 as uuidv4 } from 'uuid'

// Wait for pdfjs NodePackages to initialize, then inject canvas
const { getDocument } = pdfjsLib;
import sharp from 'sharp';


import { createCanvas } from 'canvas';
//import fs from 'fs/promises';
//import path from 'path';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  pdfjsWorker,
  import.meta.url
).toString();

//import { Path2D } from 'path2d';

//global.Path2D = Path2D;

/*
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
}*/


export const runtime = 'nodejs'; // not 'edge'

async function uploadImage(buffer, fileType, fileName){
  const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `extract-pdf-images/${fileName}`,
    Body: buffer,
    ContentType: fileType,
    //ACL: 'public-read', // optional
  })

   await s3.send(command)

  const fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/extract-pdf-images/${encodeURIComponent(fileName)}`
  return fileUrl

}

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

async function getImageBoxesFromPdf(page, scale, rect) {
  const viewport = page.getViewport({ scale });
  const ops = await page.getOperatorList();
  const OPS = pdfjsLib.OPS;
  const boxes = [];
  let currentTransform = [1, 0, 0, 1, 0, 0];

  for (let i = 0; i < ops.fnArray.length; i++) {
    const fn = ops.fnArray[i];
    const args = ops.argsArray[i];

    if (fn === OPS.transform) {
      currentTransform = args;
    }

    if (fn === OPS.paintImageXObject || fn === OPS.paintInlineImageXObject) {
      const [a, b, c, d, e, f] = currentTransform;

      // PDF-space width/height/origin (unit square scaled by the CTM)
      const pdfWidth = Math.hypot(a, b);
      const pdfHeight = Math.hypot(c, d);
      const pdfX = e;
      const pdfTopY = f + d; // top edge in PDF space (y-up)

      // Convert PDF-space point to viewport/canvas space (y-down, scaled)
      // viewport.convertToViewportPoint handles scale + y-flip + any page rotation
      const [vx, vy] = viewport.convertToViewportPoint(pdfX, pdfTopY);
      const [vx2, vy2] = viewport.convertToViewportPoint(pdfX + pdfWidth, pdfTopY - pdfHeight);

      const x = Math.min(vx, vx2)

      const y = Math.min(vy, vy2)

      if (x >= rect.startX*scale && x <= rect.endX*scale &&
          y >= rect.startY*scale && y <= rect.endY*scale) {

              boxes.push({
                imgName: args[0],
                x: x,
                y: y,
                width: Math.abs(vx2 - vx),
                height: Math.abs(vy2 - vy),
              });
          }
    }
  }
  return boxes;
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

            console.log('currentTransform', currentTransform)

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
            file_name: imgName+'.jpg',
            file_type: 'image/jpeg',
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

async function extractImageCanvas(box, page, scale, removeWhiteSpace=true){


  const inset = 0

  const viewport = page.getViewport({ scale });

  const canvas = createCanvas(viewport.width, viewport.height);
  const ctx = canvas.getContext('2d');

  await page.render({
    canvasContext: ctx,
    viewport,
  }).promise;


  const croppedCanvas = createCanvas(box.width-(inset*2), box.height-(inset*2))
  const croppedCtx = croppedCanvas.getContext('2d');

    croppedCtx.drawImage(
      canvas,
      box.x+inset, box.y+inset, box.width-(inset*2), box.height-(inset*2),
      0, 0, box.width-(inset*2), box.height-(inset*2)
    );

    const imageBuffer = croppedCanvas.toBuffer('image/png');


    const trimmedFile =  await sharp(imageBuffer)
    .trim({ threshold: 50, background: '#ffffff' })
    .toBuffer();


    const sharpenFile = await sharp(trimmedFile)
      .sharpen() // Applies a fast, standard sharpen filter
      .toBuffer();

        // upload to sw3
    
    const fileName = uuidv4()+'.png'
    const fileUrl = await uploadImage(sharpenFile, 'image/png', fileName)


    return {
      id: uuidv4(),
      file_name: fileName,
      file_type: 'image/png',
      width:box.width-(inset*2),
      height:box.height-(inset*2),
      //file_url:`data:image/png;base64,${sharpenFile.toString('base64')}`
      file_url: fileUrl
    };
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

    const loadingTask = pdfjsLib.getDocument({
      url: pdfUrl,
    //  CanvasFactory: CustomCanvasFactory,  // capital C, class not instance
      useWorkerFetch: false,
      isEvalSupported: false,
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

    //const images = await extractImagesFromPdf(page, rect)



    const imageboxes = await getImageBoxesFromPdf(page, 3, rect)


    let extractedImagesArray = []

    for (const box of imageboxes) {
      const extractedImage = await extractImageCanvas(box, page, 3, false)
      extractedImagesArray.push(extractedImage)
    }


    // -------------------------
    // RESPONSE
    // -------------------------
    return Response.json({
      text,
      text_json: {
        blocks: textBlocks,
      },
      images: extractedImagesArray,
      //extractedImages:extractedImagesArray
    },{status: 200});
  } catch (err) {
    console.error(err);
    return Response.json({
      error: "Failed to extract PDF region",
      details: err.message,
    },{status: 500});
  }
}
