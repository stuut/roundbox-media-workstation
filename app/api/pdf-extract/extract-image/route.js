import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.mjs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

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

    const imageBuffer = croppedCanvas.toBuffer('image/png');

    const trimmedFile =  await sharp(imageBuffer)
    .trim({ threshold: 25, background: '#ffffff' })
    .toBuffer();

    // upload to sw3

    const fileName = uuidv4()+'.png'
    const fileUrl = await uploadImage(trimmedFile, 'image/png', fileName)


    return {
      id: uuidv4(),
      file_name: fileName,
      file_type: 'image/png',
      width:cropWidth,
      height:cropWidth,
      //file_url: `data:image/png;base64,${trimmedFile.toString('base64')}`
      file_url: fileUrl
    }
  }else{


    const imageBuffer = croppedCanvas.toBuffer('image/png');

     // upload to sw3

     const fileUrl = await uploadImage(imageBuffer, 'image/png', fileName)
     const fileName = uuidv4()+'.png'

    return {
      id: uuidv4(),
      file_name: fileName,
      file_type: 'image/png',
      width:cropWidth,
      height:cropHeight,
      //file_url:`data:image/png;base64,${imageBuffer.toString('base64')}`

      file_url: fileUrl

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
