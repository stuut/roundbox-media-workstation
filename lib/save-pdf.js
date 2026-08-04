import canvasToPDF from "@pdftron/canvas-to-pdf";

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

const applyEffect = (ctx, effect) =>{
  if (!ctx) return
  if (!effect) return
  ctx.shadowColor = effect.shadowColor;
  ctx.shadowBlur = effect.shadowBlur;
  ctx.shadowOffsetX = effect.shadowOffsetX;
  ctx.shadowOffsetY = effect.shadowOffsetX;
}

function tracePath(ctx, x, y, width, height, radii) {
  let [tl, tr, br, bl] = radii;

  const maxRadius = Math.min(width, height) / 2;
  tl = Math.min(tl, maxRadius);
  tr = Math.min(tr, maxRadius);
  br = Math.min(br, maxRadius);
  bl = Math.min(bl, maxRadius);

  // Bezier "kappa" constant to approximate a circular arc
  const k = 0.5522847498;

  ctx.beginPath();
  ctx.moveTo(x + tl, y);

  // top edge
  ctx.lineTo(x + width - tr, y);
  // top-right corner
  ctx.bezierCurveTo(
    x + width - tr + tr * k, y,
    x + width, y + tr - tr * k,
    x + width, y + tr
  );

  // right edge
  ctx.lineTo(x + width, y + height - br);
  // bottom-right corner
  ctx.bezierCurveTo(
    x + width, y + height - br + br * k,
    x + width - br + br * k, y + height,
    x + width - br, y + height
  );

  // bottom edge
  ctx.lineTo(x + bl, y + height);
  // bottom-left corner
  ctx.bezierCurveTo(
    x + bl - bl * k, y + height,
    x, y + height - bl + bl * k,
    x, y + height - bl
  );

  // left edge
  ctx.lineTo(x, y + tl);
  // top-left corner
  ctx.bezierCurveTo(
    x, y + tl - tl * k,
    x + tl - tl * k, y,
    x + tl, y
  );

  ctx.closePath();
}

function buildCurve(c, pointList, close) {
  if (pointList.length < 1) return;
  c.beginPath();
  c.moveTo(pointList[0].x, pointList[0].y);

  const len = close ? pointList.length : pointList.length - 1;
  for (let i = 0; i < len; i++) {
    const a = pointList[i];
    const b = pointList[(i + 1) % pointList.length];
    const cp1 = a.cpOut || { x: a.x, y: a.y };  // fallback = anchor → straight
    const cp2 = b.cpIn  || { x: b.x, y: b.y };
    c.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, b.x, b.y);
  }
  if (close) c.closePath();
}

function getLineOffset(lineIndex = 0, line, align, ctx, boxWidth, padding, currentObject) {

  const textWidth = measureTextWidth(line, currentObject, lineIndex, ctx)

  if (align === "center") {
    return (boxWidth - textWidth) / 2 - padding;
  } else if (align === "right") {
    return boxWidth - textWidth - padding * 2;
  }
  return 0; // left align
}


function measureTextWidth(line, lineIndex, currentObject, ctx){

  ctx.save()

  let textWidth = 0;


  for (let charIndex = 0; charIndex < line.length; charIndex++) {
    const ch = line[charIndex];
    const style = currentObject.charStyles?.[`${lineIndex}:${charIndex}`] || {};

    const fontSize = style?.fontSize || currentObject.fontSize;
    const fontWeight = style?.fontWeight || currentObject.fontWeight || "";
    const fontStyle = style?.fontStyle || currentObject.fontStyle || "";
    const fontFamily = style?.fontFamily || currentObject.fontFamily;
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    // Measure individual character, not whole line
    textWidth += ctx.measureText(ch).width;
  }

  ctx.restore()

  return textWidth

}

function getTextAnimatedProps(lineIndex, charIndex = null,  totalLines = 1) {
  // Default props
  let props = { x: 0, y: 0, opacity: 1 };

  currentObject.animations?.forEach(anim => {
    if (!anim.type.includes('Lines') && !anim.type.includes('Char')) return;
    if (currentTime < anim.startTime) {

      if (anim.type.includes('fadeIn')) props.opacity = 0;
      if (anim.type === 'fadeInUpLines') props.y = 100;
      if (anim.type === 'fadeInUpChar') props.y = 20;
      if (anim.type === 'slideInLeftLines' || anim.type === 'slideInLeftChar') {
        props.x = -100; props.opacity = 0;
      }
      if (anim.type === 'slideInRightLines' || anim.type === 'slideInRightChar') {
        props.x = 100; props.opacity = 0;
      }

      return;
    }

    // Stagger delays
    const lineStagger = 0.1; // per-line delay
    const charStagger = 0.03; // per-character delay

    let staggerDelay = 0;

    // Decide if this animation is line-based or char-based
    if (anim.type.includes('Lines')) {
      staggerDelay = lineIndex * lineStagger;
    } else if (anim.type.includes('Char')) {
      staggerDelay = charIndex * charStagger; // charIndex = global char index
    }



    const animStart = anim.startTime + staggerDelay;
    const animEnd = animStart + anim.duration;

    // Before animation starts
    if (currentTime < animStart) {
      if (anim.type.includes('fadeIn')) props.opacity = 0;
      if (anim.type === 'fadeInUpLines') props.y = 100;
      if (anim.type === 'fadeInUpChar') props.y = 20;
      if (anim.type === 'slideInLeftLines' || anim.type === 'slideInLeftChar') {
        props.x = -100; props.opacity = 0;
      }
      if (anim.type === 'slideInRightLines' || anim.type === 'slideInRightChar') {
        props.x = 100; props.opacity = 0;
      }
      return;
    }

    // After animation ends
    if (currentTime > animEnd) return;

    // Calculate eased progress
    let progress = (currentTime - animStart) / anim.duration;

    const easingFn = Easings[anim.easing || 'linear'];
    const eased = easingFn(progress);


    // Apply animation type

    switch (anim.type) {
      case 'fadeInUpLines':
        props.opacity = eased;
        props.y = 100 * (1 - eased);
        break;
      case 'fadeInUpChar':
        props.opacity = eased;
        props.y = 20 * (1 - eased);
        break;
      case 'fadeInLines':
      case 'fadeInChar':
        props.opacity = eased;
        break;
      case 'slideInLeftLines':
      case 'slideInLeftChar':
        props.opacity = eased;
        props.x = -100 * (1 - eased);
        break;
      case 'slideInRightLines':
      case 'slideInRightChar':
        props.opacity = eased;
        props.x = 100 * (1 - eased);
        break;
    }
  });

  return props;
}

export const createPDF = async (elements, width, height) => {

        let fontFiles;

        async function getManifest() {
        if (!fontFiles) fontFiles = await fetch(`/fonts/manifest.json`).then(r => r.json());
        return fontFiles;
        }

        async function loadFont(fontFamily, weight = '400', style = 'normal') {
        const manifest = await getManifest();
        const fileName = manifest[fontFamily]?.[style]?.[weight];
        if (!fileName) return;


        const response = await fetch(`/fonts/${fontFamily}/${fileName}`);
        const fontData = await response.arrayBuffer();
        const font = new FontFace(fontFamily, fontData, { weight, style });
        await font.load();
        self.fonts.add(font);
        return font;
        }




    const draw = async (ctx) => {
    ctx.save(); 
    ctx.setTransform(1,0,0,1,0,0);

        for (const object of elements) {
            ctx.save();
        
            if (object.type !== 'image'){
                ctx.translate(object.cx, object.cy);
                ctx.rotate(object.angle);
                ctx.scale(object.scale, object.scale);
            }

        ctx.globalAlpha = object.opacity;
        ctx.beginPath(); 

        if (object.effects.length > 0){
            object.effects.forEach(effect => {
            applyEffect(ctx, effect)
            })
        }


        if (object.type === "rectangle") {
            if (object.cornerRadiusCoordinates) {
            tracePath(ctx, -object.width / 2, -object.h / 2, object.width, object.h, object.cornerRadius);
            }else{
            ctx.rect(-object.width/ 2, -object.h / 2, object.width, object.h);
            }

        } else if (object.type === "ellipse") {

            ctx.ellipse(0, 0, object.width/ 2, object.h / 2, 0, 0, Math.PI * 2);
        } else if (object.type === "triangle"){

            ctx.moveTo(0, -object.h / 2);
            ctx.lineTo(-object.width/2, object.h / 2);
            ctx.lineTo(object.width/2, object.h / 2);

        } else if (object.type === "custom-shape"){

            if (object.type === 'custom-shape' && !object.closed) {
            
                buildCurve(ctx, object.points, object.closed);
                ctx.stroke();
    
            } else {
            
                buildCurve(ctx, object.points, object.closed);
                ctx.stroke();
                ctx.fillStyle = object.fill || "lightgray";
                ctx.fill();
            
            }

        } else if (object.type === "text"){
            
            try{
            await loadFont(object.fontFamily, object.fontWeight, object.fontStyle)
            } catch (error) {
            console.error('Error loading font:', error);
            }
            ctx.textBaseline = "alphabetic";
            const lines = object.lines;
            const lineHeight = object.lineHeight;
            const totalCharsInBlock  = object.text.length;
            let charCounter = 0; // global char index

            lines.forEach((line, lineIndex) => {
            const lineOffset = getLineOffset(
                lineIndex,
                line,
                object.textAlign,
                ctx,
                object.width,
                object.textPadding,
                object
            );

            let x = lineOffset - object.width / 2 + object.textPadding;
            const baseStyle = object.charStyles?.[`${lineIndex}:0`] || {};
            const fontSize = baseStyle?.fontSize || object.fontSize;
            const baselineOffset = fontSize * 0.8;
            let y = -object.h / 2 + object.textPadding + lineIndex * lineHeight + baselineOffset;

            for (let charIndex = 0; charIndex < line.length; charIndex++) {
                const ch = line[charIndex];

                const style = object.charStyles?.[`${lineIndex}:${charIndex}`] || {};
                const fontWeight = style?.fontWeight || object.fontWeight || "";
                const fontStyle = style?.fontStyle || object.fontStyle || "";
                const fontFamily = style?.fontFamily || object.fontFamily;
                const fill = style?.fill || object.fill || "#000";
                const charFontSize = style?.fontSize || fontSize;

                ctx.font = `${fontStyle} ${fontWeight} ${charFontSize}px ${fontFamily}`;

                ctx.fillStyle = fill;

                // Animation props
                let drawX = x;
                let drawY = y;
                let alpha

                const allowedTypes = new Set(["Lines", "Char"]);

                const hasTextAnim = object.animations?.some(a => !allowedTypes.has(a.type));

                if (hasTextAnim) {

                // perline
                const animProps = getTextAnimatedProps(lineIndex, charCounter, lines.length);

                drawX += animProps.x;
                drawY += animProps.y;
                alpha = object.opacity * animProps.opacity;
                }else{
                alpha = object.opacity
                }

                ctx.globalAlpha = alpha;
                ctx.fillText(ch, drawX, drawY);

                // Move to next character
                x += ctx.measureText(ch).width;
                charCounter++; // increment global index
            }
            });


        }


        if (object.type !== "pen" && object.type !== "image" && object.type !== "custom-shape"){
            ctx.fillStyle = object.fill || "lightgray";
            ctx.fill();
        }

        // Then stroke (optional)
        if (object.strokeColour && object.strokeWeight && object.type !== 'image' && object.type !== 'custom-shape'){

            ctx.strokeStyle = object.strokeColour || "black";
            ctx.lineWidth = object.strokeWeight || 0
            // put stroke on outside
            ctx.strokeRect(
            -object.width/ 2 - (object.strokeWeight/2),
            -object.h / 2 - (object.strokeWeight/2),
            object.width + object.strokeWeight,
            object.h + object.strokeWeight
            );
        }


        ctx.closePath();
        ctx.restore()
    

        }

        ctx.restore()
    };

    const res = await canvasToPDF(draw, { width: width, height: height })

    return res
};