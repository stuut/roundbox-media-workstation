'use client'

import { useEffect, useRef, useState } from "react";
import { saveAsPng, saveAsjpg } from "@/lib/save-canvas"
import { SketchPicker } from 'react-color'
import { BufferedBrush } from "@/lib/buffered-brush"
import '@/app/canvas_styles.css'
import { convertMMToPixels } from "@/lib/calculations"

const dpi = 300;
const mmToInch = 1 / 25.4;

const widthMM = 210;
const heightMM = 297;

const widthPx = Math.round(widthMM * mmToInch * dpi);  // 2480
const heightPx = Math.round(heightMM * mmToInch * dpi); // 3508
const BLEED = convertMMToPixels(5, 300);
//const BLEED = 0;


const PAGE_WIDTH = 2480;
const PAGE_HEIGHT = 3508;
const COLOUR = 'rgb(83, 89, 229)'
const HILIGHTCOLOUR = 'rgb(83, 89, 229, 0.3)'

const HANDLE_SIZE = 6;
const ELEMENT_PADDING = 0
const ROTATE_DISTANCE = 40;
const TRANSFORM_COLOUR = COLOUR
const HANDLE_FILL_COLOUR = '#ffffff'
const TRANSFORM_WIDTH = 2
const GUIDES_WIDTH = 1

const defaultFonts = [
  "Arial",
  "Times New Roman",
  "Courier New",
  "Verdana",
  "Georgia",
]



const fonts = [
  {
    label: "Poppins",
    weights: ['100', '200', '300', '400', '700', '800', '900'],
    styles: ['italic','normal']
  },
  {
    label: "Raleway",
    weights: ['100', '200', '300', '400', '700', '800', '900'],
    styles: ['italic','normal']
  },
]



export default function TwoCanvasDesign() {
  const upperRef = useRef(null);
  const lowerRef = useRef(null);
  const overlayRef = useRef(null);
  const toolsRef = useRef(null);
  const guidesRef = useRef(null);
  const textEditRef = useRef(null);
  const isTextEditingRef = useRef(false);
  const artboardRef = useRef(null);
  const bufferRef = useRef(null);
  const bufferCtxRef = useRef(null);
  const deltaRef = useRef(null);
  const deltaCtxRef = useRef(null);
  const overlayCtxRef = useRef(null);
  const drawingRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const lastPointRef = useRef(null);
  const panXRef = useRef(0);
  const panYRef = useRef(0);
  const scaleRef = useRef(1);
  const activeToolRef = useRef(null);
  const bufferedBrushRef = useRef(null)
  const [objects, setObjects] = useState([
    { id: 1, x: 200, y: 200, width: 400, h: 300 }
  ]);


  const objectsRef = useRef([]);

  const [activeTool, setActiveTool] = useState(null); // page -> screen scale
  const [shapeType, setShapeType] = useState(null); // page -> screen scale
  const [paintType, setPaintType] = useState(null); // page -> screen scale
  const [hardness, setHardness] = useState(5); // page -> screen scale

  const [scale, setScale] = useState(1); // page -> screen scale
  const [scalePercentage, setScalePercentage] = useState(null); // page -> screen scale

  const [offset, setOffset] = useState({ x: 0, y: 0 });
//  const [dragging, setDragging] = useState(null);
  const [zoomMode, setZoomMode] = useState("center");
  const [zoomInActive, setZoomInActive] = useState(false); // 1 = 100%
  const [zoomOutActive, setZoomOutActive] = useState(false); // 1 = 100%
  const [pagePosition, setPagePosition] = useState({ x: 400, y: 100 });
  const [activeElement, setActiveElement] = useState(null);
  //const rotationOffset = useRef(0)
  const containerRef = useRef(null)
  const resizingRef = useRef(null)
  const resizingSideRef = useRef(null)
  const rotatingRef = useRef(false)
  const offsetRef = useRef(null)
  const selectedIndexRef = useRef(null)
  const draggingRef = useRef(null);
  const handMode = useRef(false); // spacebar toggles this
  const isPanning = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const topToolbarRef = useRef(null);
  const brushTextureRef = useRef(null)
  const eraserTextureRef = useRef(null)
  const textHilightRef = useRef(false)
  const [fillColour, setFillColour] = useState('rgba(0,0,0,1)');
  const [strokeColour, setStrokeColour] = useState(null);
  const [strokeWeight, setStrokeWeight] = useState(0);
  const isPaintingRef = useState(null);
  const isErasingRef = useState(null);

  // Resize effect
  const [brushSize, setBrushSize] = useState(200)
  const [brushHardness, setBrushHardness] = useState(50);
  const [brushOpacity, setBrushOpacity] = useState(50);
  const [brushFlow, setBrushFlow] = useState(100);
  const [buildOpacity, setBuildOpacity] = useState(true)

  const [eraserSize, setEraserSize] = useState(200)
  const [eraserHardness, setEraserHardness] = useState(50);
  const [eraserOpacity, setEraserOpacity] = useState(50);
  const [activeElementJson, setActiveElementJson] = useState(null)
  const caretVisibleRef =  useRef(false)
  const caretTimer =  useRef(null)


  const [selectedFont, setSelectedFont] = useState(fonts[0].label)
  const [fontWeights, setFontWeights] = useState(fonts[0].weights)
  const [selectedFontWeight, setSelectedFontWeight] = useState(fonts[0].weights[0])
  const [fontStyles, setFontStyles] = useState(fonts[0].styles)
  const [selectedFontStyle, setSelectedFontStyle] = useState(fonts[0].styles[1])

  const [fontSize, setFontSize] = useState(100)


  const [selectedTextAlignment, setSelectedTextAlignment] = useState('left')

  const [selectedTextLineHeight, setSelectedTextLineHeight] = useState(120)



  class Element {
  constructor({
    id,
    x = 0,
    y = 0,
    type = null,
    cx,            // optional — will default to x
    cy,            // optional — will default to y
    width = 100,
    h = 100,
    angle = 0,
    fill = null,
    strokeColour = null,
    strokeWeight = 0,
    opacity = 1,
    text = null,
    maxWidth = 200,
    lineHeight = 18,
    fontFamily,          // optional — will default to `${fontSize}px Arial`
    fontWeight =100,
    fontStyle ='normal',
    fontSize = 18,
    textAlign = 'left',
    lines = [],
    totalHeight = 0,
    points = [],
    brushSize = null,
    brushOpacity = 0,
    brushHardness = 0,
    brushFlow = 0,
    airbrushBuffer = null,
    airBrushTexture = null,
    selectionStart = null,
    selectionEnd = null,
    caretAbsIndex = null,
    imageSrc = null

  } = {}) {
    // Basic properties
    this.id = id;
    this.x = x;
    this.y = y;
    this.type = type;

    // ✅ Auto-calculate if not provided
    this.cx = cx ?? x;
    this.cy = cy ?? y;

    this.width = width;
    this.h = h;
    this.angle = angle;
    this.fill = fill;
    this.strokeColour = strokeColour;
    this.strokeWeight = strokeWeight;
    this.opacity = opacity;

    this.text = text;
    // ✅ Auto-generate font if not supplied
    this.fontFamily = fontFamily || `Arial`;
    this.fontSize = fontSize;
    this.fontWeight = fontWeight
    this.fontStyle = fontStyle
    this.maxWidth = maxWidth;
    this.lineHeight = lineHeight?lineHeight:fontSize;
    this.textPadding = 25;
    this.textAlign = textAlign
    this.charStyles = {}


    this.lines = lines;
    this.totalHeight = totalHeight;
    this.points = points;
    this.brushSize = brushSize;
    this.brushOpacity = brushOpacity;
    this.brushHardness = brushHardness;
    this.brushFlow = brushFlow;
    this.airbrushBuffer = airbrushBuffer;
    this.airBrushTexture = airBrushTexture;
    this.caretAbsIndex = text? text.length : null;
    this.selectionStart = selectionStart;
    this.selectionEnd = selectionEnd;
    this.imageSrc = imageSrc

    // ✅ Only update lines if text exists and canvas context is available
    if (this.text && typeof lowerRef?.current?.getContext === 'function') {

      this.updateLines();
    }

    if (this.imageSrc && typeof lowerRef?.current?.getContext === 'function') {

      this.drawImageInit();
    }
  }

  getLines(){
    return this.lines
  }

  updateLinesWrap() {

    const ctx = lowerRef.current.getContext('2d');
    if (!ctx) return;

    ctx.font = this.font()
    this.lines = [];

    const paragraphs = this.text.split('\n');

    paragraphs.forEach((paragraph, index) => {
      if (paragraph.trim() === '') {
        this.lines.push('');
        return;
      }

      const words = paragraph.split(' ');
      let currentLine = '';
      let lineIndex = this.lines.length; // current line index across paragraphs


      words.forEach((word, wordIndex) => {
        const testLine = currentLine ? currentLine + ' ' + word : word;
        const testLineIndex = lineIndex; // use same line index for measuring
        const testWidth = this.measureTextWidth(testLine, testLineIndex, ctx);

        if (testWidth > this.width && currentLine) {
          // push current line and start new one
          this.lines.push(currentLine);
          lineIndex = this.lines.length; // update line index
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });

      if (currentLine) {
        this.lines.push(currentLine);
      }
    });

  }


  updateLines() {
    const lower = lowerRef.current;
    if (!lower) return;
    const ctx = lower.getContext('2d');
    if (!ctx) return;

    this.lines = [];

    const paragraphs = this.text.split('\n');

    paragraphs.forEach((paragraph, paragraphIndex) => {
      if (paragraph.trim() === '') {
        this.lines.push('');
        return;
      }

      const words = paragraph.split(' ');
      let currentLine = '';
      let lineIndex = this.lines.length; // current line index across paragraphs

      words.forEach((word, wordIndex) => {
        const testLine = currentLine ? currentLine + ' ' + word : word;
        const testLineIndex = lineIndex; // use same line index for measuring
        const testWidth = this.measureTextWidth(testLine, testLineIndex, ctx);

        if (testWidth > this.width && currentLine) {
          // push current line and start new one
          this.lines.push(currentLine);
          lineIndex = this.lines.length; // update line index
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });

      if (currentLine) {
        this.lines.push(currentLine);
      }
    });

    // Compute total height dynamically based on styled lines
    let totalHeight = 0;
    for (let i = 0; i < this.lines.length; i++) {

      console.log('this.measureTextHeight(i, this.lines[i])', this.measureTextHeight(i, this.lines[i]))
      totalHeight += this.measureTextHeight(i, this.lines[i]); // use the earlier helper we discussed
    }

    console.log('this.totalHeight', this.totalHeight)

    this.totalHeight = totalHeight + this.textPadding;
    this.h = this.totalHeight;
    this.cx = this.x + this.width / 2;
    this.cy = this.y + this.totalHeight / 2;
  }



  getCharacterPosition(pos){
    const ctx = lowerRef.current.getContext("2d");
    if (!ctx) return;
    const lineHeight = this.getLineHeight()
    const relY = (pos.y - this.y) / lineHeight;
    const clickedRow = Math.min(Math.floor(relY), this.lines.length - 1);
    const line = this.lines[clickedRow] || "";
    let col = 0;
    for (let i = 1; i <= line.length; i++) {

      const text = line.slice(0, i)
      const width = this.measureTextWidth(text, i, ctx)
      const offsetX = this.getLineOffset(i, line, this.textAlign, ctx, this.width, this.textPadding);

      if (this.x + width + offsetX > pos.x) {
        col = i - 1;
        break;
      }
      col = i;
    }

    return {line: clickedRow, char:col}

  }

  isTextHilighted(){
    const ctx = lowerRef.current.getContext("2d");
    let start = this.selectionStart;
    let end = this.selectionEnd;
    if (!start || !end) return false

    if ( start.line > end.line || (start.line === end.line && start.char > end.char)) {
      [start, end] = [end, start];
    }

    if (JSON.stringify(start) !== JSON.stringify(end)){
      return true
    }else{
      return false
    }


  }


  normalizeSelection(start, end) {
    if (
      start.line > end.line ||
      (start.line === end.line && start.char > end.char)
    ) {
      return { start: end, end: start }; // swap
    }
    return { start, end };
  }



  applyStyleToSelection(style) {
    const { start, end } = this.normalizeSelection(this.selectionStart, this.selectionEnd);

    const lines = this.getLines()

    for (let lineIndex = start.line; lineIndex <= end.line; lineIndex++) {
      const line = lines[lineIndex];
      const charStart = (lineIndex === start.line) ? start.char : 0;
      const charEnd = (lineIndex === end.line) ? end.char : line.length;

      for (let charIndex = charStart; charIndex < charEnd; charIndex++) {
        const key = `${lineIndex}:${charIndex}`;
        this.charStyles[key] = {
          ...(this.charStyles[key] || {}),
          ...style
        };
      }
    }
  }



  getAbsoluteIndex(pos) {
    if (!pos) return 0;
    const { line, char } = pos;
    let abs = 0;
    const lines = this.getLines()
    for (let i = 0; i < line; i++) {
      abs += lines[i].length + 1; // +1 for newline
    }
    return abs + char;
  }




  drawHilightTextArtboard(ctx, scale) {
    ctx.save();


    ctx.font =  this.font();
    ctx.textBaseline = "top";
    const lineHeight = this.getLineHeight() * scale;

    // Normalize selection order
    let start = this.selectionStart;
    let end = this.selectionEnd;
    if (!start || !end) return this.drawTextChars(ctx);

    if (
      start.line > end.line ||
      (start.line === end.line && start.char > end.char)
    ) {
      [start, end] = [end, start];
    }

    const lines = this.getLines();
    // Loop through each line and draw highlights
    lines.forEach((line, index) => {
      if (index < start.line || index > end.line) return;

      const startChar = index === start.line ? start.char : 0;
      const endChar = index === end.line ? end.char : line.length;

      const prefix = line.slice(0, startChar);
      const selected = line.slice(startChar, endChar);

      // Calculate horizontal text alignment offset
      const offsetX = this.getLineOffset(
        index,
        line,
        this.textAlign,
        ctx,
        this.width,
        this.textPadding
      );

      const prefixWidth = this.measureTextWidthHilight(prefix, index, ctx, 0);
      const selectedWidth = this.measureTextWidthHilight(selected, index, ctx, startChar);

      const startX = -this.width / 2 + this.textPadding + offsetX + prefixWidth;
      const startY = (-this.h / 2 + this.textPadding / 2) * scale  + (index * lineHeight);

      const hilightHeight = this.measureTextHeight(index, line)


      ctx.fillStyle = HILIGHTCOLOUR;
      ctx.fillRect(startX * scale, startY, selectedWidth * scale, hilightHeight * scale);
    });
    ctx.restore();

    this.drawTextArtboard(ctx, scale)


  }

  measureTextHeight(lineIndex, line){

      let maxHeight = 0;

      if (line){
        for (let charIndex = 0; charIndex < line.length; charIndex++) {
          const style = this.charStyles?.[`${lineIndex}:${charIndex}`] || {};


          const fontSize = style.fontSize || this.fontSize;
          const lineHeight = style.lineHeight || this.lineHeight || 120;


          const height = lineHeight

          if (height > maxHeight) {
            maxHeight = height;
          }
        }

        return maxHeight;
      }


  }

measureTextWidthHilight(line, lineIndex, ctx, startCharIndex = 0) {
  ctx.save();
  let textWidth = 0;

  for (let i = 0; i < line.length; i++) {
    const charIndex = startCharIndex + i; // absolute position in the full line
    const ch = line[i];

    const style = this.charStyles?.[`${lineIndex}:${charIndex}`] || {};

    const fontSize = style?.fontSize || this.fontSize;
    const fontWeight = style?.fontWeight || this.fontWeight || "";
    const fontStyle = style?.fontStyle || this.fontStyle || "";
    const fontFamily = style?.fontFamily || this.fontFamily;
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;

    textWidth += ctx.measureText(ch).width;
  }

  ctx.restore();
  return textWidth;
}


  measureTextWidth(line, lineIndex, ctx){

    ctx.save()

    let textWidth = 0;


    for (let charIndex = 0; charIndex < line.length; charIndex++) {
      const ch = line[charIndex];
      const style = this.charStyles?.[`${lineIndex}:${charIndex}`] || {};

      const fontSize = style?.fontSize || this.fontSize;
      const fontWeight = style?.fontWeight || this.fontWeight || "";
      const fontStyle = style?.fontStyle || this.fontStyle || "";
      const fontFamily = style?.fontFamily || this.fontFamily;
      ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
      // Measure individual character, not whole line
      textWidth += ctx.measureText(ch).width;
    }

    ctx.restore()

    return textWidth

  }


  drawHilightText(ctx) {
    ctx.save();

    // Apply the same transform used in drawObject()
    ctx.translate(this.cx, this.cy);
    ctx.rotate(this.angle);

    ctx.font =  this.font();
    ctx.textBaseline = "top";
    const lineHeight = this.getLineHeight();

    // Normalize selection order
    let start = this.selectionStart;
    let end = this.selectionEnd;
    if (!start || !end) return this.drawTextChars(ctx);

    if (
      start.line > end.line ||
      (start.line === end.line && start.char > end.char)
    ) {
      [start, end] = [end, start];
    }

    const lines = this.getLines();

    // Loop through each line and draw highlights
    lines.forEach((line, index) => {
      if (index < start.line || index > end.line) return;

      const startChar = index === start.line ? start.char : 0;
      const endChar = index === end.line ? end.char : line.length;

      const prefix = line.slice(0, startChar);
      const selected = line.slice(startChar, endChar);

      // Calculate horizontal text alignment offset
      const offsetX = this.getLineOffset(
        index,
        line,
        this.textAlign,
        ctx,
        this.width,
        this.textPadding
      );


      const prefixWidth = this.measureTextWidthHilight(prefix, index, ctx, 0);
      const selectedWidth = this.measureTextWidthHilight(selected, index, ctx, startChar);

      const startX = -this.width / 2 + this.textPadding + offsetX + prefixWidth;
      const startY = (-this.h / 2 + this.textPadding / 2) + index * lineHeight;

      const hilightHeight = this.measureTextHeight(index, line)

      ctx.fillStyle = HILIGHTCOLOUR;
      ctx.fillRect(startX, startY, selectedWidth, hilightHeight);
    });
    ctx.restore();


    this.drawTextChars(ctx)


  }

font(){
  return `${this.fontStyle || ""} ${this.fontWeight || ""} ${this.fontSize}px ${this.fontFamily}`
}


async drawImageInit() {
  return new Promise((resolve, reject) => {
    const ctx = lowerRef.current.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = this.imageSrc;

    img.addEventListener("load", () => {
      this.img = img; // ✅ store image reference
      this.width = img.naturalWidth;
      this.h = img.naturalHeight;
      this.originalWidth = img.naturalWidth
      this.originalHeight = img.naturalHeight

      ctx.drawImage(
        img,
        this.cx - this.width / 2,
        this.cy - this.h / 2,
        this.width,
        this.h
      );

      resolve(true);
    });

    img.addEventListener("error", reject);
  });
}





redrawImage(ctx) {
  ctx.save();
      ctx.translate(this.cx, this.cy);
      ctx.rotate(this.angle || 0);
      ctx.drawImage(
        this.img,
        -this.width / 2,
        -this.h / 2,
        this.width,
        this.h
      );
  ctx.restore();
}

redrawImageArtboard(ctx, scale) {

      ctx.drawImage(
        this.img,
        (-this.width / 2) * scale,
        (-this.h / 2) * scale,
        this.width * scale,
        this.h * scale
      );
}

drawTextArtboard(ctx, scale) {

  ctx.save();
  ctx.textBaseline = "alphabetic";

  const lines = this.getLines();
  const lineHeight = this.getLineHeight() * scale;

  lines.forEach((line, lineIndex) => {

    const lineOffset = this.getLineOffset(
      lineIndex,
      line,
      this.textAlign,
      ctx,
      this.width,
      this.textPadding
    )

    let x = (lineOffset -this.width / 2 + this.textPadding) * scale;

    const style = this.charStyles?.[`${lineIndex}:0`] || {};
    const fontSize = style?.fontSize || this.fontSize;
    const baselineOffset = (fontSize * 0.8) * scale; // approximate distance from top to baseline

    const y = (-this.h / 2 + this.textPadding) * scale + (lineIndex * lineHeight + baselineOffset) ;

    // Draw each character individually with its style
    for (let charIndex = 0; charIndex < line.length; charIndex++) {
      const ch = line[charIndex];
      const style = this.charStyles?.[`${lineIndex}:${charIndex}`] || {};

      const fontSize = style?.fontSize || this.fontSize;
      const fontWeight = style?.fontWeight || this.fontWeight || "";
      const fontStyle = style?.fontStyle || this.fontStyle || "";
      const fontFamily = style?.fontFamily || this.fontFamily;
      const fill = style?.fill || this.fill || "#000";

      ctx.font = `${fontStyle} ${fontWeight} ${fontSize  * scale}px ${fontFamily}`;
      ctx.fillStyle = fill;
      ctx.fillText(ch, x, y);

      // Move X to next character
      x += ctx.measureText(ch).width;
    }

  });

ctx.restore();
}

getLineHeight(){
  return this.lineHeight
}


drawTextChars(ctx) {

  ctx.save();
  ctx.translate(this.cx, this.cy);
  ctx.rotate(this.angle);
  ctx.textBaseline = "alphabetic";

  const lines = this.getLines();
  const lineHeight = this.getLineHeight()

  lines.forEach((line, lineIndex) => {
    // Calculate X offset for line alignment
    const lineOffset = this.getLineOffset(
      lineIndex,
      line,
      this.textAlign,
      ctx,
      this.width,
      this.textPadding
    );

    let x = lineOffset -this.width / 2 + this.textPadding ;

    const style = this.charStyles?.[`${lineIndex}:0`] || {};
    const fontSize = style?.fontSize || this.fontSize;
    const baselineOffset = fontSize * 0.8; // approximate distance from top to baseline

    const y = -this.h / 2 + this.textPadding + lineIndex * lineHeight + baselineOffset;

    // Draw each character individually with its style
    for (let charIndex = 0; charIndex < line.length; charIndex++) {
      const ch = line[charIndex];
      const style = this.charStyles?.[`${lineIndex}:${charIndex}`] || {};

      const fontSize = style?.fontSize || this.fontSize;
      const fontWeight = style?.fontWeight || this.fontWeight || "";
      const fontStyle = style?.fontStyle || this.fontStyle || "";
      const fontFamily = style?.fontFamily || this.fontFamily;
      const fill = style?.fill || this.fill || "#000";

      ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
      ctx.fillStyle = fill;
      ctx.fillText(ch, x, y);
      // Move X to next character
      x += ctx.measureText(ch).width;
    }
  });

  ctx.restore();
}





drawText(ctx) {

  ctx.save();
  ctx.translate(this.cx, this.cy);
  ctx.rotate(this.angle);

  ctx.font = this.font()
  ctx.textBaseline = "top";
  ctx.textAlign = this.textAlign || "left"; // e.g., "center", "right", etc.

  const lines = this.getLines();
  const lineHeight = this.getLineHeight()

  // Top-left corner relative to the pivot
  const offsetX = -this.width / 2 + this.textPadding;
  const offsetY = -this.h / 2 + this.textPadding;

  lines.forEach((line, i) => {
    const y = offsetY + i * lineHeight;
    let x = offsetX;
    // Align text properly relative to alignment
    if (this.textAlign === "center") x = 0;
    else if (this.textAlign === "right") x = this.width / 2 - this.textPadding;

    ctx.fillText(line, x, y);
  });

  ctx.restore();
}

getLineOffset(lineIndex = 0, line, align, ctx, boxWidth, padding) {

  const textWidth = this.measureTextWidth(line, lineIndex, ctx)

  if (align === "center") {
    return (boxWidth - textWidth) / 2 - padding;
  } else if (align === "right") {
    return boxWidth - textWidth - padding * 2;
  }
  return 0; // left align
}

  // --- Helper: map absolute caret index → (line, column)
  getCaretPosFromIndex(index) {
    let count = 0;
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      if (index <= count + line.length) {
        return { row: i, col: index - count };
      }
      count += line.length + 1; // +1 for implicit newline
    }
    return { row: this.lines.length - 1, col: this.lines.at(-1).length };
  }

  // --- Helper: map (line, column) → absolute index
  getIndexFromCaretPos(row, col) {
    let count = 0;
    for (let i = 0; i < row; i++) count += this.lines[i].length + 1;
    return Math.min(count + col, this.text.length);
  }

  getAbsIndexFromLineChar(line, char) {
    let count = 0;
    for (let i = 0; i < line; i++) count += this.lines[i].length + 1; // +1 for newline
    return count + char;
  }

  containsPoint(x, y) {
      return x >= this.x - 4 &&
             x <= this.x + this.totalWidth + 4 &&
             y >= this.y - this.fontSize - 2 &&
             y <= this.y + this.totalHeight - this.fontSize + 4;
  }

  insertTextAtCaret(insertedText) {

    // If there is a selection, delete it first
    if (this.selectionStart && this.selectionEnd) {
      this.deleteSelectedText();
    }

    // Insert new text at caret position
    const before = this.text.slice(0, this.caretAbsIndex);
    const after = this.text.slice(this.caretAbsIndex);
    this.text = before + insertedText + after;

    // Move caret after inserted text
    this.caretAbsIndex += insertedText.length;

    // Clear any selection
    this.selectionStart = this.selectionEnd = null;


    // Update lines and redraw
    this.updateLines();
}

handleBackspace() {
  // If there is a selection, delete it entirely
  if (this.selectionStart && this.selectionEnd) {
    this.deleteSelectedText();
    return;
  }

  // If nothing to delete
  if (this.caretAbsIndex <= 0) return;

  // Remove the character before the caret
  const before = this.text.slice(0, this.caretAbsIndex - 1);
  const after = this.text.slice(this.caretAbsIndex);
  this.text = before + after;

  // Move caret left
  this.caretAbsIndex -= 1;

  // Update lines and redraw
  this.updateLines();
}

handleDelete() {
  // Delete selection if present
  if (this.selectionStart && this.selectionEnd) {
    this.deleteSelectedText();
    return;
  }

  // Nothing to delete
  if (obj.caretAbsIndex >= obj.text.length) return;

  const before = obj.text.slice(0, obj.caretAbsIndex);
  const after = obj.text.slice(obj.caretAbsIndex + 1);
  this.text = before + after;

  this.updateLines();
}



  deleteSelectedText() {
    if (!this.selectionStart || !this.selectionEnd) return;

    // Compute absolute indices for both selection points
    const lines = this.getLines()
    let absStart = 0, absEnd = 0;

    for (let i = 0; i < lines.length; i++) {
      if (i < this.selectionStart.line) absStart += lines[i].length + 1;
      if (i < this.selectionEnd.line) absEnd += lines[i].length + 1;
    }
    absStart += this.selectionStart.char;
    absEnd += this.selectionEnd.char;

    if (absStart > absEnd) [absStart, absEnd] = [absEnd, absStart];

    // Perform the deletion
      this.text = this.text.slice(0, absStart) + this.text.slice(absEnd);

    // Update caret and clear selection
      this.caretAbsIndex = absStart;
    this.selectionStart = this.selectionEnd = null;

      this.updateLines();
  }

  handleEnter() {
    this.insertTextAtCaret("\n");
  }

  updateMaxWidth(newMaxWidth) {
      this.maxWidth = newMaxWidth;
      this.updateLines();
  }

  hitObject(obj, mx, my) {
    const dx = mx - obj.cx;
    const dy = my - obj.cy;

    const cos = Math.cos(-obj.angle);
    const sin = Math.sin(-obj.angle);
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;

    return (
      localX >= -obj.width/ 2 &&
      localX <= obj.width/ 2 &&
      localY >= -obj.h / 2 &&
      localY <= obj.h / 2
    );
  }
}

const addImageLoad = () => {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = "/shared-assets/images/examples/rhino.jpg";
  const canvas = lowerRef.cuurent;
  const ctx = canvas.getContext("2d");
  img.addEventListener("load", () => {
    ctx.drawImage(img, 0, 0);
    img.style.display = "none";
  });
}

const addImage = async () => {

  const newObj =  new Element({
    id: objectsRef.current.length+1,
    //x:lowerRef.current.width/2,
    //y:lowerRef.current.height/2,
    cx:lowerRef.current.width/2,
    cy:lowerRef.current.height/2,
    imageSrc : '/sample_image.jpg',
    lineHeight : 1.2,
    type:'image',
  })

  objectsRef.current.push(newObj);
  selectedIndexRef.current = objectsRef.current.length - 1

  const lower = lowerRef.current;
  if (!lower) return;
  const ctx = lower.getContext("2d");

  await newObj.drawImageInit(ctx)

  setActiveElement(newObj)

  drawUpper();

}

const redrawAll = () => {
  drawLower();
  drawUpper();
  drawArtboard();
}


const addText = () => {

  const newObj =  new Element({
    id: objectsRef.current.length+1,
    x:lowerRef.current.width/2,
    y:lowerRef.current.height/2,
    //cx:lowerRef.current.width/2,
    //cy:lowerRef.current.height/2,
    fontFamily:selectedFont,
    fontSize:fontSize,
    text:'New text\nanother line',
    fill:fillColour,
    textAlign:selectedTextAlignment,
    width : 500,
    lineHeight : selectedTextLineHeight,
    type:'text',
  })

 objectsRef.current.push(newObj);
 selectedIndexRef.current = objectsRef.current.length - 1

 const lower = lowerRef.current;
 if (!lower) return;
 const ctx = lower.getContext("2d");

 newObj.drawTextChars(ctx)

 setActiveElement(newObj)

 drawUpper();

}


useEffect(()=>{

  if (activeElement){
    setActiveElementJson({...activeElement})

    if (activeElement.type === 'text'){
      if (activeElement.fontFamily){
        setSelectedFont(activeElement.fontFamily)
      }

      if (activeElement.fontWeight){
        setSelectedFontWeight(activeElement.fontWeight)
      }

      if (activeElement.fontStyle){
        setSelectedFontStyle(activeElement.fontStyle)
      }

      if (activeElement.fontSize){
        setFontSize(activeElement.fontSize)
      }

    }


  }else{
    setActiveElementJson(null)
  }



},[activeElement])

function updateToolBarPosition(obj){
  setActiveElementJson({...obj})
}



  const resize = (size='scale to fit', paddingFactor = 0.85) => {
    const artboard = artboardRef.current;
    const upper = upperRef.current;
    const cursor = toolsRef.current;
    const guides = guidesRef.current;

    const lower = lowerRef.current;
    const topToolbar = topToolbarRef.current
    const container = containerRef.current
    const canvasContainer = canvasContainerRef.current

    if (!upper || !lower || !topToolbar || !container || !guides) return;

    const containerWidth = container.offsetWidth
    const containerHeight = container.offsetHeight - topToolbar.offsetHeight
    //set size of upper canvas and artboard to fullsize
    upper.width = containerWidth;
    upper.height = containerHeight;

    cursor.width = containerWidth;
    cursor.height = containerHeight;

    guides.width = containerWidth;
    guides.height = containerHeight;

    artboard.width = containerWidth;
    artboard.height = containerHeight


    let displayWidth = PAGE_WIDTH + (BLEED * 2);
    let displayHeight = PAGE_HEIGHT + (BLEED * 2);

    const scaleX = containerWidth / displayWidth;
    const scaleY = containerHeight / displayHeight;

    const scaleToFit = Math.min(scaleX, scaleY);
    const scaleToCover = Math.max(scaleX, scaleY);

    let scaleMaths

    if (size === 'scale to fit') {
      scaleMaths = Math.min(scaleX, scaleY) * paddingFactor; // <-- add padding
    } else if (size === 'scale to cover') {
      scaleMaths = Math.max(scaleX, scaleY);
    }

    displayWidth *= scaleMaths ;
    displayHeight *= scaleMaths ;

    const left = (containerWidth - displayWidth) / 2;
    const top = (containerHeight - displayHeight) / 2 + topToolbar.offsetHeight;

    canvasContainer.style.left = `${left}px`;
    canvasContainer.style.top = `${top}px`;

    setScale(scaleMaths);
    scaleRef.current = scaleMaths

    setOffset({
      x: left,
      y: top
    })
    offsetRef.current={
      x: left,
      y: top
    };

  };

  useEffect(() => {
      setScalePercentage(Math.ceil((scale)*100))
  }, [scale]);



  useEffect(() => {
  window.addEventListener("resize", () => resize());
    resize('scale to fit');
    return () => window.removeEventListener("resize", resize);
  }, []);


  const drawArtboard = () => {
    const artboard = artboardRef.current;
    const offset = offsetRef.current
    const cursor = toolsRef.current;


    if (!artboard) return;

    const ctx = artboard.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    ctx.clearRect(0, 0, artboard.width, artboard.height);
    ctx.save();

    if (isPanning.current) {
      ctx.translate(panXRef.current, panYRef.current);
    }

    objectsRef.current.forEach(obj => {
      const {cx, cy, width, h, angle, fill  } = obj;

      ctx.save(); // fresh per object
      ctx.translate(offset.x + cx * scale , offset.y + cy * scale);   // move to object center
      ctx.rotate(angle);    // apply rotation

      ctx.beginPath();
      if (obj.type === "rectangle") {
        // Rectangle: draw centered rect
        ctx.rect((-obj.width/ 2) * scale, (-obj.h / 2) * scale, obj.width * scale, obj.h * scale);
      } else if (obj.type === "ellipse") {
        // Ellipse: radii are half width/height
        ctx.ellipse(0, 0, obj.width/ 2 * scale, obj.h / 2 * scale, 0, 0, Math.PI * 2);
      } else if (obj.type === "triangle"){
        ctx.rect((-obj.width/ 2) * scale, (-obj.h / 2) * scale, obj.width * scale, obj.h * scale); // centered at (0,0)

      } else if (obj.type === "text"){

        if (textHilightRef.current){
          obj.drawHilightTextArtboard(ctx, scale)

        }else{
          obj.drawTextArtboard(ctx, scale)

        }


      }else if (obj.type === "image"){
          obj.redrawImageArtboard(ctx, scale)
      }
      ctx.closePath();

      ctx.fillStyle = obj.fill || "lightgray";
      ctx.fill();
      // Then stroke (optional)
      if (obj.strokeColour && obj.strokeWeight){
        ctx.strokeStyle = obj.strokeColour || "black";
        ctx.lineWidth = obj.strokeWeight || 0
        ctx.stroke();
      }
      ctx.restore();
    });
    ctx.restore();
  }

  const drawGuides = () => {

    const guides = guidesRef.current;
    if (!guides) return;

    const ctx = guides.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    ctx.clearRect(0, 0, guides.width, guides.height);



    const offset = offsetRef.current;

    const scaledWidth = PAGE_WIDTH * scale
    const scaledHeight = PAGE_HEIGHT * scale

    ctx.strokeStyle = TRANSFORM_COLOUR;
    ctx.lineWidth = GUIDES_WIDTH;

    ctx.strokeRect(
      offset.x + BLEED * scale,
      offset.y + BLEED * scale,
      scaledWidth,
      scaledHeight
    );

  }

  // Draw upper canvas overlay
const drawUpper = () => {
  const upper = upperRef.current;
  if (!upper) return;

  const selectedIndex = selectedIndexRef.current;

  const ctx = upper.getContext("2d");
  ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform

  ctx.clearRect(0, 0, upper.width, upper.height);
  ctx.save();

  if (selectedIndex != null) {

    const object = objectsRef.current[selectedIndex];


    /*

    if (object.type === 'text'){
      object.updateLines()
    }
    */

    const offset = offsetRef.current;

    if (object.type !== 'pen' && object.type !== 'air brush'){

    const { cx, cy, width, h, angle } = object;
    // Apply global pan + zoom
    const screenCx = offset.x + cx * scale;
    const screenCy = offset.y + cy * scale;

    const screenW = width * scale
    const screenH = h * scale

    ctx.save();
    ctx.translate(screenCx, screenCy);
    ctx.rotate(angle);

    // Draw bounding box centered at (0,0)
    ctx.strokeStyle = TRANSFORM_COLOUR;
    ctx.lineWidth = TRANSFORM_WIDTH;
    ctx.strokeRect(-screenW / 2, -screenH / 2, screenW, screenH);

    // Draw corner handles (in local space)
    const corners = [
      { x: -screenW / 2, y: -screenH / 2, type:'corner' }, // top-left
      { x:  screenW / 2, y: -screenH / 2, type:'corner' }, // top-right
      { x: -screenW / 2, y:  screenH / 2, type:'corner' }, // bottom-left
      { x:  screenW / 2, y:  screenH / 2, type:'corner' }, // bottom-right
      { x:  -screenW / 2, y:  0, type:'side-left' }, // left
      { x:  screenW / 2, y:  0, type:'side-right' }, // right
      { x:  0, y:  -screenH / 2, type:'side-top' }, // top
      { x:  0, y:  screenH / 2, type:'side-bottom' }, // bottom
    ];

    corners.forEach((c, index) => {
      ctx.fillStyle = index === 0 ? HANDLE_FILL_COLOUR : HANDLE_FILL_COLOUR;

      if (c.type === 'corner'){

        ctx.fillRect(
          c.x - HANDLE_SIZE,
          c.y - HANDLE_SIZE,
          HANDLE_SIZE * 2,
          HANDLE_SIZE * 2
        );
        ctx.strokeRect(
          c.x - HANDLE_SIZE,
          c.y - HANDLE_SIZE,
          HANDLE_SIZE * 2,
          HANDLE_SIZE * 2
        );

        /*
        ctx.fillStyle = `rgba(${255},${255},${255},1)`;
        ctx.beginPath();
        ctx.arc(c.x, c.y, HANDLE_SIZE*2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
        */
      }else if (c.type === 'side-right' || c.type === 'side-left'){
        ctx.fillRect(
          c.x - HANDLE_SIZE,
          c.y - HANDLE_SIZE * 4,
          HANDLE_SIZE * 2,
          HANDLE_SIZE * 8
        );
        ctx.strokeRect(
          c.x - HANDLE_SIZE,
          c.y - HANDLE_SIZE * 4,
          HANDLE_SIZE * 2,
          HANDLE_SIZE * 8
        );
      }else if (c.type === 'side-top' || c.type === 'side-bottom'){
        ctx.fillRect(
          c.x - HANDLE_SIZE * 4,
          c.y - HANDLE_SIZE,
          HANDLE_SIZE * 8,
          HANDLE_SIZE * 2
        );
        ctx.strokeRect(
          c.x - HANDLE_SIZE * 4,
          c.y - HANDLE_SIZE,
          HANDLE_SIZE * 8,
          HANDLE_SIZE * 2
        );
      }
    });
    // Draw rotate handle: top-center + distance
    ctx.beginPath();
    ctx.arc(0, +screenH / 2 + ROTATE_DISTANCE, HANDLE_SIZE * 2, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
    }
  }

  ctx.restore();
};


  // Draw lower canvas (full resolution)
  const drawLower = () => {
    const lower = lowerRef.current;
    if (!lower) return;
    const ctx = lower.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    ctx.clearRect(0, 0, PAGE_WIDTH + (BLEED*2), PAGE_HEIGHT + (BLEED*2));
    ctx.save();

    if (isPanning.current) {
      ctx.translate(panXRef.current, panYRef.current);
    }

    objectsRef.current.forEach(object => {
      drawObject(ctx, object);
    });

    ctx.restore();
  };

  function drawObject(ctx, obj) {
      ctx.save();
      ctx.beginPath(); // 🟢 Always begin a new path for each object

      if (obj.type === "rectangle") {
        ctx.translate(obj.cx, obj.cy);
        ctx.rotate(obj.angle);
        // Rectangle: draw centered rect
        ctx.rect(-obj.width/ 2, -obj.h / 2, obj.width, obj.h);
      } else if (obj.type === "ellipse") {
        ctx.translate(obj.cx, obj.cy);
        ctx.rotate(obj.angle);
        ctx.ellipse(0, 0, obj.width/ 2, obj.h / 2, 0, 0, Math.PI * 2);
      } else if (obj.type === "triangle"){
        ctx.translate(obj.cx, obj.cy);
        ctx.rotate(obj.angle);
        ctx.moveTo(0, -obj.h / 2);
        ctx.lineTo(-obj.width/2, obj.h / 2);
        ctx.lineTo(obj.width/2, obj.h / 2);

      }else if (obj.type === "pen"){
           drawPen(ctx, obj.points, obj.fill, obj.brushSize);
           return;
      }else if (obj.type === "air brush"){
          if (obj.airbrushBuffer){
            ctx.globalAlpha = obj.brushOpacity/100;
            ctx.drawImage(obj.airbrushBuffer, 0, 0);
            ctx.globalAlpha = 1;
          }
          ctx.restore();
          return;
      }else if (obj.type === "text"){

        if (textHilightRef.current){
          obj.drawHilightText(ctx)
        }else{
          obj.drawTextChars(ctx)
        }

        ctx.restore();
        return;
      }else if (obj.type === "image"){
        obj.redrawImage(ctx)
        ctx.restore();
        return;
      }

      ctx.closePath();
      // Fill first

      if (obj.type !== "pen"){
        ctx.fillStyle = obj.fill || "lightgray";
        ctx.fill();
      }

      // Then stroke (optional)
      if (obj.strokeColour && obj.strokeWeight){
        ctx.strokeStyle = obj.strokeColour || "black";
        ctx.lineWidth = obj.strokeWeight || 0
        ctx.stroke();
      }

      ctx.restore();
}

useEffect(() => {
  drawGuides()
}, [scale, offset]);

  // Redraw when objects, scale, offset, or zoom changes
  useEffect(() => {
    drawLower();
  }, [scale, offset]);


  useEffect(() => {
    console.log('scale', scale)
     drawArtboard();
  }, [scale, offset])


  // Redraw when objects, scale, offset, or zoom changes
  useEffect(() => {
    drawUpper();
  }, [scale, offset]);



  const zoomIn = (mouseX, mouseY) => {
    setZoom(prev => prev * SCALE_FACTOR)
    //panXRef.current -= (mouseX - panXRef.current) * (SCALE_FACTOR - 1);
  //  panYRef.current -= (mouseY - panYRef.current) * (SCALE_FACTOR - 1);
  }

  const checkRotateHandleHit = (object, mouseX, mouseY) => {
    const x = object.x;
    const y = object.y;
    const width = object.width;
    const h = object.h;


    const cx = x + width / 2;
    const cy = y + h / 2;


    const offsetX = 0;
    const offsetY = +ROTATE_DISTANCE/scale + (object.h/2);


    const cos = Math.cos(object.angle);
    const sin = Math.sin(object.angle);

    // rotate handle into world coordinates
    const handleX = object.cx + offsetX * Math.cos(object.angle) - offsetY * Math.sin(object.angle);
    const handleY = object.cy + offsetX * Math.sin(object.angle) + offsetY * Math.cos(object.angle);

    //addToRectangletoCanvas(x, y, w, h)

    //addToCircleCanvas(handleX, handleY, HANDLE_SIZE * 2 / scale, "blue")

    // check distance from mouse
    const dx = mouseX - handleX;
    const dy = mouseY - handleY;
    const hit = Math.sqrt(dx*dx + dy*dy) <= HANDLE_SIZE * 2 / scale; // circle hit

  return hit
};

const getHandlePolygons = (object) => {
  const { x, y, cx, cy, angle } = object;

  let {width, h} = object;

  //w = w+ELEMENT_PADDING
  //h = h+ELEMENT_PADDING

  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const localCorners = [
    { x: -width / 2, y: -h / 2 }, // top-left
    { x:  width / 2, y: -h / 2 }, // top-right
    { x: -width / 2, y:  h / 2 }, // bottom-left
    { x:  width / 2, y:  h / 2 }  // bottom-right
  ];

  const half = HANDLE_SIZE / scale;
  const localRect = [
    { x: -half, y: -half },
    { x:  half, y: -half },
    { x:  half, y:  half },
    { x: -half, y:  half }
  ];

  // For each corner → build its rotated rect
  return localCorners.map(corner => {
    const cornerX = cx + corner.x * cos - corner.y * sin;
    const cornerY = cy + corner.x * sin + corner.y * cos;

    return localRect.map(p => ({
      x: cornerX + p.x * cos - p.y * sin,
      y: cornerY + p.x * sin + p.y * cos
    }));
  });
};

const getSideHandlePolygonsOld = (object) => {
  const { x, y, cx, cy, width, h, angle } = object;

  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const localCorners = [
    { x: -width / 2, y: 0 }, // left
    { x:  width / 2, y: 0 }, // right
    { x: 0, y: -h / 2 },  // top
    { x: 0, y:  h / 2 }  // bottom
  ];

  const half = HANDLE_SIZE / scale;

  const localRect = [
    { x: -half, y: -half }, // left
    { x:  half, y: -half }, // right
    { x:  half, y:  half }, // top
    { x: -half, y:  half } // bottom
  ];

  // For each corner → build its rotated rect
  return localCorners.map(corner => {
    const cornerX = cx + corner.x * cos - corner.y * sin;
    const cornerY = cy + corner.x * sin + corner.y * cos;

    return localRect.map(p => ({
      x: cornerX + p.x * cos - p.y * sin,
      y: cornerY + p.x * sin + p.y * cos
    }));
  });
};

const getSideHandlePolygons = (object) => {
  const { cx, cy, width, h, angle } = object;

  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  // Four side positions (centers)
  const sideCenters = [
    { name: 'side-left',   x: -width / 2, y: 0 },
    { name: 'side-right',  x:  width / 2, y: 0 },
    { name: 'side-top',    x: 0, y: -h / 2 },
    { name: 'side-bottom', x: 0, y:  h / 2 }
  ];

  // Convert local → global, build the rectangular polygon for each side
  return sideCenters.map(side => {
    // Define local rectangle size based on side type
    let w, hh;
    if (side.name === 'side-left' || side.name === 'side-right') {
      w = HANDLE_SIZE * 2 / scale;
      hh = HANDLE_SIZE * 8 / scale;
    } else {
      w = HANDLE_SIZE * 8 / scale;
      hh = HANDLE_SIZE * 2 / scale;
    }

    // Rectangle corners in local coords (centered on side)
    const localRect = [
      { x: -w / 2, y: -hh / 2 },
      { x:  w / 2, y: -hh / 2 },
      { x:  w / 2, y:  hh / 2 },
      { x: -w / 2, y:  hh / 2 }
    ];

    // Compute the world-space center of this side handle
    const cornerX = cx + side.x * cos - side.y * sin;
    const cornerY = cy + side.x * sin + side.y * cos;

    // Rotate and translate all rectangle corners
    const polygon = localRect.map(p => ({
      x: cornerX + p.x * cos - p.y * sin,
      y: cornerY + p.x * sin + p.y * cos
    }));

    return { name: side.name, polygon };
  });
};

const checkResizeHandleHit = (object, mouseX, mouseY) => {
  const polygons = getHandlePolygons(object);

  for (let i = 0; i < polygons.length; i++) {
    if (hitPolygon(mouseX, mouseY, polygons[i])) {
      return i;
    }
  }

  return null;
};

const checkResizeSideHandleHit = (object, mouseX, mouseY) => {
  //const polygons = getSideHandlePolygonsOld(object);

  const polygons = getSideHandlePolygons(object);

  for (let i = 0; i < polygons.length; i++) {

    if (hitPolygon(mouseX, mouseY, polygons[i].polygon)) {
      return i;
    }

  }

  return null;
};

const renderCornersDetection = (object) => {
  const polygons = getHandlePolygons(object, scale);

   const lower = lowerRef.current;
   if (!lower) return;
   const ctx = lower.getContext("2d");

   polygons.forEach((poly, index) => {
     ctx.beginPath();
     ctx.moveTo(poly[0].x, poly[0].y);
     for (let i = 1; i < poly.length; i++) {
       ctx.lineTo(poly[i].x, poly[i].y);
     }
     ctx.closePath();

     ctx.fillStyle = index === 0 ? "rgba(0,0,255,0.3)" : "rgba(255,255,255,0.3)";
     ctx.fill();
     ctx.strokeStyle = "red";
     ctx.stroke();
 });

}




  const addToRectangletoCanvas = (x, y, width, h) => {

    const lower = lowerRef.current;
    if (!lower) return;
    const ctx = lower.getContext("2d");
    ctx.fillStyle = "green"
    ctx.fillRect(x, y, width, h);

  }



  const addToCircleCanvas = (x, y, radius, color) => {

    const lower = lowerRef.current;
    if (!lower) return;
    const ctx = lower.getContext("2d");
    ctx.fillStyle = color
    ctx.strokeStyle = color; // Sets the stroke color to blue
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.stroke();

  }


function hitPolygon(px, py, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;

    const intersect = ((yi > py) !== (yj > py)) &&
                      (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}



  const hitCircle = (circleX, circleY, radius, mouseX, mouseY) => {
    //
    //addToCircleCanvas(mouseX, mouseY, radius, "red")
    const dx = mouseX - circleX;
    const dy = mouseY - circleY;
    return dx * dx + dy * dy <= radius * radius;
  };

  const hitObject = (obj, mx, my) => {
    // Translate mouse into object's local space
    const dx = mx - obj.cx;
    const dy = my - obj.cy;

    // Undo rotation
    const cos = Math.cos(-obj.angle);
    const sin = Math.sin(-obj.angle);
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;

    // Check inside axis-aligned rectangle in local space
    return (
      localX >= -obj.width/ 2 &&
      localX <= obj.width/ 2 &&
      localY >= -obj.h / 2 &&
      localY <= obj.h / 2
    );
  };

  const hitHandle = (obj, mx, my) => {
    const corners = [
      { x: obj.x, y: obj.y },
      { x: obj.x + obj.width, y: obj.y },
      { x: obj.x, y: obj.y + obj.h },
      { x: obj.x + obj.width, y: obj.y + obj.h },
    ];
    for (let i = 0; i < corners.length; i++) {
      const c = corners[i];
      if (mx >= c.x - HANDLE_SIZE && mx <= c.x + HANDLE_SIZE &&
          my >= c.y - HANDLE_SIZE && my <= c.y + HANDLE_SIZE) return i;
    }
    return -1;
  };

  const getMousePos = e => {

    if (offsetRef.current === null) return

    const rect = upperRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const offset = offsetRef.current

    //setLeft((mouseX - offset.x) / scale)
    return { x: (mouseX - offset.x) / scale, y: (mouseY - offset.y) / scale };
  };

  // Mouse events
  const handleMouseDown = (e) => {

    const pos = getMousePos(e);
    const tool = activeToolRef.current
    if (!pos) return

    if (isTextEditingRef.current){
      //textHilightRef.current = true

      const object = getActiveElement()

      if (hitObject(object, pos.x, pos.y)) {


        lastPointRef.current = pos
        const position = object.getCharacterPosition(pos)

        object.selectionStart = object.getCharacterPosition(pos)
        object.selectionEnd = object.getCharacterPosition(pos)
        // convert (row, col) → absolute caret index
        object.caretAbsIndex = object.getIndexFromCaretPos(position.line, position.char);
        // re-sync and re-focus hidden input
          syncInputCaret(object);
          textEditRef.current.focus();
          requestAnimationFrame(() => textEditRef.current.focus());

          startCaretBlink();
      }
      return;
    }

    if (handMode.current) {
      isPanning.current = true;
      lastPos.current = { x: e.clientX, y: e.clientY };
    }else if (tool === 'size-position') {
      // resize handles
      for (let i = objectsRef.current.length - 1; i >= 0; i--) {
        const handle = checkResizeHandleHit(objectsRef.current[i], pos.x, pos.y);
        if (handle !== null) {
          resizingRef.current = { index: i, corner: handle }
          selectedIndexRef.current = i
          return;
        }
      }
      // side handles
      for (let i = objectsRef.current.length - 1; i >= 0; i--) {
        const handle = checkResizeSideHandleHit(objectsRef.current[i], pos.x, pos.y);
        if (handle !== null) {
          resizingSideRef.current = { index: i, side: handle }
          selectedIndexRef.current = i
          return;
        }
      }
      // rotate
      for (let i = objectsRef.current.length - 1; i >= 0; i--) {
          if (checkRotateHandleHit(objectsRef.current[i], pos.x, pos.y)) {
            const startAngle = Math.atan2(pos.y - objectsRef.current[i].y, pos.x - objectsRef.current[i].x );
            rotatingRef.current = {offset:objectsRef.current[i].angle - Math.atan2(pos.y - objectsRef.current[i].cy, pos.x - objectsRef.current[i].cx)}
            selectedIndexRef.current = i
            return;
          }
      }
      // object selection (topmost first)
      for (let i = objectsRef.current.length - 1; i >= 0; i--) {

        if (hitObject(objectsRef.current[i], pos.x, pos.y)) {
            setActiveElement(objectsRef.current[i])
            selectedIndexRef.current = i
            draggingRef.current = { id: objectsRef.current[i].id, startX: pos.x, startY: pos.y }
            return;
        }
      }


      selectedIndexRef.current = null
      if (selectedIndexRef.current === null){
        drawUpper()
        drawArtboard()
        setActiveElement(null)
      }
    }else if (tool === 'shape') {
      const pos = getMousePos(e); // function that gives {x,y} in world space
      const newObj =  new Element({
        id: objectsRef.current.length+1,
        x:pos.x,
        y:pos.y,
        type:shapeType,
        fill:fillColour,
      })

     objectsRef.current.push(newObj);
     setActiveElement(newObj)
     selectedIndexRef.current = objectsRef.current.length - 1
     draggingRef.current = { id: newObj.id, startX: pos.x, startY: pos.y }
    }else if (tool === 'paint') {
        const pos = getMousePos(e);
        isPaintingRef.current = true

      if (paintType === 'pen'){

        const newObj =  new Element({
          id:objectsRef.current.length+1,
          x:pos.x,
          y:pos.y,
          type:paintType,
          fill:fillColour,
          brushOpacity:brushOpacity,
          brushHardness:brushHardness,
          brushSize:brushSize
        })
        objectsRef.current.push(newObj);

        selectedIndexRef.current = objectsRef.current.length - 1

        newObj.points = [{ x: pos.x, y: pos.y, pressure: e.pressure || 1 }]


      }else if (paintType === 'air brush'){
        const lower = lowerRef.current;
        if (!lower) return;

        const newObj =  new Element({
          id:objectsRef.current.length+1,
          x:pos.x,
          y:pos.y,
          type:paintType,
          fill:fillColour,
          brushOpacity:brushOpacity,
          brushHardness:brushHardness,
          brushSize:brushSize
        })
         objectsRef.current.push(newObj);

        selectedIndexRef.current = objectsRef.current.length - 1

        newObj.points = [{ x: pos.x, y: pos.y, pressure: e.pressure || 1 }]


        bufferCtxRef.current.clearRect(0,0,bufferRef.current.width,bufferRef.current.height);

        // draw first stamp into buffer (full alpha inside texture)
        stampToBuffer(pos.x, pos.y);
        renderOverlay();

      //  applyPaint(pos.x, pos.y, ctx);
      }
    }else if (tool === 'eraser'){
      const pos = getMousePos(e);
      isErasingRef.current = true

      lastPointRef.current = {x:pos.x, y:pos.y}


      bufferCtxRef.current.clearRect(0,0,bufferRef.current.width,bufferRef.current.height);
      //bufferCtxRef.current.globalCompositeOperation = 'source-over';

      eraseAt(pos.x, pos.y);

    //applyEraseBuffer();

    }else if (tool === 'text'){


    }
  };

  const hideToolBar = () => {
    if (activeElementJson){
      setActiveElementJson(null)
    }
  }


  const handleMouseMove = (e) => {

    const pos = getMousePos(e);

    if (!pos) return

    const resizing = resizingRef.current
    const resizingSide = resizingSideRef.current
    const textEditing = isTextEditingRef.current


    const rotating = rotatingRef.current
    const panning = isPanning.current
    const dragging = draggingRef.current; // snapshot so it doesn’t change mid-execution

    if (textEditing){
      const object = getActiveElement()

      if (hitObject(object, pos.x, pos.y) && lastPointRef.current) {

        const distance = Math.sqrt((pos.x - lastPointRef.current.x) ** 2 + (pos.y - lastPointRef.current.y) ** 2);

        if (distance > 0.5){
          // draw cursor
            textHilightRef.current = true
            stopCaretBlink();
            clearCursor()
            object.selectionEnd = object.getCharacterPosition(pos)

          //syncInputCaret(object)
            drawLower()
            drawArtboard()

        }else{
          textHilightRef.current = false
          //startCaretBlink();
          drawLower()
          drawTextCursor()
        }

      }


    }else if (panning) {
         const dx = e.clientX - lastPos.current.x;
         const dy = e.clientY - lastPos.current.y;
         const prevOffset = offsetRef.current

         offsetRef.current={
           x: prevOffset.x + dx,
           y: prevOffset.y + dy,
         };

         setOffset({
           x: prevOffset.x + dx,
           y: prevOffset.y + dy,
         })

         const canvasContainer = canvasContainerRef.current

         //const lower = lowerRef.current;
         if (canvasContainer) {
            canvasContainer.style.left = `${parseFloat(canvasContainer.style.left) + dx}px`;
            canvasContainer.style.top  = `${parseFloat(canvasContainer.style.top) + dy}px`;
         }
         lastPos.current = { x: e.clientX, y: e.clientY };

        drawUpper();
        drawArtboard()

    }else if (activeToolRef.current === 'size-position'){

      // resizing element
      if (resizing) {

          hideToolBar()
        const { index, corner } = resizing;
        const obj = objectsRef.current[index];

        const keepRatio = e.shiftKey;
        const aspect = obj.width/ obj.h;

        // Mouse position relative to center, rotated into object space
        const dx = pos.x - obj.cx;
        const dy = pos.y - obj.cy;
        const cos = Math.cos(-obj.angle);
        const sin = Math.sin(-obj.angle);
        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;

        // Compute half-width/half-height based on dragged corner
        let halfW = Math.abs(localX);
        let halfH = Math.abs(localY);

        if (keepRatio) {
          const newAspect = halfW / halfH;
          if (newAspect > aspect) halfW = halfH * aspect;
          else halfH = halfW / aspect;
        }

        obj.width= halfW * 2;
        obj.h = halfH * 2;
        obj.maxWidth = halfW * 2;

        // DO NOT TOUCH obj.cx / obj.cy
        objectsRef.current[index] = obj;

        if (obj.type === 'text'){
          obj.updateLinesWrap()
        }

        drawLower();
        drawUpper();
        drawArtboard();
        return;
      }

      // resize Side
      if (resizingSide) {
          hideToolBar()
        const { index, side } = resizingSide; // side = 0: top, 1: right, 2: bottom, 3: left
        const obj = objectsRef.current[index];
        // Transform mouse → local object space
        const dx = pos.x - obj.cx;
        const dy = pos.y - obj.cy;

        //inverse of the object’s rotation Now we can treat it like a plain rectangle without worrying about rotation
        const cos = Math.cos(-obj.angle);
        const sin = Math.sin(-obj.angle);
        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;

        // Current local bounds (centered at 0,0)
        let left   = -obj.width/ 2;
        let right  =  obj.width/ 2;
        let top    = -obj.h / 2;
        let bottom =  obj.h / 2;

        // Move just the selected side
        switch (side) {
          case 2: // top
            top = localY;
            break;
          case 1: // right
            right = localX;
            break;
          case 3: // bottom
            bottom = localY;
            break;
          case 0: // left
            left = localX;
            break;
        }

        // Compute new width/height
        const newW = right - left;
        const newH = bottom - top;

        // Compute new local center (midpoint of bounds) cx and cy
        const newLocalCx = (left + right) / 2;
        const newLocalCy = (top + bottom) / 2;

        // Rotate local center shift back to world space
        const worldDx = newLocalCx * Math.cos(obj.angle) - newLocalCy * Math.sin(obj.angle);
        const worldDy = newLocalCx * Math.sin(obj.angle) + newLocalCy * Math.cos(obj.angle);

        // Update object
        obj.width= newW;
        obj.h = newH;
        obj.cx += worldDx;
        obj.cy += worldDy;
        obj.x = obj.cx - obj.width/ 2;
        obj.y = obj.cy - obj.h / 2;

        objectsRef.current[index] = obj;

        if (obj.type === 'text'){
          obj.updateLinesWrap()
        }


        drawLower();
        drawUpper();
        drawArtboard();
        return;
      }


      if (rotating){
        hideToolBar()

        const index = selectedIndexRef.current
        const obj = objectsRef.current[index];

        // Use the center coordinates
         const cx = obj.cx;
         const cy = obj.cy;

         // Angle between center and mouse
          const dx = pos.x - cx;
          const dy = pos.y - cy;
          const currentAngle = Math.atan2(dy, dx);

        obj.angle = currentAngle + rotating.offset;

        drawLower();
        drawUpper();
        drawArtboard();
        return;
      }

    // dragging element
      if (dragging){

        hideToolBar()


        const dx = pos.x - dragging.startX;
        const dy = pos.y - dragging.startY;

        if (objectsRef.current) {

          const index = selectedIndexRef.current
          const obj = objectsRef.current[index];
          obj.cx = obj.cx + dx;
          obj.cy = obj.cy + dy;
          obj.x = obj.cx - obj.width/2
          obj.y = obj.cy - obj.h/2
          objectsRef.current[index] = obj;

        //  return
          drawLower();
          drawUpper();
          drawArtboard()
        }
        draggingRef.current = { ...draggingRef.current, startX: pos.x, startY: pos.y }
      }

    }else if (activeToolRef.current === 'shape' && dragging){

      if (shapeType === 'rectangle'){
        const index = selectedIndexRef.current;
        const obj = objectsRef.current[index];
        if (!obj) return;

        // calculate width & height from start → current mouse
        let width = Math.abs(pos.x - dragging.startX);
        let h = Math.abs(pos.y - dragging.startY);

        if (e.shiftKey) {
          // enforce equal width & height
          const size = Math.max(width, h);
          width = size;
          h = size;

          // adjust pos so square grows correctly
          const dx = pos.x - dragging.startX;
          const dy = pos.y - dragging.startY;

          // if dragging left/up we need to shift center back
          obj.cx = dragging.startX + (dx >= 0 ? size / 2 : -size / 2);
          obj.cy = dragging.startY + (dy >= 0 ? size / 2 : -size / 2);
        } else {
          // normal rectangle logic
          obj.cx = (dragging.startX + pos.x) / 2;
          obj.cy = (dragging.startY + pos.y) / 2;
        }

        obj.width= width;
        obj.h = h;

        //console.log('obj', obj)

        drawLower();
        drawUpper();
        drawArtboard();


      }else if (shapeType === 'ellipse'){
        const index = selectedIndexRef.current
        const obj = objectsRef.current[index];
        if (!obj) return

        const width = Math.abs(pos.x - dragging.startX);
        const h = Math.abs(pos.y - dragging.startY);

        if (e.shiftKey) {
          // perfect circle
          const size = Math.min(width, h);
          obj.width= size;
          obj.h = size;
        } else {
          // free ellipse
          obj.width= width;
          obj.h = h;
        }

        obj.cx = (dragging.startX + pos.x) / 2;
        obj.cy = (dragging.startY + pos.y) / 2;

        drawLower();
        drawUpper();
        drawArtboard();


      }else if (shapeType === 'triangle'){

        const index = selectedIndexRef.current
        const obj = objectsRef.current[index];
        if (!obj) return

        // calculate width & height from start → current mouse
        let width = Math.abs(pos.x - dragging.startX);
        let h = Math.abs(pos.y - dragging.startY);

        if (e.shiftKey) {
          // enforce equal width & height
          const size = Math.max(width, h);
          width = size;
          h = size;

          // adjust pos so square grows correctly
          const dx = pos.x - dragging.startX;
          const dy = pos.y - dragging.startY;

          // if dragging left/up we need to shift center back
          obj.cx = dragging.startX + (dx >= 0 ? size / 2 : -size / 2);
          obj.cy = dragging.startY + (dy >= 0 ? size / 2 : -size / 2);
        } else {
          // normal rectangle logic
          obj.cx = (dragging.startX + pos.x) / 2;
          obj.cy = (dragging.startY + pos.y) / 2;
        }

        obj.width= width;
        obj.h = h;

        drawLower();
        drawUpper();
        drawArtboard();

      }

    }else if (activeToolRef.current === 'paint'){
      const pos = getMousePos(e);
      const index = selectedIndexRef.current;

      const obj = objectsRef.current[index];

      if (paintType === 'pen'){
        if (!isPaintingRef.current) return;

        obj.points.push({
          x: pos.x,
          y: pos.y,
          pressure: e.pressure || 1,
        });

        drawBrushPreview(obj, paintType);

      }else if (paintType === 'air brush'){

        //mouse move

         if (!isPaintingRef.current) return;

         //const lastObject = obj.points[obj.points.length - 1];

         obj.points.push({
           x: pos.x,
           y: pos.y,
           pressure: e.pressure || 1,
         });

         drawBrushPreview(obj, paintType);

         renderOverlay();

      }

    }else if (activeToolRef.current === 'eraser'){
      if (!isErasingRef.current) return;


        drawEraserBuffer(lastPointRef.current.x, lastPointRef.current.y, pos.x, pos.y)

        lastPointRef.current = {x:pos.x, y:pos.y}

    //    applyEraseBuffer()

    }

  };

  function easeInOut(t) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }


  useEffect(()=> {
      brushTextureRef.current = createBrushTexture();
  },[brushSize, brushHardness, fillColour])

  useEffect(()=> {
      eraserTextureRef.current = createEraserTexture();
  },[eraserSize, eraserHardness])

  function createEraserTexture() {
    // brushColor fixed to black here; change if you need color

    const diameter = Math.max(eraserSize * 2, 64);
    const canv = document.createElement('canvas');
    canv.width = canv.height = diameter;
    const gctx = canv.getContext('2d');

    const cx = diameter / 2;
    const cy = diameter / 2;
    const R = eraserSize; // use brushSize as radius for consistent visual size

    const radius = eraserSize / 2;

    const hard = Math.max(0, Math.min(1, eraserHardness / 100));

    //const alpha = (brushOpacity * brushFlow) / 10000; // Combined opacity and flow


    if (hard >= 0.999) {
      // fully hard: draw a crisp circle mask with alpha = 1 in center -> we will apply globalAlpha once at composition
      gctx.fillStyle = `rgba(${0},${0},${0},1)`;
      gctx.beginPath();
      gctx.arc(cx, cy, R / 2, 0, Math.PI*2);
      gctx.closePath();
      gctx.fill();
    } else {

      const innerR = R * hard;

      const gradient = gctx.createRadialGradient(
          cx, cy, radius * (eraserHardness / 100),
          cx, cy, radius
      );

      // We'll use a smooth falloff using eased stops
      const steps = 500;
      for (let i=0;i<=steps;i++){
        const stop = i / steps;
        // t goes 0..1 across radius; easedAlpha goes from 1 down to 0
        const eased = 1 - easeInOut(stop);
        const easedAlpha = eased * (1 - easeInOut(stop));

        gradient.addColorStop(stop, `rgba(${0},${0},${0},${easedAlpha})`);
      }
      gctx.fillStyle = gradient;
      gctx.fillRect(0,0,diameter,diameter);
    }

    return canv;
  }




  function createBrushTexture() {
    // brushColor fixed to black here; change if you need color

    const diameter = Math.max(brushSize * 2, 64);
    const canv = document.createElement('canvas');
    canv.width = canv.height = diameter;
    const gctx = canv.getContext('2d');

    const cx = diameter / 2;
    const cy = diameter / 2;
    const R = brushSize; // use brushSize as radius for consistent visual size

    const radius = brushSize / 2;


    // hardness 0..1 (0 soft, 1 hard)
    const hard = Math.max(0, Math.min(1, brushHardness / 100));

    const alpha = (brushOpacity * brushFlow) / 10000; // Combined opacity and flow

    const [, r, g, b, a] = fillColour.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);


    if (hard >= 0.999) {
      // fully hard: draw a crisp circle mask with alpha = 1 in center -> we will apply globalAlpha once at composition
      gctx.fillStyle = `rgba(${r},${g},${b},1)`;
      gctx.beginPath();
      gctx.arc(cx, cy, R / 2, 0, Math.PI*2);
      gctx.closePath();
      gctx.fill();
    } else {
      // soft: radial gradient from alpha=1 at center to alpha=0 at edge
      // inner radius where alpha stays 1
      const innerR = R * hard;
      //const gradient = gctx.createRadialGradient(cx, cy, innerR/2, cx, cy, R/2);

      const gradient = gctx.createRadialGradient(
          cx, cy, radius * (brushHardness / 100),
          cx, cy, radius
      );



      // We'll use a smooth falloff using eased stops
      const steps = 500;
      for (let i=0;i<=steps;i++){
        const stop = i / steps;
        // t goes 0..1 across radius; easedAlpha goes from 1 down to 0
        const eased = 1 - easeInOut(stop);
      //  const alpha = eased; // we keep center at 1 and edge at 0
        const easedAlpha = alpha * (1 - easeInOut(stop));

        gradient.addColorStop(stop, `rgba(${r},${g},${b},${easedAlpha})`);
      }
      gctx.fillStyle = gradient;
      gctx.fillRect(0,0,diameter,diameter);
    }

    return canv;
  }


  function eraserToBuffer(x, y) {
    const d = eraserTextureRef.current.width;
    bufferCtxRef.current.drawImage(eraserTextureRef.current, x - d/2, y - d/2);

  }



  function stampToBuffer(x, y) {
    // Draw brush texture onto the buffer. NOTE: draw with full alpha (we rely on buffer being composited once)
    const d = brushTextureRef.current.width;
    bufferCtxRef.current.drawImage(brushTextureRef.current, x - d/2, y - d/2);
  }


  function renderOverlay() {
    // Clear overlay and draw buffer onto it once with globalAlpha = brushOpacity
    overlayCtxRef.current.clearRect(0,0,overlayRef.current.width,overlayRef.current.height);
    overlayCtxRef.current.globalAlpha = brushOpacity/100;
    overlayCtxRef.current.drawImage(bufferRef.current, 0, 0);
    overlayCtxRef.current.globalAlpha = 1;
  }




  function applyEraseBuffer() {
/*
    overlayCtxRef.current.clearRect(0,0,overlayRef.current.width,overlayRef.current.height);
    overlayCtxRef.current.globalAlpha = eraserOpacity/100;
    overlayCtxRef.current.drawImage(bufferRef.current, 0, 0);
    overlayCtxRef.current.globalAlpha = 1;
*/



    for (const obj of objectsRef.current) {
        if (!obj.airbrushBuffer) continue;
        const bufCtx = obj.airbrushBuffer.getContext('2d');
        bufCtx.save();
        bufCtx.globalCompositeOperation = 'destination-out';
        bufCtx.globalAlpha = eraserOpacity/100;
        const d = eraserTextureRef.current.width;
        // draw soft eraser stroke
        bufCtx.drawImage(bufferRef.current, 0, 0);
        bufCtx.restore();
    }



    const lower = lowerRef.current;
    const lowerCtx = lower.getContext("2d");
    const d = eraserTextureRef.current.width;
    lowerCtx.save();
    lowerCtx.globalCompositeOperation = "destination-out";
    lowerCtx.globalAlpha = eraserOpacity/100;
    lowerCtx.drawImage(bufferRef.current, 0, 0);
    lowerCtx.restore();

  }




  function drawAirBrush(lastPointX, lastPointY, currentPointX, currentPointY) {
      const lower = lowerRef.current;
      if (!lower) return;

      const ctx = lower.getContext("2d");


      const x1 = lastPointX
      const y1 = lastPointY
      const x2 = currentPointX
      const y2 = currentPointY

      const dx = currentPointX - lastPointX;
      const dy = currentPointY - lastPointY;

      const dist = Math.sqrt(dx * dx + dy * dy);
      const spacing = brushSize * (0.25 - brushHardness * 0.2);


      //const steps = Math.ceil(dist / (brushSize / 4));

      const steps = Math.ceil(dist / Math.max(spacing, 1)); // never less than 1px spacing

      if (dist > 0.1) {

        for (let i = 0; i < steps; i++) {
          const x = lastPointX + (dx * i) / steps;
          const y = lastPointY + (dy * i) / steps;
          //ctx.globalAlpha = brushOpacity;
          //ctx.drawImage(brushTextureRef.current, x - brushSize, y - brushSize);
          applyPaint(x, y, ctx)

        }
      }

  }

  function applyPaint(x, y, ctx) {


    if (!brushTextureRef.current) {
        brushTextureRef.current = createBrushTexture();
    }

    ctx.globalAlpha = brushOpacity / 100;


    const size = Math.max(brushSize * 2, 100);

    ctx.drawImage(
        brushTextureRef.current,
        x - size / 2,
        y - size / 2
    );

    ctx.globalAlpha = 1;
  }

  const handleMouseUp = () => {
    //setDragging(null)

    if (isPaintingRef.current && paintType === 'air brush'){
      const obj = getActiveElement()
      if (!obj) return

      drawBuffer(obj, bufferRef.current)

      // ✅ Create a new offscreen canvas
      const clonedCanvas = document.createElement('canvas');
      clonedCanvas.width = bufferRef.current.width;
      clonedCanvas.height = bufferRef.current.height;
      const clonedCtx = clonedCanvas.getContext('2d');

      // Copy the current buffer pixels into it
      clonedCtx.drawImage(bufferRef.current, 0, 0);

      // Store the copy, not the original reference
      obj.airbrushBuffer = clonedCanvas;
      obj.brushOpacity = brushOpacity;

      overlayCtxRef.current.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
      bufferCtxRef.current.clearRect(0, 0, bufferRef.current.width, bufferRef.current.height);

    }

    if (isPaintingRef.current && paintType === 'pen'){

      const obj = getActiveElement()
      if (!obj) return

        obj.fill === fillColour
        obj.brushSize === brushSize

    }

    if (isTextEditingRef.current){
      const obj = getActiveElement()
    }

    isPanning.current = false;
    draggingRef.current = null
    resizingRef.current = null
    resizingSideRef.current = null
    rotatingRef.current = false
    lastPointRef.current = null
    isPaintingRef.current = false;
    isErasingRef.current = false;
    //textHilightRef.current = false
    console.log('turn hilight off')


    if (activeElement){
      const obj = getActiveElement()
      if (!obj) return
      setActiveElementJson({...obj})
    }




  };

  const getActiveElement = () => {
    const index = selectedIndexRef.current
    const obj = objectsRef.current[index];
    if (obj) {
      return obj
    }else{
      return null
    }
  }


function drawBrushPreview(element, paintType) {
  const lower = lowerRef.current;
  if (!lower) return;

  const ctx = lower.getContext("2d");
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  if (paintType === 'pen'){
    drawPen(ctx, element.points, element.fill, brushSize);
  }else if (paintType === 'air brush'){
    const lastObject = element.points[element.points.length - 2];
    const currentObject = element.points[element.points.length - 1]
    drawLineBuffer(lastObject.x, lastObject.y, currentObject.x, currentObject.y);
  }
}

function drawLineBuffer(x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  //const hardnessFactor = Math.max(0.01, brushHardness / 100);
  //const spacing = Math.max(1, brushSize * (0.25 - 0.2 * hardnessFactor));

  const spacing = Math.max(0.5, (brushSize * 0.02) * (100 / brushFlow));

  const steps = Math.ceil(dist / spacing);

  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps;
    const x = x1 + dx * t;
    const y = y1 + dy * t;
    stampToBuffer(x, y);
  }
}


const eraseAt = (x, y) => {

  for (const obj of objectsRef.current) {
      if (!obj.airbrushBuffer) continue;
      const bufCtx = obj.airbrushBuffer.getContext('2d');
      bufCtx.save();
      bufCtx.globalCompositeOperation = 'destination-out';
      bufCtx.globalAlpha = eraserOpacity/100;
      const d = eraserTextureRef.current.width;
      // draw soft eraser stroke
      bufCtx.drawImage(eraserTextureRef.current, x - d/2, y - d/2);
      bufCtx.restore();
  }

  const lower = lowerRef.current;
  const lowerCtx = lower.getContext("2d");

  const d = eraserTextureRef.current.width;
  lowerCtx.save();

  lowerCtx.globalCompositeOperation = "destination-out";
  lowerCtx.globalAlpha = eraserOpacity/100;

  lowerCtx.drawImage(eraserTextureRef.current, x - d/2, y - d/2);
   lowerCtx.restore();

}

function eraserStampToMain(x, y) {
  const mainCtx = lowerCtx; // or mainCtxRef.current
  const d = eraserTextureRef.current.width;

  mainCtx.save();
  mainCtx.globalCompositeOperation = 'destination-out';
  // Use globalAlpha to control the erase strength per stamp (0..1)
  mainCtx.globalAlpha = eraseStrength; // e.g. your eraser opacity (0..1)
  mainCtx.drawImage(eraserTextureRef.current, x - d/2, y - d/2);
  mainCtx.restore();
}


const drawBuffer = (obj, buffer) => {
  const lower = lowerRef.current;
  const lowerCtx = lower.getContext("2d");

  lowerCtx.globalAlpha = brushOpacity/100;
  lowerCtx.drawImage(buffer, 0, 0);
  lowerCtx.globalAlpha = 1;

}

function drawEraserBuffer(x1, y1, x2, y2) {

  const dx = x2 - x1, dy = y2 - y1;
  const dist = Math.hypot(dx, dy);

  const spacing = Math.max(0.5, (eraserOpacity * 0.02) * (100 / 100));

  const steps = Math.ceil(dist / spacing);

  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps;
    const x = x1 + dx * t;
    const y = y1 + dy * t;
    //eraserToBuffer(x, y);
    eraseAt(x, y)
  }

}



function drawPen(ctx, points, colour = "rgba(0,0,0,1)", brushSize = 50) {

//  ctx.globalCompositeOperation = 'lighter';

  if (!points || points.length < 2) return;


  // Extract RGBA values
  /*
  const match = fillColour.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
  let r = 0, g = 0, b = 0, a = 1;

  if (match) {
    r = parseInt(match[1]);
    g = parseInt(match[2]);
    b = parseInt(match[3]);
    a = match[4] !== undefined ? parseFloat(match[4]) : 1;
  }*/

  // Combine existing alpha with brushOpacity
  //const finalAlpha = a * element.brushOpacity;
  //console.log('rgba', `rgba(${r}, ${g}, ${b}, ${finalAlpha/100})`)
  //ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${finalAlpha/100})`
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

//  ctx.globalCompositeOperation = 'source-over'; // (normal)
}



function drawSoftStrokePreview(stroke) {

  const lower = lowerRef.current;
  if (!lower) return;

  const ctx = lower.getContext("2d");
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  const { points, colour, width, hardness } = stroke;
  if (!points || points.length < 1) return;

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    drawBrushStamp(ctx, p.x, p.y, width, colour, hardness);
  }

}



  const getCorners = (obj) => {
    const { cx, cy, width, h, angle } = obj;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // Half dimensions
    const hw = width / 2;
    const hh = h / 2;

    // Local corners relative to center
    const localCorners = [
      { x: -hw, y: -hh }, // top-left
      { x:  hw, y: -hh }, // top-right
      { x:  hw, y:  hh }, // bottom-right
      { x: -hw, y:  hh }  // bottom-left
    ];

    // Rotate and translate to world coordinates
    return localCorners.map(c => ({
      x: cx + c.x * cos - c.y * sin,
      y: cy + c.x * sin + c.y * cos
    }));
  };



  // Hand tool activation with spacebar
  useEffect(() => {
    const canvas = upperRef.current; // or any wrapper div

    const handleKeyDown = (e) => {

      if (isTextEditingRef.current === true) return


      const keysToBlock = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', '=', '-', '1', '0'];
        if (keysToBlock.includes(e.key)) {
          event.preventDefault();
        }

        if (e.code === "Space") {
          e.preventDefault();
          handMode.current = true;
          if (canvas) canvas.style.cursor = "grabbing"; // change cursor
          //return
        }


        if (e.key === "="){
          setScale(prev => prev * 1.25)
        }

        if (e.key === "-"){
          setScale(prev => prev / 1.25)
        }

        if (e.key === "1"){
          setScale(1)
        }

        if (e.key === "0"){
          resize('scale to fit')
        }

        const index = selectedIndexRef.current
        const obj = objectsRef.current[index];

        if (selectedIndexRef.current !== null && obj) {
        // Track if object has moved
          switch (e.key) {
            case "ArrowUp":

              //move(obj, e.key)

              objectsRef.current[index].cy -= 5
              objectsRef.current[index].y -= 5
              drawLower();
              drawUpper();
              drawArtboard();


              break;
            case "ArrowDown":
              obj.cy += 5;
              obj.y += 5
              objectsRef.current[index] = obj;
              drawLower();
              drawUpper();
              drawArtboard();

              break;
            case "ArrowLeft":
              obj.cx -= 5;
              obj.x -= 5;
              objectsRef.current[index] = obj;
              drawLower();
              drawUpper();
              drawArtboard();

              break;
            case "ArrowRight":
              obj.cx += 5;
              obj.x += 5;
              objectsRef.current[index] = obj;
              drawLower();
              drawUpper();
              drawArtboard();

              break;

            case "Delete":
            case "Backspace":

                removeItem(index)
              return;

            default:
              return;
          }
          updateToolBarPosition(obj)
        }

    };

    const handleKeyUp = (e) => {

      if (e.code === "Space") {
        handMode.current = false;
        isPanning.current = false;
        if (canvas) canvas.style.cursor = "default"; // reset cursor
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [scale]);


  const removeItem = (index) => {
    objectsRef.current.splice(index, 1);
    selectedIndexRef.current = null
    setActiveElement(null)
    setActiveElementJson(null)
    drawUpper()
  //  drawLower();
    drawArtboard()

  }


  const toolCallback = (tool, active) =>{

    if (active){
        setActiveTool(tool)
        activeToolRef.current = tool
    }else{
      activeToolRef.current = null
      setActiveTool(null)
      if (tool === 'size-position' && selectedIndexRef.current){
        selectedIndexRef.current = null
        drawUpper()
      }
    }

    if (tool === 'edit text'){

      if (active){
        const obj = getActiveElement()
        if (!obj && obj.type !== 'text') return
        isTextEditingRef.current = true
        textEditRef.current.value = obj.text?obj.text:''
        textEditRef.current.focus();
        if (!obj.caretAbsIndex){
            obj.caretAbsIndex = obj.text.length;
        }

      //  syncInputCaret(obj);
        const lines = obj.getLines()
        activateTextEditor()
        startCaretBlink()
        console.log('drawTextCursor()')

      }else{
          isTextEditingRef.current = false
      }

    }else{
      isTextEditingRef.current = false
    }

  }



  function activateTextEditor(){

    textEditRef.current.addEventListener("blur", () => {

      stopCaretBlink();
      clearCursor()
    });

    textEditRef.current.addEventListener("input", (e) => {
      const obj = getActiveElement();
      if (!obj || obj.type !== "text") return;

      const newText = textEditRef.current.value;
      const diff = newText.length - obj.text.length;

      console.log('newText', newText)

      const inserted = newText.slice(obj.caretAbsIndex, obj.caretAbsIndex + diff);

    });

    textEditRef.current.addEventListener("keydown", (e) => {

      const obj = getActiveElement()
      const { row, col } = obj.getCaretPosFromIndex(obj.caretAbsIndex);
      const lines = obj.getLines();
      let clearSelection = false



      if (!obj && obj.type !== 'text') return


      if (e.key === "ArrowUp") {
        if (row > 0) {
          const prev = lines[row - 1];
          const newCol = Math.min(prev.length, col);
          obj.caretAbsIndex = obj.getIndexFromCaretPos(row - 1, newCol);
          obj.selectionStart = {line: row - 1, char:newCol}
          obj.selectionEnd = {line: row - 1, char:newCol}
          clearSelection = true
        }
        e.preventDefault();
      } else if (e.key === "ArrowDown") {
        if (row < lines.length - 1) {
          const next = lines[row + 1];
          const newCol = Math.min(next.length, col);
          obj.caretAbsIndex = obj.getIndexFromCaretPos(row + 1, newCol);
          obj.selectionStart = {line: row + 1, char:newCol}
          obj.selectionEnd = {line: row + 1, char:newCol}
          clearSelection = true
        }
        e.preventDefault();
      } else if (e.key === "ArrowLeft") {
        obj.caretAbsIndex = Math.max(0, obj.caretAbsIndex - 1);
        obj.selectionStart = {line: row, char:obj.caretAbsIndex - 1}
        obj.selectionEnd = {line: row, char:obj.caretAbsIndex - 1}
        clearSelection = true
      } else if (e.key === "ArrowRight") {
        obj.caretAbsIndex = Math.min(obj.text.length, obj.caretAbsIndex + 1);
        obj.selectionStart = {line: row, char:obj.caretAbsIndex + 1}
        obj.selectionEnd = {line: row, char:obj.caretAbsIndex + 1}
        clearSelection = true
      } else if ( e.key === "Backspace") {
        e.preventDefault();
        obj.handleBackspace();
      } else if (e.key === "Delete") {
        e.preventDefault();
        obj.handleDelete(obj);
      } else if (e.key === "Enter") {
        e.preventDefault();
        obj.handleEnter();
      } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
        // Normal character input
        e.preventDefault();
        obj.insertTextAtCaret(e.key);
      }

      if (clearSelection){
        startCaretBlink()
      }


      // Keep textarea synced
      textEditRef.current.value = obj.text;

      textEditRef.current.setSelectionRange(obj.caretAbsIndex, obj.caretAbsIndex);

      drawLower()
      drawUpper();
      drawArtboard();
      drawTextCursor();
    });

  }



  function syncInputCaret(obj) {

    const startAbs = obj.getAbsIndexFromLineChar(obj.selectionStart.line, obj.selectionStart.char);
    const endAbs   = obj.getAbsIndexFromLineChar(obj.selectionEnd.line, obj.selectionEnd.char);

    textEditRef.current.setSelectionRange(endAbs, startAbs);


  }

  function updateHiddenCaret(obj) {

    const beforeLines = obj.getLines().slice(0, obj.caretRow);
    const absoluteIndex = beforeLines.join("\n").length + (obj.caretRow > 0 ? 1 : 0) + obj.caretCol;
    textEditRef.current.setSelectionRange(absoluteIndex, absoluteIndex);
  }

  function startCaretBlink() {
    if (caretTimer.current) clearInterval(caretTimer.current);
    caretVisibleRef.current = true;
    caretTimer.current = setInterval(() => {
      caretVisibleRef.current = !caretVisibleRef.current;
      drawTextCursor();
    }, 500);
  }

  function stopCaretBlink() {
    clearInterval(caretTimer.current);
    caretTimer.current = null;
  }

useEffect(()=>{

  if (paintType === 'air brush'){

    brushTextureRef.current = createBrushTexture();

    if (!lowerRef.current || !overlayRef.current) return;

    const buffer = document.createElement('canvas');
    const bufferCtx = buffer.getContext('2d');
    buffer.width = lowerRef.current.width
    buffer.height = lowerRef.current.height

    bufferCtxRef.current = bufferCtx
    bufferRef.current = buffer
    overlayCtxRef.current = overlayRef.current.getContext('2d');


    //bufferedBrushRef.current = new BufferedBrush(lowerRef.current, overlayRef.current, upperRef.current, scale, offsetRef.current);
  }

},[paintType])

useEffect(()=>{

  if (activeTool === 'eraser'){
    eraserTextureRef.current = createEraserTexture();
    if (!lowerRef.current || !overlayRef.current) return;

    const buffer = document.createElement('canvas');
    const bufferCtx = buffer.getContext('2d');
    buffer.width = lowerRef.current.width
    buffer.height = lowerRef.current.height

    const delta = document.createElement('canvas');
    const deltaCtx = buffer.getContext('2d');
    delta.width = lowerRef.current.width
    delta.height = lowerRef.current.height


    deltaCtxRef.current = deltaCtx
    deltaRef.current =  delta


    bufferCtxRef.current = bufferCtx
    bufferRef.current = buffer
    overlayCtxRef.current = overlayRef.current.getContext('2d');


  }

},[activeTool])

  const fillColourCallBack = (colour) => {
      setFillColour(`rgba(${ colour.r }, ${ colour.g }, ${ colour.b }, ${ colour.a })`)
      const index = selectedIndexRef.current
      if (index !== null){
        const obj = objectsRef.current[index];
        if (index !== null){
          if (obj.type !== "pen"){
            obj.fill = `rgba(${ colour.r }, ${ colour.g }, ${ colour.b }, ${ colour.a })`
          }
        }
        drawLower()
      }
  }

  const strokeColourCallBack = (colour) => {
      setStrokeColour(`rgba(${ colour.r }, ${ colour.g }, ${ colour.b }, ${ colour.a })`)
      const index = selectedIndexRef.current
      if (index !== null){
        const obj = objectsRef.current[index];
        if (index !== null){
          obj.strokeColour = `rgba(${ colour.r }, ${ colour.g }, ${ colour.b }, ${ colour.a })`
        }
        drawLower()
      }
  }

  const exportPage = () => {
    const lowerCanvas = lowerRef.current;
    const dataURL = lowerCanvas.toDataURL("image/png"); // PNG of page only

    // create a temporary link to download
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = "page.png";
    link.click();
  };

  const pick = (event) => {
    const bounding = canvas.getBoundingClientRect();
    const x = event.clientX - bounding.left;
    const y = event.clientY - bounding.top;
    const pixel = ctx.getImageData(x, y, 1, 1);
    const data = pixel.data;

    const rgbColor = `rgb(${data[0]} ${data[1]} ${data[2]} / ${data[3] / 255})`;

    return rgbColor;
  };




  const save = () => {
    // Suppose you have an array of elements
    /*
    const elements = [element1, element2, element3];

    // Convert to JSON
    // Only save the actual data; omit derived or canvas-specific properties like `lines` or `cx/cy`
    const elementsData = elements.map(el => ({
          id: el.id,
          x: el.x,
          y: el.y,
          type: el.type,
          w: el.w,
          h: el.h,
          angle: el.angle,
          fill: el.fill,
          strokeColour: el.strokeColour,
          strokeWeight: el.strokeWeight,
          opacity: el.opacity,
          text: el.text,
          fontSize: el.fontSize,
          maxWidth: el.maxWidth,
          lineHeight: el.lineHeight,
          font: el.font,
          points: el.points,
          brushWidth: el.brushWidth,
          brushOpacity: el.brushOpacity,
          brushHardness: el.brushHardness,
          brushFlow: el.brushFlow
        }));

        const json = JSON.stringify(elementsData);
        */

    const json = JSON.stringify(elements); // automatically calls el.toJSON()

    localStorage.setItem("myCanvasElements", json);
  }

  const load = () => {
    const savedJson = localStorage.getItem("myCanvasElements");
    if (!savedJson) return;

    const loadedData = JSON.parse(savedJson);

    // Recreate class instances
    const loadedElements = loadedData.map(data => {
      const el = new Element(data); // Rehydrate
      // Recalculate anything derived that needs canvas
      if (el.text) el.updateLines();
      return el;
    });
  }

  function clearCursor(){
    const ctx = toolsRef.current.getContext("2d");
    ctx.clearRect(0, 0, toolsRef.current.width, toolsRef.current.height);
  }

function drawTextCursorTest() {
  const object = getActiveElement();
   const isTextEditing = isTextEditingRef.current;
   const caretVisible = caretVisibleRef.current;
   const cursor = toolsRef.current;
   const lower = lowerRef.current;
   if (!cursor || !lower) return;
   const lowerCtx = lower.getContext("2d");
   const ctx = cursor.getContext("2d");
   ctx.clearRect(0, 0, cursor.width, cursor.height);

   if (isTextEditing && caretVisible) {
     const { row, col } = object.getCaretPosFromIndex(object.caretAbsIndex);
     const lines = object.getLines();
     const before = (lines[row] || "").slice(0, col);


     const textWidth = object.measureTextWidth(before, row, lowerCtx)
     const lineHeight = object.getLineHeight();
     const caretLocalX = -object.width/ 2 + object.textPadding + textWidth;
     const caretLocalY = -object.h / 2 + object.textPadding + row * lineHeight;
     // Apply rotation and translation like when drawing text
     ctx.save();
     ctx.translate(offsetRef.current.x + object.cx * scale, offsetRef.current.y + object.cy * scale);
     ctx.rotate(object.angle);

     //const caretHeight = object.fontSize;
     console.log('before', before)

     const caretHeight = object.measureTextHeight(before, row, col, ctx);


     ctx.beginPath();
     ctx.moveTo(caretLocalX * scale, caretLocalY * scale);
     ctx.lineTo(caretLocalX * scale, (caretLocalY + caretHeight) * scale);
     ctx.strokeStyle = COLOUR;
     ctx.lineWidth = 1;
     ctx.stroke();
     ctx.restore();
   }
}



  function drawTextCursor() {
    const object = getActiveElement();
     const isTextEditing = isTextEditingRef.current;
     const caretVisible = caretVisibleRef.current;
     const cursor = toolsRef.current;
     const lower = lowerRef.current;
     if (!cursor || !lower) return;
     const lowerCtx = lower.getContext("2d");
     const ctx = cursor.getContext("2d");
     ctx.clearRect(0, 0, cursor.width, cursor.height);

     if (isTextEditing && caretVisible) {

       ctx.save();
       lowerCtx.font = object.font();

       const { row, col } = object.getCaretPosFromIndex(object.caretAbsIndex);


       const lines = object.getLines();
       const line = lines[row] || "";
       const before = line.slice(0, col);
       const character = line[col-1]

       const textWidth = object.measureTextWidth(before, row, lowerCtx);

       const lineHeight = object.getLineHeight();

       const alignOffset = object.getLineOffset(
         row,
         line,
         object.textAlign,
         lowerCtx,
         object.width,
         object.textPadding
       );


       const caretLocalX = -object.width/ 2 + object.textPadding + alignOffset + textWidth;
       const caretLocalY = -object.h / 2 + object.textPadding / 2 + row * lineHeight;

       ctx.translate(offsetRef.current.x + object.cx * scale, offsetRef.current.y + object.cy * scale);

       ctx.rotate(object.angle);


       const caretHeight = object.measureTextHeight(row, character);

       ctx.beginPath();
       ctx.moveTo(caretLocalX * scale, caretLocalY * scale);
       ctx.lineTo(caretLocalX * scale, (caretLocalY + caretHeight) * scale);
       ctx.strokeStyle = fillColour;
       ctx.lineWidth = 1;
       ctx.stroke();
       ctx.restore();
     }

  }

  function drawTextCursorBk() {
    const object = getActiveElement();
    const isTextEditing = isTextEditingRef.current;
    const caretVisible = caretVisibleRef.current;
    const cursor = toolsRef.current;
    const lower = lowerRef.current;
    if (!cursor || !lower) return;

    const ctx = cursor.getContext("2d");
    ctx.clearRect(0, 0, cursor.width, cursor.height);

    if (isTextEditing && caretVisible) {
      const { row, col } = object.getCaretPosFromIndex(object.caretAbsIndex);
      const lines = object.getLines();
      const before = (lines[row] || "").slice(0, col);

      const textWidth = ctx.measureText(before).width;
      const lineHeight = object.getLineHeight();
      const caretLocalX = -object.width/ 2 + object.textPadding + textWidth;
      const caretLocalY = -object.h / 2 + object.textPadding + row * lineHeight;

      // Apply rotation and translation like when drawing text
      ctx.save();
      ctx.translate(offsetRef.current.x + object.cx * scale, offsetRef.current.y + object.cy * scale);
      ctx.rotate(object.angle);

      const caretHeight = object.fontSize;
      ctx.beginPath();
      ctx.moveTo(caretLocalX * scale, caretLocalY * scale);
      ctx.lineTo(caretLocalX * scale, (caretLocalY + caretHeight) * scale);
      ctx.strokeStyle = fillColour;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
  }



  function drawTextCursorOld(){
    const object = getActiveElement()
    const isTextEditing = isTextEditingRef.current;
    const caretVisible = caretVisibleRef.current
    const cursor = toolsRef.current;
    const lower = lowerRef.current;
    if (!cursor && !lower) return;
    const lowerCtx = lower.getContext("2d");
    const ctx = cursor.getContext("2d");
    ctx.clearRect(0, 0, cursor.width, cursor.height);
    if (isTextEditing && caretVisible){
      const { row, col } = object.getCaretPosFromIndex(object.caretAbsIndex);
      const lines = object.getLines();
      const before = (lines[row] || "").slice(0, col);
      const innerHeight = object.y + (object.fontSize * object.lineHeight) * (row + 1)
      const caretX = offsetRef.current.x + (object.x + lowerCtx.measureText(before).width + object.textPadding ) * scale;
      const caretY = offsetRef.current.y + innerHeight * scale;

      ctx.beginPath();
      ctx.moveTo(caretX, caretY - 24);
      ctx.lineTo(caretX, caretY + 6);
      ctx.strokeStyle = fillColour;
      ctx.stroke();
    }
  }



  function drawCursor(e) {
    // First, clear the previous cursor
    const object = getActiveElement()
    const isTextEditing = isTextEditingRef.current;
    const caretVisible =  caretVisibleRef.current

    const cursor = toolsRef.current;
    const rect = cursor.getBoundingClientRect();
    if (!cursor) return;
    const ctx = cursor.getContext("2d");

    if (activeToolRef.current === 'paint' && activeToolRef.current === 'eraser'){

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      ctx.clearRect(0, 0, cursor.width, cursor.height);

      ctx.beginPath();
      ctx.arc(x, y, brushSize * scale / 2, 0, Math.PI * 2);
      ctx.strokeStyle = fillColour;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

  }

  const fontSelectionCallback = (value) => {
    const selectedFont = fonts.find((font)=> font.label === value)

    setSelectedFont(selectedFont.label)
    setFontWeights(selectedFont.weights)
    setFontStyles(selectedFont.styles)
    const active = getActiveElement();
    if (!active || active.type !== "text") return;


      if (active.isTextHilighted()){
        active.applyStyleToSelection({ fontFamily: value });
      }else{
        active.fontFamily = value;

      }

      active.updateLines?.();
      drawLower();
      drawUpper();
      drawArtboard()
  }

  const fontWeightSelectionCallback = (value) => {

    setSelectedFontWeight(value)
    const active = getActiveElement();
    if (!active || active.type !== "text") return;


    if (active.isTextHilighted()){
      active.applyStyleToSelection({ fontWeight: value });
    }else{
      active.fontWeight = value;
    }

  //  active.updateLines?.();
    drawLower();
    drawUpper();
    drawArtboard()
  }


  const fontStyleSelectionCallback = (value) => {

    setSelectedFontStyle(value)
    const active = getActiveElement();
    if (!active || active.type !== "text") return;

    if (active.isTextHilighted()){
      active.applyStyleToSelection({ fontStyle: value });
    }else{
      active.fontStyle = value;
    }



    // Recalculate wrapped lines and redraw everything
  //  active.updateLines?.();
    drawLower();
    drawUpper();
    drawArtboard()
  }

  const fontSizeInputCallback = (value) => {

    setSelectedFontStyle(value)
    const active = getActiveElement();
    if (!active || active.type !== "text") return;


    if (active.isTextHilighted()){
      active.applyStyleToSelection({ fontSize: value });
    }else{
      active.fontSize = +value;
    }


    // Recalculate wrapped lines and redraw everything
  //  active.updateLines?.();
    drawLower();
    drawUpper();
    drawArtboard()
  }

  const textAlignmentCallback = (value) => {

    setSelectedTextAlignment(value)
    const active = getActiveElement();
    if (!active || active.type !== "text") return;

    active.textAlign = value;

    // Recalculate wrapped lines and redraw everything
    //active.updateLines?.();
    drawLower();
    drawUpper();
    drawArtboard()
  }

  const textLineHeightCallback = (value) => {

    setSelectedTextLineHeight(value)
    const active = getActiveElement();
    if (!active || active.type !== "text") return;

    console.log('value', value)

    //active.lineHeight = +value;

    if (active.isTextHilighted()){
      active.applyStyleToSelection({ lineHeight: +value });
    }else{
        active.lineHeight = +value;
    }

    // Recalculate wrapped lines and redraw everything
   //active.updateLines?.();
    drawLower();
    drawUpper();
    drawArtboard()
  }

  const resizeImage = (fitType) => {


    const element = getActiveElement();

  if (!element || element.type !== 'image') return false

  const img = element

  const canvasWidth = lowerRef.current.width;
  const canvasHeight = lowerRef.current.height;
  // Calculate aspect ratios
  const canvasAspect = canvasWidth / canvasHeight;
  const imageAspect = img.width / img.height;

  let scaleX, scaleY;

  if (fitType === 'Fit Width'){
    // Determine the scale factors
    if (canvasAspect > imageAspect) {
        // Canvas is wider than the image
        scaleX = canvasWidth / img.width;
        scaleY = scaleX; // Maintain the same scale for uniformity
    } else {
        // Canvas is taller than the image
        scaleY = canvasHeight / img.h;
        scaleX = scaleY; // Maintain the same scale for uniformity
    }


    // Scale the image
    img.width = img.width * scaleX;
    img.h = img.h * scaleY;


  }else if (fitType === 'Fit Page'){



    scaleX = canvasWidth / img.width;
    scaleY = scaleX;

    img.width = img.width * scaleX;
    img.h = img.h * scaleY;


  }

  drawLower()
  drawUpper()
  drawArtboard()
}

const handleReplaceImage = () => {

}



  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: "100vw", height: "100vh", background: "#e9e9e9" }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <canvas
        ref={artboardRef}
        style={{ position: "absolute", top: 0, left: 0, cursor: "default"}}
      />
      <div
        ref={canvasContainerRef}
        style={{
          width: PAGE_WIDTH + (BLEED * 2),
          height: PAGE_HEIGHT + (BLEED * 2),
          position:'absolute',
          background: "white",
          boxShadow: "0 0",
          transformOrigin: "0 0",
          transform: `scale(${scale})`,
          willChange: 'transform'
        }}
      >
        <canvas
          ref={lowerRef}
          width={PAGE_WIDTH + (BLEED * 2)}
          height={PAGE_HEIGHT + (BLEED * 2)}
          style={{
            position: 'absolute',
            width: '100%'
          }}
        />
        <canvas
          ref={overlayRef}
          width={PAGE_WIDTH + (BLEED * 2)}
          height={PAGE_HEIGHT + (BLEED * 2)}
          style={{
            position: 'absolute',
            width: '100%',
            pointerEvents: "auto", // 👈 make sure it's not 'none'
          }}
        />
      </div>
      <canvas
        ref={toolsRef}
        style={{ position: "absolute", top: 0, left: 0}}
      />


      <canvas
        id='guides'
        ref={guidesRef}
        style={{ position: "absolute", top: 0, left: 0}}
      />

      <canvas
        ref={upperRef}
        style={{ position: "absolute", top: 0, left: 0, cursor: "default"}}
        onMouseDown={handleMouseDown}
        onMouseMove={drawCursor}
      />


      {/* tools */}
      <div className='canvas-left-side-toolbar dropshadow'>
        <Tool
          icon={{tool:'click.svg', toolActive:'click_active.svg'}}
          callBack={toolCallback}
          tool='size-position'
          label='Size & Position'
          position={'left'}
          activeTool={activeTool}
        />
        <Tool
          icon={{tool:'shape.svg', toolActive:'shape_active.svg'}}
          callBack={toolCallback}
          tool='shape'
          label='Shapes'
          position={'left'}
          activeTool={activeTool}
          >
            <div onClick={() => setShapeType('rectangle')} className={`tool-option ${shapeType === 'rectangle'? 'active':''}`}><img src='rectangle.svg' style={{marginRight:'5px', width:'15px'}}/>Rectangle</div>
            <div onClick={() => setShapeType('ellipse')} className={`tool-option ${shapeType === 'ellipse'? 'active':''}`}><img src='circle.svg' style={{marginRight:'5px', width:'15px'}}/>Ellipse</div>
            <div onClick={() => setShapeType('triangle')} className={`tool-option ${shapeType === 'triangle'? 'active':''}`}><img src='triangle.svg' style={{marginRight:'5px', width:'15px'}}/>Triangle</div>
        </Tool>
        <Tool
          icon={{tool:'draw.svg', toolActive:'draw_active.svg'}}
          callBack={toolCallback}
          tool='paint'
          label='Paint'
          position={'left'}
          activeTool={activeTool}
          >

            <div onClick={() => setPaintType('pen')} className={`tool-option ${paintType === 'pen'? 'active':''}`}><img src='pen.svg' style={{marginRight:'5px', width:'15px'}}/>Pen</div>
            <div onClick={() => setPaintType('air brush')} className={`tool-option ${paintType === 'air brush'? 'active':''}`}><img src='brush.svg' style={{marginRight:'5px', width:'15px'}}/>Air Brush</div>
              <div>
                <div style={{display:'flex', alignItems:'center', marginBottom:'15px'}}>
                    <label style={{marginRight:'5px'}}>Size</label>
                    <input style={{marginRight:'5px'}} type="range" id="size" min="5" max="500" value={brushSize} onChange={(e) => setBrushSize(e.target.value)}/>
                    <span className="size_display" style={{width:'30px'}}>{brushSize}</span>
                </div>

                {paintType === 'air brush' &&
                  <>
                    <div style={{display:'flex', alignItems:'center', marginBottom:'15px'}}>
                        <label style={{marginRight:'5px'}}>Hardness</label>
                        <input style={{marginRight:'5px'}} type="range" id="size" min="0" max="100" value={brushHardness} onChange={(e) => setBrushHardness(e.target.value)}/>
                        <span className="size_display"  style={{width:'30px'}}>{brushHardness}</span>
                    </div>
                    <div style={{display:'flex', alignItems:'center', marginBottom:'15px'}}>
                        <label style={{marginRight:'5px'}}>Opacity</label>
                        <input style={{marginRight:'5px'}} type="range" id="size" min="1" max="100" value={brushOpacity} onChange={(e) => setBrushOpacity(e.target.value)}/>
                        <span className="size_display" style={{width:'30px'}}>{brushOpacity}</span>
                    </div>
                    <div style={{display:'flex', alignItems:'center', marginBottom:'15px'}}>
                        <label style={{marginRight:'5px'}}>Flow</label>
                        <input style={{marginRight:'5px'}} type="range" id="size" min="1" max="100" value={brushFlow} onChange={(e) => setBrushFlow(e.target.value)}/>
                        <span id="sizeDisplay">{brushFlow}</span>
                    </div>
                  </>
                }
                {/*}
                <div style={{display:'flex', alignItems:'center', marginBottom:'15px'}}>
                    <label style={{marginRight:'5px'}}>Flow</label>
                    <input style={{marginRight:'5px'}} type="range" id="size" min="1" max="100" value={brushFlow} onChange={(e) => setBrushFlow(e.target.value)}/>
                    <span id="sizeDisplay">{brushFlow}</span>
                </div>
                */}
            </div>
        </Tool>
        <Tool
          icon={{tool:'eraser.svg', toolActive:'eraser_active.svg'}}
          callBack={toolCallback}
          tool='eraser'
          label='Eraser'
          position={'left'}
          activeTool={activeTool}
          >
              <div>
                <div style={{display:'flex', alignItems:'center', marginBottom:'15px'}}>
                    <label style={{marginRight:'5px'}}>Size</label>
                    <input style={{marginRight:'5px'}} type="range" id="size" min="5" max="500" value={eraserSize} onChange={(e) => setEraserSize(e.target.value)}/>
                    <span className="size_display" style={{width:'30px'}}>{eraserSize}</span>
                </div>
                <div style={{display:'flex', alignItems:'center', marginBottom:'15px'}}>
                    <label style={{marginRight:'5px'}}>Opacity</label>
                    <input style={{marginRight:'5px'}} type="range" id="size" min="1" max="100" value={eraserOpacity} onChange={(e) => setEraserOpacity(e.target.value)}/>
                    <span className="size_display" style={{width:'30px'}}>{eraserOpacity}</span>
                </div>
                <div style={{display:'flex', alignItems:'center', marginBottom:'15px'}}>
                    <label style={{marginRight:'5px'}}>Hardness</label>
                    <input style={{marginRight:'5px'}} type="range" id="size" min="0" max="100" value={eraserHardness} onChange={(e) => setEraserHardness(e.target.value)}/>
                    <span className="size_display"  style={{width:'30px'}}>{eraserHardness}</span>
                </div>

            </div>

        </Tool>
        <Tool
          icon={{tool:'text.svg', toolActive:'text_active.svg'}}
          callBack={toolCallback}
          tool='text'
          label='Text'
          position={'left'}
          activeTool={activeTool}
          >
            <div>
              <FontSelection callBack={fontSelectionCallback} selectedFont={selectedFont}/>
              <FontStyleSelection  callBack={fontStyleSelectionCallback}  selectedFontStyle={selectedFontStyle} fontStyles={fontStyles}/>
              <div style={{display:'flex'}}>
                <div style={{flex:1, marginRight:5}}>
                  <FontSizeComponent callBack={fontSizeInputCallback} fontSize={fontSize}/>
                </div>
                <div style={{flex:1, marginLeft:5}}>
                  <FontWeightSelection  callBack={fontWeightSelectionCallback}  selectedFontWeight={selectedFontWeight} fontWeights={fontWeights}/>
                </div>
              </div>
              <TextAlignmentComponent callBack={textAlignmentCallback} selectedTextAlignment={selectedTextAlignment}/>

              <button className='btn primary' onClick={addText}>Add Text</button>
            </div>
        </Tool>
        <Tool
          icon={{tool:'image.svg', toolActive:'image_active.svg'}}
          callBack={toolCallback}
          tool='images'
          label='Add Image'
          position={'left'}
          activeTool={activeTool}
          >
            <div>

              <button className='btn primary' onClick={addImage}>Add Image</button>
            </div>
        </Tool>
        <FillColourPicker
          //callBack={toolCallback}
          tool='fill-colour-picker'
          label='Fill Colour'
          activeTool={activeTool}
          position={'left'}
          fillColourCallBack={fillColourCallBack}
        />
        <StrokeColourPicker
          //callBack={toolCallback}
          tool='stroke-colour-picker'
          label='Stroke Colour'
          activeTool={activeTool}
          position={'left'}
          strokeColourCallBack={strokeColourCallBack}
        />
      </div>
      <div ref={topToolbarRef} className='canvas-top-toolbar dropshadow'>
        <div style={{display:'flex', alignItems:'center'}}>
          <div  style={{marginLeft: 'auto', padding:'0px 15px'}}>
            {scalePercentage &&
              <Percentage
                scalePercentage={scalePercentage}
                setScale={setScale}
                resize={resize}
              />
            }

          </div>
          <Download canvas={lowerRef.current}/>
          <div style={{width:'50px'}}>
          </div>
        </div>
      </div>
      {activeElementJson &&
        <div
          className='tool-tip dropshadow'
          style={{
          position:'absolute',
          left: (offsetRef.current.x + activeElementJson.cx * scale),
          top: (offsetRef.current.y + activeElementJson.cy * scale) - (activeElementJson.h / 2 * scale),
          background:'#fffff',
          padding:'5px 15px 5px 5px',
          transform: 'translate(-50%, -100%)',
          marginTop: activeElementJson.rotate === 0?'-25px':'-75px',
          borderRadius:'10px',
          display:'flex',
          alignItems:'center',
          background:'#ffffff',

        }}>
          {(activeElementJson.type === 'text') &&
            <>
              <div>
                <Tool
                  icon={{tool:'edit_text.svg', toolActive:'edit_text_active.svg'}}
                  callBack={toolCallback}
                  tool='edit text'
                  label='Edit Text'
                  position={'tool_tip'}
                  activeTool={activeTool}
                />
              </div>
              <div style={{margin: '0px 0px 0px 0px', width:150}}>
                <FontSelection callBack={fontSelectionCallback} selectedFont={selectedFont}/>
              </div>
              {fontWeights.length>0&&
                <div style={{margin: '0px 0px 0px 15px', width:90}}>
                  <FontWeightSelection  callBack={fontWeightSelectionCallback}  selectedFontWeight={selectedFontWeight} fontWeights={fontWeights}/>
                </div>
              }
              {fontStyles.length>0&&
                <div style={{margin: '0px 0px 0px 15px', width:130}}>
                  <FontStyleSelection  callBack={fontStyleSelectionCallback}  selectedFontStyle={selectedFontStyle} fontStyles={fontStyles}/>
                </div>
              }
              <div style={{margin: '0px 0px 0px 15px', width:90}}>
                <FontSizeComponent callBack={fontSizeInputCallback} fontSize={fontSize}/>
              </div>
              <div style={{margin: '0px 0px 0px 15px', width:90}}>
                <TextAlignmentComponent callBack={textAlignmentCallback} selectedTextAlignment={selectedTextAlignment}/>
              </div>
              <div style={{margin: '0px 0px 0px 15px', width:90}}>
                <TextLineHeightComponent callBack={textLineHeightCallback} selectedTextLineHeight={selectedTextLineHeight}/>
              </div>
            </>
          }
          {(activeElementJson.type === 'image') &&
          <>
            {/*}<img src='/replace_image.svg' onClick={handleReplaceImage} style={{width:'28px', marginRight:'10px'}} alt='Replace Image'/>*/}
            <img src='/fit_width.svg' onClick={() => resizeImage('Fit Width')} style={{width:'28px', marginRight:'10px'}} alt='Fit Width'/>
            <img src='/fit_page.svg' onClick={() => resizeImage('Fit Page')} style={{width:'28px', marginRight:'10px'}} alt='Fit Page'/>
          </>
        }
        </div>

      }
      <textarea ref={textEditRef} id="hidden-input"></textarea>

    </div>
  );
}


const Percentage = ({
  scalePercentage,
  setScale,
  resize
}) => {
  const [open, setOpen] = useState(false)

  return(
    <div style={{position:'relative'}}>
      <div onClick={() => setOpen(prev => !prev)}>
        <div className={`${open?'active':''} ${'zoom_tab'}` } style={{display:'flex', alignItems:'center'}}>
          <p>{scalePercentage}%</p>
          <img style={{width: '25px'}} src={open?'arrow_down_active.svg':'arrow_down.svg'}/>
        </div>
      </div>
      {open &&
        <div style={{position:'absolute', marginTop: '10px'}} className='canvas-zoom-dropdown dropshadow'>
          <p onClick={() => setScale(prev => prev * 1.25)}>Zoom In <span>⌘+</span></p>
          <p onClick={() => setScale(prev => prev / 1.25)}>Zoom Out <span>⌘-</span></p>
          <p onClick={() => setScale(1)}>100% <span>⌘1</span></p>
          <p onClick={() => resize('scale to fit')}>Fit to screen <span>⌘0</span></p>
          <p onClick={() => resize('scale to cover')}>Fill screen</p>
        </div>
      }
    </div>
  )
}

const Download = ({canvas}) => {
  const [open, setOpen] = useState(false)

  return(
    <div style={{position:'relative'}}>
      <button onClick={() => setOpen(prev => !prev)} className='btn primary'>Download</button>
      {open &&
        <div style={{position:'absolute', marginTop: '10px'}} className='canvas-zoom-dropdown dropshadow'>
          <p onClick={() => saveAsPng(canvas, 300)}>Save as PNG</p>
          <p onClick={() => saveAsJpg(canvas, 300)}>Save as JPG</p>

        </div>
      }
    </div>
  )
}


const Tool = ({
  icon,
  callBack,
  tool,
  label,
  position,
  activeTool,
  children
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(()=>{
    if (activeTool === tool){
      setIsOpen(true)
    }else{
      setIsOpen(false)
    }
  },[activeTool, tool])

  return(
    <div style={{width: '100%', padding: '5px 10px'}}>
      <div onClick={() => callBack(tool, !isOpen)} className={`${isOpen?'active':null} ${'tool_tip'} ${'tool-icon-container'}`} style={{padding:'2px'}}>
        <img className="tool-icon" src={isOpen?icon.toolActive:icon.tool} />
      </div>
      {(isOpen && position !== 'tool_tip') &&
        <div className={`dropshadow ${position==='left'? 'side_menu_left':'side_menu_right'}`}>
          <div style={{display:'flex'}}><strong><p style={{paddingLeft:'10px'}}>{label}</p></strong><img onClick={() => callBack(tool, !isOpen)} src='close.svg' style={{width:'20px', marginLeft:'auto'}}/></div>
          {children}
        </div>
      }
    </div>
  )
}


const FillColourPicker = ({
  //callBack,
  tool,
  label,
  activeTool,
  position,
  fillColourCallBack
}) => {

const [isOpen, setIsOpen] = useState(false);
const [colour, setColour] = useState({
  r: 0,
  g: 0,
  b: 0,
  a: 1,
})

const isWhite =
  colour.r === 255 &&
  colour.g === 255 &&
  colour.b === 255 &&
  colour.a === 1;


useEffect(()=>{
  if (activeTool === tool){
    setIsOpen(true)
  }else{
    setIsOpen(false)
  }
},[activeTool, tool])



const  handleClose = () => {
    setIsOpen(false)
  };

const  handleChange = (color) => {
    setColour(color.rgb)
    fillColourCallBack(color.rgb)
  };




    return (
      <div style={{position:'relative', width: '100%', padding: '5px 10px'}}>
        <div className={`${isWhite? 'colour-border':"" }`} style={{margin:'0 auto', width:25, height:25, borderRadius:'50%', background: `rgba(${ colour.r }, ${ colour.g }, ${ colour.b }, ${ colour.a })`,}} onClick={() => setIsOpen(prev => !prev)}>
        </div>
        { isOpen ? <div className={`dropshadow ${position==='left'? 'side_menu_left':'side_menu_right'}`}>
          <div style={{display:'flex'}}><strong><p style={{paddingLeft:'10px'}}>{label}</p></strong><img onClick={handleClose} src='close.svg' style={{width:'20px', marginLeft:'auto'}}/></div>
          <SketchPicker color={ colour } onChange={ handleChange } />
        </div> : null }
      </div>
    )

}

const StrokeColourPicker = ({
  //callBack,
  tool,
  label,
  activeTool,
  position,
  strokeColourCallBack
}) => {

const [isOpen, setIsOpen] = useState(false);
const [colour, setColour] = useState({
  r: 0,
  g: 0,
  b: 0,
  a: 1,
})

const isWhite =
  colour.r === 255 &&
  colour.g === 255 &&
  colour.b === 255 &&
  colour.a === 1;


useEffect(()=>{
  if (activeTool === tool){
    setIsOpen(true)
  }else{
    setIsOpen(false)
  }
},[activeTool, tool])


const  handleClose = () => {
    setIsOpen(false)
  };

const  handleChange = (color) => {
    setColour(color.rgb)
    strokeColourCallBack(color.rgb)
  };



    return (
      <div style={{position:'relative', width: '100%', padding: '5px 10px'}}>
        <div className={`${isWhite? 'colour-border-stroke':"" }`} style={{margin:'0 auto', width:30, height:30, borderRadius:'50%', borderStyle: 'solid', borderWidth: 5, borderColor: `rgba(${ colour.r }, ${ colour.g }, ${ colour.b }, ${ colour.a })`,}} onClick={() => setIsOpen(prev => !prev)}>
        </div>
        { isOpen ? <div className={`dropshadow ${position==='left'? 'side_menu_left':'side_menu_right'}`}>
          <div style={{display:'flex'}}><strong><p style={{paddingLeft:'10px'}}>{label}</p></strong><img onClick={handleClose} src='close.svg' style={{width:'20px', marginLeft:'auto'}}/></div>
          <SketchPicker color={ colour } onChange={ handleChange } />
        </div> : null }
      </div>
    )

}

const FontSelection = ({callBack, selectedFont}) => {

  const [font, setFont] = useState('');

  useEffect(()=>{
    setFont(selectedFont)
  },[selectedFont])


  const setFontFunction = (value) => {

    setFont(value)
    callBack(value)
  }

  return(
    <div>
      <p className='font-label'>Font</p>
      <select id="font" className="form-input select font-label-input" onChange={(e) => setFontFunction(e.target.value)} value={font}>
        {fonts.map((font, index)=>{
          return <option key={index} value={font.label}>{font.label}</option>
        })
        }
      </select>
    </div>
  )

}

const FontWeightSelection = ({callBack, selectedFontWeight, fontWeights}) => {

  const [fontWeight, setFontWeight] = useState(selectedFontWeight);

  useEffect(()=>{
    setFontWeight(selectedFontWeight)
  },[selectedFontWeight])


  const setFontWeightFunction = (value) => {

    setFontWeight(value)
    callBack(value)
  }

  return(
    <div>
      <p className='font-label'>Font Weight</p>
      <select id="font-weight" className="form-input select font-label-input" onChange={(e) => setFontWeightFunction(e.target.value)} value={fontWeight}>
        {fontWeights.map((fontWeight, index)=>{
          return <option key={index} value={fontWeight}>{fontWeight}</option>
        })
        }
      </select>
    </div>
  )

}

const FontStyleSelection = ({callBack, selectedFontStyle, fontStyles}) => {

  const [fontStyle, setFontStyle] = useState(selectedFontStyle);

  useEffect(()=>{
    setFontStyle(selectedFontStyle)
  },[selectedFontStyle])


  const setFontStyleFunction = (value) => {

    setFontStyle(value)
    callBack(value)
  }

  return(
    <div>
      <p className='font-label'>Font Styles</p>
      <select id="font-weight" className="form-input select font-label-input" onChange={(e) => setFontStyleFunction(e.target.value)} value={fontStyle}>
        {fontStyles.map((fontStyle, index)=>{
          return <option key={index} value={fontStyle}>{fontStyle}</option>
        })
        }
      </select>
    </div>
  )

}

const FontSizeComponent = ({callBack, fontSize}) => {
  const [fontSizeValue, setFontSizeValue] = useState(fontSize);

  useEffect(()=>{
    setFontSizeValue(fontSize)
  },[fontSize])

  const setFontSizeFunction = (value) => {

    setFontSizeValue(value)
    callBack(value)
  }

  return(
    <div>
      <p className='font-label'>Font Size</p>
      <input id='font-size' className="form-input input font-label-input" value={fontSizeValue} type='number' onChange={(e) => setFontSizeFunction(e.target.value)}/>
    </div>
  )

}

const TextAlignmentComponent = ({callBack, selectedTextAlignment}) => {
  const [activeAlignment, setActiveAlignment] = useState(selectedTextAlignment);
  useEffect(()=>{
    setActiveAlignment(selectedTextAlignment)
  },[selectedTextAlignment])

  const setAlignmentFunction = (value) => {

    setActiveAlignment(value)
    callBack(value)
  }
return(
  <div>
    <p className='font-label'>Align</p>
    <div style={{display:'flex', alignItems:'center', height: '38px', margin: '5px 0px 10px 0px'}}>
        <img style={{width:30}} src={activeAlignment === 'left'? '/text_align_left_active.svg':'/text_align_left.svg'} onClick={() => setAlignmentFunction('left')}/>
        <img style={{width:30}} src={activeAlignment === 'center'? '/text_align_center_active.svg':'/text_align_center.svg'} onClick={() => setAlignmentFunction('center')}/>
        <img style={{width:30}} src={activeAlignment === 'right'? '/text_align_right_active.svg':'/text_align_right.svg'} onClick={() => setAlignmentFunction('right')}/>
    </div>
  </div>
)
}

const TextLineHeightComponent = ({callBack, selectedTextLineHeight}) => {
  const [activeLineHeight, setActiveLineHeight] = useState(selectedTextLineHeight);

  useEffect(()=>{
    setActiveLineHeight(selectedTextLineHeight)
  },[selectedTextLineHeight])

  const setLineHeightFunction = (value) => {

    setActiveLineHeight(value)
    callBack(value)
  }
return(
  <div>
    <p className='font-label'>Line Height</p>
    <input id='line-Height' className="form-input input font-label-input" value={activeLineHeight} type='number' onChange={(e) => setLineHeightFunction(e.target.value)}/>
  </div>
)
}
