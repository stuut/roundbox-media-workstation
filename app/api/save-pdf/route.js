import {
  PDFDocument,
  concatTransformationMatrix,
  pushGraphicsState,
  popGraphicsState,
  moveTo,
  lineTo,
  closePath,
  clip,
  endPath,
  rgb
} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

function drawCropMarks(page, opts) {
  const {
    trimWidth,
    trimHeight,
    bleed,
    gap,
    markLength,
    markWeight = 0.25
  } = opts

  const pageWidth = trimWidth + bleed * 2
  const pageHeight = trimHeight + bleed * 2

  const left = bleed
  const right = bleed + trimWidth
  const bottom = bleed
  const top = bleed + trimHeight

  const markStart = gap
  const markEnd = gap + markLength

  const color = rgb(0, 0, 0)
  const opts_ = { thickness: markWeight, color }

  const corners = [
    { x: left, y: bottom, xDir: -1, yDir: -1 },
    { x: right, y: bottom, xDir: 1, yDir: -1 },
    { x: left, y: top, xDir: -1, yDir: 1 },
    { x: right, y: top, xDir: 1, yDir: 1 }
  ]

  for (const c of corners) {
    page.drawLine({
      start: { x: c.x + c.xDir * markStart, y: c.y },
      end: { x: c.x + c.xDir * markEnd, y: c.y },
      ...opts_
    })
    page.drawLine({
      start: { x: c.x, y: c.y + c.yDir * markStart },
      end: { x: c.x, y: c.y + c.yDir * markEnd },
      ...opts_
    })
  }

  return { pageWidth, pageHeight, left, right, bottom, top }
}

let fontManifest;

// manifest.json now looks like:
// { "Poppins": { "normal": { "900": { "web": "Poppins-900-normal.woff2", "print": "Poppins-900-normal.ttf" } } } }
async function getManifest() {
  if (!fontManifest) {
    fontManifest = await fetch('https://localhost:3001/fonts/manifest.json').then(r => r.json());
  }
  return fontManifest;
}

// Cache embedded PDFFont objects per pdfDoc so the same weight/style
// isn't fetched + embedded again for every text element that uses it.
function createFontLoader(pdfDoc, manifest) {
  const cache = new Map();

  return async function getFont(fontFamily, style, weight) {





    const key = `${fontFamily}-${style}-${weight}`;
    if (cache.has(key)) return cache.get(key);

    const entry = manifest[fontFamily]?.[style]?.[weight];
    if (!entry) {
      throw new Error(`No manifest entry for ${fontFamily} ${style} ${weight}`);
    }

    // .print is the TTF path — required for pdf-lib/Acrobat glyph extraction.
    // .web (woff2) is for the browser canvas only; never embed it into a PDF.
    const fontUrl = `https://localhost:3001/fonts/${fontFamily}/${entry.print}`;
    const fontBytes = await fetch(fontUrl).then(r => r.arrayBuffer());
    const font = await pdfDoc.embedFont(fontBytes);

    cache.set(key, font);
    return font;
  };
}

function getLineOffset(lineWidth, align, boxWidth, padding) {
  if (align === 'center') {
    return (boxWidth - lineWidth) / 2 - padding;
  } else if (align === 'right') {
    return boxWidth - lineWidth - padding * 2;
  }
  return 0; // left align
}





export async function POST(req) {
  const { canvasPngBytes, width, height, elements } = await req.json();

  const pdfDoc = await PDFDocument.create();
  const trimWidth = width;
  const trimHeight = height;
  const bleed = 8.5;

  const page = pdfDoc.addPage([trimWidth + bleed * 2, trimHeight + bleed * 2]);

  pdfDoc.registerFontkit(fontkit);
  const manifest = await getManifest();
  const getFont = createFontLoader(pdfDoc, manifest);

  const translate = (tx, ty) => concatTransformationMatrix(1, 0, 0, 1, tx, ty);
  const rotate = (angle) => {
    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);
    return concatTransformationMatrix(cos, sin, -sin, cos, 0, 0);
  };
  const scale = (sx, sy) => concatTransformationMatrix(sx, 0, 0, sy, 0, 0);

  

    for (const object of elements) {
      const { height: pageHeight } = page.getSize();

      if (object.clippingPath){
           

      }else{

      }

      page.pushOperators(
        pushGraphicsState(),
        translate(object.cx, pageHeight - object.cy),
        rotate(object.angle),
        scale(object.scale, object.scale),  
       // translate(-object.cx, -object.cy),
      );


      if (object.type === 'text') {
        //const font = await getFont(object.fontFamily, object.fontStyle, object.fontWeight);
        // Get total height or specific metrics

          const lines = object.lines;
          const lineHeight = object.lineHeight;
          let charCounter = 0;

          for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];

            // measure this line's width using the correct font per char (fallback to base font for offset calc)
            const baseStyle = object.charStyles?.[`${lineIndex}:0`] || {};
            const fontSize = baseStyle.fontSize || object.fontSize;
            const baseFont = await getFont(
              object.fontFamily,
              object.fontStyle,
              object.fontWeight
            );
            const lineWidth = baseFont.widthOfTextAtSize(line, fontSize);

            const lineOffset = getLineOffset(lineWidth, object.textAlign, object.width, object.textPadding);

            let x = lineOffset - object.width / 2 + object.textPadding;

            const baselineOffset = fontSize * 0.8;
            // NOTE: sign flipped vs canvas because pdf-lib's y-axis points up
            let y = object.h / 2 - object.textPadding - lineIndex * lineHeight - baselineOffset;

            for (let charIndex = 0; charIndex < line.length; charIndex++) {
              const ch = line[charIndex];
              const style = object.charStyles?.[`${lineIndex}:${charIndex}`] || {};
              const fontWeight = style.fontWeight || object.fontWeight || '';
              const fontStyle = style.fontStyle || object.fontStyle || '';
              const fontFamily = style.fontFamily || object.fontFamily;
              const fill = style.fill?.colour || object.fill?.colour || '#000000';
              const charFontSize = style.fontSize || fontSize;
              const matches = fill.match(/[\d.]+/g);
              const rgbaNumbers = matches ? matches.map(Number) : [];

              const font = await getFont(fontFamily, fontStyle, fontWeight);


              // Animations don't translate to a static PDF — bake in the final/rest state only.
              // If you need a specific animation frame frozen into the export, compute
              // drawX/drawY/alpha here the same way getTextAnimatedProps did, just once,
              // rather than per-frame.
              const drawX = x;
              const drawY = y;
              const alpha = object.opacity;

              page.drawText(ch, {
                x: drawX,
                y: drawY,
                size: charFontSize,
                font,
                color:rgb(rgbaNumbers[0], rgbaNumbers[1], rgbaNumbers[2]),
                opacity: alpha,
              });

              x += font.widthOfTextAtSize(ch, charFontSize);
              charCounter++;
            }
          }

      }else if (object.type === 'image'){

         // 2. Fetch or read your image as an ArrayBuffer or Uint8Array
          // Node.js way:
          // Browser way:
          const imageBytes = await fetch(object.imageSrc).then(res => res.arrayBuffer());

          // 3. Embed the image (use embedJpg for JPGs)
          const image = await pdfDoc.embedJpg(imageBytes);

          // 4. Get or scale dimensions (Optional but recommended)

          page.pushOperators(
            pushGraphicsState(),
          //  translate(object.cx, pageHeight - object.cy),
          //  rotate(object.angle),
          //  scale(object.scale, object.scale),

            // Build the clip rectangle path (local coords, relative to the object frame)
            moveTo(-object.width/2, -object.h/2),
            lineTo(x + width, y),
            lineTo(x + width, y + height),
            lineTo(x, y + height),
            closePath(),

            clip(),      // marks the current path as the clip region
            endPath(),   // required — 'n' operator, ends the path without fill/stroke
          );


          // 5. Draw the image onto the page
          page.drawImage(image, {
            x: -object.width/2,
            y: -object.h/2,
            width: object.width,
            height: object.h,
            opacity: object.opacity, // Optional: transparency value between 0.0 and 1.0
          });

          qpage.pushOperators(popGraphicsState());

      }

      page.pushOperators(popGraphicsState());
    }
  

  const pdfBytes = await pdfDoc.save();

  return new Response(pdfBytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="my-document.pdf"',
    },
  });
}