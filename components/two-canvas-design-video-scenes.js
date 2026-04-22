'use client'

import { useEffect, useRef, useState, useCallback, useImperativeHandle } from "react";
import { saveAsPng, saveAsjpg, exportWebm } from "@/lib/save-canvas"
import { SketchPicker } from 'react-color'
import { BufferedBrush } from "@/lib/buffered-brush"
import '@/app/canvas_styles.css'
import { convertMMToPixels } from "@/lib/calculations"
import { useFilesContext } from "@/context/files-context"
import { Play, Pause, SkipBack, SkipForward, Video, Save, Undo, Redo, Settings,
  Smartphone, Monitor, Square, ChevronLeft,
  Film, Clock, Loader2, Trash2, Maximize2, Upload, Download, Music,
  MousePointer2, MousePointerClick, X, Copy, FileImage, Type, Eraser, PencilLine, MousePointer, Move, LoaderCircle,
  SquareMousePointer,
  BringToFront, SendToBack,
  LayoutTemplate,
  Rss,
  TextSelect,
  CalendarDays,
  ExternalLink,
  Plus,
  CircleCheck
} from 'lucide-react';
import { getFiles } from "@/lib/supabase";
import { storeFileInfo } from "@/lib/supabase";
import { isObjectInArray } from '@/lib/utils'
import { showSuccess } from '@/lib/toast';
import { showError } from '@/lib/toast';
import { showInfo } from '@/lib/toast';
import { ThemeSwitcher } from "@/components/theme-switcher"
import ToastProvider from "@/components/toast-provider"
import * as contentful from 'contentful'
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";
import { Easings } from "@/lib/easings";
import { getFacebookPages } from "@/lib/supabase";
import JSZip from "jszip";
import axios from "axios";
var WPAPI = require( 'wpapi' );
import WavesurferPlayer from '@wavesurfer/react'

/*
import { Recorder, RecorderStatus, Encoders } from "canvas-record";
import createCanvasContext from "canvas-context";
import { AVC } from "media-codecs";*/

function lightenRgba(rgba, amount = 0.5) {
  const parts = rgba.match(/\d+(\.\d+)?/g).map(Number);

  const [r, g, b, a = 1] = parts;

  const mix = v => Math.round(v + (255 - v) * amount);

  return `rgba(${mix(r)}, ${mix(g)}, ${mix(b)}, ${a})`;
}



const removeMd = require('remove-markdown');

const dpi = 300;
const mmToInch = 1 / 25.4;

const widthMM = 210;
const heightMM = 297;

const widthPx = Math.round(widthMM * mmToInch * dpi);  // 2480
const heightPx = Math.round(heightMM * mmToInch * dpi); // 3508


//const PAGE_WIDTH = 2480;
//const PAGE_HEIGHT = 3508;
const COLOUR = 'rgb(65 95 145)'
const HILIGHTCOLOUR = 'rgb(65 95 145)'

const HANDLE_SIZE = 6;
const ELEMENT_PADDING = 0
const ROTATE_DISTANCE = 40;
const TRANSFORM_COLOUR = COLOUR
const HANDLE_FILL_COLOUR = '#ffffff'
const TRANSFORM_WIDTH = 1
const GUIDES_WIDTH = 1



const decodeEntities = (str) => {
// this prevents any overhead from creating the object each timesocialId
  var element = document.createElement('div');

  function decodeHTMLEntities (str) {
    if(str && typeof str === 'string') {

      str = str.replace(/(.*[\s+\"\']wp-caption-text[\s+\"\'].*)/g, '');
      // strip script/html tags
      str = str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
      str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');

      str = str.replace("&#8230;", "...");
      str = str.replace("&#8217;", "'");
      str = str.replace('&nbsp;', '\n');
      str = str.replaceAll("\\s+","");
      str = str.replace("\u00A0","");
      str = str.replace('&#8211;', '');

      str = str.split('\n').join('\n\n');
      str = str.trim();

      element.innerHTML = str;
      str = element.textContent;
      element.textContent = '';
    }

    return str;
  }

  return decodeHTMLEntities(str);
}

const decodeCaptionEntities = (str) => {
// this prevents any overhead from creating the object each timesocialId
  var element = document.createElement('div');

  function decodeHTMLEntities (str) {
    if(str && typeof str === 'string') {

      let captions = str.match(/(.*[\s+\"\']wp-caption-text[\s+\"\'].*)/g, '');

      str = str.replace(/(.*[\s+\"\']wp-caption-text[\s+\"\'].*)/g, '');
      // strip script/html tags
      str = str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
      str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');



      if (captions !== null){
        for (let i = 0; i < captions.length; i++) {
          captions[i] = captions[i].replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
          captions[i] = captions[i].replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');
          if (captions.length > 1){
            str = str+ '\n' + 'IMAGE '+(i+1)+': ' + captions[i]
          }else{
            str = str+ '\n' + 'IMAGE: ' + captions[i]
          }

        }
      }

      str = str.replace("&#8230;", "...");
      str = str.replace("&#8217;", "'");
      str = str.replace('&nbsp;', '\n');
      str = str.replaceAll("\\s+","");
      str = str.replace("\u00A0","");
      str = str.replace('&#8211;', '');

      str = str.split('\n').join('\n\n');
      str = str.trim();

      element.innerHTML = str;
      str = element.textContent;
      element.textContent = '';
    }

    return str;
  }

  return decodeHTMLEntities(str);
}



const toPercent = n => Math.round(n * 10000) / 100;

const defaultFonts = [
  "Arial",
  "Times New Roman",
  "Courier New",
  "Verdana",
  "Georgia",
]

const ANIMATION_TYPES = [
  { value: 'fadeIn', label: 'Fade In', easing: 'easeOutQuad'},
  { value: 'fadeOut', label: 'Fade Out', easing: 'easeOutQuad' },
  { value: 'slideInLeft', label: 'Slide In Left', easing: 'easeOutQuad'},
  { value: 'slideInRight', label: 'Slide In Right', easing: 'easeOutQuad' },
  { value: 'slideInTop', label: 'Slide In Top', easing: 'easeOutQuad' },
  { value: 'slideInBottom', label: 'Slide In Bottom', easing: 'easeOutQuad' },
  { value: 'scaleIn', label: 'Scale In', easing: 'easeOutQuad' },
  { value: 'scaleOut', label: 'Scale Out', easing: 'easeOutQuad' },
  { value: 'rotate', label: 'Rotate 360°', easing: 'easeOutQuad' },
  { value: 'pulse', label: 'Pulse', easing: 'easeOutQuad' },
  { value: 'bounce', label: 'Bounce', easing: 'easeOutQuad' },
  { value: 'grow', label: 'Grow', easing: 'easeOutQuad' }
];

const TEXT_ONLY_ANIMATION_TYPES = [
  { value: 'fadeInUpLines', label: '📝 Lines: Fade In Up', easing: 'easeOutQuad' },
  { value: 'fadeInLines', label: '📝 Lines: Fade In', easing: 'easeOutQuad' },
  { value: 'slideInLeftLines', label: '📝 Lines: Slide Left', easing: 'easeOutQuad' },
  { value: 'slideInRightLines', label: '📝 Lines: Slide Right', easing: 'easeOutQuad' },
  { value: 'fadeInUpChar', label: '📝 Characters: Fade In Up', easing: 'easeOutQuad' },
  { value: 'fadeInChar', label: '📝 Characters: Fade In', easing: 'easeOutQuad' },
  { value: 'slideInLeftChar', label: '📝 Characters: Slide Left', easing: 'easeOutQuad' },
  { value: 'slideInRightChar', label: '📝 Characters: Slide Right', easing: 'easeOutQuad' },
];

const TEMPLATES = {
  videos : [
    {
      label:'Reel'
    }
  ],
  images : [
    {
      label:'Story'
    }
  ]

}

const FEEDS = [
  {
    label: 'Hilltops Phoenix',
    spaceId: 'ticbtmcn8ib7',
    accessToken: 'ZevYwQ2O4E749EFWvAWStcN_nZh9ntUhi5dzW9fk2Dw',
    website:'www.hilltopsphoenix.com.au',
    CMSType:'contentful',
    scheduleDate: 'scheduleDate',
    publishedDate: 'publishDate',
    slug:'slug',
    title:'title',
    image:'heroImage',
    text:'body',
    facebook_page_id:'1509386042722586'

  },
  {
    label: 'Cowra Phoenix',
    spaceId: 'blbpa6fzvcno',
    accessToken: '_jbLmb4SDG2TkgW42NOTAVjPoCS78mQGEjOIXJrRExI',
    website:'www.cowrasphoenix.com.au',
    CMSType:'contentful',
    scheduleDate: 'scheduleDate',
    publishedDate: 'publishDate',
    slug:'slug',
    title:'title',
    image:'image',
    text:'copy',
    facebook_page_id:'100367901935086'
  },
  {
    label: 'Canowindra Phoenix',
    username: 'editor',
    password: 'xKGAB%ncydDFbrClXwd5Ex%t',
    website:'www.canowindraphoenix.com.au',
    CMSType:'wordpress',
    facebook_page_id:'106626202692898',
    scheduleDate: 'acf.schedule_date',
  },
  {
    label: 'Parkes Phoenix',
    username: 'roxane',
    password: 'SOw4vSFu*ueYUBnR$4Jkip@b',
    website:'www.parkesphoenix.com.au',
    CMSType:'wordpress',
    facebook_page_id:'973264922791233',
    scheduleDate: 'acf.schedule_date',
  },
  {
    label: 'Forbes Phoenix',
    username: 'roxane',
    password: 'f#63$^bBGRz(Om)XXcpLqt0z',
    website:'www.forbesphoenix.com.au',
    CMSType:'wordpress',
    facebook_page_id:'883736781692596',
    scheduleDate: 'acf.schedule_date',
  },
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
    styles: ['italic', 'normal']
  },
]

const PRESETS = [
  { label: 'Story (9:16)', width: 1080, height: 1920, dpi:72, media:'video', icon: Smartphone },
  { label: 'Reel (9:16)', width: 1080, height: 1920, dpi:72, media:'video', icon: Film },
  { label: 'Square (1:1)', width: 1080, height: 1080, dpi:72, media:'video', icon: Square },
  { label: 'Landscape (16:9)', width: 1920, height: 1080, dpi:72, media:'video', con: Monitor },
  { label: 'A4 (297:210)', width: 210, height: 297, dpi:300, media:'print', icon: Monitor },
];

const radToDeg = (rad) => rad * 180 / Math.PI;
const degToRad = (deg) => deg * Math.PI / 180;

const timeTravel = (date) => {

  var scheduled = moment(date).add(30, 'm').toDate()
  var now = new Date();

  if(moment(date).diff(moment(now), "minutes") < 30){
    return true
  }else{
    return false
  }

}

function copyText(text) {
  // Get the text content from the element

  // Use the Clipboard API to write the text
  navigator.clipboard.writeText(text).then(function() {
    // Success feedback (optional)
    showSuccess('Text Copied')

  }).catch(function(err) {
    // Error handling (optional)
    console.error('Could not copy text: ', err);
  });
}

function generateUniqueId() {
    // High-resolution timestamp
    const timestamp = new Date().getTime().toString();
    // Append a random value
    const randomComponent = Math.random().toString(36).substring(2);
    return timestamp + randomComponent;
}


function calculateMinAnimationDuration({
  lineCount,
  lineLengths,
  animType,
  charStagger = 0.03,
  lineStagger = 0.1,
  unitDuration = 0.5
}) {
  // Calculate total characters in the block
  const totalChars = lineLengths.reduce((sum, len) => sum + len, 0);

  let totalDuration = unitDuration;

  if (animType.includes('Char')) {
    // Stagger per character (optionally also per line if desired)
    // We'll assume global character index for smooth typewriter effect
    totalDuration += (totalChars - 1) * charStagger;
  }

  if (animType.includes('Lines')) {
    // Stagger per line
    totalDuration += (lineCount - 1) * lineStagger;
  }

  return totalDuration;
}




export const Danva = (({postData, user}, ref) => {

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
  const trackingBufferRef = useRef(null);

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
  const [elements, setElements] = useState([]);
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
  const [strokeColour, setStrokeColour] = useState('rgba(0,0,0,1)');
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
  const [text, setText] = useState('New text\nanother line')
  const [selectedTextAlignment, setSelectedTextAlignment] = useState('left')

  const [selectedTextLineHeight, setSelectedTextLineHeight] = useState(120)
  const [currentTime, setCurrentTime] = useState(0);
  const currentTimeRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(false);
  const isTrackingRef = useRef(false);
  const animationRef = useRef(null);
  const startTimeRef = useRef(null);
  const [showAnimate, setShowAnimate] = useState(false);
  const [showProperties, setShowProperties] = useState(false);
  const [duration, setDuration] = useState(5);
  const [fps, setFps] = useState(30);
  const [isExporting, setIsExporting] = useState(false);

  const[PAGE_WIDTH, SET_PAGE_WIDTH] = useState(1080);
  const [PAGE_HEIGHT, SET_PAGE_HEIGHT] = useState(1920);
  const [BLEED, SET_BLEED] = useState(0);
  const [currentPreset, setCurrentPreset]= useState(PRESETS[0].label)
  const [backgroundColour, setBackgroundColour] = useState(`rgba(255, 255, 255, 1)`)
  const [projectTitle, setProjectTitle] = useState('')
  const [audioUrl, setAudioUrl] = useState(null);
  const [canvasLoader, setCanvasLoader] = useState(false);
  const audioRef = useRef(null);
  const pendingSeeksRef = useRef(0);
  const lastMediaTimeRef = useRef(null);
  const seekIdRef = useRef(0);
  const seekTimeoutRef = useRef({});
  const videoRegistryRef = useRef(new Map());
  const [videoSeeking, setVideoSeeking] = useState({});
  const seekTimeoutMapRef  = useRef(new WeakMap());
  const workerRef = useRef(null);
  const offscreenCanvasRef = useRef(null);
  const [dragMedia, setDragMedia] = useState(null)
  const postDataRef = useRef(null);
  const [postInfo, setPostInfo] = useState(null);
  const [textEditing, setTextEditing] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [videoFrameProgress, setVideoFrameProgress] = useState(0);
  const [videoConvertProgress, setVideoConvertProgress] = useState(0);

  const captureRef = useRef(null);
  const offscreenCanvasExportRef = useRef(null);
  const sceneManagerRef = useRef(null);
  const [activeScene, setActiveScene] = useState([]);
  const [scenes, setScenes] = useState([])

  const [selectedFeed, setSelectedFeed] = useState(FEEDS[0])
  const [dateFilter, setDateFilter] = useState(new Date());
  const [posts, setPosts] = useState([]);

  useImperativeHandle(ref, () => ({

    childFunction: async () => {
        console.log('useImperativeHandle')
        const blob = await createVideo('mp4')
        return blob;
    }
  }));


    useEffect(()=>{

      sceneManagerRef.current = new SceneManager({
          id: generateUniqueId()
      });

      const newScene = createScene(0, duration, true)

    },[])



  const loadCCapture = () => {
      return new Promise((resolve) => {
        if (window.CCapture) return resolve();

        const script = document.createElement("script");
        script.src = "/libs/CCapture.all.min.js";

        script.onload = () => resolve();
        document.body.appendChild(script);
      });
    };


    const exportVideoFrames = async (download = true, showCanvasLoader = true) => {

      if (showCanvasLoader){
          setCanvasLoader(true)
      }


      return new Promise(async(resolve) => {

        const zip = new JSZip();

        let pending = videoRegistryRef.current.size;


        const totalFrames = duration * fps;

        const frames = [];

        for (let frame = 0; frame < totalFrames; frame++) {
             currentTimeRef.current = frame / fps;


               const scene = sceneManagerRef.current.getSceneAtTime(currentTimeRef.current);
               if (!scene) return

               const videos = scene.objects.filter(o => o.type === "video");

               if (videos.length === 0) {
                 drawLower(true);

               }else{
                 let pending = videos.length;

                 const localTime = currentTimeRef.current - scene.start;

                 videos.forEach((video) => {
                     video.requestVideoFrameCallback(() => {
                       pending--;
                       if (pending === 0) {
                         // all videos ready → render + capture
                         drawLower(true);

                       }
                     });

                     // trigger frame decode
                     video.currentTime = localTime;
                   });
               }

               //const blob = await new Promise(resolve => lowerRef.current.toBlob(resolve, "image/jpeg", 0.9));
               const blob = await new Promise(resolve => offscreenCanvasExportRef.current.toBlob(resolve, "image/jpeg", 0.9));
               frames.push(blob);
               setVideoFrameProgress(Math.floor(((frame + 1) / totalFrames) * 100));

        }


        // Add each frame as frame0001.jpg, frame0002.jpg, ...
        for (let i = 0; i < frames.length; i++) {
          const blob = frames[i];
          zip.file(`frame${String(i).padStart(4, "0")}.jpg`, blob);
        }

        // Generate zip as blob
        const zipBlob = await zip.generateAsync({ type: "blob" });

        const formData = new FormData();

        formData.append("framesZip", zipBlob);

        //frames.forEach((frame, i) => formData.append(`frame${i}`, frame));
        if (audioUrl) {
          const audioBlob = await fetchAudioBlob(audioUrl);
          formData.append('audio', audioBlob);
        }


        const res = await axios.post('/api/encode-video-frames', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            // progressEvent.loaded = bytes uploaded so far
            // progressEvent.total = total bytes to upload
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);

            console.log(`Upload Progress: ${percentCompleted}%`);
            setVideoConvertProgress(percentCompleted)

            // You can also update a React state here
          },
          responseType: 'blob', // important to get a Blob instead of JSON
        });



        const mp4Blob = res.data;
        if (download){
          const url = URL.createObjectURL(mp4Blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${projectTitle || 'video'}.mp4`;
          a.click();
          URL.revokeObjectURL(url);
          resolve()
            if (showCanvasLoader){
              setCanvasLoader(false)
            }
          setVideoFrameProgress(0)
          setVideoConvertProgress(0)

        }else{
          showSuccess('Converted To Video')
          resolve(mp4Blob)
          if (showCanvasLoader){
            setCanvasLoader(false)
          }
          setVideoFrameProgress(0)
          setVideoConvertProgress(0)
        }

      })

    }


const exportCcaptureWorker = async(type, download = true) => {
  return new Promise(async(resolve) => {

  await loadCCapture();

  const capturer = new window.CCapture({
     format: "webm",
     framerate: fps,
   });

   captureRef.current = capturer
   const totalFrames = duration * fps;

   captureRef.current.start()

   for (let frame = 0; frame < totalFrames; frame++) {
        currentTimeRef.current = frame / fps;
          renderSceneWorker(currentTimeRef.current)
          console.log('frame', frame)
   }

  })


}


  const exportCcapture = async(type, download = true) => {

    exportVideoFrames()

    return



    console.log('type', type)
    return new Promise(async(resolve) => {

    await loadCCapture();

    const capturer = new window.CCapture({
       format: "webm",
       framerate: fps,
     });

    const totalFrames = duration * fps;
    let pending = videoRegistryRef.current.size;

    capturer.start();

      for (let frame = 0; frame < totalFrames; frame++) {

            currentTimeRef.current = frame / fps;

            if (pending === 0) {
              drawLower()
              drawArtboard()
              capturer.capture(lowerRef.current);
            }else{
              videoRegistryRef.current.forEach((video) => {
                  video.requestVideoFrameCallback(() => {
                    pending--;
                    if (pending === 0) {
                      // all videos ready → render + capture
                      try {
                        drawLower();
                      } catch (err) {
                        console.error("DRAW ERROR:", err);
                      }
                      capturer.capture(lowerRef.current);
                    }
                  });

                  // trigger frame decode
                  video.currentTime = currentTimeRef.current;
                });
            }

            // Update progress (0 → 100%)
            setProgress(Math.floor(((frame + 1) / totalFrames) * 100));
            console.log(Math.floor(((frame + 1) / totalFrames) * 100))
         // optional: yield to UI thread to keep it responsive

      }

      capturer.stop();

      if (type === 'mp4'){
          setProgress(0);
        capturer.save(async(blob) => {
          // blob is the complete WebM video
          const mp4Video = await uploadWebMToServer(blob);

          if (download){
            const url = URL.createObjectURL(mp4Video);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${projectTitle || 'video'}.${type}`;
            a.click();
            URL.revokeObjectURL(url);
            resolve()
          }else{

            resolve(mp4Video)
          }

        });
      }else{
          setProgress(0);
        if (download){
            capturer.save();
            resolve()
        }else{
          capturer.save(async(blob) => {

            resolve(blob)
          })
        }

      }

    });

  }

  async function uploadWebMToServer(webmBlob) {

    return new Promise(async(resolve, reject) => {



      const formData = new FormData();

      formData.append("video", webmBlob, "video.webm");
      if (audioUrl){
        const audioBlob = await fetchAudioBlob(audioUrl);
        formData.append("audio", audioBlob, "audio.mp3");
      }


      const response = await fetch("/api/convert-webm-to-mp4-audio", {
        method: "POST",
        body: formData,
      });

      const result = await response.blob();

      resolve(result);

    })
}


async function fetchAudioBlob(url) {
  const response = await fetch(url);
  const blob = await response.blob(); // this is your raw audio file
  return blob;
}







useEffect(()=>{

  scaleRef.current = scale

},[scale])

useEffect(() => {

  const offscreenCanvas = document.createElement("canvas");
  offscreenCanvas.width = PAGE_WIDTH + BLEED * 2;
  offscreenCanvas.height = PAGE_HEIGHT + BLEED * 2;
  offscreenCanvasRef.current = offscreenCanvas
  // 1. Setup worker
  const worker = new Worker(new URL('../lib/videoWorker.js', import.meta.url));
  workerRef.current = worker;
  // 2. Transfer canvas to worker
  const offscreen = offscreenCanvas.transferControlToOffscreen();
  worker.postMessage({ canvas: offscreen }, [offscreen]);
  //worker.postMessage({ type: 'LOAD_FONTS' });
  workerRef.current.onmessage = handleWorkerMessage;

}, []);


const loadFontWorker = () => {
  workerRef.current.postMessage({
    type: 'LOAD_FONTS',
    fontFamily: activeElement.fontFamily,
    weight: activeElement.fontWeight,
    style: activeElement.fontStyle,
  });
}



const handleWorkerMessage = (e) => {
  if (e.data.type === 'CONFIRM') {

    const ctx = lowerRef.current.getContext("2d");
    //ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(e.data.canvasImage, 0, 0);

    if (captureRef.current){
      captureRef.current.capture(lowerRef.current);
    }

    e.data.canvasImage.close();

  }

}

const moveBackwards = () => {

  const activeElement = getActiveElement()
  if (!activeElement) return

  const activeScene = sceneManagerRef.current.getActiveScene()
  if (!activeScene) return

  const index = activeScene.objects.findIndex(o => o.id === activeElement.id);


  const items = activeScene.objects

  // Cannot move the last item backwards

  if (index <= 0) return;

  // Create a new array copy
  const newItemsArray = [...items];

  // Swap item at index with the next item
  const temp = newItemsArray[index];
  newItemsArray[index] = newItemsArray[index - 1];
  newItemsArray[index - 1] = temp;

  // Update state
  selectedIndexRef.current = selectedIndexRef.current-1
  objectsRef.current=newItemsArray
  setElements(newItemsArray);

  // Update scene
  activeScene.objects = newItemsArray
  updateActiveScene({objects:newItemsArray})
  handleUpdateScenes(activeScene.id, {objects:newItemsArray})

  drawLower()
};


const changeTime = (time) => {
  setCurrentTime(time)
  currentTimeRef.current = time
}



const moveForward = () => {

const activeElement = getActiveElement()
if (!activeElement) return

const activeScene = sceneManagerRef.current.getActiveScene()
if (!activeScene) return


const index = activeScene.objects.findIndex(o => o.id === activeElement.id);

const items = activeScene.objects


// Cannot move the last item forward
if (index >= items.length - 1) return;


// Create a new array copy
const newItemsArray = [...items];

// Swap item at index with the next item
const temp = newItemsArray[index];
newItemsArray[index] = newItemsArray[index + 1];
newItemsArray[index + 1] = temp;

// Update state
selectedIndexRef.current = selectedIndexRef.current+1
objectsRef.current=newItemsArray
setElements(newItemsArray);

// Update scene
activeScene.objects = newItemsArray
updateActiveScene({objects:newItemsArray})
handleUpdateScenes(activeScene.id, {objects:newItemsArray})


drawLower()
};

const sendToBack = () => {

  const activeElement = getActiveElement()
  if (!activeElement) return

  const activeScene = sceneManagerRef.current.getActiveScene()
  if (!activeScene) return


// 1. Filter out the object to move from its current position
const otherItems = activeScene.objects.filter(item => item.id !== activeElement.id);

// 2. Create a new array with the object at the front
const newItemsArray = [activeElement, ...otherItems];

// 3. Update the state with the new array
selectedIndexRef.current = 0

activeScene.objects = newItemsArray
updateActiveScene({objects:newItemsArray})

// Update scene
activeScene.objects = newItemsArray
updateActiveScene({objects:newItemsArray})
handleUpdateScenes(activeScene.id, {objects:newItemsArray})

drawLower()
};



const bringToFront = () => {
// 1. Filter out the object to move from its current position

const activeElement = getActiveElement()
if (!activeElement) return

const activeScene = sceneManagerRef.current.getActiveScene()
if (!activeScene) return



const otherItems = activeScene.objects.filter(item => item.id !== activeElement.id);

// 2. Create a new array with the object at the front
const newItemsArray = [...otherItems, activeElement];

// 3. Update the state with the new array
selectedIndexRef.current = newItemsArray.length - 1


objectsRef.current=newItemsArray
setElements(newItemsArray);

// Update scene
activeScene.objects = newItemsArray
updateActiveScene({objects:newItemsArray})
handleUpdateScenes(activeScene.id, {objects:newItemsArray})



drawLower()
};

useEffect(()=>{
  resize('scale to fit')
  drawLower()
},[PAGE_WIDTH, PAGE_HEIGHT, BLEED])


useEffect(()=>{
  createBufferCanvas()
},[PAGE_WIDTH, PAGE_HEIGHT, BLEED])


const createBufferCanvas = () => {
  const offscreen = document.createElement("canvas");
  offscreen.width = PAGE_WIDTH + BLEED * 2;
  offscreen.height = PAGE_HEIGHT + BLEED * 2;
  trackingBufferRef.current = offscreen;
}

const onSelectElement = (id) => {
  const index = objectsRef.current.findIndex(o => o.id === id);
  if (index === -1) return;

  setActiveElement(objectsRef.current[index]);
  selectedIndexRef.current = index;
  drawUpper();
}

const onSelectScene = (id) => {
  const index = sceneManagerRef.current.scenes.findIndex(o => o.id === id);
  if (index === -1) return;

  setActiveScene(scenes[index]);
  sceneManagerRef.current.activeSceneId = id
  const activeScene = sceneManagerRef.current.getActiveScene()
  setCurrentTime(activeScene.start)
  drawUpper();
}





  const handlePresetChange = (presetLabel) => {
    setCurrentPreset(presetLabel)
    const preset = PRESETS.find(p => p.label === presetLabel);

    if (preset.label === 'A4 (297:210)') {

      SET_PAGE_WIDTH(convertMMToPixels(preset.width, 300))
      SET_PAGE_HEIGHT(convertMMToPixels(preset.height, 300))
      SET_BLEED(convertMMToPixels(5, 300))

    }else{
      SET_PAGE_WIDTH(preset.width)
      SET_PAGE_HEIGHT(preset.height)
      SET_BLEED(0)
    }
  };

  class SceneManager {
    constructor({
      id,
      scenes = [],
      activeSceneId
    } = {}) {
      this.id = id??generateUniqueId();
      this.scenes = scenes??[];
      this.activeSceneId = activeSceneId??null
    }

    update(values) {
      return new SceneManager({
        ...this,
        ...values
      });
    }

    getSceneAtTime(time) {
        return this.scenes.find(scene =>
          time >= scene.start &&
          time < scene.start + scene.duration
      );
    }

    getActiveScene(){
      return this.scenes.find((scene)=> scene.id === this.activeSceneId)
    }

    removeScene(sceneToRemove){
      this.scenes = this.scenes.filter(scene => scene.id !== sceneToRemove.id)
    }


  };


  class Scene {
    constructor({
      id,
      activeObjectId,
      objects = [],
      start,
      duration
    } = {}) {
      this.id = id??generateUniqueId();
      this.activeObjectId = activeObjectId??null
      this.objects = objects??[];
      this.start = start??0;
      this.duration = duration??0
    }

    update(values) {
      return new Scene({
        ...this,
        ...values
      });
    }

    getObjectIndex(id){
      return this.objects.findIndex(o => o.id ===id)
    }

    getObjectById(id){
      return this.objects.find(o => o.id === id)
    }

    removeItem(obj){
     this.objects = this.objects.filter((object)=> object.id !== obj.id)
    }

    getActiveObject(){
      return this.objects.find((object)=> object.id === this.activeObjectId)
    }

  }









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
    originalWidth = null,
    originalHeight = null,
    img = null,
    video = null,
    angle = 0,
    fill = null,
    strokeColour = null,
    strokeWeight = 0,
    opacity = 1,
    text = null,
    maxWidth = 200,
    lineHeight = null,
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
    imageSrc = null,
    videoSrc = null,
    animations = [],
    currentTime = 0,
    frames = [],
    thumbnails = [],
    videoDuration = null,
    scale = 1,
    imageBitmap = null,
    airbrushBufferBitmap = null,
    clippingPath = null

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
    this.originalWidth = originalWidth;
    this.originalHeight = originalHeight;
    this.img = img;
    this.video = video;
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
    this.lineHeight = lineHeight?lineHeight:fontSize*1.2;
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
    this.videoSrc = videoSrc
    this.animations = animations
    this.currentTime = currentTime
    this.frames = frames
    this.videoDuration = videoDuration
    this.thumbnails = thumbnails
    this.scale = scale
    this.imageBitmap = imageBitmap
    this.airbrushBufferBitmap = airbrushBufferBitmap
    this.clippingPath = clippingPath

    // ✅ Only update lines if text exists and canvas context is available
    if (this.text && typeof lowerRef?.current?.getContext === 'function') {

      this.updateLines();
    }

    /*
    if (this.imageSrc && typeof lowerRef?.current?.getContext === 'function') {
      this.drawImageInit();
    }*/
  }

  update(values) {
    return new Element({
      ...this,
      ...values
    });
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

      totalHeight += this.measureTextHeight(i, this.lines[i]); // use the earlier helper we discussed
    }


    this.totalHeight = totalHeight + this.textPadding;
    this.h = this.totalHeight;
    this.x = this.cx - this.width / 2;
    this.y = this.cy - this.totalHeight / 2;

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
    ///const ctx = lowerRef.current.getContext("2d");
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

    console.log('drawHilightTextArtboard', scale)

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
          const lineHeight = style.lineHeight || this.lineHeight || this.fontSize * 1.2;


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


  drawTextCharsOriginal(ctx) {

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




  drawHilightText(ctx, scale = 0) {


    console.log('drawHilightText')


    ctx.save();

    // Apply the same transform used in drawObject()
    //ctx.translate(this.cx, this.cy);
    //ctx.rotate(this.angle);

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

async drawVideoInit(ctx) {
  return new Promise((resolve) => {
    const videoEl = document.createElement('video');

    videoEl.crossOrigin = 'anonymous';
    videoEl.src = this.videoSrc;

    videoEl.muted = true;
    videoEl.preload = 'auto';
    videoEl.playsInline = true;   // important on iOS


    videoEl.addEventListener('loadedmetadata', async () => {
      videoEl.pause();
      videoEl.currentTime = 0;
      this.video = videoEl;
      this.width = videoEl.videoWidth;
      this.h = videoEl.videoHeight;
      this.originalWidth = videoEl.videoWidth;
      this.originalHeight = videoEl.videoHeight;
      this.videoDuration = videoEl.duration;

      videoEl.requestVideoFrameCallback(() => {
        ctx.drawImage(
          this.video,
          this.cx - this.width / 2,
          this.cy - this.h / 2,
          this.width,
          this.h
        );

      });

      //this.captureFrames()

      videoRegistryRef.current.set(this.id, this.video);
      await this.generateThumbnails()
      this.video.currentTime = 0
      resolve(true);
    });
  });
}




redrawVideo(ctx, animationProps) {
  if (!this.video || this.video.readyState < 2) return;

  ctx.drawImage(
    this.video,
    -this.width / 2,
    -this.h / 2,
    this.width,
    this.h
  );

}



async captureFrames() {

  const fps = 12
  this.video.pause();
  const frameCount = Math.floor(this.video.duration * fps);

    for (let i = 0; i < frameCount; i++) { // 30 fps
      const t = i / fps;
      this.video.currentTime = t;
      await new Promise(resolve => {
        this.video.requestVideoFrameCallback(() => {
          createImageBitmap(this.video).then(bitmap => {
            this.frames.push({ time: t, bitmap });
            resolve();
          });
        });
      });
    }

};

async generateThumbnails(){

  return new Promise( async(resolve) => {

    await this.video.play().catch(() => {}); // some browsers require play before seeking
    this.video.pause();

    const count = Math.round(this.video.duration) // number of thumbnails
    const urls = [];

    for (let i = 0; i < count; i++) {
      const t = (i / (count - 1)) * this.video.duration;
      this.video.currentTime = t;
      // wait until frame is ready
      await new Promise((resolve) =>
        this.video.requestVideoFrameCallback(() => resolve())
      );

      // draw to offscreen canvas
      const offscreen = new OffscreenCanvas(this.video.videoWidth, this.video.videoHeight);
      const ctx = offscreen.getContext("2d");
      ctx.drawImage(this.video, 0, 0);

      // convert to blob → URL
      const blob = await offscreen.convertToBlob({ type: "image/png" });
      const url = URL.createObjectURL(blob);
      urls.push(url);
    }



    this.thumbnails = urls
    resolve()
  })

};


getFrameAtTime(time) {
  if (!this.frames || this.frames.length === 0) return null;

  const frameIndex = Math.min(
    Math.floor(time * this.fps),
    this.frames.length - 1
  );

  return this.frames[frameIndex]?.bitmap || null;
}


async drawImageInit() {

  return new Promise( async(resolve, reject) => {
    const ctx = lowerRef.current.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = this.imageSrc;

    await img.decode(); // waits until fully loaded

      //this.img = img; // ✅ store image reference
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

      this.img = img;


      // ✅ create ImageBitmap safely
      const bitmap = await createImageBitmap(img);
      this.imageBitmap = bitmap; // store for worker

      resolve(true);


    img.addEventListener("error", reject);
  });
}


redrawImage(ctx, animationProps) {

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

  console.log('scale', scale)

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


drawTextChars(ctx, animationProps) {

  if (!this.text) return

  ctx.textBaseline = "alphabetic";
  const lines = this.getLines();



  const lineHeight = this.getLineHeight();
  const totalCharsInBlock  = this.text.length;
  let charCounter = 0; // global char index
  // Loop through lines
  lines.forEach((line, lineIndex) => {
    const lineOffset = this.getLineOffset(
      lineIndex,
      line,
      this.textAlign,
      ctx,
      this.width,
      this.textPadding
    );

    let x = lineOffset - this.width / 2 + this.textPadding;
    const baseStyle = this.charStyles?.[`${lineIndex}:0`] || {};
    const fontSize = baseStyle?.fontSize || this.fontSize;
    const baselineOffset = fontSize * 0.8;
    let y = -this.h / 2 + this.textPadding + lineIndex * lineHeight + baselineOffset;

    // Loop through characters
    for (let charIndex = 0; charIndex < line.length; charIndex++) {
      const ch = line[charIndex];

      // Character style
      const style = this.charStyles?.[`${lineIndex}:${charIndex}`] || {};
      const fontWeight = style?.fontWeight || this.fontWeight || "";
      const fontStyle = style?.fontStyle || this.fontStyle || "";
      const fontFamily = style?.fontFamily || this.fontFamily;
      const fill = style?.fill || this.fill || "#000";
      const charFontSize = style?.fontSize || fontSize;

      ctx.font = `${fontStyle} ${fontWeight} ${charFontSize}px ${fontFamily}`;
      ctx.fillStyle = fill;

      // Animation props
      let drawX = x;
      let drawY = y;

      let alpha

      const allowedTypes = new Set(["Lines", "Char"]);

      const hasTextAnim = this.animations?.some(a => !allowedTypes.has(a.type));


      if (hasTextAnim) {
        // Get animation for this character (handles lines or chars automatically)
        // perline
        const animProps = this.getTextAnimatedProps(lineIndex, charCounter, lines.length);
        //const animProps = this.getTextAnimatedProps(lineIndex, charCounter, lines.length);
        drawX += animProps.x;
        drawY += animProps.y;
        alpha = animationProps.opacity * animProps.opacity;
      }else{
        alpha = animationProps?.opacity?animationProps.opacity: 1
      }

      ctx.globalAlpha = alpha;
      ctx.fillText(ch, drawX, drawY);

      // Move to next character
      x += ctx.measureText(ch).width;
      charCounter++; // increment global index
    }
  });
/*
  ctx.restore();
  */
}

getTextAnimatedProps(lineIndex, charIndex = null,  totalLines = 1) {
  // Default props
  let props = { x: 0, y: 0, opacity: 1 };

  this.animations?.forEach(anim => {

    if (!anim.type.includes('Lines') && !anim.type.includes('Char')) return;

    if (this.currentTime < anim.startTime) {
        console.log('before animation starts')
      if (anim.type.includes('fadeIn')) props.opacity = 0;
      if (anim.type === 'fadeInUpLines') props.y = 100;
      if (anim.type === 'fadeInUpChar') props.y = 20;
      if (anim.type === 'slideInLeftLines' || anim.type === 'slideInLeftChar') {
        props.x = -300; props.opacity = 0;
      }
      if (anim.type === 'slideInRightLines' || anim.type === 'slideInRightChar') {
        props.x = 300; props.opacity = 0;
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
    if (this.currentTime < animStart) {

      if (anim.type.includes('fadeIn')) props.opacity = 0;
      if (anim.type === 'fadeInUpLines') props.y = 100;
      if (anim.type === 'fadeInUpChar') props.y = 20;
      if (anim.type === 'slideInLeftLines' || anim.type === 'slideInLeftChar') {
        props.x = -300; props.opacity = 0;
      }
      if (anim.type === 'slideInRightLines' || anim.type === 'slideInRightChar') {
        props.x = 300; props.opacity = 0;
      }
      return;
    }

    // After animation ends
    if (this.currentTime > animEnd) return;

    // Calculate eased progress
    let progress = (this.currentTime - animStart) / anim.duration;

    const easingFn = Easings[anim.easing || 'linear'];
    const  eased = easingFn(progress);

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
        props.x = -300 * (1 - eased);
        break;
      case 'slideInRightLines':
      case 'slideInRightChar':
        props.opacity = eased;
        props.x = 300 * (1 - eased);
        break;
    }
  });

  return props;
}



  easeInOutCubic(t){
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };


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

const createScene = (start, duration, changeTime = false) =>{

    const newScene = new Scene({
      id: generateUniqueId(),
      start:start,
      duration:duration

    })

    sceneManagerRef.current.scenes.push(newScene)
    sceneManagerRef.current.activeSceneId = newScene.id

    setScenes(prev => [...prev, newScene])
    setActiveScene(newScene)


    if (changeTime){

         // Update React state safely
         setCurrentTime(prev => prev + start)
         // Update ref for immediate access elsewhere
         currentTimeRef.current = currentTime + start;
    }

    setDuration(prev => prev + start)

}


const addAudio = (audio) => {
  setAudioUrl(audio[0].file_url)
  showSuccess('Audio Added')
}

const addVideos = (videos) => {

  videos.forEach((video) => {
      addVideo(video)
  });

  showSuccess(`Video${videos.length>0?'s':''} Added`)

}



const addVideo = async (video) => {

  setCanvasLoader(true)

      const lower = lowerRef.current;
      if (!lower) return;
      const ctx = lower.getContext("2d");

    const newObj =  new Element({
      id: generateUniqueId(),
      cx:lowerRef.current.width/2,
      cy:lowerRef.current.height/2,
      videoSrc : video.file_url,
      type:'video',
    })
    await newObj.drawVideoInit(ctx)

    addElement(newObj)

    selectedIndexRef.current = objectsRef.current.length - 1

    setCanvasLoader(false)

    setActiveElement(newObj)
    drawUpper();
    drawArtboard();

}

const onDragOver = (e) => {
}

const onDragStart = (data) => {
  console.log(data)
  setDragMedia(data);
};

const getObjectById = (id) => {

  return objectsRef.current.find((object)=> object.id === id)
}


const findText = () => {

  return objectsRef.current.find((object)=> object.type === 'text')
}


const findImage = () => {

  return objectsRef.current.find((object)=> object.type === 'image')
}

const applyTemplate = (type, template) => {

  const image = getObjectById(postDataRef.current.image)
  const text = getObjectById(postDataRef.current.title)


  if (type === 'videos'){

    if ( template === 'Reel'){
      setBackgroundColour('rgba(0,0,0,1)')


      text.fontFamily = 'Raleway'
      text.fontSize = 120
      text.fontWeight = 900
      text.fill = 'rgba(255,255,255,1)'
      text.textAlign = 'left'
      text.width = PAGE_WIDTH - 100
      text.cx = lowerRef.current.width/2
      text.cy = lowerRef.current.height/2
      text.updateLinesWrap()
      text.updateLines()

      const newTextAnimation = {
        id: generateUniqueId(),
        type:'slideInLeftLines',
        startTime:0,
        duration:4,
        easing: 'easeOutQuad',
        label: '📝 Lines: Slide Left'
      };

      const lines = text.getLines()
      const lineLengths = lines.map(l => l.length);
      const minDuration = calculateMinAnimationDuration({
        lineCount: lines.length,
        lineLengths,
        animType: 'slideInLeftLines', // could also be 'fadeInUpLines'
        charStagger: 0.03,
        lineStagger: 0.1,
        unitDuration: 0.5
      })

     newTextAnimation.duration = minDuration

     text.animations.push(newTextAnimation)

     handleUpdateElements(text.id, { animations: text.animations})

     if (minDuration > 5){
       //change duration
       setDuration(Math.round(minDuration+2))
     }


     //image

     image.opacity = .6

     const newImageAnimation = {
       id: generateUniqueId(),
       type:'grow',
       startTime:0,
       duration:minDuration > 5? Math.round(minDuration+2):5,
       easing: 'easeOutQuad',
       label: 'Grow'
     };

     image.animations.push(newImageAnimation)
     resizeImage('Fit Width', image)

     handleUpdateElements(image.id, { animations: image.animations})


    }

  }

  if (type === 'image'){

    image.animations = []
    text.animations = []

    if (template === 'Story'){

        image.opacity = .6
        resizeImage('Fit Width', image)

        text.fontFamily = 'Raleway'
        text.fontSize = 120,
        text.fontWeight = 900,
        text.fill = 'rgba(255,255,255,1)',
        text.textAlign = 'center',
        text.width = PAGE_WIDTH - 100,
        text.cx = lowerRef.current.width/2
        text.cy = lowerRef.current.height/2
        text.updateLinesWrap()
        text.updateLines()

        setBackgroundColour('rgba(0,0,0,1)')


    }

  }
  setCurrentTime(0)
}




const loadPost = async (postData) => {



  setProjectTitle(postData.title)

  const imageId = generateUniqueId()
  const newImageObj =  new Element({
    id: imageId,
    cx:lowerRef.current.width/2,
    cy:lowerRef.current.height/2,
    imageSrc : postData.image,
    type:'image',
  })

  const lower = lowerRef.current;
  if (!lower) return;
  const ctx = lower.getContext("2d");

  await newImageObj.drawImageInit(ctx)

 addElement(newImageObj)

 const titleId =  generateUniqueId()

  const newTextObj =  new Element({
    id: titleId,
    cx:lowerRef.current.width/2,
    cy:lowerRef.current.height/2,
    fontFamily:'Raleway',
    fontSize:120,
    fontWeight:900,
    text:postData.title,
    fill:'rgba(255,255,255,1)',
    textAlign:'center',
    width : PAGE_WIDTH,
    lineHeight : 140,
    type:'text',
  })



  addElement(newTextObj)

  const websiteId =  generateUniqueId()

  const CTA = `Read the full article at\n${postData.website}`

   const newWebTextObj =  new Element({
     id: websiteId,
     cx:lowerRef.current.width/2,
     cy:80,
     fontFamily:'Raleway',
     fontSize:50,
     fontWeight:900,
     text:CTA,
     fill:'rgba(255,255,255,1)',
     textAlign:'center',
     width : PAGE_WIDTH,
     lineHeight : 60,
     type:'text',
   })

   addElement(newWebTextObj)

  postDataRef.current={
    image:imageId,
    title:titleId,
    website:websiteId,
  }

setCurrentTime(0)

}


const onDrop = async(e) => {
  if (dragMedia){
    if (dragMedia.file_type === 'video/mp4' || dragMedia.file_type === 'video/webm'){
      addVideo(dragMedia)
    }else if (dragMedia.file_type === 'image/png' || dragMedia.file_type === 'image/jpeg'){
      addImage(dragMedia)
    }else if (dragMedia.type === 'post'){

      console.log('dragMedia', dragMedia)

      loadPost({
        image:dragMedia.data.image_url,
        title:dragMedia.data.title,
        website:dragMedia.data.base_url
      })

      setPostInfo(dragMedia)

    }
  }
}

const addImages = (images) => {

  images.forEach((image) => {
      addImage(image)
  });

  showSuccess(`Image${images.length>0?'s':''} Added`)

}

const addImage = async (image) => {
  setCanvasLoader(true)

  const lower = lowerRef.current;
  if (!lower) return;
  const ctx = lower.getContext("2d");

  const newObj =  new Element({
    id: generateUniqueId(),
    cx:lowerRef.current.width/2,
    cy:lowerRef.current.height/2,
    imageSrc : image.file_url,
    type:'image',
  })

  await newObj.drawImageInit(ctx)

  addElement(newObj)
  selectedIndexRef.current = objectsRef.current.length - 1

  setCanvasLoader(false)

  setActiveElement(newObj)
  drawUpper();
  drawArtboard();
}


const redrawAll = () => {
  drawLower();
  drawUpper();
  drawArtboard();
}

const renderSceneWorker = async (time) => {
  const newObjects = [];

// replace html element with bitmaps
  for (const object of objectsRef.current) {
    const newObject = { ...object };
    if (object.type === 'video') {
      newObject.video = await createImageBitmap(object.video); // HTMLVideoElement → ImageBitmap
    }else if (object.type === 'air brush'){
      newObject.airbrushBuffer = object.airbrushBufferBitmap
    }else if (object.type === 'image'){
      newObject.img = object.imageBitmap
    }
    newObjects.push(newObject);
  }

  // Send **all objects in a single message**
  workerRef.current.postMessage({
    type: 'DRAW_FRAME',
    currentTime: time,
    objects: newObjects
  });
};

const renderSceneBuffer = (time) => {

  if (!time) return

  const trackingBufferCtx = trackingBufferRef.current.getContext("2d");

  // Clear ONCE per frame
  trackingBufferCtx.setTransform(1, 0, 0, 1, 0, 0);
  trackingBufferCtx.clearRect(0, 0, trackingBufferCtx.canvas.width, trackingBufferCtx.canvas.height);

  // Draw ALL objects in order
  objectsRef.current.forEach((object) => {
    object.currentTime = time;
    const animationProps = getAnimatedProps(object);
      drawObject(trackingBufferCtx, object, animationProps)
  });

  // Present ONCE
  const ctx = lowerRef.current.getContext("2d");
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.drawImage(trackingBufferRef.current, 0, 0);
};




const renderSceneFrames = (currentTime) => {
  if (!currentTime) return

  const trackingBufferCtx = trackingBufferRef.current.getContext("2d");

  // Clear ONCE per frame
  trackingBufferCtx.setTransform(1, 0, 0, 1, 0, 0);
  trackingBufferCtx.clearRect(0, 0, trackingBufferCtx.canvas.width, trackingBufferCtx.canvas.height);

  // Draw ALL objects in order
  objectsRef.current.forEach((object) => {
    object.currentTime = currentTime;
    const animationProps = getAnimatedProps(object);
    if (object.type==='video'){
      // render frame here
      const bitmap = object.getFrameAtTime(currentTime);

        if (bitmap) {
          trackingBufferCtx.save();

          // apply transforms
          trackingBufferCtx.translate(object.cx, object.cy);
          trackingBufferCtx.rotate(animationProps.angle || 0);
          trackingBufferCtx.scale(animationProps.scale || 1, animationProps.scale || 1);
          trackingBufferCtx.globalAlpha = animationProps.opacity ?? 1;

          trackingBufferCtx.drawImage(
            bitmap,
            -object.width / 2,
            -object.h / 2,
            object.width,
            object.h
          );

          trackingBufferCtx.restore();
        }

        return;
    }else{
      drawObject(trackingBufferCtx, object, animationProps)

    }

  });

  // Present ONCE
  const ctx = lowerRef.current.getContext("2d");
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.drawImage(trackingBufferRef.current, 0, 0);
};




const updateVideosWorker = (time) => {

  let pending = videoRegistryRef.current.size;

  videoRegistryRef.current.forEach((video, key) => {

    if (!video || !isFinite(video.duration)) {
      pending--;
      return;
    }

    const seekTime = Math.min(
      Math.max(time, 0),
      video.duration - 0.001
    );

    if (!video.paused) {
      video.pause();
    }

      video.requestVideoFrameCallback((_, metadata) => {

        pending--;

        if (pending === 0) {
        renderSceneWorker(time);
        }

      });

      video.currentTime = seekTime;
  });
}

const updateVideosBuffer = (time) => {

  let pending = videoRegistryRef.current.size;

  videoRegistryRef.current.forEach((video, key) => {

    if (!video || !isFinite(video.duration)) {
      pending--;
      return;
    }

    const seekTime = Math.min(
      Math.max(time, 0),
      video.duration - 0.001
    );

    if (!video.paused) {
      video.pause();
    }

      video.requestVideoFrameCallback((_, metadata) => {

        /*

        if (
          video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
          video.videoWidth === 0
        ) {
          return;
        }*/

        pending--;

        if (pending === 0) {
          renderSceneBuffer(time);
          //drawLower()
        }

      });


      video.currentTime = seekTime;

  });
}





const stopTracking = (time) => {

  //
}


//tracking
useEffect(() => {

  if (isTrackingRef.current){
    if (videoRegistryRef.current.size > 0){
      //updateVideosBuffer(currentTime)
      updateVideosWorker(currentTime)

    }else{
    //renderSceneWorker(currentTime)
     drawLower()
     drawUpper()
     drawArtboard()
    }
  }


},[currentTime])




const startVideos = () => {
  objectsRef.current.forEach((object)=>{
    if (object.type === 'video'){
      object.video.play();
    }
  })
}

const stopVideos = () => {
  objectsRef.current.forEach((object)=>{
    if (object.type === 'video'){
      object.video.pause();
    }
  })
}



const handlePlayPause = () => {
  if (isPlaying) {
    setIsPlaying(false);
    isPlayingRef.current = false
    stopVideos()

  } else {
    clearUpper()
    if (currentTime >= duration) {
      setCurrentTime(0);
      currentTimeRef.current = 0
    }
    setIsPlaying(true);
    isPlayingRef.current = true
    startVideos()
  }
};

// Audio playback sync
useEffect(() => {


  if (audioRef.current && audioUrl) {

    if (isPlaying) {
      audioRef.current.currentTime = currentTime;
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  }
}, [isPlaying, audioUrl]);



// Animation loop
useEffect(() => {
  if (isPlaying) {
    startTimeRef.current = performance.now() - currentTime * 1000;
    const animate = () => {
      const elapsed = (performance.now() - startTimeRef.current) / 1000;

      if (elapsed >= duration) {
        setIsPlaying(false);
        isPlayingRef.current = false
        setCurrentTime(0);
        currentTimeRef.current = 0
        //reset
        drawLower()
        drawArtboard()
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        //drawUpper()
        return;
      }
      setCurrentTime(elapsed);
      currentTimeRef.current = elapsed
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  } else {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }

  return () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };
}, [isPlaying, duration]);


useEffect(()=>{

  if (isPlaying){
    drawLower()
    drawArtboard()
  }

},[currentTime, isPlaying])

const easeInOutCubic = (t) => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};






 const getAnimatedProps = (element) => {

   if (!element.animations || element.animations.length === 0) {

      return {
        cx: element.cx,
        cy: element.cy,
        opacity: element.opacity ?? 1,
        scale: 1,
        angle: element.angle ?? 0,
        isTextAnimation:false,
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


    const progress = Math.max(0, Math.min(1, (currentTimeRef.current - anim.startTime) / anim.duration));

    const easingFn = Easings[anim.easing || 'linear'];
    const  eased = easingFn(progress);


    props.eased = eased
    props.progress = progress


    if (currentTimeRef.current <= anim.startTime) {
       // Set initial state before animation starts

       if (anim.type === 'fadeIn') props.opacity = 0;
       if (anim.type === 'slideInLeft' ) props.cx = element.x - 300;
       if (anim.type === 'slideInRight') props.cx = element.x + 300;
       if (anim.type === 'slideInTop') props.cy = element.y - 300;
       if (anim.type === 'slideInBottom') props.cy = element.y + 300;
       if (anim.type === 'scaleIn') props.scale = 0;
       return;
     }
    if (currentTimeRef.current > anim.startTime + anim.duration) {
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
      if (anim.type === 'grow') props.scale = 1.2 ; // <-- Add this line
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

        props.scale = 1 + 0.2 * eased;
        break;
    }
  });

  return props;
};



const addText = () => {

  const newObj =  new Element({
    id: generateUniqueId(),
    cx:PAGE_WIDTH/2,
    cy:PAGE_HEIGHT/2,
    fontFamily:selectedFont,
    fontSize:fontSize,
    text:text,
    fill:fillColour,
    textAlign:selectedTextAlignment,
    width : 500,
    lineHeight : selectedTextLineHeight,
    type:'text',
  })


 //objectsRef.current.push(newObj);
 addElement(newObj)
 selectedIndexRef.current = objectsRef.current.length - 1


 setActiveElement(newObj)
 drawUpper();
 drawLower();
 setShowProperties(true)
}


useEffect(()=>{

  if (activeElement){

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

      if (activeElement.lineHeight){
        setSelectedTextLineHeight(activeElement.lineHeight)
      }
      if (activeElement.text){
        setText(activeElement.text)
      }

      loadFontWorker()
    }
  }

},[activeElement])

const updateActiveScene = (updates) => {
  if (activeScene){
      setActiveScene(prev => prev.update(updates));

  }
}

const handleUpdateScenes = (id, updates) => {

  setScenes(prev =>
     prev.map(el =>
       el.id === id ? el.update(updates) : el
     )
   );


}


const updateActiveElement = (updates) => {
  if (activeElement){
      setActiveElement(prev => prev.update(updates));
  }
}

const handleUpdateElements = (id, updates) => {

  setElements(prev =>
   prev.map(el =>
     el.id === id ? el.update(updates) : el
   )
 );


   setScenes(prev =>
      prev.map(scene =>
        scene.update({
          objects: scene.objects.map(obj =>
            obj.id === id
              ? obj.update(updates)
              : obj
          )
        })
      )
  );

}

const addElement = (newObj) => {
    objectsRef.current.push(newObj);
    setElements(prev => [...prev, newObj]);

    // add new element to scene
    const activeScene = sceneManagerRef.current.getActiveScene()
    if (!activeScene) return
      activeScene.objects.push(newObj)

      /*

      setScenes(prev =>
         prev.map(scene =>
           scene.update({
             objects: [...scene.objects, newObj]
           })
         )
     );*/

}

/*
const update = ()  => {

  // Example: updating an element inside a scene
  setSceneManager(prev =>
    updateSceneManager(prev, {
      sceneId: "scene-123",
      elementId: "el-456",
      updates: { x: 100, y: 200 }
    })
  );

  // Example: updating a whole scene
  setSceneManager(prev =>
    updateSceneManager(prev, {
      sceneId: "scene-123",
      updates: { backgroundColor: "#ff0000" }
    })
  );

}


// Generic nested updater for SceneManager state
function updateSceneManager(sceneManager, { sceneId, elementId, updates }) {
  return sceneManager.update({
    scenes: sceneManager.scenes.map(scene => {
      // If updating a specific scene
      if (scene.id !== sceneId) return scene;

      // If updating an element inside the scene
      if (elementId) {
        return scene.update({
          elements: scene.elements.map(el =>
            el.id === elementId ? el.update(updates) : el
          )
        });
      }

      // If updating the scene itself
      return scene.update(updates);
    })
  });
}
*/






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
    const containerHeight = container.offsetHeight
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
    const top = (containerHeight - displayHeight) / 2 + (topToolbar.offsetHeight/2);

    canvasContainer.style.left = `${left}px`;
    canvasContainer.style.top = `${top}px`;

    setScale(scaleMaths);
    //scaleRef.current = scaleMaths

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




  const handleResize = useCallback(() => {
    resize();
  }, [resize]);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);


  const drawArtboard = () => {
    const artboard = artboardRef.current;
    const offset = offsetRef.current
    const cursor = toolsRef.current;

    if (!artboard) return;

    const ctx = artboard.getContext("2d");
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    ctx.clearRect(0, 0, artboard.width, artboard.height);

    if (isPanning.current) {
      ctx.translate(panXRef.current, panYRef.current);
    }

    objectsRef.current.forEach(obj => {
      obj.currentTime = currentTime
      const animationProps = getAnimatedProps(obj);


      ctx.save(); // fresh per object
      ctx.translate(offset.x + animationProps.cx * scaleRef.current , offset.y + animationProps.cy * scaleRef.current);   // move to object center
      ctx.rotate(animationProps.angle);    // apply rotation
      ctx.scale(animationProps.scale, animationProps.scale);
      ctx.globalAlpha = animationProps? animationProps.opacity : obj.opacity;
      ctx.beginPath();

      if (obj.type === "rectangle") {
        // Rectangle: draw centered rect
        ctx.rect((-obj.width/ 2) * scaleRef.current, (-obj.h / 2) * scaleRef.current, obj.width * scaleRef.current, obj.h * scaleRef.current);
      } else if (obj.type === "ellipse") {
        // Ellipse: radii are half width/height
        ctx.ellipse(0, 0, obj.width/ 2 * scaleRef.current, obj.h / 2 * scaleRef.current, 0, 0, Math.PI * 2);
      } else if (obj.type === "triangle"){

        ctx.moveTo(0, -obj.h / 2 * scaleRef.current);
        ctx.lineTo((-obj.width/2) * scaleRef.current, (obj.h / 2) * scaleRef.current);
        ctx.lineTo((obj.width/2) * scaleRef.current, (obj.h / 2) * scaleRef.current);
        // centered at (0,0)

      } else if (obj.type === "text"){

        if (textHilightRef.current){
          obj.drawHilightTextArtboard(ctx, scaleRef.current)
        }else{

          obj.drawTextArtboard(ctx, scaleRef.current)
        }

      }else if (obj.type === "image"){

          ctx.drawImage(
            obj.img,
            (-obj.width / 2) * scaleRef.current,
            (-obj.h / 2) * scaleRef.current,
            obj.width * scaleRef.current,
            obj.h * scaleRef.current
          );

      }else if (obj.type === "video"){

        ctx.drawImage(
          obj.video,
          (-obj.width / 2) * scaleRef.current,
          (-obj.h / 2) * scaleRef.current,
          obj.width * scaleRef.current,
          obj.h * scaleRef.current
        );

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

const clearUpper = () => {
  const upper = upperRef.current;
  if (!upper) return;
  const ctx = upper.getContext("2d");
  ctx.clearRect(0, 0, upper.width, upper.height);
  ctx.save();

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

    let {cx, cy, width, h, angle} = object

    /*

    if (object.type === 'image' && object.clippingPath){

        cx = object.clippingPath.cx;
        cy = object.clippingPath.cy;
        width = object.clippingPath.width;
        h = object.clippingPath.height;
        angle = object.clippingPath.angle
    }else{
        cx = object.cx;
        cy = object.cy;
        width = object.width;
        h = object.width;
        angle = object.angle
    }*/




    const animatedProps = getAnimatedProps(object)
    // Apply global pan + zoom
    const screenCx = offset.x + cx * scaleRef.current;
    const screenCy = offset.y + cy * scaleRef.current;

    const screenW = width * scaleRef.current * animatedProps.scale
    const screenH = h * scaleRef.current * animatedProps.scale

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

    // Curved arrow
    ctx.beginPath();
    ctx.arc(0, +screenH / 2 + ROTATE_DISTANCE, HANDLE_SIZE / 1.2, Math.PI * 0.10, Math.PI * 1.7);
    //ctx.closePath();
    ctx.stroke();

    // Arrowhead
    const r = HANDLE_SIZE / 1.2;

    //Pick the angle where the arrowhead sits
    const endAngle = Math.PI * 1.6;
    const arrowLength = 6;
    const arrowShort = 5.5;
    const spread = 0.7; // controls arrow openness


    const arrowx = 0
    const arrowy = screenH / 2 + ROTATE_DISTANCE;


    const ax = (arrowx + Math.cos(endAngle) * r) + 3.5;
    const ay = (arrowy + Math.sin(endAngle) * r) + 1.5

    const arrowAngle = endAngle + Math.PI / 2; // tangent direction


    ctx.beginPath();

    // Left wing
    ctx.moveTo(ax, ay);
    ctx.lineTo(
      ax - Math.cos(arrowAngle - spread) * arrowShort,
      ay - Math.sin(arrowAngle - spread) * arrowShort
    );


    // Right wing
    ctx.moveTo(ax, ay);
    ctx.lineTo(
      ax - Math.cos(arrowAngle + spread) * arrowLength,
      ay - Math.sin(arrowAngle + spread) * arrowLength
    );

    ctx.strokeStyle = TRANSFORM_COLOUR;
    ctx.lineWidth = TRANSFORM_WIDTH;
    ctx.lineCap = 'round';
    ctx.stroke();


    ctx.restore();
    }
  }

  ctx.restore();
};

const clearCanvas = (ctx) => {
  ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
  ctx.clearRect(0, 0, PAGE_WIDTH + (BLEED*2), PAGE_HEIGHT + (BLEED*2));
  ctx.fillStyle = backgroundColour;
  ctx.fillRect(0, 0, PAGE_WIDTH + (BLEED*2), PAGE_HEIGHT + (BLEED*2));
}


const clearAll = () => {
  const lower = lowerRef.current;
  if (!lower) return;
  const ctx = lower.getContext("2d");
  setBackgroundColour('rgba(255, 255, 255, 1)')
  setPostInfo(null)
  clearCanvas(ctx)
  setActiveElement(null)
  setElements([])
  objectsRef.current = []
  const activeScene = sceneManagerRef.current.getActiveScene()

  activeScene.objects=[]
  setActiveScene(prev => prev.update({objects:[]}));

  setScenes(prev =>
     prev.map(scene =>
       scene.update({
         objects: []
       })
     )
 );

 drawLower()
drawArtboard()
drawUpper()
}

  // Draw lower canvas (full resolution)
  const drawLower = (exportVideo = false) => {

    const scene = sceneManagerRef.current.getSceneAtTime(currentTimeRef.current);

    if (!scene) return

    let ctx

    if (!exportVideo){

      const lower = lowerRef.current;
      if (!lower) return;
      ctx = lower.getContext("2d");

    }else{

      const offscreenCanvasExport = document.createElement("canvas");
      offscreenCanvasExport.width = PAGE_WIDTH + BLEED * 2;
      offscreenCanvasExport.height = PAGE_HEIGHT + BLEED * 2;
      offscreenCanvasExportRef.current = offscreenCanvasExport
      ctx = offscreenCanvasExportRef.current.getContext("2d");

    }


    ctx.save();
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = backgroundColour;
    ctx.fillRect(0, 0, PAGE_WIDTH + (BLEED*2), PAGE_HEIGHT + (BLEED*2));

    if (isPanning.current) {
      ctx.translate(panXRef.current, panYRef.current);
    }


    const localTime = currentTimeRef.current - scene.start;




    scene.objects.forEach(object => {
      // get animation dimensions
      if (!object) return

      object.currentTime = localTime
      const animationProps = getAnimatedProps(object, localTime);

      ctx.save();
      ctx.translate(animationProps.cx, animationProps.cy);
      ctx.rotate(animationProps.angle);
      ctx.scale(animationProps.scale, animationProps.scale);
      ctx.globalAlpha = animationProps.opacity;
      ctx.beginPath(); // 🟢 Always begin a new path for each object


      if (object.type === "rectangle") {

        ctx.rect(-object.width/ 2, -object.h / 2, object.width, object.h);
      } else if (object.type === "ellipse") {

        ctx.ellipse(0, 0, object.width/ 2, object.h / 2, 0, 0, Math.PI * 2);
      } else if (object.type === "triangle"){

        ctx.moveTo(0, -object.h / 2);
        ctx.lineTo(-object.width/2, object.h / 2);
        ctx.lineTo(object.width/2, object.h / 2);

      }else if (object.type === "text"){
        if (textHilightRef.current){
          object.drawHilightText(ctx)
        }else{
          object.drawTextChars(ctx, animationProps)
        //object.drawTextCharsOriginal(ctx)
        }
      }else if (object.type === "image"){

        object.redrawImage(ctx, animationProps)

      }else if (object.type === "video"){


        object.redrawVideo(ctx, animationProps)

      }else if (object.type === "pen"){
              ctx.save();
              ctx.setTransform(1, 0, 0, 1, 0, 0);
              drawPen(ctx, object.points, object.fill, object.brushSize);
              ctx.restore();
       }else if (object.type === "air brush"){

            if (object.airbrushBuffer){
              ctx.save();
              ctx.setTransform(1, 0, 0, 1, 0, 0);
              ctx.globalAlpha = object.brushOpacity/100;
              ctx.drawImage(object.airbrushBuffer, 0, 0);
              ctx.globalAlpha = 1;
              ctx.restore();
            }
      }

      // Fill first

      if (object.type !== "pen" && object.type !== "image"){
        ctx.fillStyle = object.fill || "lightgray";
        ctx.fill();
      }

      // Then stroke (optional)
      if (object.strokeColour && object.strokeWeight){
        ctx.strokeStyle = object.strokeColour || "black";
        ctx.lineWidth = object.strokeWeight || 0
        ctx.stroke();
      }

      ctx.closePath();

      ctx.restore(); // ✅ always restore exactly once per object

    });

    ctx.restore();
  };

  const applyAnimationProps = (ctx, animationProps) => {
    ctx.translate(animationProps.cx, animationProps.cy);
    ctx.scale(animationProps.scale, animationProps.scale);
    ctx.rotate(animationProps.angle);
  }



useEffect(() => {
  drawGuides()
}, [scale, offset]);

  // Redraw when objects, scale, offset, or zoom changes
  useEffect(() => {
    drawLower();
  }, [scale, offset]);


  useEffect(() => {
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
    const animatedProps = getAnimatedProps(object)
    const x = object.x;
    const y = object.y;
    const width = object.width
    const h = object.h


    const cx = x + width * animatedProps.scale / 2;
    const cy = y + h * animatedProps.scale  / 2;


    const offsetX = 0;
    const offsetY = +ROTATE_DISTANCE/scale + (object.h/2) * animatedProps.scale


    const cos = Math.cos(animatedProps.angle);
    const sin = Math.sin(animatedProps.angle);

    // rotate handle into world coordinates
    const handleX = object.cx + offsetX * Math.cos(animatedProps.angle) - offsetY * Math.sin(animatedProps.angle);
    const handleY = object.cy + offsetX * Math.sin(animatedProps.angle) + offsetY * Math.cos(animatedProps.angle);

    // check distance from mouse
    const dx = mouseX - handleX;
    const dy = mouseY - handleY;
    const hit = Math.sqrt(dx*dx + dy*dy) <= HANDLE_SIZE * 2 / scale; // circle hit

  return hit
};

const getHandlePolygons = (object) => {
  const { x, y, cx, cy, angle } = object;
  const animatedProps = getAnimatedProps(object)

  let width = object.width * animatedProps.scale
  let h = object.h * animatedProps.scale

  const cos = Math.cos(animatedProps.angle);
  const sin = Math.sin(animatedProps.angle);

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



const getSideHandlePolygons = (object) => {
  const { cx, cy, angle } = object;
  const animatedProps = getAnimatedProps(object)

  let width = object.width * animatedProps.scale
  let h = object.h * animatedProps.scale

  const cos = Math.cos(animatedProps.angle);
  const sin = Math.sin(animatedProps.angle);

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

    const animatedProps = getAnimatedProps(obj)

    // Translate mouse into object's local space
    const dx = mx - obj.cx;
    const dy = my - obj.cy;

    // Undo rotation
    const cos = Math.cos(-animatedProps.angle);
    const sin = Math.sin(-animatedProps.angle);
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;

    // Check inside axis-aligned rectangle in local space
    return (
      localX >= -obj.width * animatedProps.scale / 2  &&
      localX <= obj.width * animatedProps.scale / 2  &&
      localY >= -obj.h * animatedProps.scale / 2  &&
      localY <= obj.h * animatedProps.scale / 2
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
        id: generateUniqueId(),
        x:pos.x,
        y:pos.y,
        type:shapeType,
        fill:fillColour,
        strokeColour:strokeColour,
      })

     //objectsRef.current.push(newObj);
     addElement(newObj)
     setActiveElement(newObj)
     selectedIndexRef.current = objectsRef.current.length - 1
     draggingRef.current = { id: newObj.id, startX: pos.x, startY: pos.y }
    }else if (tool === 'paint') {
        const pos = getMousePos(e);
        isPaintingRef.current = true

      if (paintType === 'pen'){

        const newObj =  new Element({
          id:generateUniqueId(),
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
          id:generateUniqueId(),
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


    /*
    if (activeElement){
      setActiveElement(null)
    }*/
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
        const animated = getAnimatedProps(obj);


        const keepRatio = e.shiftKey;

        const aspect = obj.width/ obj.h;

        // Mouse position relative to center, rotated into object space
        const dx = pos.x - obj.cx;
        const dy = pos.y - obj.cy;
        const cos = Math.cos(-animated.angle);
        const sin = Math.sin(-animated.angle);
        const localX = (dx * cos - dy * sin) / animated.scale;
        const localY = (dx * sin + dy * cos) / animated.scale;

        // Compute half-width/half-height based on dragged corner
        let halfW = Math.abs(localX);
        let halfH = Math.abs(localY);

        if (!keepRatio) {
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

        const animated = getAnimatedProps(obj);

        // Transform mouse → local object space
        const dx = pos.x - obj.cx;
        const dy = pos.y - obj.cy;

        //inverse of the object’s rotation Now we can treat it like a plain rectangle without worrying about rotation
        const cos = Math.cos(-animated.angle);
        const sin = Math.sin(-animated.angle);
        const localX = (dx * cos - dy * sin) / animated.scale;
        const localY = (dx * sin + dy * cos) / animated.scale;

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
        const worldDx =
          newLocalCx * Math.cos(animated.angle) -
          newLocalCy * Math.sin(animated.angle);

        const worldDy =
          newLocalCx * Math.sin(animated.angle) +
          newLocalCy * Math.cos(animated.angle);



          if (obj.type === 'image'){
            /*

            console.log('resizingSide', resizingSide)


            let cx = obj.cx
            let cy = obj.cy


            const clippingPath = {
              width : newW,
              height : newH,
              cx : cx += worldDx,
              cy: cy += worldDy,
              x:  cx - obj.width/ 2,
              y:  cy - obj.h / 2,
              angle: obj.angle,
              origin: resizingSide.side
            }


            obj.clippingPath = clippingPath
            */

            // Update object
            obj.width= newW;
            obj.h = newH;
            obj.cx += worldDx;
            obj.cy += worldDy;
            obj.x = obj.cx - obj.width/ 2;
            obj.y = obj.cy - obj.h / 2;

            objectsRef.current[index] = obj;


          }else{


            // Update object
            obj.width= newW;
            obj.h = newH;
            obj.cx += worldDx;
            obj.cy += worldDy;
            obj.x = obj.cx - obj.width/ 2;
            obj.y = obj.cy - obj.h / 2;

            objectsRef.current[index] = obj;

          }


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

        //dragging new element
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

  const handleMouseUp = async() => {
    //setDragging(null)

    var obj

    if (selectedIndexRef.current !== null){
      obj = getActiveElement()
    }

    if (isPaintingRef.current && paintType === 'air brush'){
      obj = getActiveElement()
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
      obj.airbrushBufferBitmap = await createImageBitmap(obj.airbrushBuffer)

      overlayCtxRef.current.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
      bufferCtxRef.current.clearRect(0, 0, bufferRef.current.width, bufferRef.current.height);

    }

    if (isPaintingRef.current && paintType === 'pen'){

      obj = getActiveElement()
      if (!obj) return

        obj.fill === fillColour
        obj.brushSize === brushSize

    }

    if (isTextEditingRef.current){
      obj = getActiveElement()
    }

    isPanning.current = false;
    draggingRef.current = null
    resizingRef.current = null
    resizingSideRef.current = null
    rotatingRef.current = false
    lastPointRef.current = null
    isPaintingRef.current = false;
    isErasingRef.current = false;

    if (selectedIndexRef.current !== null){
      const index = selectedIndexRef.current;
      const obj = objectsRef.current[index];
      if (!obj) return
      // Update state with new copy
      if (!["pen", "air brush"].includes(obj?.type)){
        updateActiveElement({ cy: obj.cy, y: obj.y, cx: obj.cx, x: obj.x, width:obj.width, h:obj.h, angle:obj.angle})
        handleUpdateElements( obj.id, { cy: obj.cy, y: obj.y, cx: obj.cx, x: obj.x, width:obj.width, h:obj.h, angle:obj.angle})
      }
      //
    }

    drawLower()

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


  if (!points || points.length < 2) return;

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

      const isCommandOrCtrl = e.metaKey || e.ctrlKey;



      const keysToBlock = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', '=', '-', '1', '0'];
        if (keysToBlock.includes(e.key)) {
          e.preventDefault();
        }

        if (e.code === "Space") {
          e.preventDefault();
          handMode.current = true;
          if (canvas) canvas.style.cursor = "grabbing"; // change cursor
          //return
        }


        if (isCommandOrCtrl) {
          switch (e.key) {
            case "1":
              e.preventDefault();
              setScale(1);
              break;
            case "0":
              e.preventDefault();
              resize('scale to fit');
              break;
            case "=":
              e.preventDefault();
              setScale(prev => prev * 1.25);
              break;
            case "-":
              e.preventDefault();
              setScale(prev => prev / 1.25);
              break;
          }
        }



        const index = selectedIndexRef.current
        const obj = objectsRef.current[index];


        if (selectedIndexRef.current !== null && obj && !["pen", "air brush"].includes(obj.type)) {
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
              //removeItem(index, obj)
              return;

            default:
              return;
          }
          updateActiveElement({ cy: obj.cy, y: obj.y, cx: obj.cx, x: obj.x})
          handleUpdateElements(obj.id, { cy: obj.cy, y: obj.y, cx: obj.cx, x: obj.x})
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


  const removeItem = (obj) => {

    if (obj.type === 'video'){
      videoRegistryRef.current.delete(obj.id);
    }

    const activeScene = sceneManagerRef.current.getActiveScene()

    activeScene.removeItem(obj)

      setScenes(prev =>

        prev.filter(scene => {
          const newObjects = scene.objects.filter((object) => object.id !== obj.id)

          return {
            ...prev,
            objects: newObjects
          };
        })

      );

    selectedIndexRef.current = null

    drawLower()
    drawUpper()
    drawArtboard()

  }


  const toolCallback = (tool, active) =>{

    setShowAnimate(false)

    if (tool === 'size-position'){
        setShowProperties(true)
    }else{
        setShowProperties(false)
    }


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
        updateActiveElement({'text':obj.text})
        handleUpdateElements(obj.id, {'text':obj.text})
        textHilightRef.current = false
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
            updateActiveElement({fill: obj.fill})
            handleUpdateElements( obj.id, {fill: obj.fill})
          }
        }

        drawLower()
        drawArtboard()
      }
  }

  const strokeColourCallBack = (colour) => {
      setStrokeColour(`rgba(${ colour.r }, ${ colour.g }, ${ colour.b }, ${ colour.a })`)
      const index = selectedIndexRef.current
      if (index !== null){
        const obj = objectsRef.current[index];
        if (index !== null){
          obj.strokeColour = `rgba(${ colour.r }, ${ colour.g }, ${ colour.b }, ${ colour.a })`
          updateActiveElement({strokeColour: obj.strokeColour})
          handleUpdateElements( obj.id, {strokeColour: obj.strokeColour})
        }
        drawLower()
        drawArtboard()
      }
  }

  const backgroundColourCallBack = (colour) => {
      setBackgroundColour(`rgba(${ colour.r }, ${ colour.g }, ${ colour.b }, ${ colour.a })`)
  }


  useEffect(()=>{
    drawLower()
  },[backgroundColour])

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

  const textChangeCallback = (value) => {
    console.log('textChangeCallback',value)
    setText(value)
    const active = getActiveElement();
    if (!active || active.type !== "text") return;

    active.text = value;
    active.updateLines()
    console.log('active', active)

    updateActiveElement({ text: value })
    handleUpdateElements(active.id, { text: value })

    drawLower();
    drawUpper();
    drawArtboard()


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

      active.updateLines();

      updateActiveElement({ fontFamily: value })
      handleUpdateElements(active.id, { fontFamily: value })

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

  const resizeImage = (fitType, element = getActiveElement()) => {


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

const onUpdateElementAnimations = (object, animations) => {

    // Update the ref directly
    const index = selectedIndexRef.current;
    const obj = objectsRef.current[index];

    obj.animations = animations;  // ref now updated


    updateActiveElement({ animations: animations})
    handleUpdateElements(obj.id, { animations: animations})
    drawLower()
    drawArtboard()
}

const onSceneUpdateProperty = (property, value) => {
  const updates = { [property]: value };

  const activeScene = sceneManagerRef.current.getActiveScene()
  if (!activeScene) return
  activeScene[property] = value
  updateActiveScene(updates)
  handleUpdateScenes(activeScene.id, updates)

}




const onElementUpdateProperty = (property, value) => {
  const index = selectedIndexRef.current;
  const obj = objectsRef.current[index];

  const updates = { [property]: value };

  const textUpdate = new Set(["fontFamily", "fontWeight", "fontStyle", "fontSize", "textAlign", "lineHeight", "text"]);

  if (textUpdate.has(property)){
    // update text value
      if (obj.type !== "text") return;
      if (obj.isTextHilighted()){
        obj.applyStyleToSelection({ property : value });
      }else{
        obj[property] = value
      }
    obj.updateLines();
    setSelectedFont(obj.fontFamily)
    setSelectedFontStyle(obj.fontStyle)
    setSelectedFontWeight(obj.fontWeight)
    setSelectedTextAlignment(obj.textAlign)
    setSelectedTextLineHeight(obj.lineHeight)
    setFontSize(obj.fontSize)
  }else{
    obj[property] = value
  }

  //const updatedElement = obj.update(updates);
  updateActiveElement(updates)
  handleUpdateElements(obj.id, updates)
  drawLower()
  drawUpper()
}


const saveProject = async () => {
  const objs = objectsRef.current

  const json = JSON.stringify({
    project: {
      name: projectTitle,
      version: "1.0",
      author: "Daniel",
      created: "2025-09-16T08:00:00Z",
      modified: "2025-09-16T09:00:00Z"
    },
    canvas: {
      width: PAGE_WIDTH,
      height: PAGE_HEIGHT,
      bleed: BLEED,
      backgroundColour: backgroundColour,
      currentPreset: currentPreset
    },
    audio:{
      audio_url:audioUrl
    },
    sceneManager: sceneManagerRef.current,
    scenes: scenes,
    elements: objectsRef.current

  }, null, 2);

  const mime = "file/application"

  const fileHandle = await window.showSaveFilePicker({
    suggestedName: projectTitle+'.danva',
    types: [{ description: mime, accept: { [mime]: [".danva"] } }]
  });
  const writable = await fileHandle.createWritable();
  await writable.write(json);
  await writable.close();

}

const loadProject = async (e) => {
const file = e.target.files[0]


const text = await file.text();
const data = JSON.parse(text);

if (data){
  setProjectTitle(data.project.name)
  SET_PAGE_WIDTH(data.canvas.width)
  SET_PAGE_HEIGHT(data.canvas.height)
  SET_BLEED(data.canvas.bleed)
  setCurrentPreset(data.canvas.currentPreset)
  setBackgroundColour(data.canvas.backgroundColour)

  if (data?.audio?.audio_url){
    setAudioUrl(data?.audio?.audio_url)
  }


  const elementArray = []



for (const element of data.elements) {
  if (element.type === 'image'){
    const lower = lowerRef.current;
    if (!lower) return;
    const ctx = lower.getContext("2d");
    const newImageElement = new Element(element)
    await newImageElement.drawImageInit(ctx)
    elementArray.push(newImageElement)
  }else if (element.type === 'video'){
    const lower = lowerRef.current;
    if (!lower) return;
    const ctx = lower.getContext("2d");
    const newVideoElement = new Element(element)
    await newVideoElement.drawVideoInit(ctx)
    elementArray.push(newVideoElement)
  }else{
    const newElement = new Element(element)
    elementArray.push(newElement)
  }


}


  const sceneArray = []

  data.scenes.forEach((scene) => {

      const objectArray = []

      scene.objects.forEach((object) => {

            const newObject = elementArray.find((el)=> el.id === object.id)

           objectArray.push(newObject)
      })

      const newScene = new Scene({
        id:scene.id,
        activeObjectId:scene.activeObjectId,
        objects: objectArray,
        start:scene.start,
        duration:scene.duration,
      })


      sceneArray.push(newScene)

  })

  const newSceneManager = new SceneManager({
    id:data.sceneManager.id,
    scenes:sceneArray,
    activeSceneId:data.sceneManager.activeSceneId
  })


  setElements(elementArray)
  setScenes(sceneArray)

  sceneManagerRef.current = newSceneManager

  drawLower()
  }
}

const exportVideo = async(type, download) => {
  setIsExporting(true);
  const blob = await createVideo(type)

  if (download){
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectTitle || 'video'}.${type}`;
    a.click();
    URL.revokeObjectURL(url);
  }
  setIsExporting(false);
}

const createVideo = async (format) => {

  return new Promise(async(resolve, reject) => {

  try {

    // Get the canvas element

    const canvas = lowerRef.current


    if (!canvas) {
      throw new Error('Canvas not found');
    }

    let stream = canvas.captureStream(fps);


    // Add audio track if available
    if (audioUrl) {
      // Create a fresh audio element for export
      const exportAudio = new Audio();
      exportAudio.crossOrigin = "anonymous";
      exportAudio.src = audioUrl;

      const audioContext = new AudioContext();
      const source = audioContext.createMediaElementSource(exportAudio);
      const destination = audioContext.createMediaStreamDestination();
      source.connect(destination);

      const audioTrack = destination.stream.getAudioTracks()[0];
      if (audioTrack) {
        stream = new MediaStream([...stream.getTracks(), audioTrack]);
      }

      // Prepare audio for recording
      exportAudio.currentTime = 0;
      await exportAudio.play();
    }


      const mediaRecorder = new MediaRecorder(stream, {
             mimeType: 'video/webm;codecs=vp9',
             videoBitsPerSecond: 5000000
           });

           const chunks = [];
           mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

           mediaRecorder.onstop = async () => {
             const blob = new Blob(chunks, { type: 'video/webm' });


             if (format === 'mp4'){
               const response = await fetch('/api/convert-webm-to-mp4', {
                method: 'POST',
                body: blob
              });

              if (!response.ok) throw new Error('Failed to convert video');
              const mp4 = await response.blob();
              resolve(mp4);
             }else{
               resolve(blob);
             }

           };

           // Start recording and play animation
           mediaRecorder.start();
           setCurrentTime(0);
           currentTimeRef.current = 0

           setIsPlaying(true);
           isPlayingRef.current = true
           startVideos()

           // Stop after duration
           setTimeout(() => {
             mediaRecorder.stop();
             setIsPlaying(false);
             isPlayingRef.current = false
             stopVideos()
           }, duration * 1000 + 100);

  } catch (error) {
    console.error('Export error:', error);
  }

  })
};

const duplicate = (element) => {
 const newElement = new Element({
    ...element,
    id: generateUniqueId()
  });

  addElement(newElement)
  setActiveElement(newElement)
  selectedIndexRef.current = objectsRef.current.length - 1

}


useEffect(()=>{

  if (textEditing){
    activateEditText()
  }else{
    deActivateEditText()
  }

},[textEditing])

const deActivateEditText = () => {
  const obj = getActiveElement()
  if (!obj && obj?.type !== 'text') return
  isTextEditingRef.current = false
}

const activateEditText = () => {
  const obj = getActiveElement()
  if (!obj && obj?.type !== 'text') return
  isTextEditingRef.current = true
  textEditRef.current.value = obj.text?obj.text:''
  textEditRef.current.focus();
  if (!obj.caretAbsIndex){
      obj.caretAbsIndex = obj.text.length;
  }

  const lines = obj.getLines()
  activateTextEditor()
  startCaretBlink()
}

const handleDoubleClick = (e) => {
    const pos = getMousePos(e);
    if (!pos) return
    if (isTextEditingRef.current){
      return
    }
    if (handMode.current) {
        return
    }
    // object selection (topmost first)
    for (let i = objectsRef.current.length - 1; i >= 0; i--) {
      if (hitObject(objectsRef.current[i], pos.x, pos.y) && objectsRef.current[i].type === 'text') {
        const obj = getActiveElement()
        if (!obj && obj.type !== 'text') return
        isTextEditingRef.current = true
        textEditRef.current.value = obj.text?obj.text:''
        textEditRef.current.focus();
        if (!obj.caretAbsIndex){
            obj.caretAbsIndex = obj.text.length;
        }

        const lines = obj.getLines()
        activateTextEditor()
        startCaretBlink()

        return;
      }
    }
}

const postScheduled = (postInfo) => {


  setPosts(prev =>
    prev.map((post)=>{
      if (post.id === postInfo.data.id){
        post.scheduled = true
      }
      console.log('post', post)
      return post
    })
  )

  setPostInfo(prevState => ({
     ...prevState, // Copy top-level properties
     data: {
       ...prevState.data, // Copy nested 'profile' properties
       scheduled: true // Overwrite 'notifications'
     }
   }));


}

useEffect(()=>{

  console.log(posts)

},[posts])



  return (
    <>
    <ToastProvider/>
    <div style={canvasLoader? {display:'block'}:{display:'none'}} className={'loader_screen'}>
        <div className="loader"></div>
    </div>
    <div
      ref={containerRef}
      style={{ position: "relative", width: "100%"}}
      className='editor-background video'
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
        onDoubleClick={handleDoubleClick}
        onDragOver={(e) => {
         e.preventDefault(); // <-- This is essential
         onDragOver(e);
       }}
       onDrop={(e) => {
         e.preventDefault(); // good practice to prevent browser defaults
         onDrop(e);
       }}
      />
      {/* tools */}
      <div className='canvas-left-side-toolbar dropshadow'>
        <ToolSVG
          icon={SquareMousePointer}
          callBack={toolCallback}
          tool='size-position'
          label='Size & Position'
          position={'left'}
          activeTool={activeTool}
        />
        <ToolSVG
          icon={Square}
          callBack={toolCallback}
          tool='shape'
          label='Shapes'
          position={'left'}
          activeTool={activeTool}
          >
            <div onClick={() => setShapeType('rectangle')} className={`tool-option ${shapeType === 'rectangle'? 'active':''}`}><img src='rectangle.svg' style={{marginRight:'5px', width:'15px'}}/>Rectangle</div>
            <div onClick={() => setShapeType('ellipse')} className={`tool-option ${shapeType === 'ellipse'? 'active':''}`}><img src='circle.svg' style={{marginRight:'5px', width:'15px'}}/>Ellipse</div>
            <div onClick={() => setShapeType('triangle')} className={`tool-option ${shapeType === 'triangle'? 'active':''}`}><img src='triangle.svg' style={{marginRight:'5px', width:'15px'}}/>Triangle</div>
          </ToolSVG>
        <ToolSVG
          icon={PencilLine}
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
        </ToolSVG>
        <ToolSVG
          icon={Eraser}
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

        </ToolSVG>
        <ToolSVG
          icon={Type}
          callBack={toolCallback}
          tool='text'
          label='Text'
          position={'left'}
          activeTool={activeTool}
          >
            <div>
              <TextComponent callBack={textChangeCallback} text={text}/>
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
              <div className='col-2 column-gap-2'>
                <TextAlignmentComponent callBack={textAlignmentCallback} selectedTextAlignment={selectedTextAlignment}/>
                <TextLineHeightComponent callBack={textLineHeightCallback} selectedTextLineHeight={selectedTextLineHeight}/>
              </div>
              <button className='btn primary' onClick={addText}>Add Text</button>
            </div>

        </ToolSVG>
        <ToolSVG
          icon={FileImage}
          callBack={toolCallback}
          tool='images'
          label='Add Image'
          position={'left'}
          activeTool={activeTool}
          >
            <div>
              <Media
                user={user}
                addMedia={addImages}
                fileTypes={['image/png', 'image/jpg']}
                accept="image/*,.pdf,.doc"
                label={'image'}
                onDragStart={onDragStart}
              />
            </div>
        </ToolSVG>
        <ToolSVG
          icon={Music}
          callBack={toolCallback}
          tool="music"
          label="Music"
          position="left"
          activeTool={activeTool}
        >
          <div>
            <Media
              user={user}
              addMedia={addAudio}
              fileTypes={['audio/mpeg', 'audio/wav', 'audio/aac', 'audio/webm', 'audio/ogg']}
              accept="audio/*,.mp3"
              label={'music'}
              onDragStart={onDragStart}
            />
          </div>
        </ToolSVG>
        <ToolSVG
          icon={Film}
          callBack={toolCallback}
          tool="video"
          label="Video"
          position="left"
          activeTool={activeTool}
        >
          <div>
            <Media
              user={user}
              addMedia={addVideos}
              fileTypes={['video/mp4', 'video/webm']}
              accept="video/*,.mp4"
              label={'video'}
              onDragStart={onDragStart}
            />
          </div>
        </ToolSVG>
        <ToolSVG
          icon={LayoutTemplate}
          callBack={toolCallback}
          tool="template"
          label="Templates"
          position="left"
          activeTool={activeTool}
        >
          <div>
            <TemplatePanel
              applyTemplate={applyTemplate}
            />
          </div>
        </ToolSVG>
        <ToolSVG
          icon={Rss}
          callBack={toolCallback}
          tool="posts"
          label="Posts"
          position="left"
          activeTool={activeTool}
        >
          <div>
            <FeedsPanel
              selectedFeed={selectedFeed}
              setSelectedFeed={setSelectedFeed}
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
              posts={posts}
              setPosts={setPosts}
              onDragStart={onDragStart}
            />
          </div>
        </ToolSVG>
        <FillColourPicker
          //callBack={toolCallback}
          tool='fill-colour-picker'
          label='Fill Colour'
          activeTool={activeTool}
          position={'left'}
          fillColourCallBack={fillColourCallBack}
          activeColour={activeElement?.fill?activeElement?.fill:null}
        />
        <StrokeColourPicker
          //callBack={toolCallback}
          tool='stroke-colour-picker'
          label='Stroke Colour'
          activeTool={activeTool}
          position={'left'}
          strokeColourCallBack={strokeColourCallBack}
          activeColour={activeElement?.strokeColour?activeElement?.strokeColour:null}
        />
        <BackgroundColourPicker
          tool='background-colour-picker'
          label='Background Colour'
          activeTool={activeTool}
          position={'left'}
          backgroundColourCallBack={backgroundColourCallBack}
          activeColour={backgroundColour}
        />
      </div>
      <div className={`side_menu_right dropshadow`}>
        <button className="btn primary" onClick={clearAll}>Clear Canvas</button>
        {activeScene &&
          <div className='properties-container'>
            <div className="property-label"><Film className="property-icon" /><p>Active Scene</p></div>
            <p className='font-label'>Duration</p>
            <input
              type='number'
              style={{border:0}}
              onChange={(e) => onSceneUpdateProperty('duration', e.target.value)}
              value={activeScene?.duration??''}
              className={'form-input'}
            />
            <div className='col-2 column-gap-2'>
              <button onClick={() => duplicateScene(activeScene)} style={{flex: 4}} className='btn secondary icon-button'>
                <Copy className='button-icon'/>
                Duplicate
              </button>
              {scenes.length>1&&
              <button style={{}} onClick={() => removeScene(activeScene)} className='btn danger'><Trash2 style={{verticalAlign: 'middle'}} className="h-3 w-3"/></button>
              }
            </div>
          </div>
        }
        {!activeScene &&
          <button className="btn primary" onClick={()=>createScene(0,5,false)}>Create New Scene</button>
        }
        {postInfo&&
          <div className='properties-container' style={{marginTop:'10px'}}>
            <div className="property-label"><Rss className="property-icon" /><p>Post Info</p></div>
            {postInfo.data.scheduled &&
              <div className="scheduled_badge">
                <strong>Scheduled</strong>
                <CircleCheck />
              </div>
            }


            <p className='font-label'>Post Link</p>
            <div className={'form-input'} style={{display:'flex', alignItems:'center', padding: '0px 5px 0px 0px'}}>
              <input
                id="post-link"
                type='text'
                style={{border:0, margin: '1px'}}
                defaultValue={`https://${postInfo.data.base_url}/${postInfo.data.slug}`}
                className={'form-input'}
              />
              <Copy onClick={()=>copyText(`https://${postInfo.data.base_url}/${postInfo.data.slug}`)}/>
            </div>
            <p className='font-label'>Schedule Date</p>
              <input
                id="post-link"
                type='datetime'
                defaultValue={new Date(postInfo.data.scheduleDate)}
                className={'form-input'}
              />
            <p className='font-label'>Post Caption</p>
            <textarea
              id="post-caption"
              rows="4"
              defaultValue={postInfo.data.caption}
              className={'form-input'}
            />
          </div>
        }

        {activeElement &&
          <>
            <div style={{marginTop: '20px'}} className="property-label"><SquareMousePointer className="property-icon" /><p>Active Element</p></div>

            <div className='col-2 column-gap-2'>
              <button onClick={() => duplicate(activeElement)} style={{flex: 4}} className='btn secondary icon-button'>
                <Copy className='button-icon'/>
                Duplicate
              </button>
              <button style={{}} onClick={() => removeItem(activeElement)} className='btn danger'><Trash2 style={{verticalAlign: 'middle'}} className="h-3 w-3"/></button>
            </div>

            <div className='col-2 column-gap-2'>
                <button style={{flex:1}} className={`btn  ${showAnimate? 'primary':''}`} onClick={()=> {
                  setShowAnimate(prev => !prev)
                    if (!showAnimate){
                      setShowProperties(false)
                    }
                  }
                }
                >Animate</button>
                <button style={{flex:1}} className={`btn  ${showProperties? 'primary':''}`} onClick={()=> {
                  setShowProperties(prev => !prev)
                  if (!showProperties){
                    setShowAnimate(false)
                  }
                }
              }
                >Properties</button>
            </div>
          </>
        }

        {showAnimate &&
          <AnimatePanel
          element={activeElement}
          onUpdateElement={onUpdateElementAnimations}
          duration={duration}
          />
        }
        {showProperties &&
          <PropertiesPanel
          element={activeElement}
          onElementUpdateProperty={onElementUpdateProperty}
          selectedIndex={selectedIndexRef.current}
          removeItem={removeItem}
          resizeImage={resizeImage}
          bringToFront={bringToFront}
          sendToBack={sendToBack}
          moveBackwards={moveBackwards}
          moveForward={moveForward}
          setTextEditing={setTextEditing}
          textEditing={textEditing}
          />
        }
      </div>


      <div ref={topToolbarRef} className='canvas-top-toolbar dropshadow'>

        <div style={{display:'flex', alignItems:'center'}}>
          <div style={{width:200}}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 1060 240"
              className="logo"
            >
              <defs>
                <linearGradient id="myGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--md-sys-color-inverse-primary)" />
                  <stop offset="100%" stopColor="var(--md-sys-color-primary)" />
                </linearGradient>
              </defs>
              <path d="M133.4,0C45.7,0,0,46.7,0,98.4c0,20.2,6.6,41.3,21.4,57.1l33.1-26.8c-5.7-9.1-9.5-21.4-9.5-34.4c0-25.5,15.1-49.8,53.6-58
                L36.9,239.4h38.8c20.2,16.1,42,23.3,65.9,23.3c80.1,0,127.1-78.5,127.1-147.3C268.7,49.2,223.6,0,133.4,0z M129,223.9
                c-12.3,0-25.2-2.8-36.6-11.4L147,34.1c53.3,5,73.5,35.6,73.5,77.9C220.5,162.8,192.4,223.9,129,223.9z"/>
              <path d="M1042.1,150.5c-17.3,35.3-35.6,59.6-49.8,59.6c-9.8,0-9.1-10.1-5.7-20.8l33.7-110.7h-46.1l-7.9,25.5
                c-7.9-18.3-23.7-28.4-43.5-28.4c-43.4,0-77.7,42.6-85.9,88.4c-8.8,11.7-19.4,17.9-31.2,17.9c-5.7,0-10.7-1.3-15.8-3.8
                c24.6-30.3,34.7-54.3,34.7-74.8c0-29.3-21.4-42.9-42.6-42.9c-31.2,0-45.4,27.4-45.4,56.1c0,16.1,4.1,33.7,12,48.9
                c-8.8,10.7-19.2,21.8-30.9,33.4L707.5,78.5h-46.1l7.1,72.8c-17.2,34.8-35.3,58.7-49.4,58.7c-9.5,0-9.1-10.1-5.7-20.8l14.2-46.4
                c10.4-33.7,0.6-67.2-35.3-67.2c-17,0-31.9,8.5-45.1,23.3l6.3-20.5h-46l-22.9,74.8c-16.9,33.8-34.6,56.7-48.4,56.7
                c-9.8,0-9.1-10.1-5.7-20.8l33.7-110.7h-46.1l-7.9,25.5c-7.9-18.3-23.7-28.4-43.5-28.4c-49.8,0-87.7,56.1-87.7,108.8
                c0,36.9,21.1,57.7,52.7,57.7c19.9,0,38.2-9.8,52.4-25.5c2.8,14.5,12.3,25.5,32.8,25.5c17.3,0,33-8.2,47.2-22l-5.8,19.1h46.1
                l31.9-104.7c9.1-11.4,19.6-20.5,32.2-20.5c16.1,0,18,13.9,12.9,30l-11,35c-8.2,26.8-7.3,63.1,29.6,63.1c28.3,0,52.6-21.9,72.2-54.6
                l5.1,51.7h53l7.9-6.9c14.8-13.2,27.1-25.9,37.8-37.5c8.5,4.7,18,7.6,29,7.6c11.5,0,21.8-3.2,30.7-9c3.2,31.3,23.3,48.8,52.2,48.8
                c19.9,0,38.2-9.8,52.4-25.5c2.8,14.5,12.3,25.5,32.8,25.5c36,0,65.3-35.3,87.1-83C1056.9,155.5,1048.1,150.8,1042.1,150.5z
                 M350.7,204.1c-13.9,0-22.7-9.8-22.7-26.8c0-27.4,22.1-59,43.8-59c13.9,0,23.3,9.8,23.3,26.5C395.2,172.5,373.1,204.1,350.7,204.1z
                 M763.6,145.7c-3.5-9.1-5.4-19.2-5.4-29.3c0-14.5,4.4-28.1,13.6-28.1c5.4,0,9.1,5,9.1,14.2C781,114.2,774.6,129,763.6,145.7z
                 M906.8,204.1c-13.9,0-22.7-9.8-22.7-26.8c0-27.4,22.1-59,43.8-59c13.9,0,23.3,9.8,23.3,26.5C951.3,172.5,929.2,204.1,906.8,204.1z
                "/>

            </svg>
          </div>
          <input id='projectTitle' className="form-input input" value={projectTitle} type='text' onChange={(e) => setProjectTitle(e.target.value)} placeholder='Untitled'/>
          <div  style={{marginLeft: 'auto', padding:'0px 0px 0px 15px', display:'flex', alignItems:'center'}}>
            <div style={{display:'flex', alignItems:'center', gap:'5px', width:'100px', position:'relative'}}>
              <Clock style={{
                 position: 'absolute',
                  left: '5px',
                  width: '19px'
                }}
              />
              <input
                style={{paddingLeft: '30px'}}
                  type="number"
                  className="form-input input"
                  id="duration"
                  value={duration}
                  onChange={(e)=>setDuration(e.target.value)}
                />
            </div>
            <div style={{width:'250px', padding:'0px 15px'}}>
              <select id="presets-select" name="presets-select" value={currentPreset} className="form-input select" onChange={(e) => handlePresetChange(e.target.value)}>
                {PRESETS.map(preset => (
                  <option key={preset.label} value={preset.label}>{preset.label}</option>
                ))}
              </select>
            </div>

            {scalePercentage &&
              <Percentage
                scalePercentage={scalePercentage}
                setScale={setScale}
                resize={resize}
              />
            }
          <button className="btn primary icon-button" onClick={saveProject} disabled={projectTitle.length>0?false:true}><Save className='button-icon'/>Save</button>
          <div style={{margin: '0px 15px'}}>
            <input
                style={{display:'none'}}
                type="file"
                accept=".danva"
                className='btn secondary'
                onChange={loadProject}
                id="file-upload"
              />
              <label
                className="btn secondary icon-button"
                htmlFor="file-upload"
              >
              <Upload className='button-icon'/>
              Load File
            </label>
          </div>
          <DownloadDropDown
            exportVideo={exportVideo}
            canvas={lowerRef.current}
            projectTitle={projectTitle}
            showShare={setShowShare}
            postInfo={postInfo}
            exportCcapture={exportCcapture}
            exportVideoFrames={exportVideoFrames}

          />
        </div>
        <ThemeSwitcher />
        </div>
      </div>
      {activeElement &&
        <div
          className='tool-tip dropshadow'
          style={{
          position:'absolute',
          left: (offsetRef.current.x + activeElement.cx * scale),
          top: (offsetRef.current.y + activeElement.cy * scale) - 120,
          background:'#fffff',
          padding:'5px 15px 5px 5px',
          transform: 'translate(-50%, -100%)',
          marginTop: activeElement.rotate === 0?'-25px':'-75px',
          borderRadius:'10px',
          display:'none',
          alignItems:'center',
          background:'#ffffff',
        }}>
          {(activeElement.type === 'text') &&
            <>
              {/*}
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
              */}
            </>
          }
          {(activeElement.type === 'image') &&
            <>
              {/*}<img src='/replace_image.svg' onClick={handleReplaceImage} style={{width:'28px', marginRight:'10px'}} alt='Replace Image'/>*/}
              <img src='/fit_width.svg' onClick={() => resizeImage('Fit Width')} style={{width:'28px', marginRight:'10px'}} alt='Fit Width'/>
              <img src='/fit_page.svg' onClick={() => resizeImage('Fit Page')} style={{width:'28px', marginRight:'10px'}} alt='Fit Page'/>
            </>
          }
          <div style={{margin: '0px 0px 0px 15px'}}>
            <button className={`btn  ${showAnimate? 'primary':''}`} onClick={()=> {
              setShowAnimate(prev => !prev)
                if (!showAnimate){
                  setShowProperties(false)
                }
              }
            }
            >Animate</button>
          </div>
          <div style={{margin: '0px 0px 0px 15px'}}>
            <button className={`btn  ${showProperties? 'primary':''}`} onClick={()=> {
              setShowProperties(prev => !prev)
              if (!showProperties){
                setShowAnimate(false)
              }
            }
          }
            >Properties</button>
          </div>
        </div>

      }

      <textarea ref={textEditRef} id="hidden-input"></textarea>
      <div style={{
        position: 'absolute',
        bottom: '0px',
        right: '0px'
      }}>

      </div>
      {audioUrl && (
        <audio ref={audioRef} src={audioUrl} />
      )}
    </div>
    <div className='timeline-container' >
      <div className='timeline dropshadow'>
        <Timeline
          duration = {duration}
          currentTime = {currentTime}
          onTimeChange={changeTime}
          isPlaying = {isPlaying}
          isTracking = {isTrackingRef}
          stopTracking = {stopTracking}
          onPlayPause = {handlePlayPause}
          elements = {elements}
          selectedElement = {activeElement}
          onSelectElement = {onSelectElement}
          fps = {fps}
          scenes = {scenes}
          createScene = {createScene}
          activeScene={activeScene}
          onSelectScene = {onSelectScene}
          audioUrl={audioUrl}
          toolCallback={toolCallback}
        />
      </div>
    </div>
    {showShare &&
      <Share
        showShare={setShowShare}
        createVideo={createVideo}
        postInfo={postInfo}
        userId={user.id}
        videoFrameProgress={videoFrameProgress}
        exportVideoFrames={exportVideoFrames}
        videoConvertProgress={videoConvertProgress}
        postScheduled={postScheduled}
      />
    }
</>
  );
})


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

const DownloadDropDown = ({
exportVideo,
canvas,
projectTitle,
showShare,
postInfo,
exportCcapture,
exportVideoFrames
}) => {
  const [open, setOpen] = useState(false)

  return(
    <div style={{position:'relative'}}>
      <button style={{width:121}} onClick={() => setOpen(prev => !prev)} className='btn primary icon-button'><Upload  className='button-icon'/>Share</button>
      {open &&
        <div style={{position:'absolute', marginTop: '10px'}} className='canvas-zoom-dropdown dropshadow'>
          <p onClick={() => {
            saveAsPng(projectTitle, canvas, 300)
            setOpen(false)
          }}>Save as PNG</p>
          <p onClick={() => {
            saveAsjpg(projectTitle, canvas, 300)
            setOpen(false)
          }}>Save as JPG</p>
          <p onClick={() => {
            exportVideoFrames(true)
            setOpen(false)
          }}>Export Video</p>
          {postInfo&&
            <button
              onClick={() => {
                showShare(true)
                setOpen(false)
              }} style={{flex: 2}} className='btn secondary icon-button'>
              <CalendarDays className='button-icon'/>
              Schedule
            </button>
          }
        </div>
      }
    </div>
  )
}

const ToolSVG = ({
  icon,
  callBack,
  tool,
  label,
  position,
  activeTool,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(activeTool === tool);
  }, [activeTool, tool]);

  const ToolIcon = icon;

  return (
    <div style={{ width: "100%", padding: "5px 10px" }}>
      <div
        onClick={() => callBack(tool, !isOpen)}
        className={`${isOpen ? "active" : ""} tool_tip tool-icon-container`}
        style={{ padding: "2px" }}
      >
        <ToolIcon className="tool-icon" />
      </div>
      {(isOpen && position !== "tool_tip" && children )&& (
        <div className={`dropshadow ${position === "left" ? "side_menu_left" : "side_menu_right"}`}>
          <div style={{ display: "flex" }}>
            <strong>
              <p style={{ paddingLeft: "10px" }}>{label}</p>
            </strong>
            <X
              onClick={() => callBack(tool, !isOpen)}
              className="close-icon"
              style={{ marginLeft: "auto", cursor: "pointer" }}
            />
          </div>

          {children}
        </div>
      )}
    </div>
  );
};



const Tool = ({
  icon,
  callBack,
  tool,
  label,
  position,
  activeTool,
  children,

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
      {(isOpen && position !== 'tool_tip' && children) &&
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
  fillColourCallBack,
  activeColour
}) => {


const [isOpen, setIsOpen] = useState(false);
const [colour, setColour] = useState(activeColour?activeColour:'rgba(255, 255, 255, 1)')

const isWhite = colour === 'rgba(255, 255, 255, 1)'


useEffect(()=>{
  if (activeTool === tool){
    setIsOpen(true)
  }else{
    setIsOpen(false)
  }
},[activeTool, tool])



const handleClose = () => {
    setIsOpen(false)
  };

const  handleChange = (color) => {
    setColour(color.rgb)
    fillColourCallBack(color.rgb)
  };



    return (
      <div style={{width: '100%', padding: '5px 10px'}}>
        <div className={`${isWhite? 'colour-border':"" }`} style={{margin:'0 auto', width:25, height:25, borderRadius:'50%', background: activeColour?activeColour:`rgba(${ colour.r }, ${ colour.g }, ${ colour.b }, ${ colour.a })`}} onClick={() => setIsOpen(prev => !prev)}>
        </div>
        { isOpen ? <div className={`dropshadow ${position==='left'? 'side_menu_left':'side_menu_right'}`}>
          <div style={{display:'flex'}}><strong><p style={{paddingLeft:'10px'}}>{label}</p></strong><img onClick={handleClose} src='close.svg' style={{width:'20px', marginLeft:'auto'}}/></div>
          <SketchPicker
            color={ colour }
            onChange={ handleChange }
            onChangeComplete={handleChange}
            presetColors={["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#00FFFF"]}
          />
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
  strokeColourCallBack,
  activeColour
}) => {

const [isOpen, setIsOpen] = useState(false);
const [colour, setColour] = useState(activeColour?activeColour:'rgba(255, 255, 255, 1)')

const isWhite = colour === 'rgba(255, 255, 255, 1)'


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
      <div style={{width: '100%', padding: '5px 10px'}}>
        <div className={`${isWhite? 'colour-border-stroke':"" }`} style={{margin:'0 auto', width:30, height:30, borderRadius:'50%', borderStyle: 'solid', borderWidth: 5, borderColor: activeColour?activeColour:`rgba(${ colour.r }, ${ colour.g }, ${ colour.b }, ${ colour.a })`,}} onClick={() => setIsOpen(prev => !prev)}>
        </div>
        { isOpen ? <div className={`dropshadow ${position==='left'? 'side_menu_left':'side_menu_right'}`}>
          <div style={{display:'flex'}}><strong><p style={{paddingLeft:'10px'}}>{label}</p></strong><img onClick={handleClose} src='close.svg' style={{width:'20px', marginLeft:'auto'}}/></div>
          <SketchPicker
            color={ colour }
            onChange={ handleChange }
            onChangeComplete={handleChange}
            presetColors={["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#00FFFF"]}
          />
        </div> : null }
      </div>
    )

}

const BackgroundColourPicker = ({
  //callBack,
  tool,
  label,
  activeTool,
  position,
  backgroundColourCallBack,
  activeColour
}) => {

const [isOpen, setIsOpen] = useState(false);
const [colour, setColour] = useState(activeColour?activeColour:'rgba(255, 255, 255, 1)')



const isWhite = colour === 'rgba(255, 255, 255, 1)'

const  handleClose = () => {
    setIsOpen(false)
  };

const  handleChange = (color) => {


    setColour(color.rgb)
    backgroundColourCallBack(color.rgb)
};





    return (
      <div style={{width: '100%', padding: '5px 10px'}}>
        <div className={`${isWhite? 'colour-border':"" }`} style={{margin:'0 auto', width:25, height:25, borderRadius:'50%', background: activeColour?activeColour:`rgba(${ colour.r }, ${ colour.g }, ${ colour.b }, ${ colour.a })`}} onClick={() => setIsOpen(prev => !prev)}>
        </div>
        { isOpen ? <div className={`dropshadow ${position==='left'? 'side_menu_left':'side_menu_right'}`}>
          <div style={{display:'flex'}}><strong><p style={{paddingLeft:'10px'}}>{label}</p></strong><img onClick={handleClose} src='close.svg' style={{width:'20px', marginLeft:'auto'}}/></div>
          <SketchPicker
            color={ colour }
            onChange={ handleChange }
            onChangeComplete={handleChange}
            presetColors={["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#00FFFF"]}
          />
        </div> : null }
      </div>
    )

}

const TextComponent = ({callBack, text}) => {

  const [textValue, setTextValue] = useState(text);

  useEffect(()=>{
    setTextValue(text)
  },[text])



  const setTextFunction = (value) => {

    setTextValue(value)
    callBack(value)
  }

  return(
    <textarea
      id="text-area"
      rows="4"
      className="form-input input"
      value={textValue}
      onChange={e => setTextFunction(e.target.value)}
    />
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

const Media = ({
  user,
  addMedia,
  fileTypes,
  accept,
  label,
  onDragStart
}) => {
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false)


  const getData = async (userId) => {

    try {
      const myFiles = await getFiles(userId, fileTypes);
      setFiles(myFiles);
    } catch (error) {
      showError('error getting files', error);
    }
  };

  useEffect(() => {

    if (user){
      getData(user.id)
    }

}, [user]);

const selectFileFunction = (data) => {
  if (selectedFiles.some((obj)=> data.id === obj.id)){
    setSelectedFiles(prev => prev.filter(remove => remove.id !== data.id));
  }else{
    setSelectedFiles(selectedFiles => [...selectedFiles, data])
  }
}


const uploadFile = async (event) => {
  try {
    setUploading(true)

    if (!event.target.files || event.target.files.length === 0) {
      throw new Error('You must select an image to upload.')
    }

    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${Math.random()}.${fileExt}`;
    const fileType = file.type;
    const fileName = file.name
    const formData = new FormData()
    formData.append('file', file)

    try{
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await res.json()

      if (res.ok) {

        const fileData={
          file_url:result.url,
          file_type:fileType,
          file_name:fileName
        }
        handleFileFunction(fileData)
      } else {
        showError(result.error)
      }
    }catch(error){
      showError('file upload error', error)
    }

  } catch (error) {
    showError(error)
    alert('Error uploading image!')
  } finally {
    setUploading(false)
  }
}

const handleFileFunction = async (data) => {
  try{
    const fileinfo = await storeFileInfo({
      user_id:user.id,
      file_url: data.file_url,
      file_type:data.file_type,
      file_name:data.file_name
    })

    const newFile={
      created_at: fileinfo.created_at,
      file_type: data.file_type,
      file_url: data.file_url,
      file_name:data.file_name,
      id: fileinfo.id,
      user_id: user.id
    }

  setFiles(prev => [newFile, ...prev]);

  }catch (error){
    showError('Error updating task due date: ', error)
  }
}


  return(
    <>
      <div>
        <button
          className='btn primary'
          disabled={selectedFiles.length>0?false:true}
          onClick={() => addMedia(selectedFiles)}>
          {`Add ${label}${selectedFiles.length>1 && label !== 'music'?'s':''}`}
        </button>
        <input
          style={{display:'none'}}
          type="file"
          id="single"
          accept={accept}
          onChange={uploadFile}
          disabled={uploading}
          id="file-upload"
        />
        <label
          className="btn secondary icon-button"
          htmlFor="file-upload"
          style={{
            padding: '10px 10px',
            marginTop:'0px',
            marginBottom: '0px',
            marginLeft: '10px'
          }}
        >
          <Upload className='button-icon'/>
          {`Upload ${label}`}
        </label>
      </div>
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      overflowY: 'scroll',
      overflowX: 'hidden',
      alignContent: 'flex-start'
    }}>

      {files.length === 0?(
          <p>{`No ${label} files`}</p>
      ):(
        <>
          {files.map((file, index)=>{
            return (
              <div key={file.id} style={{width:(file.file_type === 'image/png' || file.file_type === 'image/jpeg')?'48%':'99%', margin:'1%'}}
              >
                <div className={`${ (file.file_type === 'video/mp4' || file.file_type === 'video/webm' || file.file_type === 'audio/mpeg' || file.file_type === 'audio/wav' || file.file_type === 'audio/aac' || file.file_type === 'audio/webm' || file.file_type === 'audio/ogg')? 'media':'media-image'} ${isObjectInArray(file, selectedFiles)?'active':''}`} onClick={() => selectFileFunction(file) }>
                  {(file.file_type === 'image/png' || file.file_type === 'image/jpeg')&&
                      <img
                        draggable
                        onDragStart={() => onDragStart(file)}
                        src={file.file_url}
                      />
                  }
                  {(file.file_type === 'audio/mpeg' || file.file_type === 'audio/wav' || file.file_type === 'audio/aac' || file.file_type === 'audio/webm' || file.file_type === 'audio/ogg')&&
                    <div draggable onDragStart={() => onDragStart(file)}>
                      <Audio file={file} onClick={selectFileFunction}/>
                    </div>
                  }
                  {(file.file_type === 'video/mp4' || file.file_type === 'video/webm')&&
                    <div>
                      <video
                        draggable
                        onDragStart={() => onDragStart(file)}
                        src={file.file_url}
                        autoPlay={false}
                        className="video_thumb"
                        playsInline
                      />
                    </div>
                  }
                </div>
              </div>
            )
          })}
        </>
      )
    }
    </div>
  </>
  )
}


const Audio = ({
  file,
  onClick
}) => {

  const audioRef = useRef(null)
  const [isPlaying, setIsPLaying] = useState(false)

  const handleClick = () => {
    if (audioRef.current.paused) {
      audioRef.current.play();
      setIsPLaying(true)
    } else {
      audioRef.current.pause();
      setIsPLaying(false)
    }
  }



  return(
    <div className="audio-player" onClick={() => onClick(file)}>
      <button
        className="play-button btn primary video-button"
        onClick={handleClick}
      >
        {isPlaying ? (
          <Pause/>
        ) : (
          <Play/>
        )}
      </button>
      <div className="audio-label">{file.file_name}</div>
      <audio ref={audioRef} src={file.file_url} type="audio/mpeg"></audio>
    </div>
  )
}




const AnimateButton = ({setShowAnimate, showAnimate, setShowProperties}) => {
  const [activeAnimate, setActiveAnimate] = useState(false)


const toggleAnimate = () => {
  setActiveAnimate(prev => !prev)
  setShowProperties(false)
}




useEffect(()=>{

  setActiveAnimate(showAnimate)

},[showAnimate])

  return(
    <div>
      <button className={`btn  ${activeAnimate? 'primary':''}`} onClick={toggleAnimate}>Animate</button>
    </div>
  )
}


const AnimatePanel = ({
  element,
  onUpdateElement,
  duration
}) => {

const addAnimation = () => {
  const animations = [...(element.animations || [])];

  onUpdateElement(element,
    [...animations, {
      id: generateUniqueId(),
      type: 'fadeIn',
      startTime: 0,
      duration: 0.5,
      easing: 'easeOutQuad',
      label: 'Fade In'

    }]
  );
};

const updateAnimation = (index, updates) => {
    const animations = [...(element.animations || [])];
    animations[index] = { ...animations[index], ...updates };
    onUpdateElement(element,  animations );
};

const updateAnimationSelect = (index, updates) => {
    const animations = [...(element.animations || [])];

    const animationFind = [...ANIMATION_TYPES, ...TEXT_ONLY_ANIMATION_TYPES].find((anim)=> anim.value === updates.type)

    let newAnimation = { ...animations[index], ...updates };

    newAnimation.label = animationFind?.label??null


    const allowedTypes = new Set(["Lines", "Char"]);

    if (!allowedTypes.has(updates.type)){
      // is text animation

      const lines = element.getLines()
      const lineLengths = lines.map(l => l.length);

      const minDuration = calculateMinAnimationDuration({
        lineCount: lines.length,
        lineLengths,
        animType: updates.type, // could also be 'fadeInUpLines'
        charStagger: 0.03,
        lineStagger: 0.1,
        unitDuration: newAnimation.duration
      })

      newAnimation.duration = minDuration

    }

    animations[index] = newAnimation;

    onUpdateElement(element,  animations );
};

const removeAnimation = (index) => {
  const animations = [...(element.animations || [])];
  animations.splice(index, 1);
  onUpdateElement(element,  animations );
};


if (element === null) return <div></div>



  return(
    <div>

      <button
        className='btn primary'
        onClick={addAnimation}
      >
        Add Animation
      </button>

      {(!element.animations || element.animations.length === 0) && (
        <div>
            No animations yet
        </div>
      )}
      {(element.animations || []).map((anim, index) => (
        <div key={index} className="animation-container" style={{position:'relative', marginTop:10}}>
          <X style={{position:'absolute', right:10, top:10}}

            onClick={() => removeAnimation(index)}
          />

          <div>
            <label className='font-label'>Effect</label>
            <select
              id='choose-animation'
              className="form-input select"
              value={anim.type}
              onChange={(e) => updateAnimationSelect(index, { type: e.target.value })}
            >

                {ANIMATION_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}

                {element.type==='text'&&
                  <>
                    {TEXT_ONLY_ANIMATION_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </>

                }

              </select>
          </div>
          <div className='col-2 column-gap-2'>
            <div>
              <label className='font-label'>Start (s)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max={duration}
                value={anim.startTime}
                onChange={(e) => updateAnimation(index, { startTime: parseFloat(e.target.value) || 0 })}
                className="form-input input"
              />
            </div>

            <div>
              <label className='font-label'>Duration (s)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={anim.duration}
                onChange={(e) => updateAnimation(index, { duration: parseFloat(e.target.value) || 0.5 })}
                className="form-input input"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}


const Timeline = ({
  duration,
  currentTime,
  onTimeChange,
  isPlaying,
  isTracking,
  stopTracking,
  onPlayPause,
  elements,
  selectedElement,
  onSelectElement,
  onSelectScene,
  fps,
  scenes,
  createScene,
  activeScene,
  audioUrl,
  toolCallback
}) => {


  const timelineRef = useRef(null);
  const pixelsPerSecond = 100;
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const lastMouseX = useRef(null);
  const MIN_MOVEMENT = 1; // in pixels, threshold to ignore tiny jitter
  const stopMovingTimeout = useRef(null);
  const isDraggingRef = useRef(false);
  const [wavesurfer, setWavesurfer] = useState(null)
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [audioDuration, setAudioDuration] = useState(0)


  const onReady = (ws) => {
    setWavesurfer(ws)
    ws.setMuted(true)
    const duration = ws.getDuration()

    setAudioDuration(duration)
    isAudioPlaying(false)
  }



  const playAll = () => {
    onPlayPause()
    setIsAudioPlaying(true)
    wavesurfer && wavesurfer.playPause()

  }


  useEffect(()=>{

    if (!isPlaying && wavesurfer && isAudioPlaying){
      wavesurfer.playPause()
    }

  },[isPlaying, wavesurfer, isAudioPlaying])



  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const getTimeFromPosition = (clientX) => {
   if (!timelineRef.current) return 0;
   const rect = timelineRef.current.getBoundingClientRect();
   const x = clientX - rect.left;
   return Math.max(0, Math.min(duration, x / pixelsPerSecond));
 };

  const handleTimelineClick = (e) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = Math.max(0, Math.min(duration, x / pixelsPerSecond));
    onTimeChange(time);
  };

  const handlePlayheadMouseDown = (e) => {
    e.stopPropagation();
    setIsDraggingPlayhead(true);
    isDraggingRef.current = true;
    isTracking.current = true;

    lastMouseX.current = e.clientX;

    const time = getTimeFromPosition(e.clientX);

    // Start initial timer
    if (stopMovingTimeout.current) clearTimeout(stopMovingTimeout.current);
    stopMovingTimeout.current = setTimeout(() => {
    //  console.log("Mouse truly stopped moving at time:", time);
      stopTracking(time)
      stopMovingTimeout.current = null;
    }, 150);
  };

const handleMouseMove = (e) => {
  if (!isDraggingPlayhead) return;
  const time = getTimeFromPosition(e.clientX);
  onTimeChange(time);

      // Only reset timer if mouse moved more than MIN_MOVEMENT
    if (lastMouseX.current !== null && Math.abs(e.clientX - lastMouseX.current) < MIN_MOVEMENT) {
      // tiny movement, ignore
      return;
    }

    lastMouseX.current = e.clientX;

    // Reset the timer
    if (stopMovingTimeout.current) clearTimeout(stopMovingTimeout.current);
    stopMovingTimeout.current = setTimeout(() => {
    //  console.log("Mouse truly stopped moving at time:", time);
      stopTracking(time)
      stopMovingTimeout.current = null;
    }, 150); // 150ms of no actual movement

};

const handleMouseUp = () => {
  setIsDraggingPlayhead(false);
  isDraggingRef.current = false;
  isTracking.current = false;
  lastMouseX.current = null;
  stopTracking(currentTime)
  if (stopMovingTimeout.current) {
    clearTimeout(stopMovingTimeout.current);
    stopMovingTimeout.current = null;
  }

};

useEffect(() => {
  if (isDraggingPlayhead) {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }
}, [isDraggingPlayhead, duration]);

const uploadAudioFile = () => {

}



  return(
    <div>
      {/* Controls */}
      <div className="flex items-center gap-4 border-b">
        <div className="flex" style={{alignItems: 'center'}}>
          <button
            className="skip-backward skip-button btn rounded video-button"
            onClick={() => onTimeChange(0)}
          >
            <SkipBack className="h-4 w-4" />
          </button>

          <button
            className="play-button btn primary video-button"
            onClick={playAll}
          >
            {isPlaying ? (
              <Pause/>
            ) : (
              <Play/>
            )}
          </button>

          <button
            className="skip-forward skip-button btn rounded video-button"
            onClick={() => onTimeChange(duration)}
          >
            <SkipForward className="h-4 w-4" />
          </button>
        </div>

        <div className="flex" style={{alignItems: 'center'}}>
          <span className="text-white font-mono font-medium tabular-nums">
            {formatTime(currentTime)}
          </span>
          <span className="text-slate-500">/</span>
          <span className="text-slate-400 font-mono tabular-nums">
            {formatTime(duration)}
          </span>
        </div>

        <div className="flex" style={{alignItems: 'center'}}/>

        <div className="flex" style={{alignItems: 'center', marginLeft: 'auto'}}>
          <span>{fps} FPS</span>
        </div>
      </div>

      {/* Timeline tracks */}
      <div className="flex-1 overflow-x-auto">
        <div
          ref={timelineRef}
          style={{ width: `${duration * pixelsPerSecond + 100}px`, minWidth: '100%', position:'relative', height:'100%', overflowY: 'hidden'}}
          //onClick={handleTimelineClick}
        >
          {/* Time ruler */}
          <div className="h-6 border-b border-slate-700/50 no-highlight"
            style={{
              position:'relative',
              borderColor: '#33415580'
            }}
          >
            {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
              <div
                key={i}
                className="top-0 flex flex-col items-start"
                style={{ left: `${i * pixelsPerSecond}px`, position:'absolute', height:'100%' }}
              >

                <span>{i}s</span>
              </div>
            ))}
          </div>
        <div style={{overflowY:'scroll', height: '130px'}}>
          {/* Element tracks */}
          <div style={{position:'relative', display:'flex', gap:'2px'}}>
            {scenes.map((scene, index)=>{
              return(
                <div key={index}  style={{width: `${scene.duration * pixelsPerSecond}px`, overFlow:'hidden'}}>
                  <div style={{
                      height:'46px',
                      width: `${scene.duration * pixelsPerSecond}px`,
                      borderRadius:'var(--input-border-radius)',
                      color: activeScene?.id === scene.id
                              ? 'var(--md-sys-color-on-primary)'
                              : 'var(--md-sys-color-primary)',
                      background: activeScene?.id === scene.id
                              ? 'var(--md-sys-color-primary)'
                              : 'var(--md-sys-color-secondary-container)',
                      borderColor: activeScene?.id === scene.id
                              ? 'var(--md-sys-color-inverse-primary)'
                              : 'var(--md-sys-color-inverse-primary)',
                      borderWidth:'3px',
                      borderStyle: 'solid',
                      boxSizing: 'border-box',
                  }}>
                    <div style={{
                        display:'flex',
                        alignItems: 'center',
                        paddingLeft: '10px',
                        cursor:'pointer',
                        height: '100%'
                    }}>
                      <div
                        onClick={(e) => {
                        onSelectScene(scene.id)
                      }}>
                      {`Scene ${index+1}`}
                    </div>
                    <div style={{marginLeft: 'auto'}} className='add_scene'>
                      <Plus
                      width='30'
                      height='30'
                      color = {`${activeScene?.id === scene.id?  'var(--md-sys-color-primary)' : 'var(--md-sys-color-primary)'}`}
                      onClick={()=>createScene(scene.duration, 5, true)}
                      />
                    </div>
                    </div>
                  </div>
                  {[...scene.objects].reverse().map((element, index)=>{
                    const isWhite = element?.fill === 'rgba(255,255,255,1)'
                    var colour
                    var borderColour

                    if (element?.fill){
                      colour = element?.fill
                      borderColour = lightenRgba(element?.fill, .5)
                    }else{
                      colour = 'var(--md-sys-color-secondary-container)'
                      borderColour = 'var(--md-sys-color-secondary-container)'
                    }

                    if (!element) return null

                    return(
                      <div key={index}>
                        <div
                          style={{
                            height:'36px',
                            marginTop: '5px',
                            width: `${scene.duration * pixelsPerSecond}px`,
                            background: selectedElement?.id === element.id
                                    ? 'var(--md-sys-color-primary)'
                                    : isWhite ? 'var(--md-sys-color-surface)' : colour,
                            borderRadius:'var(--input-border-radius)',
                            borderColor: selectedElement?.id === element.id
                                    ? 'var(--md-sys-color-secondary-container)'
                                    : isWhite ? 'var(--md-sys-color-surface-container)' : borderColour,

                            alignItems: 'center',
                            borderWidth:'3px',
                            borderStyle: 'solid',
                            boxSizing: 'border-box',
                            display: 'flex',
                            alignItems: 'center',

                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectElement(element.id);
                          }}
                        >
                          {element.type === 'video'&&
                            <VideoTimelineBar videoElement={element} />
                          }
                          {element.type === 'image'&&
                            <div style={{width: '100%' }} className='repeater-timeline-bar'>
                              {Array(Math.round(duration)).fill(0).map((_, index) => (
                                <img
                                  key={index}
                                  src={element.imageSrc} // Replace with your image source
                                  alt="Repeated image"
                                />
                              ))}
                            </div>
                          }
                          {element.type === 'text'&&
                            <span style={{color:`${isWhite?selectedElement?.id === element.id?'#ffffff':'#000000':'#ffffff'}`,paddingLeft:'10px', fontSize:'.8em'}} className="truncate">
                              {element.type === 'text' ? `"${element.text?.slice(0, 50) || 'Text'}..."` :
                               element.type}
                            </span>
                          }
                          {(element.type === 'rectangle' || element.type === 'ellipse' || element.type === 'triangle') &&
                            <span style={{color:'#ffffff',paddingLeft:'10px', fontSize:'.8em'}} >
                              {element.type}
                            </span>
                          }
                        </div>

                        {/* Animation indicators */}
                        {element.animations?.map((anim, i) => (
                          <div
                            key={anim.id}
                            style={{
                              height:'100%',
                              marginTop: '5px',
                              marginLeft: `${anim.startTime * pixelsPerSecond}px`,
                              width: `${anim.duration * pixelsPerSecond}px`,
                              background: 'var(--md-sys-color-surface-container)',
                              borderRadius:'var(--input-border-radius)',
                              fontSize: '.75rem',
                              lineHeight: '1rem',
                              padding: '5px'
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span style={{fontSize:'.8em'}}>{anim.label}</span>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              )
            })}

          </div>
          {audioUrl &&
            <div style={{width:'100%', overflowX:'hidden'}}>
              <div
                className="waveform"
                style={{
                  height:'36px',
                  width: `${audioDuration * pixelsPerSecond}px`,
                  borderRadius:'var(--input-border-radius)',
                  background: 'var(--md-sys-color-surface-variant)',
                  borderColor: 'var(--md-sys-color-surface-container)',
                  borderWidth:'3px',
                  borderStyle: 'solid',
                  boxSizing: 'border-box',
                  marginTop:'5px',
                }}
              >
                <WavesurferPlayer
                  normalize = {false}
                  cursorWidth ={0}
                  cursorColor ={'transparent'}
                  height={36}
                  waveColor="#696969"
                  progressColor="#b8b7b8"
                  barWidth={2}
                  barGap={2}
                  barRadius={5}
                  barHeight={0.7}
                  minPxPerSec={pixelsPerSecond}
                  url={audioUrl}
                  onReady={onReady}
                  onPlay={() => setIsAudioPlaying(true)}
                  onPause={() => setIsAudioPlaying(false)}
                />
              </div>
            </div>
          }
          {!audioUrl &&
            <div
              onClick={()=>toolCallback('music', true)}
              style={{
              height:'36px',
              width: '100%',
              borderRadius:'var(--input-border-radius)',
              color: '#000000',
              background: 'var(--md-sys-color-surface-variant)',
              borderColor: 'var(--md-sys-color-surface-container)',
              borderWidth:'3px',
              borderStyle: 'solid',
              boxSizing: 'border-box',
              marginTop:'5px',
              display:'flex',
              alignItems:'center',
              paddingLeft:'10px'
            }}>
                <Music className='button-icon' style={{color:"#000000"}}/>
                <span style={{marginLeft:'5px', fontSize:'.8em'}}>Add Music</span>
            </div>
          }
        </div>

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-400 via-violet-500 to-transparent z-10 pointer-events-none"
            style={{
              left: `${currentTime * pixelsPerSecond}px`,
              position:'absolute',
              background:'var(--md-sys-color-primary)',
              width: '.125rem',
              zIndex: 10,
              top: 0,
              bottom: 0,
            }}
          >
            <div
            onMouseDown={handlePlayheadMouseDown}
            style={{
            position:'absolute',
            background:'var(--md-sys-color-primary)',
            width: '.75rem',
            height: '.75rem',
            left: '50%',
            top: '-0px',
            transform: 'translateX(-50%)',
            borderRadius: '9999px'
          }} className="-top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-violet-400 rounded-full shadow-lg shadow-violet-400/50" />
          </div>
        </div>
      </div>
    </div>
  )
}



const VideoTimelineBar = ({videoElement}) => {







return(
  <div style={{width: '100%' }} className='video-timeline-bar'>
       {videoElement.thumbnails.map((src, i) => (
         <img
           key={i}
           src={src}
           alt={`frame ${i}`}
         />
       ))}
     </div>
)

}

const TemplatePanel = ({
  applyTemplate
}) => {
  return(
    <div>
      <p className='font-label'>Videos</p>
    {TEMPLATES.videos.map((videoTemp, index) => {
      return(
        <button key={videoTemp.label} onClick={() => applyTemplate('videos', videoTemp.label)} className='btn btn-secondary'>{videoTemp.label}</button>

      )
    })}
    <p className='font-label'>Images</p>
    {TEMPLATES.images.map((imageTemp, index) => {
      return(
        <button key={imageTemp.label} onClick={() => applyTemplate('image', imageTemp.label)} className='btn btn-secondary'>{imageTemp.label}</button>

      )
    })}

    </div>
  )
}

const FeedsPanel = ({
  selectedFeed,
  setSelectedFeed,
  dateFilter,
  setDateFilter,
  posts,
  setPosts,
  onDragStart
  }) => {


    const onFeedChange = (value) => {
      const feed = FEEDS.find(item => item.label === value);
      setSelectedFeed(feed);
      if (dateFilter){
        getFeed(feed, dateFilter);
      }

    }

    const setDateFilterFunction = (date) => {
        setDateFilter(date)
        if (selectedFeed){
          getFeed(selectedFeed, date);

        }

    }





    const getFeed = async (selectedFeed, dateFilter) => {

      console.log('get feed')

      if (selectedFeed.CMSType === 'contentful'){
        const client = contentful.createClient({
          space: selectedFeed.spaceId,
          accessToken: selectedFeed.accessToken,
        })

        const response = await client.getEntries({
          'content_type': 'post',
          'order': '-fields.publishDate',
           'limit': '100',
          'include': '10',
        })

        let date = moment(dateFilter).format('YYYY-MM-DD');

        const filterPosts = response.items.filter((item)=> item.fields[selectedFeed.publishedDate] === date)

        if (filterPosts.length < 1) return

        const posts = filterPosts.map((item)=>{
            return {
              id: item.sys.id,
              scheduleDate: item.fields[selectedFeed.scheduleDate],
              link: selectedFeed.website+'/'+item.fields[selectedFeed.slug],
              image_url: 'https:' + item.fields[selectedFeed.image].fields.file?.url,
              title: item.fields[selectedFeed.title],
              slug: item.fields[selectedFeed.slug],
              base_url: selectedFeed.website,
              status: 'unpublished',
              caption: removeMd(item.fields[selectedFeed.text]),
              publishedDate: item.fields[selectedFeed.publishedDate],
              scheduled:false
            }
        })

        setPosts(posts)
      }else if (selectedFeed.CMSType === 'wordpress'){

        const wpapiUrl = 'https://' + selectedFeed.website + '/wp-json'

        const wp = new WPAPI({
            endpoint: wpapiUrl,
            username: selectedFeed.editor,
            password: selectedFeed.password,
        });


        const response = await wp.posts().embed().perPage(100).order('desc').orderby('date').after(new Date(dateFilter)).get()

        function multiIndex(obj,is) {  // obj,['1','2','3'] -> ((obj['1'])['2'])['3']
            return is.length ? multiIndex(obj[is[0]],is.slice(1)) : obj
        }
        function pathIndex(obj,is) {   // obj,'1.2.3' -> multiIndex(obj,['1','2','3'])
            return multiIndex(obj,is.split('.'))
        }


        const posts = response.map((item)=>{

            return {
              id : item.id.toString(),
              scheduleDate: pathIndex(item, selectedFeed.scheduleDate),
              link: item.slug? 'https://' + selectedFeed.website +'/' + item.slug : null,
              image_url: (item._embedded && item._embedded['wp:featuredmedia'])? item._embedded['wp:featuredmedia'][0].source_url : null,
              title: decodeEntities(item.title.rendered),
              slug: item.slug,
              base_url: selectedFeed.website,
              status: 'unpublished',
              caption: decodeCaptionEntities(item.content.rendered),
              publishedDate: item.date,
              scheduled:false
            }
        })



        setPosts(posts)


      }


    }





  return(
    <div>
      <label className='font-label'>Publication</label>
      <select id="rss-select" className="form-input select" onChange={(e) => onFeedChange(e.target.value)} value={selectedFeed.label}>
        {FEEDS.map((feed, index)=>{
          return <option key={index} value={feed.label}>{feed.label}</option>
        })
        }
      </select>
      <div>
        <label className='font-label'>Publication Date Filter</label>
          <DatePicker
            selected={dateFilter}
            onChange={(date) => setDateFilterFunction(date)}
            className={'form-input'}
            dateFormat="dd/MM/yyyy"
          />
      </div>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        overflowY: 'scroll',
        overflowX: 'hidden',
        alignContent: 'flex-start',
        gap: '2%'
      }}>
        {posts.map((post, index)=>{
          const facebook = {facebook_page_id:selectedFeed.facebook_page_id}
          return(
            <div key={index} style={{width:'48%'}} className={`post_image ${post.scheduled? 'active': ''}`}>
              <img
                style={{
                  height:'100px',
                  objectFit:'cover',
                  margin: '2% 0',
                  borderRadius: 'var(--input-border-radius)'
                }}
                draggable
                onDragStart={() => onDragStart({ type:'post', data: { ...post, ...facebook } } ) }
                src={post.image_url}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}


const PropertiesPanel = ({
  element,
  onElementUpdateProperty,
  removeItem,
  selectedIndex,
  resizeImage,
  bringToFront,
  sendToBack,
  moveBackwards,
  moveForward,
  setTextEditing,
  textEditing,
}) => {


  if (element === null) return <div></div>

  const selectedFont = fonts.find((font)=> font.label === element?.fontFamily)


  return(
    <div>
      <div style={{padding:'0px 10px'}}>
        {element.type === 'text' &&
          <div>
            <button className={`btn ${textEditing?"primary":"secondary"} icon-button`} onClick={() => setTextEditing(prev => !prev)} style={{flex:1}}><TextSelect className='button-icon'/>Edit Text</button>
            {textEditing &&
              <>
                <p className='font-label'>Text</p>
                <textarea
                  rows="4"
                  name="elementContent"
                  className="form-input input"
                  value={element.text}
                  onChange={(e) => onElementUpdateProperty('text', e.target.value)}
              />
            </>
            }
            <div>
              <p className='font-label'>Font</p>
              <select id="font" className="form-input select font-label-input" onChange={(e) => onElementUpdateProperty('fontFamily', e.target.value)} value={element.fontFamily}>
                {fonts.map((font, index)=>{
                  return <option key={index} value={font.label}>{font.label}</option>
                })
                }
              </select>
            </div>
            <div>
              <p className='font-label'>Font Styles</p>
              <select id="font-weight" className="form-input select font-label-input" onChange={(e) => onElementUpdateProperty('fontStyle', e.target.value)} value={element.fontStyle}>
                {selectedFont.styles.map((fontStyle, index)=>{
                  return <option key={index} value={fontStyle}>{fontStyle}</option>
                })
                }
              </select>
            </div>
            <div className='col-2 column-gap-2'>
              <div>
                <p className='font-label'>Font Size</p>
                <input id='font-size' className="form-input input font-label-input" value={element.fontSize} type='number' onChange={(e) => onElementUpdateProperty('fontSize', e.target.value)}/>
              </div>
              <div>
                <p className='font-label'>Font Weight</p>
                <select id="font-weight" className="form-input select font-label-input" onChange={(e) => onElementUpdateProperty('fontWeight', e.target.value)} value={element.fontWeight}>
                  {selectedFont.weights.map((fontWeight, index)=>{
                    return <option key={index} value={fontWeight}>{fontWeight}</option>
                  })
                  }
                </select>
              </div>
            </div>
            <div className='col-2 column-gap-2'>
              <div>
                <p className='font-label'>Align</p>
                <div style={{display:'flex', alignItems:'center', height: '38px', margin: '5px 0px 10px 0px'}}>
                    <img style={{width:30}} src={element.textAlign === 'left'? '/text_align_left_active.svg':'/text_align_left.svg'} onClick={() => onElementUpdateProperty('textAlign', 'left')}/>
                    <img style={{width:30}} src={element.textAlign === 'center'? '/text_align_center_active.svg':'/text_align_center.svg'} onClick={() => onElementUpdateProperty('textAlign', 'center')}/>
                    <img style={{width:30}} src={element.textAlign === 'right'? '/text_align_right_active.svg':'/text_align_right.svg'} onClick={() => onElementUpdateProperty('textAlign', 'right')}/>
                </div>
              </div>
              <div>
                <p className='font-label'>Line Height</p>
                <input id='line-Height' className="form-input input font-label-input" value={element.lineHeight} type='number' onChange={(e) => onElementUpdateProperty('lineHeight', e.target.value)}/>
              </div>
            </div>
          </div>
        }

        {element.type !== 'text' &&
          <>
            <hr/>
            <div className="property-container">
              <div className="property-label"><Maximize2 className="property-icon" /><p>Size</p></div>
              {element.type === 'image' &&
                <div className='col-2 column-gap-2' style={{margin: '10px 0px 10px 0px'}}>
                  <div>
                    <p className='font-label'>Scale Width</p>
                    {`${toPercent(element.width/element.originalWidth)} %`}
                  </div>
                  <div>
                    <p className='font-label'>Scale Height</p>
                    {`${toPercent(element.h/element.originalHeight)} %`}
                  </div>
                </div>
              }
              <div className='col-2 column-gap-2'>
                <div style={{margin: '0px 0px 10px 0px'}}>
                  <p className='font-label'>Width</p>
                  <input
                    id='properties-width'
                    type='number'
                    value={element.width}
                    onChange={(e) => onElementUpdateProperty('width', e.target.value)}
                    step={1}
                    className="form-input input font-label-input"
                  />
                </div>
                <div style={{margin: '0px 0px 0px px'}}>
                  <p className='font-label'>Height</p>
                  <input
                    id='properties-height'
                    type='number'
                    value={element.h}
                    onChange={(e) => onElementUpdateProperty('h', e.target.value)}
                    step={1}
                    className="form-input input font-label-input"
                  />
                </div>
              </div>
              {element.type === 'image' &&
                <div style={{margin: '0px 0px 10px 0px'}}>
                  <p className='font-label'>Image Sizing</p>
                  <div style={{display:'flex', gap:'2px', marginTop:'10px'}}>
                    <img src='/fit_width.svg' onClick={() => resizeImage('Fit Width')} style={{width:'28px', marginRight:'10px'}} alt='Fit Width'/>
                    <img src='/fit_page.svg' onClick={() => resizeImage('Fit Page')} style={{width:'28px', marginRight:'10px'}} alt='Fit Page'/>
                  </div>
                </div>
              }
            </div>
            <hr/>
            <div className="property-container">
              <div className="property-label"><Move className="property-icon" /><p>Position</p></div>
              <div className='col-2 column-gap-2'>
                <div style={{margin: '0px 0px 0px px'}}>
                  <p className='font-label'>X</p>
                  <input
                    id='properties-x'
                    type='number'
                    value={element.cx}
                    onChange={(e) => onElementUpdateProperty('cx', e.target.value)}
                    step={1}
                    className="form-input input font-label-input"
                  />
                </div>
                <div style={{margin: '0px 0px 0px px'}}>
                  <p className='font-label'>Y</p>
                  <input
                    id='properties-y'
                    type='number'
                    value={element.cy}
                    onChange={(e) => onElementUpdateProperty('cy', e.target.value)}
                    step={1}
                    className="form-input input font-label-input"
                  />
                </div>
              </div>
              <p className='font-label'>Arrange</p>
              <div className='col-2' style={{columnGap : '2%'}}>
                <button className="btn secondary icon-button btn-sm" onClick={bringToFront} style={{flex:1, marginBottom:0}}><BringToFront className='button-icon'/>To Front</button>
                <button className="btn secondary icon-button btn-sm" onClick={sendToBack} style={{flex:1, marginBottom:0}}><SendToBack className='button-icon'/>To Back</button>
              </div>
              <div className='col-2' style={{columnGap : '2%'}}>
                <button className="btn secondary icon-button btn-sm" onClick={moveBackwards} style={{flex:1}}><BringToFront className='button-icon'/>Backward</button>
                <button className="btn secondary icon-button btn-sm" onClick={moveForward} style={{flex:1}}><SendToBack className='button-icon'/>Forward</button>
              </div>
            </div>
          </>
        }
        {(element.type === 'rectangle' ||  element.type === 'ellipse' || element.type === "triangle") &&
          <div style={{margin: '0px 0px 0px px'}}>
            <p className='font-label'>Stroke Weight</p>
            <input
              id='stroke-weight'
              type='number'
              value={element.strokeWeight}
              onChange={(e) => onElementUpdateProperty('strokeWeight', e.target.value)}
              step={1}
              className="form-input input font-label-input"
            />
          </div>
        }

        <div style={{margin: '0px 0px 0px px', }}>
          <div style={{display:'flex', gap:'5px'}} className='font-label'>  <p>Opacity</p> <p>{element.opacity* 100}%</p></div>
          <input
            id='properties-opacity'
            type='range'
            value={[(element.opacity ?? 1) * 100]}
            onChange={(e) => onElementUpdateProperty('opacity', e.target.value / 100)}
            min={0}
            max={100}
            step={1}
            className="form-input input font-label-input"
          />
        </div>
        <div style={{margin: '0px 0px 0px px', }}>
          <div style={{display:'flex', gap:'5px'}} className='font-label'><p>Rotation</p> <p>{Math.round(radToDeg(element.angle))}</p></div>
          <input
            id="properties-angle"
            type="range"
            value={radToDeg(element.angle || 0)}
            onChange={(e) =>
              onElementUpdateProperty('angle', degToRad(parseFloat(e.target.value)))
            }
            min={0}
            max={360}
            step={1}
            className="form-input input font-label-input"
          />
        </div>


      </div>
    </div>
  )
}

const Share = ({
  showShare,
  createVideo,
  postInfo,
  userId,
  videoFrameProgress,
  videoConvertProgress,
  exportVideoFrames,
  postScheduled
}) => {


  const [scheduleDate, setScheduleDate] = useState(postInfo?.data?.scheduleDate?new Date(postInfo.data.scheduleDate):new Date())
  const [selectedSocialPage, setSelectedSocialPage] = useState(null)
  const [socialPages, setSocialPages] = useState([])
  const [postLink, setPostLink] = useState(`https://${postInfo.data.base_url}/${postInfo.data.slug}`)
  const [caption, setCaption] = useState(postInfo.data.caption.split('\n')[0] + '\n' + `https://${postInfo.data.base_url}/${postInfo.data.slug}`)
  const videoBlobRef = useRef(null)
  const [videoSrc, setVideoSrc] = useState(null)
  const [loader, setLoader] = useState(false)
  const [videoLoader, setVideoLoader] = useState(false)
  const [scheduled, setScheduled] = useState(false)

  const getFacebookData = async() => {
    const data = await getFacebookPages(userId)

    const preSelectedPage =  data.find((page)=> page.facebook_page_id === postInfo.data.facebook_page_id)


    setSelectedSocialPage(preSelectedPage)


    setSocialPages(data)
  }

  useEffect(()=>{

    if (postInfo.data.scheduled === false){
      getFacebookData()
      displayVideo()
    }



  },[postInfo])


  const displayVideo = async() => {
    setVideoLoader(true)
    const videoBlob = await exportVideoFrames(false, false)

    videoBlobRef.current = videoBlob

    const objectUrl = URL.createObjectURL(videoBlob); //
    setVideoSrc(objectUrl)
    setVideoLoader(false)
  }



  const schedule = async () => {

     setLoader(true)

    if (timeTravel(scheduleDate)) return

    const type = 'mp4'
    const video = videoBlobRef.current


    const formData = new FormData();
    formData.append('videoBlob', video);
    formData.append('accessToken', selectedSocialPage.access_token);
    formData.append('socialId', selectedSocialPage.facebook_page_id);


      const response = await fetch('/api/uploadFacebookReel', {
        method: 'POST',
        body: formData,
      });
      // Ensure the response is successful
      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const uploadedVideo = await response.json();

      if (!uploadedVideo) return

    const pageId = selectedSocialPage.facebook_page_id;
    const videoId = uploadedVideo.videoId;
    const accessToken = selectedSocialPage.access_token;
    const description = caption;

    // Unix timestamp for a future date (e.g., tomorrow at 10 AM)
    const scheduledPublishTime = (moment(scheduleDate).unix())

  const facebookResponse = await fetch(`https://graph.facebook.com/v24.0/${pageId}/video_reels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        video_id: videoId,
        upload_phase : 'finish',
        video_state : 'SCHEDULED',
        description: description,
        title : postInfo.data.title,
        scheduled_publish_time: scheduledPublishTime,
        video_state: 'SCHEDULED', // Use 'SCHEDULED' to schedule the post
        access_token: accessToken
      }),
    })

    if (!facebookResponse.ok) {
      throw new Error(`Upload to facebook failed with status: ${facebookResponse.status}`);
    }

    const videoData = await facebookResponse.json();
    const postId = videoData.post_id

    const commentResponse = await fetch(`https://graph.facebook.com/${videoId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message : 'Check out the full details here: '+postLink,
          access_token: selectedSocialPage.access_token
        }),
      })

      if (!commentResponse.ok) {
        throw new Error(`Adding comments failed with status: ${facebookResponse.status}`);
      }

      showSuccess('Video Scheduled')
      setLoader(false)
      setScheduled(true)
      postScheduled(postInfo)

  }



  const onSocialChange = (value) => {

    const selectedSocial = socialPages.find(item => item.facebook_page_id === value);

    setSelectedSocialPage(selectedSocial)

  }

  const calculateMinTime = date => {
    let isToday = moment(date).isSame(moment(), 'day');
    if (isToday) {
        let nowAdd30Mins = moment(new Date()).add({hours: 30}).toDate();
        return nowAdd30Mins;
    }
    return moment().startOf('day').toDate();
}


  return(
    <>
    <div className={'loader_screen'}></div>
    <div className='share-dialog dropshadow' style={{padding:'40px 15px 15px 15px'}}>
      <X
        onClick={() => showShare(false)}
        className="close-icon"
        style={{
          cursor: "pointer",
          right: "5px",
          position: "absolute",
          top: "5px",
        }}
      />
      <div className='col-2 column-gap-2' style={{height:'100%'}}>
        <div style={{position:'relative'}}>

          <div style={loader? {display:'block'}:{display:'none'}} className={'loader_screen'}>
              <div style={{transform:'translate(-50%, -50%)'}}  className="loader"></div>
          </div>
            <h2>Share To Social Media</h2>
            <hr/>
            <div style={{marginTop:'25px'}}>
              {postInfo.data.scheduled &&
                <div className="scheduled_badge">
                  <strong>Scheduled</strong>
                  <CircleCheck />
                </div>
              }
                <p className='font-label'>Facebook Page</p>
                <select id="rss-select" className="form-input select" onChange={(e) => onSocialChange(e.target.value)} value={selectedSocialPage?.facebook_page_id || ""}>
                  <option value="" disabled>
                    Choose a page…
                  </option>
                  {socialPages.map((social, index)=>{
                    return <option key={index} value={social.facebook_page_id}>{social.facebook_page_name}</option>
                  })
                  }
                </select>
                <div className="properties-container" style={{margin:'15px 0px'}}>
                  <p className='font-label'>Schedule Date & Time</p>
                  <DatePicker
                    style={{minWidth:'300px'}}
                    minDate={moment().toDate()}
                    minTime={calculateMinTime(scheduleDate)}
                    maxTime={moment().endOf('day').toDate()}
                    selected={scheduleDate}
                    onChange={(date) => setScheduleDate(date)}
                    showTimeSelect
                    className={'form-input'}
                    dateFormat="MMMM d, yyyy h:mm aa"
                  />
                </div>
                <p className='font-label'>Post Link</p>
                <div className={'form-input'} style={{display:'flex', alignItems:'center', padding: '0px 5px 0px 0px'}}>
                  <input
                    id="post-link-share"
                    style={{border:0, margin: '1px'}}
                    value={postLink}
                    onChange={(e) => setPostLink(e.target.value)}
                    className={'form-input'}
                  />
                  <a href={postLink} target="new-window" style={{height: '24px'}}>
                    <ExternalLink/>
                  </a>
                </div>
                <p className='font-label'>Post Caption</p>
                <textarea
                  style={{minHeight:200}}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className={'form-input'}
                  cols={8}
                />
                {(videoSrc && selectedSocialPage) &&
                  <button disabled={scheduled} className="btn primary" onClick={schedule}>{scheduled?'Scheduled':'Schedule'}</button>
                }
            </div>
        </div>
        <div style={{position:'relative'}}>
          <div style={videoLoader? {display:'block'}:{display:'none'}} className={'loader_screen'}>
              <div style={{transform:'translate(-50%, -50%)'}}  className="loader"></div>
              {videoFrameProgress > 0 &&
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, calc(-50% + 75px))',
                  width:'100%',
                  textAlign:'center'
                }}>{`Creating Video ${videoFrameProgress}%`}</div>
              }
              {videoConvertProgress > 0 &&
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, calc(-50% + 105px))',
                  width:'100%',
                  textAlign:'center'
                }}>{`Converting Video To Mp4 ${videoConvertProgress}%`}</div>
              }

          </div>
          {videoSrc  && (
            <>
            <div className="video-container">
              <video
                src={videoSrc}
                controls // Adds play, pause, etc. controls
                className='video'
                // poster="thumbnail.jpg" // Optional: specify a placeholder image
              >
                Your browser does not support the video tag.
              </video>
            </div>
            <button  className='btn secondary btn-smll' onClick={displayVideo}>Reload Video</button>

          </>
            )}
        </div>
      </div>
    </div>
  </>
  )
}
