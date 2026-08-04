import { PDFDocument, rgb } from 'pdf-lib';
import canvasToPDF from "@pdftron/canvas-to-pdf";
import { createCanvas } from 'canvas';
import { NextResponse, NextRequest } from 'next/server';


function drawCropMarks(page, opts) {
  const {
    trimWidth,
    trimHeight,
    bleed,
    gap,
    markLength,
    markWeight = 0.25
  } = opts

  // page origin (0,0) is bottom-left in pdf-lib.
  // The trim box is centered inside the bleed box.
  const pageWidth = trimWidth + bleed * 2
  const pageHeight = trimHeight + bleed * 2

  // trim box corners, in page coordinates
  const left = bleed
  const right = bleed + trimWidth
  const bottom = bleed
  const top = bleed + trimHeight

  const markStart = gap // distance from trim edge marks start
  const markEnd = gap + markLength // distance from trim edge marks end

  const color = rgb(0, 0, 0)
  const opts_ = { thickness: markWeight, color }

  // 8 marks total: 2 per corner, one horizontal + one vertical
  const corners = [
    { x: left, y: bottom, xDir: -1, yDir: -1 }, // bottom-left
    { x: right, y: bottom, xDir: 1, yDir: -1 }, // bottom-right
    { x: left, y: top, xDir: -1, yDir: 1 }, // top-left
    { x: right, y: top, xDir: 1, yDir: 1 } // top-right
  ]

  for (const c of corners) {
    // horizontal mark (extends away from trim edge along x)
    page.drawLine({
      start: { x: c.x + c.xDir * markStart, y: c.y },
      end: { x: c.x + c.xDir * markEnd, y: c.y },
      ...opts_
    })
    // vertical mark (extends away from trim edge along y)
    page.drawLine({
      start: { x: c.x, y: c.y + c.yDir * markStart },
      end: { x: c.x, y: c.y + c.yDir * markEnd },
      ...opts_
    })
  }

  return { pageWidth, pageHeight, left, right, bottom, top }
}





export async function POST(req){
    const { canvasPngBytes, width, height } = await req.json();


    const pdfDoc = await PDFDocument.create();
    const trimWidth = width;  // A4 width in pt
    const trimHeight = height;
    const bleed = 8.5;          // ~3mm
    const bleedExtensionOfArt = bleed;

    const page = pdfDoc.addPage([trimWidth + bleed * 2, trimHeight + bleed * 2]);

    // embed your canvas image (or vector content) at bleed offset
    const pngImage = await pdfDoc.embedPng(canvasPngBytes);
    page.drawImage(pngImage, {
    x: bleed - bleedExtensionOfArt, // your art should itself extend into bleed
    y: bleed - bleedExtensionOfArt,
    width: trimWidth + bleedExtensionOfArt * 2,
    height: trimHeight + bleedExtensionOfArt * 2,
    });

    drawCropMarks(page, { trimWidth, trimHeight, bleed, gap: 8.5, markLength: 14.2 });

     const pdfBytes = await pdfDoc.save();


    return new Response(pdfBytes, {
    status: 200,
    headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="my-document.pdf"',
    },
    });

}
