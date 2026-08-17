import { Easings } from "@/lib/easings";

let ctx;
let currentObject
let currentTime

const radToDeg = (rad) => rad * 180 / Math.PI;
const degToRad = (deg) => deg * Math.PI / 180;

onmessage = async (e) => {
  if (e.data.canvas && !ctx) {
    // Receive OffscreenCanvas from main thread
    ctx = e.data.canvas.getContext('2d');
    return;
  }


  if (e.data.type === 'ERASE'){

      erase(
        e.data.eraserTexture,
        e.data.d,
        e.data.eraserOpacity,
        e.data.x,
        e.data.y
      )
    return;
  }

  if (e.data.type === 'DRAW_PEN'){

      drawPen(e.data.points, e.data.colour, e.data.brushSize)
    return;
  }

  if (e.data.type === 'DRAW_AIRBRUSH'){

      drawBuffer(e.data.airbrushBuffer, e.data.brushOpacity)

      postMessage({ type: 'DRAW_DONE' });
    return;
  }

  if (e.data.type === 'LOAD_FONTS') {

    loadFont(e.data.fontFamily, e.data.weight, e.data.style)

    return;
  }

  if (e.data.type === 'DRAW_FRAME') {

    currentTime = e.data.currentTime

    ctx.save();
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,ctx.canvas.width, ctx.canvas.height);

    const backgroundColourCheck = e.data.backgroundColour
        if (backgroundColourCheck){

      if (backgroundColourCheck.type === 'fill'){
          ctx.fillStyle = backgroundColourCheck.colour
      }else{

        const gradientObject = {
          ...backgroundColourCheck,
          width: ctx.canvas.width,
          height: ctx.canvas.height,
          x: ctx.canvas.width/2,
          y: ctx.canvas.height/2,
        }

       const grad = createCanvasGradient(ctx, gradientObject)

       ctx.fillStyle = grad;

      }
    }

    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    e.data.objects.forEach(object => {
      currentObject = object
      const { cx, cy, angle, scale, opacity } = getAnimatedProps(object);


      if (object.type !== 'image'){
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.scale(scale, scale);
      }


      ctx.save();

      ctx.globalAlpha = opacity;
            ctx.globalCompositeOperation = object.blendMode === 'normal'? "source-over" : object.blendMode; 


      if (object.type === "rectangle") {
        ctx.roundRect(-object.width/ 2, -object.h / 2, object.width, object.h, object.cornerRadius);
      } else if (object.type === "video") {

        if (object.cornerRadiusCoordinates !== null && object.cornerRadiusCoordinates.some(coord => coord.x !== 0 || coord.y !== 0)) {
              ctx.roundRect(
                -object.width / 2,
                -object.h / 2,
                object.width,
                object.h,
                object.cornerRadius || 0
              )

              ctx.clip();

        }

          ctx.drawImage(object.video, -object.width/2, -object.h/2, object.width, object.h);
          object.video.close(); // free bitmap memory
       
      } else if (object.type === "image"){
          if (object.clippingPath){

          const clipCx = (object.clippingPath.left + object.clippingPath.right)/2
          const clipCy = (object.clippingPath.top + object.clippingPath.bottom)/2
     
            ctx.save();
      
            ctx.translate(clipCx + cx, clipCy + cy);
            ctx.rotate(angle);
            ctx.scale(scale, scale);

            ctx.roundRect(
              -(object.clippingPath.right - object.clippingPath.left)/2,
              -(object.clippingPath.bottom - object.clippingPath.top)/2,
               object.clippingPath.right - object.clippingPath.left,
               object.clippingPath.bottom - object.clippingPath.top,
               object.cornerRadius || 0
            )

            ctx.clip();

            ctx.drawImage(
              object.img,
              -object.width / 2 - (object.clippingPath.left + object.clippingPath.right) / 2,
              -object.h / 2 - (object.clippingPath.top + object.clippingPath.bottom) / 2,
              object.width,
              object.h
            );

          ctx.restore();

        }else{

          ctx.translate(cx, cy);
          ctx.rotate(angle);
          ctx.scale(scale, scale);

          if (object.cornerRadiusCoordinates !== null && object.cornerRadiusCoordinates.some(coord => coord.x !== 0 || coord.y !== 0)) {
                ctx.roundRect(
                  -object.width / 2,
                  -object.h / 2,
                  object.width,
                  object.h,
                  object.cornerRadius || 0
                )
                ctx.clip();
          }

          ctx.drawImage(object.img, -object.width/2, -object.h/2, object.width, object.h);
        }
        object.img.close(); // free bitmap memory
        }else if (object.type === "ellipse"){
        ctx.ellipse(0, 0, object.width/ 2, object.h / 2, 0, 0, Math.PI * 2);
      } else if (object.type === "triangle") {
        ctx.beginPath();
        ctx.moveTo(0, -object.h / 2);
        ctx.lineTo(-object.width/2, object.h / 2);
        ctx.lineTo(object.width/2, object.h / 2);
        ctx.closePath();
      
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
            object.textPadding
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
            const fill = style?.fill.colour || object.fill.colour || "#000";
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
              alpha = opacity * animProps.opacity;
            }else{
              alpha = opacity
            }

            ctx.globalAlpha = alpha;
            ctx.fillText(ch, drawX, drawY);

            // Move to next character
            x += ctx.measureText(ch).width;
            charCounter++; // increment global index
          }
        });


      } else if (object.type === "pen"){



        if (!object.points || object.points.length < 2) return;

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);


        drawPen(object.points, object.fill, object.brushSize)

        ctx.restore();



      } else if (object.type === "air brush"){


        if (object.airbrushBuffer){
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          drawBuffer(object.airbrushBuffer, object.brushOpacity)
          ctx.restore();
        }

      } else if (object.type === 'eraser'){
        if (object.eraserBuffer){
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.globalCompositeOperation = "destination-out";
          ctx.globalAlpha = object.eraserOpacity/100;
          ctx.drawImage(object.eraserBuffer, 0, 0);
          ctx.globalAlpha = 1;
          ctx.restore();
        }
      }


      if (object.type !== "pen" && object.type !== "image" && object.type !== "video"){
           if (object?.fill?.type === 'fill'){

              ctx.fillStyle = object.fill.colour
              
            }else{
              
              const gradientObject = {
                ...object.fill,
                width: object.width,
                height: object.h,
                x:0,
                y:0
              }
            const grad = createCanvasGradient(ctx, gradientObject)
            ctx.fillStyle = grad;

        }

       ctx.fill();
      }

      // Then stroke (optional)
      if (object.strokeColour && object.strokeWeight){
        ctx.strokeStyle = object.strokeColour || "black";
        ctx.lineWidth = object.strokeWeight || 0
        ctx.stroke();
      }

      ctx.restore(); // ✅ always restore exactly once per object
    });


    ctx.restore();

    const canvasImage = await createImageBitmap(ctx.canvas);

    postMessage({ type: "CONFIRM", canvasImage }, [canvasImage]);


  }

};

const createCanvasGradient = (ctx, obj) => {
  
  let gradient

  if (obj.gradientType === "linear-gradient"){
      gradient = ctx.createLinearGradient(
          0,
          0,
          Math.cos(obj.angle * Math.PI / 180) * obj.width,
          Math.sin(obj.angle * Math.PI / 180) * obj.height
        );
  }else{

        const radius = Math.max(
          obj.width,
          obj.height
        )

        gradient = ctx.createRadialGradient(
            obj.x,
            obj.y,
            0,
            obj.x,
            obj.y,
            radius
          );
  }


  obj.stops.forEach(stop => {
    gradient.addColorStop(
      stop.offset,
      stop.colour
    );
  });

  return gradient;
};

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

function erase(eraserTexture, d, eraserOpacity, x, y){

  ctx.save();

  ctx.globalCompositeOperation = "destination-out";
  ctx.globalAlpha = eraserOpacity/100;

  ctx.drawImage(eraserTexture, x - d/2, y - d/2);
  ctx.restore();

}

function drawBuffer(airbrushBuffer, brushOpacity){
  ctx.globalAlpha = brushOpacity/100;
  ctx.drawImage(airbrushBuffer, 0, 0);
  ctx.globalAlpha = 1;
}

function drawPen(points, colour, brushSize){

      if (!points || points.length < 2) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.strokeStyle = colour;
      ctx.lineWidth = brushSize;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);

      for (let i = 1; i < points.length - 1; i++) {
        const midX = (points[i].x + points[i + 1].x) / 2;
        const midY = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
      }

      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
      ctx.stroke();
}

function getLineOffset(lineIndex = 0, line, align, ctx, boxWidth, padding) {

  const textWidth = measureTextWidth(line, lineIndex, ctx)

  if (align === "center") {
    return (boxWidth - textWidth) / 2 - padding;
  } else if (align === "right") {
    return boxWidth - textWidth - padding * 2;
  }
  return 0; // left align
}


function measureTextWidth(line, lineIndex, ctx){

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

function measureTextWidthHilight(line, lineIndex, ctx, startCharIndex = 0) {
  ctx.save();
  let textWidth = 0;

  for (let i = 0; i < line.length; i++) {
    const charIndex = startCharIndex + i; // absolute position in the full line
    const ch = line[i];

    const style = currentObject.charStyles?.[`${lineIndex}:${charIndex}`] || {};

    const fontSize = style?.fontSize || currentObject.fontSize;
    const fontWeight = style?.fontWeight || currentObject.fontWeight || "";
    const fontStyle = style?.fontStyle || currentObject.fontStyle || "";
    const fontFamily = style?.fontFamily || currentObject.fontFamily;
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;


    textWidth += ctx.measureText(ch).width;
  }

  ctx.restore();
  return textWidth;
}



const easeInOutCubic = (t) => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

const getAnimatedProps = (element) => {

  if ((!element.animations || element.animations.length === 0)) {
     return {
       cx: element.cx,
       cy: element.cy,
       opacity: element.opacity ?? 1,
       scale: 1,
       angle: element.angle ?? 0
     };
   }



   let props = {
     cx: element.cx,
     cy: element.cy,
     opacity: element.opacity ?? 1,
     scale: 1,
     angle: element.angle ?? 0
   };


 element.animations.forEach(anim => {

   const progress = Math.max(0, Math.min(1, (currentTime - anim.startTime) / anim.duration));

   const easingFn = Easings[anim.easing || 'linear'];
   const  eased = easingFn(progress);

   props.eased = eased
   props.progress = progress

   if (currentTime < anim.startTime) {
      // Set initial state before animation starts
      if (anim.type === 'fadeIn') props.opacity = 0;
      if (anim.type === 'slideInLeft') props.cx = element.x - 300;
      if (anim.type === 'slideInRight') props.cx = element.x + 300;
      if (anim.type === 'slideInTop') props.cy = element.y - 300;
      if (anim.type === 'slideInBottom') props.cy = element.y + 300;
      if (anim.type === 'scaleIn') props.scale = 0;
      return;
    }
   if (currentTime > anim.startTime + anim.duration) {
     // Animation complete

     if (anim.type === 'fadeIn') props.opacity = 1;
     if (anim.type === 'fadeOut') props.opacity = 0;
     if (anim.type === 'slideInLeft') props.cx = element.cx;
     if (anim.type === 'slideInRight') props.cx = element.cx;
     if (anim.type === 'slideInTop') props.cy = element.cy;
     if (anim.type === 'slideInBottom') props.cy = element.cy;
     if (anim.type === 'scaleIn') props.scale = 1;
     if (anim.type === 'scaleOut') props.scale = 0;
     if (anim.type === 'rotate') props.angle = (element.angle ?? 0) + degToRad(360);
     if (anim.type === 'grow') props.scale = 1.5 ; // <-- Add this line

     return;
   }

   switch (anim.type) {
     case 'fadeIn':
       props.opacity = eased;
       break;
     case 'fadeOut':
       props.opacity = 1 - eased;
       break;
     case 'slideInLeft':
       props.cx = element.cx - 300 + (300 * eased);
       break;
     case 'slideInRight':
       props.cx = element.cx + 300 - (300 * eased);
       break;
     case 'slideInTop':
      props.cy = element.cy - 300 + (300 * eased);
       break;
     case 'slideInBottom':
       props.cy = element.cy + 300 - (300 * eased);
       break;
     case 'scaleIn':
       props.scale = eased;
       break;
     case 'scaleOut':
       props.scale = 1 - eased;
       break;
     case 'rotate':
       props.angle = (element.angle ?? 0) + degToRad(360 * eased);
       break;
     case 'pulse':
       props.angle = 1 + Math.sin(eased * Math.PI * 4) * 0.1;
       break;
     case 'bounce':
       const bounceProgress = eased;
       props.cy = element.y - Math.abs(Math.sin(bounceProgress * Math.PI * 3)) * 50 * (1 - bounceProgress);
       break;
     case 'grow':
       // Scale from 1 to 1.5
       props.scale = 1 + 0.5 * eased;
       break;
   }
 });
 return props;
};




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

let fontFiles;
async function getManifest() {
  if (!fontFiles) fontFiles = await fetch('/fonts/manifest.json').then(r => r.json());
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


