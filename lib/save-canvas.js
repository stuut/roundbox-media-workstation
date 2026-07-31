import { PDFDocument, rgb, degrees } from "pdf-lib";
import { uploadFile } from '@/lib/upload-file'


// --- PNG DPI injection (from earlier example) ---
function setPngDPI(pngArrayBuffer, dpi) {
  const data = new Uint8Array(pngArrayBuffer);
  const textEncoder = new TextEncoder();
  const ppm = Math.round(dpi / 0.0254); // pixels per meter

  const chunk = new Uint8Array(21);
  chunk.set([0, 0, 0, 9], 0);
  chunk.set(textEncoder.encode("pHYs"), 4);
  [ppm >> 24, ppm >> 16, ppm >> 8, ppm].forEach((v,i)=>chunk[8+i]=v&0xFF);
  [ppm >> 24, ppm >> 16, ppm >> 8, ppm].forEach((v,i)=>chunk[12+i]=v&0xFF);
  chunk[16] = 1;

  function crc32(buf) {
    let crc = ~0;
    for (let i = 0; i < buf.length; i++) {
      crc ^= buf[i];
      for (let j = 0; j < 8; j++) {
        let mask = -(crc & 1);
        crc = (crc >>> 1) ^ (0xEDB88320 & mask);
      }
    }
    return ~crc >>> 0;
  }
  const crcVal = crc32(chunk.slice(4, 17));
  chunk[17] = (crcVal >> 24) & 0xFF;
  chunk[18] = (crcVal >> 16) & 0xFF;
  chunk[19] = (crcVal >> 8) & 0xFF;
  chunk[20] = crcVal & 0xFF;

  const before = data.slice(0, 33); // PNG sig+IHDR
  const after  = data.slice(33);
  const out = new Uint8Array(before.length + chunk.length + after.length);
  out.set(before, 0);
  out.set(chunk, before.length);
  out.set(after, before.length + chunk.length);
  return out.buffer;
}

// --- JPEG DPI injection (adds JFIF APP0 header) ---
function setJpegDPI(jpegArrayBuffer, dpi) {
  const data = new Uint8Array(jpegArrayBuffer);
  if (data[0] !== 0xFF || data[1] !== 0xD8) {
    throw new Error("Not a valid JPEG");
  }

  // Build APP0 JFIF segment with DPI
  const units = 1; // 1 = dots per inch
  const xDPI = dpi;
  const yDPI = dpi;

  const jfif = new Uint8Array([
    0xFF, 0xE0,        // APP0 marker
    0x00, 0x10,        // length = 16
    0x4A, 0x46, 0x49, 0x46, 0x00, // "JFIF\0"
    0x01, 0x02,        // version 1.02
    units,             // density units
    (xDPI >> 8) & 0xFF, xDPI & 0xFF, // X density
    (yDPI >> 8) & 0xFF, yDPI & 0xFF, // Y density
    0x00, 0x00         // no thumbnail
  ]);

  // Insert right after SOI (0xFFD8)
  const out = new Uint8Array(data.length + jfif.length);
  out.set(data.slice(0, 2), 0);        // SOI
  out.set(jfif, 2);                    // APP0 JFIF
  out.set(data.slice(2), 2 + jfif.length); // rest
  return out.buffer;
}

// --- Save function using File System Access API ---
async function saveFile(buffer, name, mime) {
  try{
    const fileHandle = await window.showSaveFilePicker({
      suggestedName: name,
      types: [{ description: mime, accept: { [mime]: [".png", ".jpg", ".webm"] } }]
    });
    const writable = await fileHandle.createWritable();
    await writable.write(buffer);
    await writable.close();
  }catch(er){
    console.log(er)
  }
  //alert(`Saved ${name} with 300 DPI metadata!`);
}

export const saveJpgMyFiles = async (projectTitle, canvas, dpi, user) => {

  try{

      const blob = await new Promise(res => canvas.toBlob(res, "image/jpeg", 0.92));


      const buf = await blob.arrayBuffer();
      const withDPI = setPngDPI(buf, dpi);

      const file = new File([withDPI],  `${projectTitle}.jpg`, { type: blob.type });

      const uploadedFile = await uploadFile(file, null, null, user)

      return uploadedFile
    }catch(er){
    console.log(er)
  }

};

export const savePngMyFiles = async (projectTitle, canvas, dpi, user) => {

  try{

  const blob = await new Promise(res => canvas.toBlob(res, "image/png"));

 

  const buf = await blob.arrayBuffer();
  const withDPI = setPngDPI(buf, dpi);

  const file = new File([withDPI],  `${projectTitle}.png`, { type: blob.type });

  const uploadedFile = await uploadFile(file, null, null, user)

  return uploadedFile
      }catch(er){
    console.log(er)
  }

};


// --- Button handlers ---
export const saveAsPng = async (projectTitle, canvas, dpi) => {
  try{
    const blob = await new Promise(res => canvas.toBlob(res, "image/png"));
    const buf = await blob.arrayBuffer();
    const withDPI = setPngDPI(buf, dpi);
    await saveFile(withDPI, `${projectTitle}-${dpi}dpi.png`, "image/png");
   }catch(er){
    console.log(er)
  }
};

export const saveAsjpg = async (projectTitle, canvas, dpi) => {
  try{
      const blob = await new Promise(res => canvas.toBlob(res, "image/jpeg", 0.92));
      const buf = await blob.arrayBuffer();
      const withDPI = setJpegDPI(buf, dpi);
      await saveFile(withDPI, `${projectTitle}-${dpi}dpi.jpg`, "image/jpeg");
     }catch(er){
    console.log(er)
  }
};


export function saveProject(objects) {
  const json = JSON.stringify({ version: 1, objects }, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "project.mycanvas";
  a.click();
}

export async function loadProject(file) {
  const text = await file.text();
  const data = JSON.parse(text);
  objectsRef.current = data.objects;
  drawArtboard();
}

async function exportObjectsToPDF(objects, width, height) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([width, height]);

  objects.forEach(obj => {
    const { cx, cy, w, h, angle, fill, stroke } = obj;

    page.drawRectangle({
      x: cx - w / 2,
      y: height - (cy + h / 2), // PDF origin is bottom-left
      width: w,
      height: h,
      color: fill ? rgb(...hexToRgb(fill)) : undefined,
      borderColor: stroke ? rgb(...hexToRgb(stroke)) : undefined,
      borderWidth: stroke ? 1 : 0,
      rotate: degrees(angle * (180 / Math.PI)) // radians → degrees
    });
  });

  const pdfBytes = await pdfDoc.save();
  downloadBlob(new Blob([pdfBytes]), "myCanvas.pdf");
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function hexToRgb(hex) {
  hex = hex.replace("#", "");
  const bigint = parseInt(hex, 16);
  return [((bigint >> 16) & 255) / 255, ((bigint >> 8) & 255) / 255, (bigint & 255) / 255];
}


export const exportWebm = async (
  canvas,
  setIsExporting,
  setIsPlaying,
  setCurrentTime,
  fps,
  duration
) => {

  setIsExporting(true);

  try {
    // Get the canvas element
    if (!canvas) {
      throw new Error('Canvas not found');
    }

    const stream = canvas.captureStream(fps);


    // Add audio track if available
      if (audioUrl && audioRef.current) {
        const audioContext = new AudioContext();
        const source = audioContext.createMediaElementSource(audioRef.current);
        const destination = audioContext.createMediaStreamDestination();
        source.connect(destination);
        source.connect(audioContext.destination);

        const audioTrack = destination.stream.getAudioTracks()[0];
        if (audioTrack) {
          stream = new MediaStream([...stream.getTracks(), audioTrack]);
        }
      }


    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 5000000
    });

    const chunks = [];
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${'video'}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      console.log('Video exported!');

      setIsExporting(false);
    };

    // Start recording and play animation
    mediaRecorder.start();
    setCurrentTime(0);
    setIsPlaying(true);

    // Stop after duration
    setTimeout(() => {
      mediaRecorder.stop();
      setIsPlaying(false);
    }, duration * 1000 + 100);

  } catch (error) {
    console.error('Export error:', error);
    setIsExporting(false);
  }
};


const sample_schema = {
  "project": {
    "name": "MyCanvasProject",
    "version": "1.0",
    "author": "Daniel",
    "created": "2025-09-16T08:00:00Z",
    "modified": "2025-09-16T09:00:00Z"
  },
  "canvas": {
    "width": 1920,
    "height": 1080,
    "background": "#ffffff",
    "grid": {
      "enabled": true,
      "size": 20
    }
  },
  "layers": [
    {
      "id": "layer_1",
      "name": "Background",
      "visible": true,
      "locked": false,
      "objects": [
        {
          "id": "rect_001",
          "type": "rectangle",
          "cx": 200,
          "cy": 150,
          "w": 100,
          "h": 80,
          "angle": 0.5,
          "style": {
            "fill": "#ff0000",
            "stroke": "#000000",
            "strokeWidth": 2,
            "opacity": 1
          }
        },
        {
          "id": "ellipse_002",
          "type": "ellipse",
          "cx": 400,
          "cy": 300,
          "w": 120,
          "h": 120,
          "angle": 0,
          "style": {
            "fill": "#00ff00"
          }
        }
      ]
    },
    {
      "id": "layer_2",
      "name": "UI Overlays",
      "visible": true,
      "locked": false,
      "objects": []
    }
  ],
  "history": [
    { "action": "create_object", "objectId": "rect_001", "timestamp": "2025-09-16T08:01:00Z" },
    { "action": "resize_object", "objectId": "rect_001", "timestamp": "2025-09-16T08:05:00Z" }
  ]
}
