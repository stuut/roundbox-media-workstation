'use client'
import { useState, useEffect, useRef, memo, useMemo } from "react";
import { useFilesContext } from "@/context/files-context"
import { useEditItemContext } from "@/context/edit-item-context"
import JSZip from "jszip";
import Checkbox from '@mui/material/Checkbox';
import { Editor } from "@tinymce/tinymce-react";
import MarkdownEditorComponent from '@/components/markdown-editor';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { showSuccess } from '@/lib/toast';
import { showError } from '@/lib/toast';
import { showInfo } from '@/lib/toast';
import moment from "moment";
import dynamic from 'next/dynamic'
import { storeFileInfo } from "@/lib/supabase";
import * as contentful from 'contentful'
import Dropdown from "@/components/dropdown"
var WPAPI = require( 'wpapi' );
import {
  X,
  ExternalLink,
  CircleCheck,
  GripVertical,
  SquarePen,
  Trash2,
  Crop,
  EllipsisVertical,
  Download,
  FileImage
} from 'lucide-react';
//const PDFViewer = dynamic(() => import('@/components/pdf-viewer'), { ssr: false })
import { PDFViewer } from "@/components/pdf-viewer"

export const checkRatio = (w, h) => {

  function roundLikePHP(num, dec){
    var num_sign = num >= 0 ? 1 : -1;
    return parseFloat((Math.round((num * Math.pow(10, dec)) + (num_sign * 0.0001)) / Math.pow(10, dec)).toFixed(dec));
  }


  let round =  w / h

  let ratio = roundLikePHP(round, 2);


      if (ratio === 1)
        return false;

    // Portrait: min 0.8 | max 0.99
    // Landscape: min 1.01 | max 1.91
    if (w < h)
        if (ratio >= 0.8 && ratio <= 0.99)
            return false;

    if (w > h)
        if (ratio >= 1.01 && ratio <= 1.91)
            return false;

    return true;
}

function removeTags(str) {
  if ((str === null) || (str === ''))
      return false;
  else
      str = str.toString();

  // Regular expression to identify HTML tags in
  // the input string. Replacing the identified
  // HTML tag with a null string.
  return str.replace(/(<([^>]+)>)/ig, '');
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
    facebook_page_id:'1509386042722586',
    content_type: 'post',
    CTA_image : 'hilltops-logo-stacked.png',
    postType: 'link',
    useDateFilter:true,
    useEventImport:true,
    addComment:true
  },
  {
    label: 'Cowra Phoenix',
    spaceId: 'blbpa6fzvcno',
    accessToken: '_jbLmb4SDG2TkgW42NOTAVjPoCS78mQGEjOIXJrRExI',
    website:'www.cowraphoenix.com.au',
    CMSType:'contentful',
    scheduleDate: 'scheduleDate',
    publishedDate: 'publishDate',
    slug:'slug',
    title:'title',
    image:'image',
    text:'copy',
    facebook_page_id:'100367901935086',
    content_type: 'post',
    CTA_image : 'cowra-logo-stacked.png',
    postType: 'link',
    useDateFilter:true,
    useEventImport:true,
    addComment:true
  },
  {
    label: 'Canowindra Phoenix',
    username: 'editor',
    password: 'xKGAB%ncydDFbrClXwd5Ex%t',
    website:'www.canowindraphoenix.com.au',
    CMSType:'wordpress',
    facebook_page_id:'106626202692898',
    scheduleDate: 'acf.schedule_date',
    CTA_image : 'canowindra-logo-stacked.png',
    postType: 'link',
    useDateFilter:true,
    useEventImport:true,
    addComment:true
  },
  {
    label: 'Parkes Phoenix',
    username: 'roxane',
    password: 'SOw4vSFu*ueYUBnR$4Jkip@b',
    website:'www.parkesphoenix.com.au',
    CMSType:'wordpress',
    facebook_page_id:'973264922791233',
    scheduleDate: 'acf.schedule_date',
    CTA_image : 'parkes-logo-stacked.png',
    postType: 'link',
    useDateFilter:true,
    useEventImport:true,
    addComment:true
  },

  {
    label: 'Forbes Phoenix',
    username: 'roxane',
    password: 'f#63$^bBGRz(Om)XXcpLqt0z',
    website:'www.forbesphoenix.com.au',
    CMSType:'wordpress',
    facebook_page_id:'883736781692596',
    scheduleDate: 'acf.schedule_date',
    CTA_image : 'forbes-logo-stacked.png',
    postType: 'link',
    useDateFilter:true,
    useEventImport:true,
    addComment:true
  },
]

const tinymceAPIkey = 'p3buqczwwii4scekdj4yuqpuwif3v2w63nbm6krta5jdnazt'




export default function PdfTextExtractor({user}) {
  const { displayEditItem, setDisplayEditItem, item, setItem, setActiveTool} = useEditItemContext();
  const {showFiles, setShowFiles, selectedFiles, setSelectedFiles, setFilePicker } = useFilesContext();
  const [pageNumber, setPageNumber] = useState(1)
  const pageNumberRef = useRef(null);
  const [tinymceContent, setTinymceContent] = useState("");
  const [imageSrc, setImageSrc] = useState(null)
  const [selectionArea, setSelectionArea] = useState(null)
  const [maxWidth, setMaxWidth] = useState(null)
  const [pdfUrl, setpdfUrl] = useState(null)
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const dragAreaRef = useRef(null);
  const selectBoxRef = useRef(null);
  const [inputType, setInputType] = useState('articles');
  const inputTypeRef  = useRef(inputType);
  const [images, setImages] = useState([])
  const imagesRef = useRef([]);
  const [selectedFeed, setSelectedFeed] = useState(FEEDS[0])
  const editorRef = useRef(null);
  const selectedFeedRef = useRef(selectedFeed)
  const [canvasSize, setCanvasSize] = useState(null)
  const [mdValue, setMdValue] = useState('');
  const [selectedTab, setSelectedTab] = useState("write");
  const [removeWhiteSpace, setRemoveWhiteSpace] = useState(true);
  const [image, setImage] = useState(null);
  const removeWhiteSpaceRef = useRef(true);
  const [heading, setHeading] = useState("");
  const [paragraphsState, setParagraphsState] = useState([]);
  const editingIndex = useRef(null)
  const editImageRef = useRef(null)
  const editImageData = useRef(null)
  const evtSourceRef = useRef(null);
  const [loader, setLoader] = useState(false)
  const [contentfulAuthorsList, setContentfulAuthorsList] = useState([]);
  const [contentfulCategoriesList, setContentfulCategoriesList] = useState([]);
  const [contentfulTagsList, setContentfulTagsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [categoriesNested, setCategoriesNested] = useState([]);
  const [showMedia, setShowMedia] = useState(false);
  const [searchMedia, setSearchMedia] = useState('');
  const [mediaList, setMediaList] = useState([]);
  const [imagesDragOver, setImagesDragOver] = useState(false);

  const createWPAPI = () => {
    let wpapiUrl
    if (!selectedFeed.website.endsWith("/")){
      wpapiUrl = 'https://' + selectedFeed.website + '/wp-json'
    }else{
      wpapiUrl = 'https://' + selectedFeed.website+'wp-json'
    }
    var wp = new WPAPI({
        endpoint: wpapiUrl,
        username: selectedFeed.username,
        password: selectedFeed.password,
    });
    return wp

  }


  const getMedia = async (e) => {
    e.preventDefault();
    setMediaList([])

  if (selectedFeed.CMSType === 'wordpress'){
    var wp = createWPAPI()
    wp.media().perPage(100).search(searchMedia).get().then(function( response ) {
      const updateImages = response.map((entry, index) => {

        console.log('entry', entry)

          return {
            id : entry.id,
            file_name : entry.filename,
            file_url : entry.source_url,
            width: entry.media_details.width,
            height: entry.media_details.height,
            caption: entry.caption.rendered?removeTags(entry.caption.rendered):''
          }
      })

      setMediaList(updateImages)
    })
  }else{

    let client = contentful.createClient({
        space: selectedFeed.spaceId,
        accessToken: selectedFeed.accessToken,
      })
      async function getAssetsWithSearchTerm(searchTerm) {
        try {
          const response = await client.getAssets({
            query: searchTerm
          });

          return response.items
        } catch (error) {
          console.error('Error fetching assets:', error);
        }
      }

      const images = await getAssetsWithSearchTerm(searchMedia);


      const updateImages = images.map((entry, index) => {

            console.log('images', entry.fields.file.fileName)

            return {
              id : entry.sys.id,
              file_name : entry.fields.file.fileName,
              file_url : entry.fields.file.url,
              width: entry.fields.file.details.image?entry.fields.file.details.image.width:'',
              height: entry.fields.file.details.image?entry.fields.file.details.image.height:'',
              caption: entry.fields.description
            }
      })
      setMediaList(updateImages)
  }
}



  const getContentfulData = async (data, contentType) => {
    let client = contentful.createClient({
        space: data.spaceId,
        accessToken: data.accessToken,
      })
    const response = await client.getEntries({
      'content_type': contentType,
      'order': 'sys.updatedAt',
       'limit': '1000',
      'include': '10',
    })


    return response.items??[]
}



  async function downloadImagesAsZip() {
    // 1. Initialize JSZip
    const zip = new JSZip();

    // 2. Extract the raw base64 string by removing the "data:image/jpeg;base64," prefix

    // 3. Create a folder inside the ZIP and add the image file
    const imageFolder = zip.folder("images");

    for (const image of images) {
      if (image.file_url.startsWith('data:image/')){
        const rawBase64 = image.file_url.split(',')[1];




        imageFolder.file(image.file_name, rawBase64, { base64: true });
      }else{
        const response = await fetch(image.file_url);
        const imageBlob = await response.blob();
        imageFolder.file(image.file_name, imageBlob);
      }
    }

    // 4. Generate the ZIP archive as a binary Blob
    zip.generateAsync({ type: "blob" }).then(async function (content) {

      const fileHandle = await window.showSaveFilePicker({
        suggestedName: selectedFeed.label+'-images',
        types: [{ description: 'application/zip', accept: { ['application/zip']: [".zip"] } }]
      });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
    });
}

async function downloadImage(image) {


  let fileToDownload
  let file_type


    if (image.file_url.startsWith('data:image/')){
      const parts = image.file_url.split(';base64,');
       const contentType = parts[0].split(':')[1];
       const rawData = window.atob(parts[1]); // Decode base64 string

       // 2. Convert raw data into an array of bytes
       const rawDataLength = rawData.length;
       const uInt8Array = new Uint8Array(rawDataLength);

       for (let i = 0; i < rawDataLength; ++i) {
           uInt8Array[i] = rawData.charCodeAt(i);
       }

       // 3. Create a Blob object from the byte array
       const blob = new Blob([uInt8Array], { type: contentType });

       fileToDownload = blob
       file_type = contentType
    }else{
      const response = await fetch(image.file_url);
      const imageBlob = await response.blob();
      fileToDownload = imageBlob
      file_type = image.file_type
    }


    const fileHandle = await window.showSaveFilePicker({
      suggestedName: image.file_name,
      types: [{ description: file_type, accept: { [file_type]: [".png", ".jpg", ".webm"] } }]
    });
    const writable = await fileHandle.createWritable();
    await writable.write(fileToDownload);
    await writable.close();

}


  const createDate = () => {
    // Create a date that is one day in the future
      const currentDate = new Date();
      const futureDate = new Date(currentDate);

      // Add one day to the current date
      futureDate.setDate(futureDate.getDate() + 1);

      // Set the specific time (e.g., 15:30:00 for 3:30 PM)
      const hours = 15; // 3 PM
      const minutes = 30;
      const seconds = 0;

      futureDate.setHours(hours, minutes, seconds, 0); // setting hours, minutes, seconds, and milliseconds

      return futureDate;
  }

  const [date, setDate] = useState(createDate());



  useEffect(() => {
    const calculateMinTime = date => {
        let isToday = moment(date).isSame(moment(), 'day');
        if (isToday) {
            let nowAdd30Mins = moment(new Date()).add({mins: 30}).toDate();
            return setMinTime(nowAdd30Mins);
        }
        return setMinTime(moment().startOf('day').toDate());
    }
    calculateMinTime(date)
  },[date])


  const calculateMinTime = date => {
      let isToday = moment(date).isSame(moment(), 'day');
      if (isToday) {
          let nowAdd30Mins = moment(new Date()).add({hours: 30}).toDate();
          return nowAdd30Mins;
      }
      return moment().startOf('day').toDate();
  }

  const [minTime, setMinTime] = useState(calculateMinTime(new Date()))

  function toTitleCase(str) {
    return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}


  const addNewFile = async (files) => {
    const file = files[0]
    if (file.file_type === 'application/pdf'){
      setpdfUrl(file.file_url)
    }else if (file.file_type === 'image/png' || file.file_type === 'image/jpeg'){
      const checkedImages = await checkInstagramImages(files)
      setImages(images => [...checkedImages, ...images])
    }
    setSelectedFiles([])
  }


  useEffect(() => {
    if (!showFiles && selectedFiles.length > 0) {
      addNewFile(selectedFiles)
    }
  }, [showFiles, selectedFiles]);


  const onMouseDown = (event) => {
    if (event.target.closest('.media-menu')) return;
    if (event.target.closest('.pdf-buttons')) return;
    const rect = dragAreaRef.current.getBoundingClientRect();
    startXRef.current = event.clientX - rect.left;
    startYRef.current = event.clientY - rect.top;

    const selectBox = selectBoxRef.current;
    selectBox.style.left = `${startXRef.current}px`;
    selectBox.style.top = `${startYRef.current}px`;
    selectBox.style.width = '0px';
    selectBox.style.height = '0px';
    selectBox.style.display = 'block';

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };


  const onMouseMove = (event) => {
    const rect = dragAreaRef.current.getBoundingClientRect();
    const currentX = event.clientX - rect.left;
    const currentY = event.clientY - rect.top;

    const width = Math.abs(currentX - startXRef.current);
    const height = Math.abs(currentY - startYRef.current);
    const left = Math.min(startXRef.current, currentX);
    const top = Math.min(startYRef.current, currentY);

    const selectBox = selectBoxRef.current;
    selectBox.style.width = `${width}px`;
    selectBox.style.height = `${height}px`;
    selectBox.style.left = `${left}px`;
    selectBox.style.top = `${top}px`;
  };

  const onMouseUp = (event) => {
  const rect = dragAreaRef.current.getBoundingClientRect();
  const endX = event.clientX - rect.left;
  const endY = event.clientY - rect.top;

  const selectionArea = {
    startX: Math.min(startXRef.current, endX),
    startY: Math.min(startYRef.current, endY),
    endX: Math.max(startXRef.current, endX),
    endY: Math.max(startYRef.current, endY),
  };

  sendAreaData(selectionArea);
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);

  };

useEffect(() => {
  if (pdfUrl){
    const dragArea = dragAreaRef.current;
    dragArea.addEventListener('mousedown', onMouseDown);
      return () => {
        dragArea.removeEventListener('mousedown', onMouseDown);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };
  }
}, [pdfUrl]);


const sendAreaData = async(selectionArea) => {
  const width  =  selectionArea.endX - selectionArea.startX
  const height  =  selectionArea.endY - selectionArea.startY
  setSelectionArea(selectionArea)

  if (width < 50) return

  setLoader(true)


  let url

  if (inputTypeRef.current === 'images'){
     url = '/api/pdf-extract/extract-image'
  }else{
    url = '/api/pdf-extract/extract-article'
  }


  const response = await fetch(url, {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pdfUrl: pdfUrl,
      rect: selectionArea,
      pageNumber: pageNumberRef.current,
      removeWhiteSpace: removeWhiteSpaceRef.current
    }),
  });

  const responseJson = await response.json()

  if (inputTypeRef.current === 'images'){
    const checkedImages = await checkInstagramImages([responseJson.image])
    setImages(prev => [...checkedImages, ...prev])

  }else{

    const {paragraphs, heading, captions} = detectArticle(responseJson)


    if (paragraphs){
      setParagraphsState(prev => [...prev, ...paragraphs])
    }

    const newParagraphs = [...paragraphsState, ...paragraphs]
    let newImages = []
    let imagesWithCaptions = []


    if (heading){
      const TrimHeading = heading.trimStart()
      const ReplaceHeading = TrimHeading.replace(/\s{2,}/g, ' ')
      setHeading(toTitleCase(ReplaceHeading))
    }

    if (responseJson.images.length > 0){
      imagesWithCaptions = addCaptions(responseJson.images, captions)

      const checkedImages = await checkInstagramImages(imagesWithCaptions)

      newImages = [...checkedImages, ...imagesRef.current]

      setImages(prev => [...checkedImages, ...prev])

    }
    if (selectedFeedRef.current.CMSType === 'wordpress'){
        addWordPressArticle(paragraphs, newImages)
    }else if (selectedFeedRef.current.CMSType === 'contentful'){
        addContentfulArticle(paragraphs, newImages)
    }
  }

  setLoader(false)
}

const addCaptions = (images, captions) => {

  return images.map((image, index)=>{
      return{
        caption: captions[index],
        ...image
      }
    })
}

function removeDoubleSpaces(string) {
    return string.replace(/ {2,}/g, ' ');
}



const addContentfulArticle = (paragraphs, images) => {

    let previousContent = mdValue

    let combinedContent

  if (paragraphs){

      let paragraphText = ''

      paragraphs.forEach((paragraph, index) => {

        const urlRegex = /(https?:\/\/[^\s]+)/gi;
        const updatedUrlText = paragraph.replace(urlRegex, '[$1]($1)');

        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const updatedEmailText = updatedUrlText.replace(emailRegex, '[mailto:$1]($1)');

        const newText = markdownLinkify(paragraph)

        paragraphText += '\n'+removeDoubleSpaces(updatedEmailText)+' \n'
      });

      combinedContent = previousContent + paragraphText

  }else{

      combinedContent = previousContent

  }


  if (images.length > 1){
    let lastImages = addLastImages(images)

    handleMDEditorChange(combinedContent + '\n'+ lastImages)
  }else{
    handleMDEditorChange(combinedContent)
  }


}

function markdownLinkify(text) {
  // URLs
  // URLs with protocol
  text = text.replace(
    /\b(https?:\/\/[^\s<]+)\b/gi,
    '[$1]($1)'
  );

  // URLs without protocol
  text = text.replace(
    /(^|[\s>])((?:www\.)[^\s<]+)/gi,
    '[$1]($1)'
  );

  // Emails
  text = text.replace(
    /\b([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})\b/gi,
    '[mailto:$1]($1)'
  );

  return text;
}

function htmlLinkify(text) {
  // URLs
  // URLs with protocol
  text = text.replace(
    /\b(https?:\/\/[^\s<]+)\b/gi,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // URLs without protocol
  text = text.replace(
    /(^|[\s>])((?:www\.)[^\s<]+)/gi,
    '$1<a href="https://$2" target="_blank" rel="noopener noreferrer">$2</a>'
  );

  // Emails
  text = text.replace(
    /\b([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})\b/gi,
    '<a href="mailto:$1">$1</a>'
  );

  return text;
}



const addWordPressArticle = (paragraphs, images) => {

  if (!editorRef.current) return

  let htmlString = getEditorContent()
  var parser = new DOMParser();
  var doc = parser.parseFromString(htmlString, 'text/html');
  var imgElements = doc.querySelectorAll('img');
  var captions = doc.getElementsByClassName('wp-caption-text')

  for (let caption of captions) {
      caption.remove()
  }

  for (let img of imgElements) {
      let remove = img.parentNode
      remove.remove()
  }

  var previousContent = doc.body.innerHTML;

  let combinedContent

  if (paragraphs){

    let paragraphText = ''

    paragraphs.forEach((paragraph, index) => {

      paragraphText += '<p>'+htmlLinkify(paragraph)+' </p>'
    });


    combinedContent = previousContent + paragraphText

  }else{

    combinedContent = previousContent

  }


  if (images.length === 0){
    setTinymceContent(combinedContent)

  }else{

    var firstImage = addFirstImage(images)

    if (images.length>1){
      let lastImages = addLastImages(images)
      if (lastImages){

        setTinymceContent(firstImage + combinedContent + lastImages)
      }
    }else{
        setTinymceContent(firstImage + combinedContent)
    }
  }
}
/*
const updateCopy = (images) => {
  let htmlString = getEditorContent()
  var parser = new DOMParser();
  var doc = parser.parseFromString(htmlString, 'text/html');
  var imgElements = doc.querySelectorAll('img');
  var captions = doc.getElementsByClassName('wp-caption-text')

  for (let caption of captions) {
      caption.remove()
  }

  for (let img of imgElements) {
      let remove = img.parentNode
      remove.remove()
  }
  var modifiedHtmlString = doc.body.innerHTML;

  var firstImage = addFirstImage(images)

  if (images.length>1){
    let lastImages = addLastImages(images)
    if (lastImages){

      setTinymceContent(firstImage + combinedContent + lastImages)
    }
  }else{
      setTinymceContent(firstImage + combinedContent)
  }
}
*/
const addFirstImage = (images) => {
  var newImageHTML

  console.log('selectedFeed', selectedFeed)

  if (images[0].file_url){

      if (selectedFeed.CMSType === 'wordpress'){
          newImageHTML = createImageHTML(images[0])
      }else{
          newImageHTML = createImageMd(images[0])
      }

  }
  return newImageHTML
}

const addLastImages = (images) => {


  let imagesHTML = ''

  let imagesWithoutFirstElement = images.slice(1);
  imagesWithoutFirstElement.reverse()

  imagesWithoutFirstElement.forEach((image, index) => {

    if (image.file_url){
        var newImage

        if (selectedFeed.CMSType === 'wordpress'){
            newImage = createImageHTML(image)
        }else{
            newImage = createImageMd(image)
        }

        imagesHTML += newImage
      //setImageCounter (imageCounter+1)
    }

  })

  return imagesHTML

}

const createImageHTML = (image) => {

  let imageHTML = ''

      let img = '<img id="image-'+image?.id+'" data-id="'+image?.id+'" width="'+image.width+'" height="'+image.height+'" src="'+image.file_url+'" style="width:100%; height:auto" class="size-full"/>'
      if (image.caption){
        imageHTML = '<div class="wp-caption alignnone social-scheduler-image">'+img+'<p id="image-caption-'+image?.id+'" data-id="caption-'+image?.id+'" class="wp-caption-text">'+image.caption+'</p></div>'
      }else{
        imageHTML = '<div class="wp-caption alignnone social-scheduler-image">'+img+'</div>'
      }


  return imageHTML
}

const createImageMd = (image) => {
  //![resized_cropped_image_1716869120.jpg](//images.ctfassets.net/blbpa6fzvcno/6q6hDPVBptDGfEwYroIcuQ/980e58418218380e48194f5c920028dc/edit_selected_image_area_1718088206_1718088224.jpg)

  let imageHTML = ''

      let img = '!['+image.file_url+']('+image.file_url+')'
      if (image.caption){
        imageHTML = img+image.caption+'\n'
      }else{
        imageHTML = img+'\n'
      }


  return imageHTML
}

const createWPImageHTML = (image) => {

  let imageHTML = ''

  let img = '<img id="image-'+image.id+'" data-id="'+image.id+'" width="'+image.width+'" height="'+image.height+'" src="'+image.image.image_path+'" style="width:100%" class="size-full"/>'
      if (image.caption){
        imageHTML = '[caption id="" align="alignnone" width="748"]'+img+' '+image.caption+'[/caption]'
      }else{
        imageHTML = img
      }


  return imageHTML
}




function detectArticle(data) {
  const paragraphs = [];
  const images = [];
  let heading = ""
  let captions = []
  let currentParagraph = "";
  let currentCaption = ""
  let bodyhtml = ""
  let previousParagraph = ''
  let counter = 0

    data.text_json.blocks.forEach(block =>{
        if (block.height === 0 ) return

        const isBold = block.fontName === 'BKSRGB+MuseoSans-900' ||
          block.fontName === 'KSGAJY+BodoniSvtyTwoITCTT-Bold' ||
          block.fontName === 'KSGAJY+Helvetica-Bold'


        let text = block.text

        if (text.length === 0) return


        let noSpace = false
        previousParagraph = text

        if (text.endsWith("-")){
            noSpace = true
            const lastIndex = text.lastIndexOf("-");
             if (lastIndex !== -1) {
               // Replace the last occurrence of '-'
               text = text.substring(0, lastIndex) + text.substring(lastIndex + 1);
             }
        }


        if (text.endsWith("/")){
            const lastIndex = text.lastIndexOf("/");
            noSpace = true
             if (lastIndex !== -1) {
               // Replace the last occurrence of '-'
               text = text.substring(0, lastIndex) + text.substring(lastIndex + 1);
             }
        }

        if (text.length === 1){
          noSpace = true
        }


        if (block.height < 8){
          //caption
          const endsWithPeriod = currentCaption.trim().endsWith('.');
          const endsWithQuotePeriod = currentCaption.trim().endsWith('".');
          const endsWithPeriodQuote = currentCaption.trim().endsWith('."');

          if (endsWithPeriod || endsWithQuotePeriod || endsWithPeriodQuote) {
            captions.push(currentCaption);
            currentCaption = "";
          }

          if (noSpace){
                currentCaption += text
          }else{
                currentCaption += text + " "
          }


          } else if (block.height > 11 && text.length > 1){

            //heading

              if (noSpace){
                    heading += text;
              }else{
                    heading += text + " "
              }

          }else{

          if (selectedFeed && selectedFeed?.CMSType === "wordpress"){
                text = isBold ? `<b>${text}</b>` : text;
          }else if (selectedFeed && selectedFeed?.CMSType === "contentful"){
                text = isBold ? `__${text}__` : text;
          }

          const endsWithPeriod = currentParagraph.trim().endsWith('.');
          // Check if the current paragraph ends with a quote followed by a period, but not a URL

          const endsWithQuotePeriod = currentParagraph.trim().endsWith('".');

          const endsWithPeriodQuote = currentParagraph.trim().endsWith('."');

          // Check if the current paragraph ends with a colon
          const endsWithColon = currentParagraph.trim().endsWith(':');

          // Check if the current text starts with a bullet point
          const startsWithBullet = text.trim().startsWith('•');

          const endsWithWWW = currentParagraph.trim().endsWith('www.');



          if ((endsWithPeriod || endsWithQuotePeriod || endsWithPeriodQuote || endsWithColon || startsWithBullet) && !endsWithWWW) {
            paragraphs.push(currentParagraph);
            currentParagraph = "";
          }

          if (previousParagraph === '-'){
            text.trim()
          }

          if (noSpace){
            currentParagraph += text;
          }else{

            currentParagraph += text + " ";
          }

        }

    })

    if (currentParagraph.trim() !== "") {
      paragraphs.push(currentParagraph.trim());
    }

    if (currentCaption.trim() !== "") {
      captions.push(currentCaption.trim());
    }

    const filterCaptions = captions.filter((cap)=>cap !== "")

    const filterParagraphs = paragraphs.filter((par)=>par !== "")

    return { paragraphs:filterParagraphs, heading, captions:filterCaptions};

}

useEffect(()=>{

  inputTypeRef.current = inputType

},[inputType])

useEffect(() => {

removeWhiteSpaceRef.current = removeWhiteSpace;

},[removeWhiteSpace])

useEffect(()=>{

  pageNumberRef.current = pageNumber

},[pageNumber])

useEffect(()=>{

  imagesRef.current = images

  if (selectedFeedRef.current.CMSType === 'wordpress'){
      setTinymceContent('')
      addWordPressArticle(null, images)
  }else if (selectedFeedRef.current.CMSType === 'contentful'){
      handleMDEditorChange('')
      addContentfulArticle(null, images)
  }

},[images])




useEffect(()=>{

  selectedFeedRef.current = selectedFeed

    if (selectedFeedRef.current.CMSType === 'wordpress'){
          let htmlString = getEditorContent()

          if (!htmlString){
            addWordPressArticle(paragraphsState, images)
          }

        //
    }else if (selectedFeedRef.current.CMSType === 'contentful'){

        if (!mdValue){
          addContentfulArticle(paragraphsState, images)

        }
    }


},[selectedFeed])

const onFeedChange = async(value) => {
  setMediaList([])
  const feed = FEEDS.find(item => item.label === value);
  setSelectedFeed(feed);


  if (feed.CMSType === 'wordpress'){


  }

  if (feed.CMSType === 'contentful'){

    const categories = await getContentfulData(feed, 'category')

    setContentfulCategoriesList(categories)

    const authors = await getContentfulData(feed, 'author')

    setContentfulAuthorsList(authors)

    const tags = await getContentfulData(feed, 'tag')

    setContentfulTagsList(tags)

  }


}

const handleImagesDragOver = (event) => {
  event.preventDefault();
  setImagesDragOver(true)
};

const handleImagesDragLeave = (event) => {
  event.preventDefault();
  setImagesDragOver(false)
};


const onTinyEditorChange = function (content, editor) {
  setTinymceContent(content);
};

const handleEditorInit = (event, editor) => {
  editorRef.current = editor;

  const contentArea = editor.getBody();

  const handleDragOver = (event) => {
    event.preventDefault();
  };



// drop on editor
  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const data = event.dataTransfer.getData('text/html') || event.dataTransfer.getData('text/plain');
    if (data) {
      const div = document.createElement('div');
      div.innerHTML = data;
      const imgElement = div.querySelector('img');

      if (imgElement) {
        const imgSrc = imgElement.getAttribute('src');
        const imgId = imgElement.getAttribute('id');
        const imgDataId = imgElement.getAttribute('data-id');
        const imgtype = imgElement.getAttribute('data-imagetype');
        const imgWidth= imgElement.getAttribute('width');
        const imgHeight = imgElement.getAttribute('height');
        var imageData

        if (imgtype === 'feature-image'){
          imageData = {
            id:imgDataId,
            image:{
              image_path:imgSrc,
            },
            width:imgWidth?imgWidth:'',
            height:imgHeight?imgHeight:'',
            caption:imageCaptionRef.current?imageCaptionRef.current:''
          }
        }else if (imgtype === 'media'){

            let filterImage = mediaListRef.current.find(function(node) {
              return node.id === parseInt(imgDataId)
           });

            imageData = {
              id:imgDataId,
              image:{
                image_path:imgSrc,
              },
              width:imgWidth?imgWidth:'',
              height:imgHeight?imgHeight:'',
              caption:filterImage?.caption.rendered?removeTags(filterImage.caption.rendered):''
          }
        }else if (imgtype === 'extracted-image'){

          let filterImage = extractedImagesRef.current.find(function(node) {
            return node.id === parseInt(imgDataId)
         });

          imageData = {
            id:imgDataId,
            image:{
              image_path:imgSrc,
            },
            width:imgWidth?imgWidth:'',
            height:imgHeight?imgHeight:'',
            caption:filterImage?.caption? filterImage.caption:''
          }

        }


        let finalImagehtml = createImageHTML(imageData)
        // Insert the modified data into the editor
        const content = finalImagehtml
        editor.insertContent(content);
      } else {
        // Proceed with the normal insertion of the dropped content
        editor.insertContent(data);
      }
    }
  };

  // Attach the event listeners to the content area
  contentArea.addEventListener('dragover', handleDragOver);
  contentArea.addEventListener('drop', handleDrop);
};

const handleMDEditorChange = (newValue) => {
  setMdValue(newValue);
};




const removeArticleImage = (id) => {
  setImages(prev => prev.filter((image)=>image.id !== id))


}

const handleDragStart = (e, id, type) => {
  e.stopPropagation(); // Prevents parent drag event from triggering

  e.dataTransfer.setData('id', id);
  e.dataTransfer.setData('type', type);
};

const handleDrop = (e, id) => {

  e.preventDefault();

  if (imagesDragOver){
    setImagesDragOver(false)
  }


  const draggedId = e.dataTransfer.getData('id');
  const draggedType = e.dataTransfer.getData('type');

  console.log('id', id)

  console.log('draggedId', draggedId)

  if (id && draggedId !== id) {
    const updatedItems = [...images];

    const draggedItemIndex = images.findIndex(item => item.id === draggedId);
    const targetItemIndex = images.findIndex(item => item.id === id);

    if (draggedItemIndex !== -1 && targetItemIndex !== -1) {
      if (draggedType === 'image') {

        const targetItemImage  = updatedItems[targetItemIndex].file_url;
        const draggedItemImage = updatedItems[draggedItemIndex].file_url;

        const targetItem = updatedItems[targetItemIndex];
        const draggedItem = updatedItems[draggedItemIndex];

        // Store the current paths temporarily
        const tempTargetImagePath = targetItem.file_url;
        const tempDraggedImagePath = draggedItem.file_url;

        // Store the dimensions temporarily
        const tempTargetDimensions = {width:targetItem.width, height:targetItem.height};
        const tempDraggedDimensions = {width:draggedItem.width, height:draggedItem.height};

        // Store the current instagram values
        const tempTargetInstagramError = targetItem.instagram_image_error;
        const tempDraggedInstagramError = draggedItem.instagram_image_error;


        // Update the paths using the stored values
        draggedItem.file_url = tempTargetImagePath;
        targetItem.file_url = tempDraggedImagePath;


        // Update the width and height
        draggedItem.width = tempTargetDimensions.width;
        draggedItem.height = tempTargetDimensions.height;
        targetItem.width = tempDraggedDimensions.width;
        targetItem.height = tempDraggedDimensions.height;

        // Update instagram using the stored values
        draggedItem.instagram_image_error = tempTargetInstagramError;
        targetItem.instagram_image_error = tempDraggedInstagramError;

      } else if (draggedType === 'caption') {

          [updatedItems[draggedItemIndex].caption, updatedItems[targetItemIndex].caption] =
          [updatedItems[targetItemIndex].caption, updatedItems[draggedItemIndex].caption];
      } else if (draggedType === 'container') {
        const [draggedItem] = updatedItems.splice(draggedItemIndex, 1);
        updatedItems.splice(targetItemIndex, 0, draggedItem);
      }

      setImages(updatedItems);
    }
  }else{


    const newImage = mediaList.find((media)=>{

      let checkId

      if (typeof media.id === 'number') {
        checkId = Number(draggedId)
      }else{
        checkId = draggedId
      }

      return media.id === checkId

    })

    console.log('newImage', newImage)

    if (newImage){
      setImages(prev => [ newImage, ...prev]);
    }


  }
};

const handleDragOver = (e) => {
  e.preventDefault();
  console.log('handleDragOver', e)
};

const getEditorContent = () => {
  if (editorRef.current) {
    return editorRef.current.getContent()
  }

};

const updateCaption = (value, id) => {
  setImages(prev =>
    prev.map(image =>
      image.id === id
        ? { ...image, caption: value }
        : image
    )
  );
};

const editMedia = (media, index, tool) => {
  setActiveTool(tool)
  setDisplayEditItem(true)
  editingIndex.current = index
  setItem(media)
}

const handleEditReplace = async(index, newItem) => {

  const checkedImages = await checkInstagramImages([newItem])


  setImages(prevItems =>
    prevItems.map((item, i) => i === index ? checkedImages[0] : item)
  );


}

useEffect(() => {

  if (!displayEditItem && item) {

      handleEditReplace(editingIndex.current, item)
      setItem(null)
  }

}, [displayEditItem, item]);

const checkInstagramImages = async (images) => {
     return await Promise.all(images.map(async(image) => {
       let instagramImageCheck = await checkImageSize(image.file_url)
       if (instagramImageCheck){
         showError('Instagram Image Size Error')
       }
       var temp = {...image}

       temp.instagram_image_error = instagramImageCheck

       return temp;
     }))

}

const checkImageSize = async (imageUrl) => {
    const img = new Image();
    img.src = imageUrl;

    let imageLoadPromise = new Promise((resolve, reject) => {
      img.onload = () => {
        let checkRatioVal = checkRatio(img.width, img.height)
        resolve(checkRatioVal)
      };

    })

  let imageStatus = await imageLoadPromise

  return imageStatus

};

const getFileName = (path) => path.split('/').pop(); // sample-image.jpg

async function fileFromServer(path) {
  const response = await fetch(path);
  const blob = await response.blob();
  const fileName = path.split("/").pop();
  return new File([blob], fileName, { type: blob.type });
}

const startSSE = () => {
  if (evtSourceRef.current) return; // already running

  const evtSource = new EventSource('/api/events');
  evtSourceRef.current = evtSource;

  evtSource.onmessage = async (event) => {


    const updatedFile = getFileName(event.data);
    const currentFile = getFileName(editImageRef.current);

    if (updatedFile === currentFile) {

      const file = await fileFromServer(event.data);

      const formData = new FormData()
      formData.append('file', file)

      try{
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        const result = await res.json()

        if (res.ok) {
          const fileInfo = await storeFileInfo({
            user_id:user.id,
            file_url:result.url,
            file_type:file.type,
            file_name:file.name,
            file_description:editImageData.current.caption??null
          })


          setImages(prevItems =>
            prevItems.map((item, i) => item.id === editImageData.current.id ? fileInfo : item)
          );


        } else {
          console.log(result.error)
          showError(result.error)
        }
      }catch(error){
        console.log(error)
        showError('file upload error', error)
      }


    }
  };

  evtSource.onerror = () => {
    console.warn('SSE error, reconnecting next edit if needed.');
    evtSource.close();
    evtSourceRef.current = null; // allow future reconnect
  };
};


const editInPhotoshop = async (image) => {

    const res = await fetch('/api/edit-in-photoshop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image:image.file_url}),
    });

    const data = await res.json();

if (data.publicUrl) {
    editImageRef.current = data.publicUrl
    editImageData.current = image
    startSSE();
  }
}




  return (
    <>
    <div>
      <div className='properties-container'>
        <label className='label'>Publication</label>
        <select id="rss-select" className="form-input select" onChange={(e) => onFeedChange(e.target.value)} value={selectedFeed.label}>
          {FEEDS.map((feed, index)=>{
            return <option key={index} value={feed.label}>{feed.label}</option>
          })
          }
        </select>
        {selectedFeed &&
          <button style={{margin: '0px'}} className="btn secondary btn-sm" onClick={() => {
            setSelectedFiles([])
            setFilePicker(true)
            setShowFiles(prevState => !prevState)
          }}>Add File</button>
        }

      </div>


      {pdfUrl &&
        <>
          <div>
            <button style={{marginLeft:'10px'}} className={`btn ${inputType === 'articles'? 'primary' : 'secondary'}  btn-sm`} onClick={() => setInputType('articles')}>Extract Articles</button>
            <button style={{marginLeft:'10px'}} className={`btn ${inputType === 'images'? 'primary' : 'secondary'}  btn-sm`} onClick={() => setInputType('images')}>Extract Image</button>
          </div>
          {inputType === 'images'&&
        <div className="form-check properties-container"
          style={{
            marginLeft: '15px',
            position: 'relative',
            display: 'inline-flex',
            alignItems:'center'
          }}>
               <Checkbox
                 style={{marginLeft: '0px', marginRight:'5px'}}
                 className="form-check-input"
                 name="check"
                 type="checkbox"
                 checked={removeWhiteSpace}
                 onChange={(e) => setRemoveWhiteSpace(!removeWhiteSpace)}
                 sx={{
                   color: 'var(--md-sys-color-secondary)',
                   '&.Mui-checked': {
                     color: 'var(--md-sys-color-primary)',
                   },
                 }}
                 />
                 <label className="form-check-label"> Remove Whitespace</label>
         </div>
       }
         </>
      }
      {/* Point explicitly to the public folder directory link */}
      {pdfUrl &&
        <div style={{display:'flex'}}>
          <div style={{flex:1, maxWidth:'550px', minWidth:'600px', position:'relative'}}>
            <div style={loader? {display:'block'}:{display:'none'}} className={'loader_screen'}>
                <div style={{transform:'translate(-50%, -50%)'}}  className="loader"></div>
            </div>
            <div
              id="drag-area"
              className='unselectable'
              ref={dragAreaRef}
              style={{ position: 'relative', height: 'calc(100% - 120px)'}}
            >
              <PDFViewer
              pdfUrl={pdfUrl}
              sizeCallBack={setCanvasSize}
              setPageNumberCallBack={setPageNumber}
              />
              <div id="select-box" ref={selectBoxRef}/>
            </div>
        </div>
        <div style={{flex:.5, padding:'10px', minWidth:'250px', maxWidth:'250px'}}>
          <Dropdown placeholder="Add Images">
            <button className="btn btn-sm clear" onClick={() => {
              setSelectedFiles([])
              setFilePicker(true)
              setShowFiles(prevState => !prevState)
            }}>From My Files</button>
            <button className={`${'btn btn-sm'} ${showMedia? 'primary':'clear'}`}
              onClick={() => setShowMedia(prevShowMedia => !prevShowMedia)}
              disabled={selectedFeed === null}
            >Show Media
            </button>

          </Dropdown>
          {images.length !== 0&&
            <div>
              <button style={{marginTop:'0px'}} className="btn secondary btn-sm" onClick={downloadImagesAsZip}>
                Download Images
              </button>
            </div>
          }
          <div
            className={`${imagesDragOver?'active':''} images-container`}
            onDragOver={handleImagesDragOver}
            onDragLeave={handleImagesDragLeave}
            onDrop={(e) => handleDrop(e, null)}
            style={{
              position:'relative',
              minHeight:images.length === 0?'150px':'0px',
              backgroundColor:images.length === 0?'var(--md-sys-color-surface-container)':'transparent',
              borderRadius: 'var(--input-border-radius)',
            }}
          >
            {images.length === 0 &&
              <div
                style={{
                  top:'50%',
                  left:'50%',
                  transform:'translate(-50%, -50%)',
                  position:'absolute',
                  display:'flex',
                  flexDirection:'column',
                  alignItems: 'center'
                }}
              >
              <FileImage size={50}/>
              <p><strong> No Images </strong></p>
            </div>
            }

            {images.length !== 0 &&
              <>
                {images.map((image, index)=>{

                  let margin=true

                  if (index+1 === images.length){
                    margin=false
                  }

                  return(
                      <ImageComponent
                      key={image.id}
                      image={image}
                      index={index}
                      removeCallback={removeArticleImage}
                      handleDragStart={handleDragStart}
                      handleDrop={handleDrop}
                      handleDragOver={handleDragOver}
                      updateCaption={updateCaption}
                      editMedia={editMedia}
                      editInPhotoshop={editInPhotoshop}
                      downloadImage={downloadImage}
                      margin={margin}
                      />
                    )
                })}
              </>
            }
          </div>
        </div>

        <div style={{flex:.7, padding:'10px', maxWidth:'500px'}}>

            <p style={{marginBottom:'0px'}} className="label" >Schedule Date</p>
              <DatePicker
                minDate={moment().toDate()}
                minTime={minTime}
                maxTime={moment().endOf('day').toDate()}
                selected={date}
                onChange={(date) => changeScheduleDate(date)}
                showTimeSelect
                dateFormat="MMMM d, yyyy h:mm aa"
                className={'form-input'}
              />

            {images.length !== 0 &&
              <>
                <ImageComponent
                image={images[0]}
                index={0}
                removeCallback={removeArticleImage}
                handleDragStart={handleDragStart}
                handleDrop={handleDrop}
                handleDragOver={handleDragOver}
                updateCaption={updateCaption}
                editMedia={editMedia}
                editInPhotoshop={editInPhotoshop}
                downloadImage={downloadImage}
                />
              </>
            }
            <textarea style={{
                width:"100%",
                margin:'15px 0px',
                fontWeight: 'bold',
                fontSize: '2em',
                background: 'transparent',
                outline: '0',
                border: '0px',
                boxShadow: 'none',
                lineHeight: '1.3em'
              }}
              id='heading'
              className="form-control"
              value={heading}
              rows="3"
              onChange={(e) => setHeading(e.target.value)}
              placeholder="Heading..."
              />
            {selectedFeed &&
              <>
                {(selectedFeed.CMSType === 'wordpress') &&
                  <Editor
                    apiKey={tinymceAPIkey}
                    onEditorChange={() => onTinyEditorChange()}
                    value={tinymceContent}
                    onInit={(evt, editor) => handleEditorInit(evt, editor)}
                    init_instance_callback={(editor) => {
                        editor.on('ExecCommand', (e) => {
                          console.log(`The ${e.command} command was fired.`);
                        });
                      }
                    }
                    // initialValue="<p>This is the initial content of the editor.</p>"
                    init={{
                      height: 500,
                      menubar: false,
                      style_formats: [
                        {title: 'Caption', inline: 'p', classes: 'wp-caption-text'},
                        {title: 'Heading', inline: 'h1'},
                        {title: 'Bold', block: 'b'},
                        {title: 'Paragraph', block: 'p'}
                      ],

                      plugins: [
                        'advlist',
                        'autolink',
                        'lists',
                        'link',
                        'image',
                        'charmap',
                        'preview',
                        'anchor'
                      ],
                      browser_spellcheck: true,
                      contextmenu: false,
                      setup: function (editor) {
                        editor.on('init', function () {
                          editor.getDoc().head.innerHTML += '<style>.wp-caption-text {font-weight: bold; font-size: .8em} .social-scheduler-image > p{margin: 0;} .social-scheduler-image{margin-bottom: 10px;}</style>';
                        });
                      },

                      formats: {
                         alignleft: {selector: 'img', styles: {'float': 'left', 'margin': '0 10px 0 10px'}},
                         alignright: {selector: 'img', styles: {'float': 'right', 'margin': '0 0 10px 10px'}},
                         aligncenter: {selector: 'img', classes: 'aligncenter'},
                       },
                      toolbar:
                        "styleselect | spellcheckdialog | link " +
                        "undo redo | " +
                        "bold italic backcolor | alignleft aligncenter " +
                        "alignright alignjustify | bullist numlist outdent indent | " +
                        "removeformat | emoticons| help",

                      content_style:
                        "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
                      emoticons_append: {
                        custom_mind_explode: {
                          keywords: ["brain", "mind", "explode", "blown"],
                          char: "🤯",
                        },
                      },
                    }}
                  />
                }

                {(selectedFeed.CMSType === 'contentful') &&
                  <>
                    <div
                    onDrop={(e) => handleMarkdownDrop(e)}
                    onDragOver={(e) => handleMarkdownDragOver(e)}
                    >
                    <MarkdownEditorComponent
                     value={mdValue}
                     onChange={handleMDEditorChange} // Pass the handler as onChange prop
                    />
                    </div>
                  </>
                }
              </>
            }

        </div>
      </div>
      }
    </div>
    {showMedia &&
      <MediaPanel
        mediaList={mediaList}
        setShowMedia={setShowMedia}
        getMedia={getMedia}
        searchMedia={searchMedia}
        setSearchMedia={setSearchMedia}
        handleDragStart={handleDragStart}
      />
    }
  </>
  );
}


const ImageComponent  = ({
  image,
  index,
  removeCallback,
  handleDragStart,
  handleDrop,
  handleDragOver,
  updateCaption,
  editMedia,
  editInPhotoshop,
  downloadImage,
  margin
}) => {

  const [caption, setCaption] = useState(image.caption)


  useEffect(()=>{

    setCaption(image.caption)

  },[image.caption])

  return(
    <div
      draggable
      onDrop={(e) => handleDrop(e, image.id)}
      className="properties-container"
      style={{
        marginBottom:margin?'20px':'0px'
      }}
      onDragStart={(e) => handleDragStart(e, image.id, 'container')}
      onDragOver={handleDragOver}
    >
      <img
        draggable
        onDragStart={(e) => handleDragStart(e, image.id, 'image')}
        src={image.file_url}
        style={{
          borderRadius: 'var(--input-border-radius)',
          border: `${image?.instagram_image_error?'5px solid var(--md-sys-color-error)':'5px solid var(--md-sys-color-surface-container)'}`

        }}
      />
      <textarea
        draggable
        onDragStart={(e) => handleDragStart(e, image.id, 'caption')}
        id={'image-caption'}
        className={'form-input'}
        type='text'
        value={caption}
        onChange={(e) => updateCaption(e.target.value, image.id)}
      >
      </textarea>
      <div style={{marginLeft:'auto', height: '30px', display:'flex', alignItems:'center'}}>
        <img onClick={() => editInPhotoshop(image)} src='/Adobe_Photoshop_CC_icon.png' style={{width:'28px', marginRight:'10px'}}/>
        <Crop size={30} onClick={() => editMedia(image, index, 'crop')}/>
        {/*}<SquarePen style={{marginLeft:'10px'}} size={30} onClick={() => editMedia(image, index, 'caption')}/>*/}
        <Download style={{marginLeft:'10px'}} size={30} onClick={() => downloadImage(image)}/>

        <Trash2 style={{marginLeft:'10px'}} size={30} onClick={() => removeCallback(image.id)}/>

      </div>
    </div>
  )
}


const MediaPanel = ({
  mediaList,
  setShowMedia,
  getMedia,
  searchMedia,
  setSearchMedia,
  handleDragStart

}) => {

  const mediaPanelRef = useRef(null);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mediaPanelRef.current && !mediaPanelRef.current.contains(event.target)) {
        setShowMedia(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={mediaPanelRef}
      className='dropshadow media-menu'
        style={{
        background:'#ffffff',
        position: 'absolute',
        top: '0px',
        left: '0px',
        height: '100%',
        width:'400px',
        padding: '100px 25px',
        overflowY: 'scroll',
        zIndex:1000
      }}>
      <p style={{display:'block'}} onClick={() => setShowMedia(false)}>CLOSE</p>
      <form onSubmit={getMedia}>
        <div style={{marginBottom:'10px', width:'100%'}}>
          <input style={{
            width:"100%",

            margin:'15px 0px',
            fontSize: '.8em'
          }}
            id='search-media'
            type="text"
            className={'form-input'}

            value={searchMedia}
            onChange={(e) => setSearchMedia(e.target.value)}
            placeholder="Search..."
          />
        </div>
        <button style={{marginTop:'15px'}} className="btn primary btn-sm" type="submit" disabled={searchMedia.length>0?false:true}>Search</button>
      </form>
      <div  style={{
        display:'flex',
        width:'100%',
        flexWrap: 'wrap',
       }}>
        {
          mediaList.map((media, index) => {
            return(
              <div draggable onDragStart={(e) => handleDragStart(e, media.id, 'image')} key={index} style={{padding:'10px', width:'50%'}}>
                  <img
                    id={media.id}
                    data-id={media.id}
                    data-image-type='media'
                    width={media.width}
                    height={media.height}
                    style={{
                      width:'100%',
                      height:'auto',
                      borderRadius: 'var(--input-border-radius)',
                    }}
                    src={media.file_url}
                  />
              </div>
            )
          })
        }
      </div>
    </div>
  )
}
