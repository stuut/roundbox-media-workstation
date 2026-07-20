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
import nspell from 'nspell';
import './pdf-extract-css.css'

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
  FileImage,
  Copy
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

const tinymceAPIkey = process.env.NEXT_PUBLIC_TINY_MCE_API_KEY

function extractImagesFromMarkdown(markdown) {
    // Regular expression to match Markdown image syntax
    const imageRegex = /!\[.*?\]\((.*?)\)/g;

    // Find all matches
    let matches;
    const images = [];

    while ((matches = imageRegex.exec(markdown)) !== null) {
        const url = matches[1];
        const filename = url.split('/').pop();
        images.push({file_url:url });
    }

    return images;
}

function extractImagesFromWordpress(htmlString) {

      // Create a new DOMParser instance
      var parser = new DOMParser();
      let images = [];

      // Parse the HTML string into a document
      var doc = parser.parseFromString(htmlString, 'text/html');

      // Query for all img elements in the document
      var imgElements = doc.querySelectorAll('img');

      // Iterate over each img element and process the src attribute asynchronously
      for (let img of imgElements) {
          let url = img.getAttribute('src');
          images.push({file_url:url});

      }

      return images

}




function replaceBase64ImageInMarkdown(markdownString, targetBase64, newUrl) {
  let result = '';
    let rest = markdownString;
    let idx;

    while ((idx = rest.indexOf(targetBase64)) !== -1) {
        result += rest.slice(0, idx) + newUrl;
        rest = rest.slice(idx + targetBase64.length);
    }
    result += rest;

    return result;
}

function replaceBase64ImageInWordpress(htmlString, targetBase64, newUrl) {

    // Create a new DOMParser instance
    var parser = new DOMParser();
    let images = [];

    // Parse the HTML string into a document
    var doc = parser.parseFromString(htmlString, 'text/html');

    // Query for all img elements in the document
    var imgElements = doc.querySelectorAll('img');


    for (let img of imgElements) {


      if (img.getAttribute('src') === targetBase64){

        img.src = newUrl
      }

    }

    var modifiedHtmlString = doc.body.innerHTML;

    return modifiedHtmlString;

}




export default function PdfTextExtractor({user, feeds}) {
  const { displayEditItem, setDisplayEditItem, item, setItem, setActiveTool} = useEditItemContext();
  const {showFiles, setShowFiles, selectedFiles, setSelectedFiles, setFilePicker, fileLimit, setFileLimit } = useFilesContext();
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
  const [selectedFeed, setSelectedFeed] = useState(feeds[0])
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
  const [uploadLoader, setUploadLoader] = useState(false)

  const [contentfulFilter, setContentfulFilter] = useState('authors');
  const [contentfulAuthorsList, setContentfulAuthorsList] = useState([]);
  const [contentfulCategoriesList, setContentfulCategoriesList] = useState([]);
  const [contentfulTagsList, setContentfulTagsList] = useState([]);
  const [author, setAuthor] = useState(null);
  const [selectedContentfulCategories, setSelectedContentfulCategories] = useState([]);
  const [selectedContentfulTags, setSelectedContentfulTags] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [categoriesState, setCategoriesState] = useState(false);
  const [categoriesNested, setCategoriesNested] = useState([]);
  const [showMedia, setShowMedia] = useState(false);
  const [searchMedia, setSearchMedia] = useState('');
  const [mediaList, setMediaList] = useState([]);
  const [imagesDragOver, setImagesDragOver] = useState(false);
  const hasMounted = useRef(false)
  const [guestAuthor, setGuestAuthor] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const mdValueRef = useRef('')
  const [uploadedPosts, setUploadedPosts] = useState([]);
  const [usedDates, setUsedDates] = useState([]);
  const [dummyState, setDummyState] = useState(0);
  const [mediaLoader, setMediaLoader]  = useState(false);
  const [imageLoader, setImageLoader] = useState(false);

  function isInArray(value, array) {
    return array.indexOf(value) > -1;
  }

  const checkFunction = (number, checkbox) => {

    if (checkbox){
      setCategoriesList(categoriesList => [...categoriesList, number])
    }else{
      let removeCategoriesList = categoriesList.filter((cat) => number !== cat);
      setCategoriesList(removeCategoriesList)
    }
  }

  function buildNestedCheckboxes(checkboxes) {
    const map = {}; // To store all items by their id
    const roots = []; // To store root items (parent === null)

    // Initialize the map with all items and an empty children array
    checkboxes.forEach(item => {
      item.children = []; // Initialize the children array for each item
      map[item.id] = item; // Add the item to the map by its id
    });

    // Populate the children arrays and roots
    checkboxes.forEach(item => {
      if (item.parent === 0) {
        // If the item has no parent, it is a root item
        roots.push(item);
      } else {
        // If the item has a parent, add it to the parent's children array
        if (map[item.parent]) {
          map[item.parent].children.push(item);
        } else {
          // Handle the case where parent is not yet in the map
          map[item.parent] = { children: [item] };
        }
      }
    });

    return roots;
  }



  const getWPCategories = async () =>{


    const response = await fetch('/api/wordpress/get-categories', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            feedId: selectedFeed.id
          }),
      });

      const categories = await response.json();


        let nestedList = buildNestedCheckboxes(categories.data)
        setCategoriesState(prev => !prev)
        setCategoriesNested(nestedList)

  }


  const getMedia = async (e) => {
    e.preventDefault();

    try{
      setMediaList([])
      setMediaLoader(true)

        if (selectedFeedRef.current.CMSType === 'wordpress'){

          const response = await fetch('/api/wordpress/get-assets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  feedId: selectedFeed.id,
                  searchTerm: searchMedia
                }),
            });

            const images = await response.json();

            const updateImages = images.data.map((entry, index) => {

                return {
                  id : entry.id,
                  file_name : entry?.filename??null,
                  file_url : entry?.source_url??null,
                  width: entry?.media_details.width??null,
                  height: entry?.media_details.height??null,
                  file_description: entry?.caption.rendered?removeTags(entry.caption.rendered):null,
                  file_type: entry?.mime_type??null,
                  source:'wordpress'
                }
            })

            setMediaList(updateImages)

        }else{

          const response = await fetch('/api/contentful/get-assets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  feedId: selectedFeed.id,
                  searchTerm: searchMedia
                }),
            });

            const images = await response.json();
            console.log('images', images)

            const updateImages = images.data.map((entry, index) => {

                  return {
                    id : entry.sys.id,
                    file_name : entry?.fields?.file?.fileName,
                    file_url : entry?.fields?.file.url,
                    width: entry?.fields?.file?.details?.image?.width??null,
                    height: entry?.fields?.file?.details?.image?.height??null,
                    caption: entry?.fields?.description,
                    file_type: entry?.fields?.file?.contentType??null,
                    source:'contentful'
                  }
            })
            setMediaList(updateImages)
        }

    }catch(err){
      showError(err)
    }finally{
      setMediaLoader(false)
    }
}



  const getContentfulData = async (data, contentType) => {
    const response = await fetch('/api/contentful/get-content', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            feedId: data.id,
            contentType: contentType
          }),
      });

      const contentfulData = await response.json();


    return contentfulData.data??[]
}



  async function downloadImagesAsZip() {
    // 1. Initialize JSZip
    const zip = new JSZip();

    // 2. Extract the raw base64 string by removing the "data:image/jpeg;base64," prefix

    // 3. Create a folder inside the ZIP and add the image file

    let folderName = heading??'images'



    const imageFolder = zip.folder(folderName);

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
      //setpdfUrl('https://roundbox-media-task-manager.s3.ap-southeast-2.amazonaws.com/1782275065890-Hilltops-Phoenix-Issue-502-25-June-2026.pdf')
    }else if (file.file_type === 'image/png' || file.file_type === 'image/jpeg'){
      const checkedImages = await checkInstagramImages(files)

      const newImages = checkedImages.map((file)=>{
        return{
          ...file,
          source:'internal'
        }
      })


      setImages(images => [...images, ...newImages])

      const updatingItems = [...images, ...newImages]

      reflowImages(updatingItems)
    }





    setSelectedFiles([])
  }


  useEffect(() => {


    if (!showFiles && selectedFiles.length > 0) {

      addNewFile(selectedFiles)
    }

  }, [showFiles, selectedFiles])



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


    const dragRect = dragAreaRef.current.getBoundingClientRect();
      const canvasEl = dragAreaRef.current.querySelector('canvas'); // adjust selector if needed
      const canvasRect = canvasEl.getBoundingClientRect();
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

  try{

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
      removeWhiteSpace: removeWhiteSpaceRef.current,
      outputScale:window.devicePixelRatio
    }),
  });

  const responseJson = await response.json()



  if (inputTypeRef.current === 'images'){

    const checkedImages = await checkInstagramImages([responseJson.image])
    console.log('setImages', images)

    const updatingItems = [...imagesRef.current, ...checkedImages]
    reflowImages(updatingItems)



    setImages(prev => [...prev, ...checkedImages])


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

      const newCheckedImages = await checkInstagramImages(imagesWithCaptions)

      newImages = [...imagesRef.current, ...newCheckedImages]

      setImages(prev => [...prev, ...newCheckedImages])

    }else{

      newImages = imagesRef.current

    }
    if (selectedFeedRef.current.CMSType === 'wordpress'){
        addWordPressArticle(paragraphs, newImages)
    }else if (selectedFeedRef.current.CMSType === 'contentful'){
        addContentfulArticle(paragraphs, newImages)
    }
  }

  }catch(err){
    showError(err)
  }finally{
      setLoader(false)
  }


}

const addCaptions = (images, captions) => {

  return images.map((image, index)=>{
      return{
        file_description: captions[index],
        ...image
      }
    })
}

function removeDoubleSpaces(string) {
    return string.replace(/ {2,}/g, ' ');
}

function removeMarkdownImages(markdownText) {
  // 1. Matches [![alt](url)](url) or [![alt](url)]
  const imageRegex = /!\[.*?\]\([^)]+\)|!\[.*?\]\[[^\]]+\]/g;
  
  return markdownText.replace(imageRegex, '').trim();
}



const addContentfulArticle = (paragraphs, images) => {


  

  let text = mdValueRef.current

  let previousContent = removeMarkdownImages(text)

  // remove images

  let combinedContent

  if (paragraphs){

      let paragraphText = ''

      paragraphs.forEach((paragraph, index) => {

        const urlRegex = /(https?:\/\/[^\s]+)/gi;
        const updatedUrlText = paragraph.replace(urlRegex, '[$1]($1)');

        const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
        const updatedEmailText = updatedUrlText.replace(emailRegex, '[$1](mailto:$1)');

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

  if (paragraphs && paragraphs.length>0){

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
    console.log('firstImage', firstImage )

    if (images.length>1){
      let lastImages = addLastImages(images)

      console.log('lastImages', lastImages)

      if (lastImages){
        setTinymceContent(firstImage + combinedContent + lastImages)
      }
    }else{
        setTinymceContent(firstImage + combinedContent)
    }
  }
}

const addFirstImage = (images) => {
  var newImageHTML

  if (images[0].file_url){

      if (selectedFeedRef.current.CMSType === 'wordpress'){
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

  console.log('imagesWithoutFirstElement', imagesWithoutFirstElement)

  imagesWithoutFirstElement.forEach((image, index) => {


    if (image.file_url){
        var newImage

        if (selectedFeedRef.current.CMSType === 'wordpress'){

          /*

         let editorContent = getEditorContent()

          const extractedImages = extractImagesFromWordpress(editorContent);

          const findImage = extractedImages.find((extracted)=> extracted.file_url === image.file_url)

          if (!findImage){
            newImage = createImageHTML(image)


          }else{
            newImage = ''
          }
          */
          newImage = createImageHTML(image)



        }else{
          /*
          const extractedImages = extractImagesFromMarkdown(mdValue);

          const findImage = extractedImages.find((extracted)=> extracted.file_url === image.file_url)

          if (!findImage){
            newImage = createImageMd(image)
          }else{
            newImage = ''
          }*/

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
      if (image.file_description){
        imageHTML = '<div class="wp-caption alignnone social-scheduler-image">'+img+'<p id="image-caption-'+image?.id+'" data-id="caption-'+image?.id+'" class="wp-caption-text">'+image.file_description+'</p></div>'
      }else{
        imageHTML = '<div class="wp-caption alignnone social-scheduler-image">'+img+'</div>'
      }


  return imageHTML
}

const createImageMd = (image) => {
  //![resized_cropped_image_1716869120.jpg](//images.ctfassets.net/blbpa6fzvcno/6q6hDPVBptDGfEwYroIcuQ/980e58418218380e48194f5c920028dc/edit_selected_image_area_1718088206_1718088224.jpg)

  let imageHTML = ''

      let img = '!['+image.file_name+']('+image.file_url+')'
      if (image.file_description){
        imageHTML = img+image.file_description+'\n'
      }else{
        imageHTML = img+'\n'
      }


  return imageHTML
}

const createWPImageHTML = (image) => {

  let imageHTML = ''

  let img = '<img id="image-'+image.id+'" data-id="'+image.id+'" width="'+image.width+'" height="'+image.height+'" src="'+image.image.image_path+'" style="width:100%" class="size-full"/>'
      if (image.file_description){
        imageHTML = '[caption id="" align="alignnone" width="748"]'+img+' '+image.file_description+'[/caption]'
      }else{
        imageHTML = img
      }


  return imageHTML
}



const LINE_WRAP_MARK = '\u0001';

function detectArticle(data) {
  const paragraphs = [];
  let heading = "";
  let captions = [];
  let currentParagraph = "";
  let currentCaption = "";
  let previousParagraph = '';
  let suppressNextSpace = false;
  let pendingHyphenGlue = false;
  let currentSection = 'none';

  function stripTrailingSpace(section) {
    if (section === 'body') currentParagraph = currentParagraph.replace(/[ \t]+$/, '');
    else if (section === 'caption') currentCaption = currentCaption.replace(/[ \t]+$/, '');
    else if (section === 'heading') heading = heading.replace(/[ \t]+$/, '');
  }

  data.text_json.blocks.forEach(block => {
    const rawText = block.text;
    if (rawText.length === 0) return;

    if (rawText.trim() === '') {
      if (suppressNextSpace) return;
      if (currentSection === 'body') currentParagraph += ' ';
      else if (currentSection === 'caption') currentCaption += ' ';
      else if (currentSection === 'heading') heading += ' ';
      return;
    }

    if (rawText.trim() === '-') {
      stripTrailingSpace(currentSection);
      pendingHyphenGlue = true;
      return;
    }

    const isBold = block.fontName === 'BKSRGB+MuseoSans-900' ||
      block.fontName === 'KSGAJY+BodoniSvtyTwoITCTT-Bold' ||
      block.fontName === 'KSGAJY+Helvetica-Bold'
    let text = rawText
    let noSpace = false
    let isDropCap = false
    previousParagraph = text

    if (text.endsWith("-")) {
      noSpace = true
      const lastIndex = text.lastIndexOf("-");
      if (lastIndex !== -1) text = text.substring(0, lastIndex) + text.substring(lastIndex + 1);
    }
    if (text.endsWith("/")) {
      noSpace = true
      const lastIndex = text.lastIndexOf("/");
      if (lastIndex !== -1) text = text.substring(0, lastIndex) + text.substring(lastIndex + 1);
    }
    if (text.length === 1 && block.height > 20) { noSpace = true; isDropCap = true; }

    if (block.height < 8) {
      currentSection = 'caption';
      const endsWithPeriod = currentCaption.trim().endsWith('.');
      const endsWithQuotePeriod = currentCaption.trim().endsWith('".');
      const endsWithPeriodQuote = currentCaption.trim().endsWith('."');
      if (endsWithPeriod || endsWithQuotePeriod || endsWithPeriodQuote) {
        captions.push(currentCaption);
        currentCaption = "";
      }
      if (pendingHyphenGlue) {
        currentCaption += noSpace ? text : text + " ";
        pendingHyphenGlue = false;
        suppressNextSpace = isDropCap;
      } else {
        currentCaption += noSpace ? text : text + " ";
        suppressNextSpace = isDropCap;
      }
    } else if (block.height > 11 && text.length > 1) {
      currentSection = 'heading';
      if (pendingHyphenGlue) {
        heading += noSpace ? text : text + " ";
        pendingHyphenGlue = false;
        suppressNextSpace = isDropCap;
      } else {
        heading += noSpace ? text : text + " ";
        suppressNextSpace = isDropCap;
      }
    } else {
      currentSection = 'body';
      if (selectedFeedRef.current?.CMSType === "wordpress") {
        text = isBold ? `<b>${text}</b>` : text;
      } else if (selectedFeed && selectedFeed?.CMSType === "contentful") {
        text = isBold ? `__${text}__` : text;
      }
      const endsWithPeriod = currentParagraph.trim().endsWith('.');
      const endsWithQuotePeriod = currentParagraph.trim().endsWith('".');
      const endsWithPeriodQuote = currentParagraph.trim().endsWith('."');
      const endsWithColon = currentParagraph.trim().endsWith(':');
      const startsWithBullet = text.trim().startsWith('•');
      const endsWithWWW = currentParagraph.trim().endsWith('www.');
      if ((endsWithPeriod || endsWithQuotePeriod || endsWithPeriodQuote || endsWithColon || startsWithBullet) && !endsWithWWW) {
        paragraphs.push(currentParagraph);
        currentParagraph = "";
        suppressNextSpace = false;
        pendingHyphenGlue = false;
      }
      if (previousParagraph === '-') text.trim()

      if (pendingHyphenGlue) {
        currentParagraph += noSpace ? text : text + " "; // <-- KEY FIX: always add trailing space unless noSpace
        pendingHyphenGlue = false;
        suppressNextSpace = isDropCap;
      } else if (noSpace) {
        currentParagraph += text;
        suppressNextSpace = isDropCap;
      } else {
        currentParagraph += text + " ";
        suppressNextSpace = false;
      }
    }
  })

  if (currentParagraph.trim() !== "") paragraphs.push(normalizeSpaces(currentParagraph));
  if (currentCaption.trim() !== "") captions.push(normalizeSpaces(currentCaption));

  const filterCaptions = captions.filter((cap) => cap !== "")
  const filterParagraphs = paragraphs.filter((par) => par !== "")
  return { paragraphs: filterParagraphs, heading: normalizeSpaces(heading), captions: filterCaptions };
}

function normalizeSpaces(text) {
  return text.replace(/[ \t]{2,}/g, ' ').trim();
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



const reflowImages = (images) => {
console.log('reflowImages', images)
    if (selectedFeedRef.current.CMSType === 'wordpress'){
        setTinymceContent('')
        addWordPressArticle(null, images)
    }else if (selectedFeedRef.current.CMSType === 'contentful'){
        handleMDEditorChange('')
        addContentfulArticle(null, images)
    }

}

useEffect(()=>{
  console.log('update images', images)

  imagesRef.current = images

},[images])

const getCategories = async(feed) => {

  if (selectedFeedRef.current.CMSType === 'wordpress'){
      getWPCategories()

    }else if (selectedFeedRef.current.CMSType === 'contentful'){
      const categories = await getContentfulData(feed, 'category')
      setContentfulCategoriesList(categories)

      const authors = await getContentfulData(feed, 'author')
      setContentfulAuthorsList(authors)

      const tags = await getContentfulData(feed, 'tag')
      setContentfulTagsList(tags)

    }

}


useEffect(()=>{
  setCategoriesList([])

  selectedFeedRef.current = selectedFeed

    if (selectedFeedRef.current.CMSType === 'wordpress'){
          let htmlString = getEditorContent()

          if (!htmlString){
            addWordPressArticle(paragraphsState, images)
          }

    }else if (selectedFeedRef.current.CMSType === 'contentful'){

        if (!mdValue){
         console.log('addContentfulArticle selectedFeed')
          addContentfulArticle(paragraphsState, images)
        }
    }

    getCategories(selectedFeed)

},[selectedFeed])

const onFeedChange = async(value) => {
  setMediaList([])
  const feed = feeds.find(item => item.label === value);


  setSelectedFeed(feed);


  if (feed.CMSType === 'wordpress'){




  }

  if (feed.CMSType === 'contentful'){


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
            file_description:imageCaptionRef.current?imageCaptionRef.current:''
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
              file_description:filterImage?.file_description?filterImage?.file_description:''
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
            file_description:filterImage?.file_descriptionn? filterImage.file_description:''
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

useEffect(()=>{
  mdValueRef.current = mdValue
  console.log('mdValueRef.current', mdValueRef.current)
},[mdValue])


const removeArticleImage = (id) => {
  console.log('setImages')

  const updatingItems = images.filter((image)=>image.id !== id)

  reflowImages(updatingItems)


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
          [updatedItems[draggedItemIndex].file_description, updatedItems[targetItemIndex].file_description] =
          [updatedItems[targetItemIndex].file_description, updatedItems[draggedItemIndex].file_description];
      } else if (draggedType === 'container') {
        const [draggedItem] = updatedItems.splice(draggedItemIndex, 1);
        updatedItems.splice(targetItemIndex, 0, draggedItem);
      }
      setImages(updatedItems);
      console.log('reflowImages')
      reflowImages(updatedItems)
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

    if (newImage){



      const updatedItems = [ newImage, ...imagesRef.current]

      reflowImages(updatedItems)

      setImages(prev => [ newImage, ...prev]);

    }

  }
};

const handleDragOver = (e) => {
  e.preventDefault();

};

const getEditorContent = () => {
  if (editorRef.current) {
    return editorRef.current.getContent()
  }

};

const updateCaption = (value, id) => {

  console.log('value', value)
  console.log('id', id)

  console.log('images', images)

  setImages(prev =>
    prev.map(image =>
      image.id === id
        ? { ...image, file_description: value }
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
  console.log(' newItem',  newItem)

  const checkedImages = await checkInstagramImages([newItem])

  const newImages = checkedImages.map((file)=>{
    return{
      ...file,
      source:'internal'
    }
  })


  const updatingItems = images.map((item, i) => i === index ? newImages[0] : item)
  reflowImages(updatingItems)


  setImages(prevItems =>
    prevItems.map((item, i) => i === index ? newImages[0] : item)
  );

}

useEffect(() => {


  if (!displayEditItem && item) {
      console.log('handleEditReplace', item)
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
            file_description:editImageData.current.file_description??null
          })

          console.log('Images', images)

          console.log('editImageData', editImageData)

          console.log('fileInfo', fileInfo)

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

const triggerCatRebuild = () => {
  // Trigger a rebuild by updating the state with a new reference of the same array
  setCategoriesNested([...categoriesNested]);
  setDummyState(prev => prev + 1);

};


useEffect(() => {
  // This useEffect will run every time categoriesNested changes
  if (categoriesList.length === 0){
    triggerCatRebuild()
  }
}, [categoriesList]);



const clear = () => {
  setTinymceContent('')
  if (editorRef.current){
      editorRef.current.setContent('');
  }
  //setCategoriesNested([])
  setHeading('')
  setImages([])
  setCategoriesList([])
  setTinymceContent('')
  handleMDEditorChange('')
  setGuestAuthor('')
  setAuthor(null)
  setSelectedContentfulCategories([])
  setSelectedContentfulTags([])

}

const handleContentfulTagsList = (data) => {
  if (isInArray(data, selectedContentfulTags)){
    const removed = selectedContentfulTags.filter(remove => {
      return remove !== data
    });
    setSelectedContentfulTags(removed);
  }else{
    setSelectedContentfulTags(selectedContentfulTags => [...selectedContentfulTags, data])
  }
}




const handleContentfulCategoriesList = (data) => {

  if (isInArray(data, selectedContentfulCategories)){
    const removed = selectedContentfulCategories.filter(remove => {
      return remove !== data
    });

    setSelectedContentfulCategories(removed);

  }else{
    setSelectedContentfulCategories(selectedContentfulCategories => [...selectedContentfulCategories, data])
  }

}

const copyImageCode = (image) =>{

  let imageHTML
  let codeType


  if (selectedFeedRef.current.CMSType === 'wordpress'){
      imageHTML = createImageHTML(image)
      codeType = "html"
  }

  if (selectedFeedRef.current.CMSType === 'contentful'){
      imageHTML = createImageMd(image)
      codeType = "markdown"
  }

  navigator.clipboard.writeText(imageHTML).then(function() {
    // Success feedback (optional)
    showSuccess(`Copied image ${codeType}`)

  }).catch(function(err) {
    // Error handling (optional)
    console.error('Could not copy code: ', err);
  });

}



const createPost = async() => {


  if (selectedFeedRef.current.CMSType === 'contentful'){

      if (selectedContentfulCategories.length===0){
        showError('No Categories Selected')
        return
      }

      try{

      setUploadLoader(true)

      const publishDate = new Date();
      publishDate.setDate(publishDate.getDate() + 1);

      //get image urls from markdown article to upload
      const extractedImages = extractImagesFromMarkdown(mdValue);
      var uploadedArticleImages = []
      var uploadMarkdownData = mdValue


      //get feature image from images

      const featureImage = images[0]


      //get declare feature image id variable
      var featureImageId

      //create array of image objects by matching url

      const imagesFromArticle = images.filter((image)=>{
        const findImage = extractedImages.find((extracted)=> extracted.file_url === image.file_url)
        if (findImage){
          return {
            ...image
          }
        }
      })

      //upload images from article loop

      for (const image of imagesFromArticle) {
        // image is not from contentful CMS so create new contentful image
        if (image.source !== 'contentful') {
          const response = await fetch('/api/contentful/publish-asset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  feedId: selectedFeed.id,
                  images: [image]
                }),
            });

            const uploadedImages = await response.json();

            const uploadedImage = uploadedImages.data[0]
            const uploadedImageUrl = uploadedImage?.fields?.file?.['en-AU']?.url
            const contentfulId = uploadedImage?.sys?.id

            uploadedArticleImages.push({
              originalUrl:image.file_url,
              uploadedUrl:uploadedImageUrl,
              contentfulId:contentfulId
            })

            //update upload markdown with new contentful urls
            uploadMarkdownData = replaceBase64ImageInMarkdown(uploadMarkdownData, image.file_url, uploadedImageUrl)
        }
      }

      //check if feature image has been uploaded already (if it happens to be in article)
      const checkFeatureImage = uploadedArticleImages.find((uploadedImage)=>uploadedImage.originalUrl === featureImage.file_url)

      if (checkFeatureImage){
        // store contentful Id for feature image because it has alreday been uploaded
        featureImageId = checkFeatureImage.contentfulId
      }else if (featureImage.source==='contentful'){
        // store contentful Id for feature image because image is already from contentful
        featureImageId = featureImage.id

      }else{
        // upload feature image
        const response = await fetch('/api/contentful/publish-asset', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                feedId: selectedFeed.id,
                images: [featureImage]
              }),
          });

          const uploadedFeatureImage = await response.json();
          // store contentful Id for feature image from newly uploaded image
          featureImageId = uploadedFeatureImage.data[0]?.sys?.id
      }

      // create post
      const response = await fetch('/api/contentful/create-content', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              feedId: selectedFeed.id,
              heading: heading??null,
              authorId: author??null,
              publishDate: moment(publishDate).format('YYYY-MM-DD'),
              scheduleDate: moment(date).format('YYYY-MM-DDTHH:mm'),
              imageField:selectedFeedRef.current.image,
              imageId:featureImageId,
              text:uploadMarkdownData,
              textField:selectedFeedRef.current.text,
              categories:selectedContentfulCategories.length>0?selectedContentfulCategories:[],
              tags:selectedContentfulTags.length>0?selectedContentfulTags:[],
            }),
        });

        if (!response.ok){
          throw error
        }

        const data = await response.json();

        setUploadedPosts(uploadedPosts => [...uploadedPosts, {...data.data, website:selectedFeed.website}])
        setUsedDates(usedDates => [...usedDates, moment(date).format('YYYY-MM-DD HH:mm:ss')])
        showSuccess('Post Created')

      }catch(err){
        showError(`Error Creating Post: ${err}`)
      }finally{
        setUploadLoader(false)
      }

  } else if (selectedFeedRef.current.CMSType === 'wordpress'){



    try{
      setUploadLoader(true)

      const publishDate = new Date();
      publishDate.setDate(publishDate.getDate() + 1);


      //get image urls from wordpress article to upload
      let htmlString = getEditorContent()
      const extractedImages = extractImagesFromWordpress(htmlString);
      var uploadedArticleImages = []
      var uploadWorkpressArticleData = htmlString

      //get feature image from images
      const featureImage = images[0]

      //get declare feature image id variable
      var featureImageId

      //create array of image objects by matching url

      const imagesFromArticle = images.filter((image)=>{
        const findImage = extractedImages.find((extracted)=> extracted.file_url === image.file_url)
        if (findImage){
          return {
            ...image
          }
        }
      })

      //upload images from article loop

      for (const image of imagesFromArticle) {
        // image is not from contentful CMS so create new contentful image
        if (image.source !== 'wordpress') {
          const response = await fetch('/api/wordpress/publish-asset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  feedId: selectedFeed.id,
                  images: [image]
                }),
            });

            const uploadedImages = await response.json();

            const uploadedImage = uploadedImages.data[0]
            const uploadedImageUrl = uploadedImage?.source_url
            const wordpressId = uploadedImage?.id

            uploadedArticleImages.push({
              originalUrl:image.file_url,
              uploadedUrl:uploadedImageUrl,
               wordpressId:wordpressId
            })

            //update upload wordpress copy with new contentful urls
            uploadWorkpressArticleData = replaceBase64ImageInWordpress(uploadWorkpressArticleData, image.file_url, uploadedImageUrl)
        }
      }

      //check if feature image has been uploaded already (if it happens to be in article)
      const checkFeatureImage = uploadedArticleImages.find((uploadedImage)=>uploadedImage.originalUrl === featureImage.file_url)

      if (checkFeatureImage){
        // store  media Id for feature image because it has already been uploaded
        featureImageId = checkFeatureImage.wordpressId
      }else if (featureImage.source==='wordpress'){
        // store media Id for feature image because image is already from contentful
        featureImageId = featureImage.id

      }else{
        // upload feature image
        const response = await fetch('/api/wordpress/publish-asset', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                feedId: selectedFeed.id,
                images: [featureImage]
              }),
          });

          const uploadedFeatureImage = await response.json();
          // store contentful Id for feature image from newly uploaded image
          featureImageId = uploadedFeatureImage.data[0]?.id
      }

      // create post

      const response = await fetch('/api/wordpress/create-content', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              feedId: selectedFeed.id,
              title: heading??null,
              content: uploadWorkpressArticleData??null,
              categories:categoriesList??[],
              featured_media: featureImageId??null,
              acf: {
                guest_author: guestAuthor? true:false,
                guest_author_name: guestAuthor?guestAuthor:null,
                schedule_date: moment(date).format('YYYY-MM-DDTHH:mm')
              },

            }),
        });


          if (!response.ok){
            throw error
          }

          const data = await response.json();

          setUploadedPosts(uploadedPosts => [...uploadedPosts, {...data.data, website:selectedFeed.website}])
          setUsedDates(usedDates => [...usedDates, moment(date).format('YYYY-MM-DD HH:mm:ss')])
          showSuccess('Post Created')




    }catch(err){
      console.log(err)
      showError(`Error Creating Post: ${err}`)
    }finally{
      setUploadLoader(false)
    }

  }

}

const uploadImages = async () => {
  if (selectedFeedRef.current.CMSType === 'contentful'){

    try{
      setImageLoader(true)
      const response = await fetch('/api/contentful/publish-asset', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              feedId: selectedFeed.id,
              images: images
            }),
        });

        if (!response.ok) {
          throw new Error(`Upload failed with status: ${response.status}`);
        }

        const uploadedImages = await response.json();

        showSuccess('images uploaded')


    }catch(err){
      showError('Error uploading images')
    }finally{
      setImageLoader(false)
    }


  }else if (selectedFeedRef.current.CMSType === 'wordpress'){

    try{
      setImageLoader(true)
      const response = await fetch('/api/wordpress/publish-asset', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              feedId: selectedFeed.id,
              images: images
            }),
        });

        if (!response.ok) {
          throw new Error(`Upload failed with status: ${response.status}`);
        }

        const uploadedImages = await response.json();

        showSuccess('images uploaded')


    }catch(err){
      showError('Error uploading images')
    }finally{
      setImageLoader(false)
    }

  }
}

const changeScheduleDate = (date) => {
  setDate(date)

  const dateUsed = isInArray(moment(date).format('YYYY-MM-DD HH:mm:ss'), usedDates)

  if (dateUsed){
    showError('Post date used')
  }
}





  return (
    <>
    <div style={{height:'95%'}} className='pdf-text-extractor-datepicker'>
      <div className='properties-container'>
        <label className='label'>Publication</label>
        <select id="rss-select" className="form-input select" onChange={(e) => onFeedChange(e.target.value)} value={selectedFeed.label}>
          {feeds.map((feed, index)=>{
            return <option key={index} value={feed.label}>{feed.label}</option>
          })
          }
        </select>
        {selectedFeed &&
          <button style={{margin: '0px'}} className="btn secondary btn-sm" onClick={() => {
            setFileLimit(1)
            setSelectedFiles([])
            setFilePicker(true)
            setShowFiles(prevState => !prevState)
          }}>Add File</button>
        }

      </div>
      {pdfUrl &&
        <>
          <div>
            <button style={{marginLeft:'10px'}} className={`btn ${inputType === 'articles'? 'primary' : ''}  btn-sm`} onClick={() => setInputType('articles')}>Extract Articles</button>
            <button style={{marginLeft:'10px'}} className={`btn ${inputType === 'images'? 'primary' : ''}  btn-sm`} onClick={() => setInputType('images')}>Extract Images</button>
            <button style={{marginLeft:'10px'}} className={`btn primary btn-sm`} onClick={clear}>Clear</button>
        </div>
          {inputType === 'images'&&
        <div className="form-check properties-container"
          style={{
            marginLeft: '15px',
            marginBottom:'10px',
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
        <div className='scroll-wrap'>
            <div style={{display:'flex'}} className='scroll-inner'>
              <div style={{flex:1, maxWidth:'600px', minWidth:'600px', position:'relative', height:'calc(100% - 71px)'}}>
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
              <div style={{flex:.5, padding:'10px', minWidth:'250px', maxWidth:'250px', height:'calc(100% - 71px)', overflowY: 'scroll', position:'relative'}}>
                <div style={uploadLoader? {display:'block'}:{display:'none'}} className={'loader_screen'}>
                </div>
                <div style={imageLoader? {display:'block'}:{display:'none'}} className={'loader_screen'}>
                  <div style={{transform:'translate(-50%, -50%)'}}  className="loader"></div>
                </div>
                <Dropdown placeholder="Add Images">
                  <button className="btn btn-sm clear" onClick={() => {
                    setFileLimit(0)
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
                {images.length !== 0 &&
                  <div>
                    <button style={{marginTop:'0px'}} className="btn secondary btn-sm" onClick={downloadImagesAsZip}>
                      Download Images
                    </button>
                    <button style={{marginTop:'0px'}} className="btn secondary outline btn-sm" onClick={uploadImages}>
                      Upload Images
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
                            copyImageCode={copyImageCode}
                            margin={margin}
                            />
                          )
                      })}
                    </>
                  }
                </div>
              </div>
              <div style={{flex:.7, padding:'10px', minWidth:'700px', height:'calc(100% - 71px)', overflowY: 'scroll', position:'relative'}}>
                <div style={uploadLoader? {display:'block'}:{display:'none'}} className={'loader_screen'}>
                    <div style={{transform:'translate(-50%, -50%)'}}  className="loader"></div>
                </div>
                <button style={{margin:'15px 15px 0px 0px'}} className="btn primary btn-outline" onClick={() => createPost()} disabled={(pdfUrl || loader)?false:true}><strong>Upload Post</strong></button>
                    {selectedFeed.CMSType === 'wordpress' &&
                      <div>
                        <input style={{
                          width:"100%",
                          margin:'15px 0px',
                        }}
                          id='guest-author'
                          type="text"
                          className="form-input"
                          value={guestAuthor}
                          onChange={(e) => setGuestAuthor(e.target.value)}
                          placeholder="Guest Author..."
                        />
                      </div>
                    }
                  <p style={{marginBottom:'0px'}} className="label" >Schedule Date</p>
                    <DatePicker
                      minDate={moment().toDate()}
                      minTime={minTime}
                      maxTime={moment().endOf('day').toDate()}
                      selected={date}
                      onChange={(date) => changeScheduleDate(date)}
                      showTimeSelect
                      dateFormat="MMMM d, yyyy h:mm aa"
                      className={'form-input pdf-text-extractor-datepicker'}
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
                      copyImageCode={copyImageCode}
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
                    <div style={{position:'relative'}}>
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
                              'anchor',
                              'code',
                            ],
                            browser_spellcheck: true,
                            contextmenu: false,
                            setup: (editor) => {
                              editor.on('GetContent', (e) => {
                                // Modify the text content output via regex or DOM parser right before it returns to React
                                /*
                                e.content = e.content.replace(/<img[^>]*>/g, (match) => {
                                  return `<div class="image-wrapper">${match}</div>`;
                                });*/
                              });
                            },

                            formats: {
                               alignleft: {selector: 'img', styles: {'float': 'left', 'margin': '0 10px 0 10px'}},
                               alignright: {selector: 'img', styles: {'float': 'right', 'margin': '0 0 10px 10px'}},
                               aligncenter: {selector: 'img', classes: 'aligncenter'},
                             },
                             toolbar: 'undo redo | blocks | bold italic | alignleft aligncenter alignright alignjustify | link image | code', // 2. CRITICAL: Add the code button to the toolbar
                             toolbar_mode: 'floating',


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
                    </div>
                  }
              </div>

                <div style={{flex:.5, padding:'10px', minWidth:'300px', height:'calc(100% - 71px)', overflowY: 'scroll', position:'relative'}}>
                  <div style={uploadLoader? {display:'block'}:{display:'none'}} className={'loader_screen'}>
                  </div>
                  {(selectedFeed.CMSType === 'wordpress' && categoriesNested.length > 0) &&
                    <div className='properties-container'>
                      {
                        categoriesNested.map((category, index) => {
                          return (
                            <div key={index} style={{marginLeft:'20px', marginTop:'5px', marginBottom:'5px'}}>
                              <CheckBox key={index} category={category} checkFunction={checkFunction} state={dummyState} style={{fontWeight:'bold'}}/>
                              {category.children.length > 0 &&
                                <>
                                 {category.children.map((catChild, i) => {
                                   return (
                                     <div key={i} style={{paddingLeft:'20px', margin:'5px 0px'}}>
                                        <CheckBox key={i} category={catChild} checkFunction={checkFunction} state={dummyState} style={{fontSize:'.9em'}}/>
                                     </div>
                                   )
                                 })
                                 }
                                </>
                              }
                            </div>
                          )

                        })
                      }
                    </div>
                  }
                  {selectedFeed.CMSType === 'contentful'&&
                      <div style={{position:'relative'}} className="properties-container">
                          <div style={{display:'flex', alignItems:'center', gap:'5px'}}>
                            <button className={`${'btn btn-sm'} ${contentfulFilter === 'authors'? 'primary' : ''}`} onClick={() => setContentfulFilter('authors')}>Authors</button>
                            <button className={`${'btn btn-sm'} ${contentfulFilter === 'categories'? 'primary' : ''}`} onClick={() => setContentfulFilter('categories')}>Categories</button>
                            <button className={`${'btn btn-sm'} ${contentfulFilter === 'tags'? 'primary' : ''}`} onClick={() => setContentfulFilter('tags')}>Tags</button>
                          </div>
                          <div>
                            <input style={{
                              width:"100%",
                              margin:'15px 0px',
                            }}
                              id='search-term'
                              type="text"
                              className="form-input"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              placeholder="Filter..."
                            />
                          </div>
                          <div>
                          <button style={{marginBottom:'15px'}} className={`${'btn btn-sm'} ${'secondary'}`} onClick={() => clearSelection(contentfulFilter)}>Clear Selection</button>
                          </div>
                              {contentfulFilter === 'authors'&&
                                <>
                                  {contentfulAuthorsList.length>0&&
                                    <div style={{borderColor: '#EBEBEC', flexGrow: 2, height:'700px', overflowY:'scroll'}} className="">
                                    {
                                      contentfulAuthorsList.filter((node) => {
                                          if (searchTerm){
                                            return node.fields.title.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1;
                                          }else{
                                            return node;
                                          }

                                      }).map((ele, index) => {
                                        return(
                                          <div key={index} onClick={() => setAuthor(ele.sys.id)} className={`${'select-tab'} ${author === ele.sys.id?'active': ''}`}>
                                          {ele.fields.title}
                                          </div>
                                        )
                                      })
                                    }
                                    </div>
                                  }
                                </>
                              }
                              {contentfulFilter === 'categories'&&
                                <>
                                  {contentfulCategoriesList.length>0&&
                                    <div style={{flexGrow: 2, height:'700px', overflowY:'scroll'}}>

                                    {selectedContentfulCategories.length>0&&
                                      <div style={{marginBottom:'15px'}}>
                                        {contentfulCategoriesList.map((ele, index) => {
                                          if (isInArray(ele.sys.id, selectedContentfulCategories)){
                                            return(
                                              <span
                                                key={index} className="btn btn-sm pill">
                                              {ele.fields.title}
                                              </span>
                                            )
                                          }else{
                                            return null
                                          }

                                        })
                                        }
                                      </div>
                                    }

                                    {
                                      contentfulCategoriesList.filter((node) => {
                                          if (searchTerm){
                                            return node.fields.title.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1;
                                          }else{
                                            return node;
                                          }

                                      }).map((ele, index) => {
                                        return(
                                          <div key={index} onClick={() => handleContentfulCategoriesList(ele.sys.id)} className={`${'select-tab'} ${isInArray(ele.sys.id, selectedContentfulCategories)?'active': ''}`}>
                                          {ele.fields.title}
                                          </div>
                                        )
                                      })
                                    }
                                    </div>
                                  }
                                </>
                              }
                              {contentfulFilter === 'tags'&&
                                <>
                                  {contentfulTagsList.length>0&&
                                    <div style={{flexGrow: 2, height:'700px', overflowY:'scroll'}} >

                                      {selectedContentfulTags.length>0&&
                                        <div style={{marginBottom:'15px'}}>
                                          {contentfulTagsList.map((ele, index) => {
                                            if (isInArray(ele.sys.id, selectedContentfulTags)){
                                              return(
                                                <span
                                                  key={index} className="btn btn-sm pill">
                                                {ele.fields.title}
                                                </span>
                                              )
                                            }else{
                                              return null
                                            }

                                          })
                                          }
                                        </div>
                                      }


                                    {
                                      contentfulTagsList.filter((node) => {
                                          if (searchTerm){
                                            return node.fields.title.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1;
                                          }else{
                                            return node;
                                          }

                                      }).map((ele, index) => {
                                        return(
                                          <div key={index} onClick={() => handleContentfulTagsList(ele.sys.id)} className={`${'select-tab'} ${isInArray(ele.sys.id, selectedContentfulTags)?'active': ''}`}>
                                          {ele.fields.title}
                                          </div>
                                        )
                                      })
                                    }
                                    </div>
                                  }
                                </>
                              }
                      </div>
                  }
                </div>
              {uploadedPosts.length>0 &&
              <div style={{flex:.2, padding:'10px', minWidth:'285px', height:'calc(100% - 70px)', overflowY:'scroll'}}>
                <h3 style={{textAlign:'center'}}><strong>Uploaded Posts</strong></h3>
                {uploadedPosts.map((entry, index) => {
                      if (entry === null) return null
                      if (entry.acf){
                        return(
                          <div key={index} className={'alert'} style={{maxWidth:'250px', border: '0px'}}>
                            <p style={{fontSize:'.8em'}}>{entry.website}</p>
                            <p><strong>{entry.title.raw?entry.title.raw:''}</strong></p>
                            <p style={{fontSize:'.8em'}}>{entry.acf.schedule_date?moment(entry.acf.schedule_date).format('MMMM Do YYYY, h:mm a'):''}</p>
                          </div>
                        )
                      }else{
                          return (
                            <div key={index} className={'alert'} style={{maxWidth:'250px', border: '0px'}}>
                              <p style={{fontSize:'.8em'}}>{entry.website}</p>
                              <p><strong>{entry.fields.title['en-AU']?entry.fields.title['en-AU']:''}</strong></p>
                              <p style={{fontSize:'.8em'}}>{entry.fields.scheduleDate['en-AU']?moment(entry.fields.scheduleDate['en-AU']).format('MMMM Do YYYY, h:mm a'):''}</p>
                            </div>
                          )
                      }
                    })
                  }
              </div>
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
        mediaLoader={mediaLoader}
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
  margin,
  copyImageCode
}) => {

  const [caption, setCaption] = useState(image.file_description??'')

  useEffect(()=>{

    setCaption(image.file_description ?? '')

  },[image.file_description])



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
        <img onClick={() => editInPhotoshop(image)} src='/Adobe_Photoshop_CC_icon.png' style={{width:'25px', marginRight:'10px'}}/>
        <Crop size={25} onClick={() => editMedia(image, index, 'crop')}/>
        {/*}<SquarePen style={{marginLeft:'10px'}} size={30} onClick={() => editMedia(image, index, 'caption')}/>*/}
        <Download style={{marginLeft:'10px'}} size={25} onClick={() => downloadImage(image)}/>
        <Copy style={{marginLeft:'10px'}} size={25} onClick={() => copyImageCode(image)}/>
        <Trash2 style={{marginLeft:'10px'}} size={25} onClick={() => removeCallback(image.id)}/>

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
  handleDragStart,
  mediaLoader

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
        <div style={mediaLoader? {display:'block'}:{display:'none'}} className={'loader_screen'}>
            <div style={{transform:'translate(-50%, -50%)'}}  className="loader"></div>
        </div>
      <X style={{display:'block', marginLeft:'auto'}} onClick={() => setShowMedia(false)}/>
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
        <button style={{marginTop:'0px'}} className="btn primary" type="submit" disabled={searchMedia.length>0?false:true}>Search</button>
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

const CheckBox = ({checkFunction, category, state, style}) => {
    const [checkbox, setCheckbox] = useState(false);
    const checkBoxFunction = (data, name, number) => {
        checkFunction(number, !checkbox)
        setCheckbox(!checkbox)
    }

    useEffect(() => {
      setCheckbox(false)
    },[state])

  return(
    <div className="form-check" style={{display:'flex', alignItems:'center', gap:'5px'}}>
       <input
        className="form-check-input"
         name="check"
         type="checkbox"
         checked={checkbox}
         onChange={(e) => checkBoxFunction(e.target, category.name, category.id)}
         />
         <label style={style} className="form-check-label"> {category.name}</label>
    </div>

  )
}
