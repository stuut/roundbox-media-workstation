'use client'

import { useEffect, useRef, useState } from "react";
import { saveAsPng, saveAsjpg } from "@/lib/save-canvas"
import { SketchPicker } from 'react-color'
import { BufferedBrush } from "@/lib/buffered-brush"
import '@/app/canvas_styles.css'

const PAGE_WIDTH = 2480;
const PAGE_HEIGHT = 3508;
const HANDLE_SIZE = 6;
const ELEMENT_PADDING = 0
const ROTATE_DISTANCE = 40;
const TRANSFORM_COLOUR = 'rgb(65 95 145)'
const HANDLE_FILL_COLOUR = '#ffffff'
const TRANSFORM_WIDTH = 1


export default function TwoCanvasDesign() {
  const upperRef = useRef(null);
  const lowerRef = useRef(null);
  const overlayRef = useRef(null);
  const toolsRef = useRef(null);
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
    { id: 1, x: 200, y: 200, w: 400, h: 300 }
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


  class Element {
  constructor({
    id,
    x = 0,
    y = 0,
    type = null,
    cx,            // optional — will default to x
    cy,            // optional — will default to y
    w = 100,
    h = 100,
    angle = 0,
    fill = null,
    strokeColour = null,
    strokeWeight = 0,
    opacity = 1,
    text = null,
    fontSize = 18,
    maxWidth = 200,
    lineHeight = 1.2,
    font,          // optional — will default to `${fontSize}px Arial`
    textAlign = 'left',
    lines = [],
    totalWidth = 0,
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

  } = {}) {
    // Basic properties
    this.id = id;
    this.x = x;
    this.y = y;
    this.type = type;

    // ✅ Auto-calculate if not provided
    this.cx = cx ?? x;
    this.cy = cy ?? y;

    this.w = w;
    this.h = h;
    this.angle = angle;
    this.fill = fill;
    this.strokeColour = strokeColour;
    this.strokeWeight = strokeWeight;
    this.opacity = opacity;

    this.text = text;
    this.fontSize = fontSize;
    this.maxWidth = maxWidth;
    this.lineHeight = lineHeight;
    this.textPadding = 25;
    this.textAlign = textAlign

    // ✅ Auto-generate font if not supplied
    this.font = font || `${fontSize}px Arial, sans-serif`;

    this.lines = lines;
    this.totalWidth = totalWidth;
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

    // ✅ Only update lines if text exists and canvas context is available
    if (this.text && typeof lowerRef?.current?.getContext === 'function') {

      this.updateLines();
    }
  }

  getLines(){
    return this.lines
  }

  updateLines() {

    const ctx = lowerRef.current.getContext('2d');
    if (!ctx) return;

    ctx.font = this.font;
    this.lines = [];

    const paragraphs = this.text.split('\n');

    paragraphs.forEach(paragraph => {
      if (paragraph.trim() === '') {
        this.lines.push('');
        return;
      }

      const words = paragraph.split(' ');
      let currentLine = '';

      words.forEach(word => {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const testWidth = ctx.measureText(testLine).width;

        if (testWidth > this.maxWidth && currentLine) {
          this.lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });

      if (currentLine) {
        this.lines.push(currentLine);
      }
    });

    this.totalWidth = Math.min(
      this.maxWidth,
      Math.max(...this.lines.map(line => ctx.measureText(line).width + this.textPadding*2))
    );
    this.totalHeight = this.lines.length * this.fontSize * this.lineHeight + this.textPadding;

    this.w = this.totalWidth
    this.h = this.totalHeight
    console.log('this.h', this.h)
    this.cx = this.x + this.totalWidth / 2
    this.cy = this.y + this.totalHeight / 2
  }

  placeCaretAtMouse(cursor){
    const ctx = lowerRef.current.getContext('2d');
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;

    // Find which character was clicked
    let pos = 0;
    for (let i = 0; i <= this.text.length; i++) {
      const width = ctx.measureText(this.text.slice(0, i)).width;

      if (cursor.x < width) {
        pos = i;
        break;
      }
      pos = this.text.length;
    }
    this.caretAbsIndex = pos
  }

  updateSize(){

    const ctx = lowerRef.current.getContext('2d');
    if (!ctx) return;

    this.w = Math.min(
      this.maxWidth,
      Math.max(...this.lines.map(line => ctx.measureText(line).width))
    );

    this.h = this.lines.length * this.fontSize * this.lineHeight;

  }

  getCharacterPosition(pos){
    const ctx = lowerRef.current.getContext("2d");
    if (!ctx) return;
    const lineHeight = this.fontSize * this.lineHeight
    const relY = (pos.y - this.y) / lineHeight;
    const clickedRow = Math.min(Math.floor(relY), this.lines.length - 1);
    const line = this.lines[clickedRow] || "";
    let col = 0;
    for (let i = 1; i <= line.length; i++) {
      const w = ctx.measureText(line.slice(0, i)).width;
      const offsetX = this.getLineOffset(line, this.textAlign, ctx, this.w, this.textPadding);

      if (this.x + w + offsetX > pos.x) {
        col = i - 1;
        break;
      }
      col = i;
    }

    return {line: clickedRow, char:col}

  }

  drawHilightText(ctx) {
    ctx.font = this.font;
    const lineHeight = this.fontSize * this.lineHeight;

    // Normalize selection order (start always before end)
    let start = this.selectionStart;
    let end = this.selectionEnd;
    if (!start || !end) return this.drawText(ctx); // no selection

    if (
      start.line > end.line ||
      (start.line === end.line && start.char > end.char)
    ) {
      [start, end] = [end, start];
    }

    let lineCounter = 0

    this.lines.forEach((line, index) => {
      const lineY = this.y + lineHeight * index;

      // Only draw highlight for affected lines
      if (index >= start.line && index <= end.line) {
        const startChar = index === start.line ? start.char : 0;
        const endChar = index === end.line ? end.char : line.length;

        const prefix = line.slice(0, startChar);
        const selected = line.slice(startChar, endChar);


        const prefixWidth = ctx.measureText(prefix).width;
        const selectedWidth = ctx.measureText(selected).width;

        const highlightX = this.x + prefixWidth;
        const highlightY = lineY + this.fontSize * 0.3; // vertical adjustment (fine-tune)
        const highlightHeight = this.fontSize * this.lineHeight * 1;

        // Draw highlight
        ctx.fillStyle = "rgba(0, 120, 215, 0.3)";

        let offsetX


        offsetX = this.getLineOffset(line, this.textAlign, ctx, this.w, this.textPadding);



        ctx.fillRect(highlightX + offsetX, highlightY, selectedWidth, highlightHeight);
        lineCounter ++

      }
  });

  // Then draw normal text on top
  this.drawText(ctx);
}


  drawText(ctx) {
      cxt.save()
      console.log('ctx.font', ctx.font)
      ctx.font = this.font;
      console.log('ctx.font', ctx.font)
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = this.fill;
      // Draw each line
      this.lines.forEach((line, index) => {
        const lineY = this.y + (this.fontSize * this.lineHeight) * (index + 1)
        const textWidth = ctx.measureText(line).width;
        const offsetX = this.getLineOffset(line, this.textAlign, ctx, this.w, this.textPadding);

        ctx.fillText(line, this.x + offsetX, lineY);

      });
      cxt.restore()
  }

getLineOffset(line, align, ctx, boxWidth, padding) {
  cxt.save()
  ctx.font = this.font;
  const textWidth = ctx.measureText(line).width;
  cxt.restore()
  console.log('getLineOffset textWidth', textWidth )
  if (align === "center") return (boxWidth - textWidth) / 2;
  if (align === "right") return boxWidth - textWidth - padding;
  return padding; // left
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
      localX >= -obj.w / 2 &&
      localX <= obj.w / 2 &&
      localY >= -obj.h / 2 &&
      localY <= obj.h / 2
    );
  }
}

const addText = () => {

  const newObj =  new Element({
    id: objectsRef.current.length+1,
    x:lowerRef.current.width/2,
    y:lowerRef.current.height/2,
    //cx:lowerRef.current.width/2,
    //cy:lowerRef.current.height/2,
    fontSize:70,
    text:'New text\nanother line',
    fill:fillColour,
    textAlign:'center',
    maxWidth : 500,
    lineHeight : 1.2,
    type:'text',
  })

 objectsRef.current.push(newObj);
 selectedIndexRef.current = objectsRef.current.length - 1

 const lower = lowerRef.current;
 if (!lower) return;
 const ctx = lower.getContext("2d");

 objectsRef.current[selectedIndexRef.current].drawText(ctx)

 setActiveElement(newObj)

  drawUpper();

}


useEffect(()=>{

  if (activeElement){
    setActiveElementJson({...activeElement})
  }else{
    setActiveElementJson(null)
  }

},[activeElement])

function updateToolBarPosition(obj){
  setActiveElementJson({...obj})
}



  const resize = (size='scale to fit') => {
    const artboard = artboardRef.current;
    const upper = upperRef.current;
    const cursor = toolsRef.current;

    const lower = lowerRef.current;
    const topToolbar = topToolbarRef.current
    const container = containerRef.current
    const canvasContainer = canvasContainerRef.current



    if (!upper || !lower || !topToolbar || !container) return;

    //const windowWidth = window.innerWidth
    //const windowHeight = window.innerHeight

    const containerWidth = container.offsetWidth
    const containerHeight = container.offsetHeight - topToolbar.offsetHeight



    //set size of upper canvas and artboard to fullsize
    upper.width = containerWidth;
    upper.height = containerHeight;

    cursor.width = containerWidth;
    cursor.height = containerHeight;

    artboard.width = containerWidth;
    artboard.height = containerHeight

    const lowerRect = lower.getBoundingClientRect();
    const upperRect = upper.getBoundingClientRect();


    let displayWidth = PAGE_WIDTH;
    let displayHeight = PAGE_HEIGHT;


    const scaleX = containerWidth / PAGE_WIDTH;
    const scaleY = containerHeight / PAGE_HEIGHT;

    const scaleToFit = Math.min(scaleX, scaleY);
    const scaleToCover = Math.max(scaleX, scaleY);

    let scaleMaths

    if (size === 'scale to fit'){
      scaleMaths = Math.min(scaleX, scaleY);
    }else if (size === 'scale to cover'){
      scaleMaths = Math.max(scaleX, scaleY);
    }

      displayWidth *= scaleMaths ;
      displayHeight *= scaleMaths ;


    const left = (containerWidth - displayWidth) / 2;
    const top = (containerHeight - displayHeight) / 2 + topToolbar.offsetHeight + 50;

    canvasContainer.style.left = `${left}px`;
    canvasContainer.style.top = `${top}px`;

    setScale(scaleMaths);
    scaleRef.current = scaleMaths

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

    if (!artboard) return;

    const ctx = artboard.getContext("2d");
    ctx.clearRect(0, 0, artboard.width, artboard.height);


    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    ctx.clearRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
    ctx.save();

    if (isPanning.current) {
      ctx.translate(panXRef.current, panYRef.current);
    }

    objectsRef.current.forEach(obj => {
      const {cx, cy, w, h, angle, fill  } = obj;

      ctx.save(); // fresh per object
      ctx.translate(offset.x + cx * scale , offset.y + cy * scale);   // move to object center
      ctx.rotate(angle);    // apply rotation



      ctx.beginPath();
      if (obj.type === "rectangle") {
        // Rectangle: draw centered rect
        ctx.rect((-obj.w / 2) * scale, (-obj.h / 2) * scale, obj.w * scale, obj.h * scale);
      } else if (obj.type === "ellipse") {
        // Ellipse: radii are half width/height
        ctx.ellipse(0, 0, obj.w / 2 * scale, obj.h / 2 * scale, 0, 0, Math.PI * 2);
      } else if (obj.type === "triangle"){
        ctx.rect((-obj.w / 2) * scale, (-obj.h / 2) * scale, obj.w * scale, obj.h * scale); // centered at (0,0)

      }
      ctx.closePath();

      // Fill first
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

    const offset = offsetRef.current;

    if (object.type !== 'pen' && object.type !== 'air brush'){

    const { cx, cy, w, h, angle } = object;
    // Apply global pan + zoom
    const screenCx = offset.x + cx * scale;
    const screenCy = offset.y + cy * scale;

    const screenW = w * scale
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
      { x:  -screenW / 2, y:  0, type:'side' }, // left
      { x:  screenW / 2, y:  0, type:'side' }, // right
      { x:  0, y:  -screenH / 2, type:'side' }, // top
      { x:  0, y:  screenH / 2, type:'side' }, // bottom
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
      }else{
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
      }
    });
    // Draw rotate handle: top-center + distance
    ctx.beginPath();
    ctx.arc(0, +screenH / 2 + ROTATE_DISTANCE, HANDLE_SIZE * 2, 0, 2 * Math.PI);
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
    ctx.clearRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
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

      if (obj.type === "rectangle") {
        ctx.translate(obj.cx, obj.cy);
        ctx.rotate(obj.angle);
        // Rectangle: draw centered rect
        ctx.rect(-obj.w / 2, -obj.h / 2, obj.w, obj.h);
      } else if (obj.type === "ellipse") {
        ctx.translate(obj.cx, obj.cy);
        ctx.rotate(obj.angle);
        // Ellipse: radii are half width/height
        ctx.ellipse(0, 0, obj.w / 2, obj.h / 2, 0, 0, Math.PI * 2);
      } else if (obj.type === "triangle"){
        ctx.translate(obj.cx, obj.cy);
        ctx.rotate(obj.angle);
        ctx.rect(-obj.w / 2, -obj.h / 2, obj.w, obj.h); // centered at (0,0)
        ctx.moveTo(0, -obj.h / 2);
        ctx.lineTo(-obj.w/2, obj.h / 2);
        ctx.lineTo(obj.w/2, obj.h / 2);
      }else if (obj.type === "pen"){
           drawPen(ctx, obj.points, obj.fill, obj.brushSize);
      }else if (obj.type === "air brush"){
          if (obj.airbrushBuffer){
            ctx.globalAlpha = obj.brushOpacity/100;
            ctx.drawImage(obj.airbrushBuffer, 0, 0);
            ctx.globalAlpha = 1;
          }
      }else if (obj.type === "text"){
        if (textHilightRef.current === true){
          obj.drawHilightText(ctx)
        }else{
          ctx.translate(obj.cx, obj.cy);
          ctx.rotate(obj.angle);
          obj.drawText(ctx)
        }
      }
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

  // Redraw when objects, scale, offset, or zoom changes
  useEffect(() => {
    drawLower();
  }, [scale]);


  useEffect(() => {
    drawArtboard();
  }, [scale]);


  // Redraw when objects, scale, offset, or zoom changes
  useEffect(() => {
    drawUpper();
  }, [scale]);



  const zoomIn = (mouseX, mouseY) => {
    setZoom(prev => prev * SCALE_FACTOR)
    //panXRef.current -= (mouseX - panXRef.current) * (SCALE_FACTOR - 1);
  //  panYRef.current -= (mouseY - panYRef.current) * (SCALE_FACTOR - 1);
  }

  const checkRotateHandleHit = (object, mouseX, mouseY) => {
    const x = object.x;
    const y = object.y;
    const w = object.w;
    const h = object.h;


    const cx = x + w / 2;
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

  let {w, h} = object;

  //w = w+ELEMENT_PADDING
  //h = h+ELEMENT_PADDING

  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const localCorners = [
    { x: -w / 2, y: -h / 2 }, // top-left
    { x:  w / 2, y: -h / 2 }, // top-right
    { x: -w / 2, y:  h / 2 }, // bottom-left
    { x:  w / 2, y:  h / 2 }  // bottom-right
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

const getSideHandlePolygons = (object) => {
  const { x, y, cx, cy, w, h, angle } = object;

  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const localCorners = [
    { x: -w / 2, y: 0 }, // left
    { x:  w / 2, y: 0 }, // right
    { x: 0, y: -h / 2 },  // top
    { x: 0, y:  h / 2 }  // bottom
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
  const polygons = getSideHandlePolygons(object);

  for (let i = 0; i < polygons.length; i++) {
    if (hitPolygon(mouseX, mouseY, polygons[i])) {
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




  const addToRectangletoCanvas = (x, y, w, h) => {

    const lower = lowerRef.current;
    if (!lower) return;
    const ctx = lower.getContext("2d");
    ctx.fillStyle = "green"
    ctx.fillRect(x, y, w, h);

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
      localX >= -obj.w / 2 &&
      localX <= obj.w / 2 &&
      localY >= -obj.h / 2 &&
      localY <= obj.h / 2
    );
  };

  const hitHandle = (obj, mx, my) => {
    const corners = [
      { x: obj.x, y: obj.y },
      { x: obj.x + obj.w, y: obj.y },
      { x: obj.x, y: obj.y + obj.h },
      { x: obj.x + obj.w, y: obj.y + obj.h },
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

      console.log('handleMouseDown', isTextEditingRef.current)

    if (isTextEditingRef.current){
      textHilightRef.current = true
      const object = getActiveElement()
      if (hitObject(object, pos.x, pos.y)) {


        lastPointRef.current = pos
        const position = object.getCharacterPosition(pos)

        console.log('position', position)

        object.selectionStart = object.getCharacterPosition(pos)
        object.selectionEnd = object.getCharacterPosition(pos)
        // convert (row, col) → absolute caret index
        object.caretAbsIndex = object.getIndexFromCaretPos(position.line, position.char);
        // re-sync and re-focus hidden input



          syncInputCaret(object);
          textEditRef.current.focus();
          requestAnimationFrame(() => textEditRef.current.focus());
          console.log('handleMouseDown startCaretBlink' )
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


  const handleMouseMove = (e) => {

    const pos = getMousePos(e);

    if (!pos) return

    const resizing = resizingRef.current
    const resizingSide = resizingSideRef.current
    const textEditing = isTextEditingRef.current


    const rotating = rotatingRef.current
    const panning = isPanning.current
    const dragging = draggingRef.current; // snapshot so it doesn’t change mid-execution

    if (textEditing && textHilightRef.current){
      const object = getActiveElement()



      if (hitObject(object, pos.x, pos.y)) {

        const distance = Math.sqrt((pos.x - lastPointRef.current.x) ** 2 + (pos.y - lastPointRef.current.y) ** 2);

        if (distance > 0.1){
            stopCaretBlink();
            clearCursor()
            object.selectionEnd = object.getCharacterPosition(pos)
          //  syncInputCaret(object)
            drawLower()

        }else{
          startCaretBlink();
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
        const { index, corner } = resizing;
        const obj = objectsRef.current[index];

        const keepRatio = e.shiftKey;
        const aspect = obj.w / obj.h;

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

        obj.w = halfW * 2;
        obj.h = halfH * 2;
        obj.maxWidth = halfW * 2;

        // DO NOT TOUCH obj.cx / obj.cy
        objectsRef.current[index] = obj;

        //console.log('objectsRef.current[index] resize', objectsRef.current[index])

        drawLower();
        drawUpper();
        drawArtboard();
        return;
      }

      // resize Side
      if (resizingSide) {
        const { index, side } = resizingSide; // side = 0: top, 1: right, 2: bottom, 3: left
        const obj = objectsRef.current[index];
        // Transform mouse → local object space
        //dx = pos.x - obj.cx → the difference in x between the mouse and the object’s center.
        //dy = pos.y - obj.cy → the difference in y between the mouse and the object’s center.
        const dx = pos.x - obj.cx;
        const dy = pos.y - obj.cy;

        //inverse of the object’s rotation Now we can treat it like a plain rectangle without worrying about rotation
        const cos = Math.cos(-obj.angle);
        const sin = Math.sin(-obj.angle);
        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;

        // Current local bounds (centered at 0,0)
        let left   = -obj.w / 2;
        let right  =  obj.w / 2;
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
        obj.w = newW;
        obj.h = newH;
        obj.cx += worldDx;
        obj.cy += worldDy;
        obj.x = obj.cx - obj.w / 2;
        obj.y = obj.cy - obj.h / 2;

        objectsRef.current[index] = obj;


        drawLower();
        drawUpper();
        drawArtboard();
        return;
      }


      if (rotating){

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
        const dx = pos.x - dragging.startX;
        const dy = pos.y - dragging.startY;

        if (objectsRef.current) {

          const index = selectedIndexRef.current
          const obj = objectsRef.current[index];
          obj.cx = obj.cx + dx;
          obj.cy = obj.cy + dy;
          obj.x = obj.cx - obj.w/2
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
        let w = Math.abs(pos.x - dragging.startX);
        let h = Math.abs(pos.y - dragging.startY);

        if (e.shiftKey) {
          // enforce equal width & height
          const size = Math.max(w, h);
          w = size;
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

        obj.w = w;
        obj.h = h;

        //console.log('obj', obj)

        drawLower();
        drawUpper();
        drawArtboard();


      }else if (shapeType === 'ellipse'){
        const index = selectedIndexRef.current
        const obj = objectsRef.current[index];
        if (!obj) return

        const w = Math.abs(pos.x - dragging.startX);
        const h = Math.abs(pos.y - dragging.startY);

        if (e.shiftKey) {
          // perfect circle
          const size = Math.min(w, h);
          obj.w = size;
          obj.h = size;
        } else {
          // free ellipse
          obj.w = w;
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
        let w = Math.abs(pos.x - dragging.startX);
        let h = Math.abs(pos.y - dragging.startY);

        if (e.shiftKey) {
          // enforce equal width & height
          const size = Math.max(w, h);
          w = size;
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

        obj.w = w;
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
      if (!obj) return

    }

    isPanning.current = false;
    draggingRef.current = null
    resizingRef.current = null
    resizingSideRef.current = null
    rotatingRef.current = false
    lastPointRef.current = null
    isPaintingRef.current = false;
    isErasingRef.current = false;
    textHilightRef.current = false

console.log('textHilightRef.current mouse up', textHilightRef.current)

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
    const { cx, cy, w, h, angle } = obj;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // Half dimensions
    const hw = w / 2;
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

      console.log('isTextEditingRef.current', isTextEditingRef.current)

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
    drawLower();
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
      //obj.insertTextAtCaret(inserted);

      /*
      if (diff > 0) {
    // Text inserted
        //const inserted = newText.slice(obj.caretAbsIndex, obj.caretAbsIndex + diff);
      //  obj.insertTextAtCaret(obj, inserted);
      } else if (diff < 0) {
        // Backspace or delete
        console.log('handleBackspace')
        handleBackspace(obj);
      }

        // Text inserted


      // Keep textarea synced
      textEditRef.current.value = obj.text;
      textEditRef.current.setSelectionRange(obj.caretAbsIndex, obj.caretAbsIndex);


      drawTextCursor();
      drawUpper();
      drawLower();
      */
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
        console.log("Backspace")
        obj.handleBackspace();
      } else if (e.key === "Delete") {
        e.preventDefault();
        console.log("Delete")
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


  const addImage = () => {
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

  function drawTextCursor() {
    const object = getActiveElement();
    const isTextEditing = isTextEditingRef.current;
    const caretVisible = caretVisibleRef.current;
    const cursor = toolsRef.current;
    const lower = lowerRef.current;
    if (!cursor || !lower) return;

    const ctx = cursor.getContext("2d");
    const lowerCtx = lower.getContext("2d");
    ctx.clearRect(0, 0, cursor.width, cursor.height);

    if (isTextEditing && caretVisible) {
      const { row, col } = object.getCaretPosFromIndex(object.caretAbsIndex);
      const lines = object.getLines();
      const line = lines[row] || "";
      const before = line.slice(0, col);

      const lineHeight = object.fontSize * object.lineHeight;
      const caretY = offsetRef.current.y + (object.y + lineHeight * (row + 1)) * scale;

      // ✨ Calculate text alignment offset
      const alignOffset = object.getLineOffset(
        line,
        object.textAlign,
        lowerCtx,
        object.w,
        object.textPadding
      );

      // ✨ Add offset to caret X position
      const caretX = offsetRef.current.x + (object.x + alignOffset + lowerCtx.measureText(before).width) * scale;

      ctx.beginPath();
      ctx.moveTo(caretX, caretY - 24);
      ctx.lineTo(caretX, caretY + 6);
      ctx.strokeStyle = "#000";
      ctx.stroke();
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
      const caretY = offsetRef.current.y + innerHeight * scale; ctx.beginPath();
      ctx.moveTo(caretX, caretY - 24);
      ctx.lineTo(caretX, caretY + 6);
      ctx.strokeStyle = "#000";
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

      // Optional: redraw your existing content here if needed
      // Draw cursor circle
      ctx.beginPath();
      ctx.arc(x, y, brushSize * scale / 2, 0, Math.PI * 2);
      ctx.strokeStyle = fillColour;
      ctx.lineWidth = 1;
      ctx.stroke();
    }



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
        style={{ position: "absolute", top: 0, left: 0, cursor: "default" }}
      />
      <div
        ref={canvasContainerRef}
        style={{
          width: PAGE_WIDTH,
          height: PAGE_HEIGHT,
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
          width={PAGE_WIDTH}
          height={PAGE_HEIGHT}
          style={{
            position: 'absolute',
            width: '100%'
          }}
        />
        <canvas
          ref={overlayRef}
          width={PAGE_WIDTH}
          height={PAGE_HEIGHT}
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
              <button className='btn primary' onClick={addText}>Add Text</button>

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
          padding:'10px',
          transform: 'translate(-50%, -100%)',
          marginTop: '-25px',
          borderRadius:'10px'
        }}>
          {(activeElementJson.type === 'text') &&
            <Tool
              icon={{tool:'edit_text.svg', toolActive:'edit_text_active.svg'}}
              callBack={toolCallback}
              tool='edit text'
              label='Edit Text'
              position={'tool_tip'}
              activeTool={activeTool}
            />
          }
        </div>

      }
      <textarea style={{
        width: '300px',
    height: '300px',
    zIndex: '10000000',
    opacity: '1',
    left: '200px',
}} ref={textEditRef} id="hidden-input"></textarea>

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
