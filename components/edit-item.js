'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useEditItemContext } from "@/context/edit-item-context"
import { useUserContext } from "@/context/user-context"
import Cropper from 'react-easy-crop'
import Slider from '@mui/material/Slider';
import {
Palette,
Square,
RectangleVertical,
RectangleHorizontal,
} from 'lucide-react';
import { showSuccess } from '@/lib/toast';
import { showError } from '@/lib/toast';
import { showInfo } from '@/lib/toast';
import { updateFileDescriptionValue } from "@/lib/supabase";
import ColorPicker from 'react-pick-color';
import { storeFileInfo } from "@/lib/supabase";
import { Cropper as ReactCropper } from "react-cropper";
import "cropperjs/dist/cropper.css";

export default function EditFile() {
  const { user } = useUserContext();
  const { displayEditItem, setDisplayEditItem, item, setItem, activeTool, setActiveTool} = useEditItemContext();
  const [newFile, setNewFile] = useState(null);

  const applyChanges = () => {
    setItem(newFile)
    setDisplayEditItem(false)
    setNewFile(null)
  }

return(
  <>
    {displayEditItem&&
      <div className='overlay' onClick={(e) => {
        setDisplayEditItem(false)
        setNewFile(null)
        setItem(null)
      }}>
        <div className='center-absolute' style={{width:'100%', maxWidth:'1200px', height:'800px'}}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{margin:0, height:'100%'}}>
            <div style={{display:'flex', height:'100%'}}>
              <div style={{flex:1, zIndex: 1}}>
                <h4>MENU</h4>
                {newFile&&
                  <button className='btn primary btn-outline' onClick={applyChanges}>Apply Changes</button>
                }
                <p style={{cursor:'pointer'}} className={`edit_image_menu_item ${activeTool === "crop"? 'active':''}`} onClick={() => setActiveTool('crop')}>Quick Crop </p>
                <p style={{cursor:'pointer'}} className={`edit_image_menu_item ${activeTool === "caption"? 'active':''}`}onClick={() => setActiveTool('caption')}> Caption </p>
                <p style={{cursor:'pointer'}} className={`edit_image_menu_item ${activeTool === "out paint"? 'active':''}`}onClick={() => setActiveTool('out paint')}> Out Paint </p>
                <p style={{cursor:'pointer'}} className={`edit_image_menu_item ${activeTool === "cropper"? 'active':''}`}onClick={() => setActiveTool('cropper')}> Cropper </p>

              </div>
              <div style={{flex:4, position:'relative'}}>
                {activeTool === 'crop' &&
                <CropComponent
                user={user}
                image={item}
                newFile={newFile}
                setNewFile={setNewFile}
                />
                }
                {activeTool === 'caption' &&

                <CaptionComponent
                user={user}
                image={item}
                newFile={newFile}
                setNewFile={setNewFile}
                />

                }
                {activeTool === 'out paint' &&

                  <OutPaint
                  user={user}
                  image={item}
                  onCropChange={(data) => console.log(data)}
                  newFile={newFile}
                  setNewFile={setNewFile}
                 />

                }

                {activeTool === 'cropper' &&

                  <NewCropper
                    user={user}
                    image={item}
                    onCropChange={(data) => console.log(data)}
                    newFile={newFile}
                    setNewFile={setNewFile}
                 />

                }
              </div>
            </div>
          </div>
        </div>
      </div>
    }
  </>
)
}




const CropComponent = ({
  user,
  image,
  setNewFile,
  newFile
}) => {

  const [fileUrl, setFileUrl] = useState(image.file_url);
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [cropAreaSize, setCropAreaSize] = useState({ width: 0, height: 0 });
  const [color, setColor] = useState('#fff');
  const [ratio, setRatio] = useState(1/1)

  const [showColourPicker, setShowColourPicker] = useState(false)
  const cropperRef = useRef(null);
  const canvasRef = useRef(null);
  const [loader, setLoader] = useState(false)

  const colorPickerRef = useRef(null);


  const getCroppedImg = async (imageSrc, croppedAreaPixels, canvas) => {
    const ctx = canvas.getContext('2d');

    const proxiedUrl = `/api/image-proxy?url=${encodeURIComponent(imageSrc)}`;

    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = proxiedUrl;
    });

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      img,
      croppedAreaPixels.x, croppedAreaPixels.y,
      croppedAreaPixels.width, croppedAreaPixels.height,
      0, 0,
      canvas.width, canvas.height
    );

    return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.95));
  };

   const createCroppedImage = async () => {

     try {
       const croppedImage = await getCroppedImg(
         image.image_url, // Your image source
         croppedAreaPixels,
         canvasRef.current
       );
       setCroppedImage(croppedImage)// This is the fina
       return croppedImage
     } catch (e) {
       console.log(e)
     }
   }



   const cropImage = async () => {
     setLoader(true)

       const file = await getCroppedImg(
         image.file_url, // Your image source
         croppedAreaPixels,
         canvasRef.current
       );

       const formData = new FormData()
         formData.append('file', file)
         formData.append('tag', '.jpg');

       try{
         const res = await fetch('/api/upload', {
           method: 'POST',
           body: formData,
         })

         const result = await res.json()

         if (res.ok) {

           const fileData={
             ...image,
             file_url:result.url
           }

           const fileinfo = await storeFileInfo({
             user_id:user.id,
             file_url: fileData.file_url,
             file_type:fileData.file_type,
             file_name:fileData.file_name,
             file_description:fileData.file_description??null
           })

           setNewFile({
             created_at: fileinfo.created_at,
             file_type: fileData.file_type,
             file_url: fileData.file_url,
             file_name:fileData.file_name,
             file_description:fileData.file_description??null,
             id: fileinfo.id,
             user_id: user.id
           })

           //setFileUrl(fileData.file_url)

         } else {
           showError(result.error)
         }
       }catch(error){
         console.log('file upload error', error)
       }

      setLoader(false)
   }




   const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
     setCroppedAreaPixels(croppedAreaPixels)

     const cropperElement = document.querySelector('[data-testid="cropper"]');

     if (cropperElement) {
       // Get the dimensions using getBoundingClientRect
       const { width, height } = cropperElement.getBoundingClientRect();
       setCropAreaSize({
         width: width,
         height: height,
       });
     }

   }, [])


   useEffect(() => {
     // Wait for the component to mount and for the element to be available in the DOM
     const cropperElement = document.querySelector('[data-testid="cropper"]');

     if (cropperElement) {
       // Get the dimensions using getBoundingClientRect
       const { width, height } = cropperElement.getBoundingClientRect();
       setCropAreaSize({
         width: width,
         height: height,
       });
     }
   }, []);

   useEffect(() => {
     const handleClickOutside = (event) => {
       if (colorPickerRef.current && !colorPickerRef.current.contains(event.target)) {
         setShowColourPicker(false);
       }
     };

     document.addEventListener("mousedown", handleClickOutside);
     return () => document.removeEventListener("mousedown", handleClickOutside);
   }, []);


  return(
    <div>
      <div style={loader? {display:'block'}:{display:'none'}} className={'loader_screen'}>
          <div style={{transform:'translate(-50%, -50%)'}}  className="loader"></div>
      </div>
      <div style={{
        height: '600px',
        width: '100%',
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)'
      }}>
        <div className="crop-container">
          <div className="reactEasyCrop_CropArea" ref={cropperRef} style={{
            width: `${cropAreaSize.width}px`,
            height: `${cropAreaSize.height}px`,
            backgroundColor: color,
          }}>
         </div>
          <Cropper
            image={fileUrl}
            crop={crop}
            zoom={zoom}
            rotation={rotation} // Pass rotation state
            aspect={ratio}
            restrictPosition={false}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            crossorigin={null}
            classes={'social-crop'}
          />
        </div>
      </div>
      <div className="controls" style={{bottom: '10px', width: '700px'}}>
        <div style={{alignItems: 'center', display:'flex', marginLeft:'10px', gap:'10px'}}>
          {showColourPicker&&
             <div
               ref={colorPickerRef}
               className='dropshadow'
               style={{
                 position: 'absolute',
                 bottom: '50px',
                 background:'#ffffff',
                 borderRadius:'var(--input-border-radius)',
                 padding:'10px',
                 left: 'calc(100% - 250px)'
               }}>
               <ColorPicker
               color={color}
               onChange={color => setColor(color.hex)}
               theme={{
                  boxShadow: 'none',
                  border: '0px solid transparent',
                  borderColor: 'white',
                }}
              />
               <EyeDropperButton setColor={setColor}/>
             </div>
           }
          <div style={{display:'flex', width:'200px', alignItems: 'center', gap:'5px'}}>
            <p className='label'> Scale</p>
            <Slider
            value={zoom}
            min={0}
            max={4}
            step={0.005}
            defaultValue={1}
            aria-label="Default"
            valueLabelDisplay="auto"
            onChange={(e, zoom) => setZoom(zoom)}
            />
          </div>
          <div style={{display:'flex', width:'200px', alignItems: 'center', gap:'15px'}}>
            <p className='label'> Rotate</p>
            <Slider
            value={rotation}
            min={0}
            max={360}
            step={1}
            defaultValue={1}
            aria-label="Default"
            valueLabelDisplay="auto"
            onChange={(e, zoom) => setRotation(zoom)}
            />
          </div>
          <Square onClick={()=> setRatio(1/1)} size={35} className={`cropped-image ${ratio===1/1?'active':''}`} alt="crop ratio 1/1" />
          <RectangleVertical onClick={()=> setRatio(4/5)} size={35}  className={`cropped-image ${ratio===4/5?'active':''}`} alt="crop ratio 4/5" />
          <RectangleHorizontal onClick={()=> setRatio(1.91/1)} size={35}  className={`cropped-image ${ratio===1.91/1?'active':''}`}  alt="crop ratio 1.91/1" />
          <Palette onClick={()=> setShowColourPicker(prevState => !prevState)} size={35} className={`cropped-image ${showColourPicker?'active':''}`} alt="show colour picker" />
         <button
         style={{height:'40px', marginLeft:'10px'}}
            onClick={cropImage}
            className="btn primary"
          >
            Crop
          </button>
        </div>
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
</div>
  )

}

const EyeDropperButton = ({setColor}) => {
  const handlePickColor = async () => {
    if (!window.EyeDropper) {
      alert("Your browser doesn't support the EyeDropper API.");
      return;
    }

    const eyeDropper = new window.EyeDropper();
    try {
      const result = await eyeDropper.open();

      setColor(result.sRGBHex)
    } catch (e) {
    }
  };

  return <button className='btn primary btn-sm' onClick={handlePickColor}>Pick Color</button>;
};

const CaptionComponent = ({
  user,
  image,
  newFile,
  setNewFile
}) => {
  const [fileDescription, setFileDescription] = useState(image?.file_description??'')

  const save = async() => {

  await updateFileDescriptionValue(fileDescription, image.id)

    const file = {...image, file_description: fileDescription}


    setNewFile(file)
    showSuccess('Image Caption Updated')
  }


  return(
    <div>
        <div style={{marginTop:'25px'}}>
          <img style={{maxWidth:'400px'}} src={image.file_url} />
          <p className='font-label'>Caption</p>
          <textarea
              rows="4"
              name="imageDescription"
              className="form-input input"
              value={fileDescription}
              onChange={(e) => setFileDescription(e.target.value)}
          />
          <button disabled={!fileDescription} className="btn primary" onClick={save}>Save</button>
        </div>

    </div>
  )
}

const OutPaint = ({
  user,
  image,
  setItem,
  setDisplayEditItem,
  newFile,
  setNewFile
}) => {

  const [fileUrl, setFileUrl] = useState(image.file_url);
  const [prompt, setPrompt] = useState('');
  const [seed, setSeed] = useState(0);
  const containerRef = useRef(null);
  const boxRef = useRef(null);
  const [scale, setScale] = useState(.5);
  const imageRef = useRef(null);
  const [actualImageDimension, setActualImageDimension] = useState(null);
  const [displayedImageDimension, setDisplayedImageDimension] = useState(null);
  const [ratio, setRatio] = useState(null);
  const [scaleUp, setScaleUp] = useState({
    scaleX:0,
    scaleY:0
  });
  const [constrainRatio, setConstrainRatio] = useState(null)


  const [box, setBox] = useState({
    left:0,
    top:0,
    right:0,
    bottom:0,
    width: 400,
    height: 400,
    boxLeft:0,
    boxTop:0,
    boxRight:0,
    boxBottom:0,
    x : 0,
    y: 0
  });
  const imgRectRef = useRef(null);
  const imgContainerRef = useRef(null);

  const applyConstraint = (width, height, ratio) => {
    if (!ratio) return { width, height };
    // Grow whichever dimension satisfies the ratio without shrinking the other
    const fromWidth = { width, height: width / ratio };
    const fromHeight = { width: height * ratio, height };
    // Pick the larger canvas so the image always fits
    return fromWidth.height >= height ? fromWidth : fromHeight;
  };



  const getImageSize = () => {
    const img = imageRef.current;
    const container = containerRef.current

    const imageRect = imageRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    const x = imageRect.left - containerRect.left;
    const y = imageRect.top - containerRect.top;

    // Actual image dimensions

    setActualImageDimension({
      width:img.naturalWidth,
      height:img.naturalHeight
    })

    // Displayed dimensions
    console.log('Offset Width:', img.offsetWidth);
    console.log('Offset Height:', img.offsetHeight);

    // More precise displayed dimensions

    setDisplayedImageDimension({
      width:imageRect.width,
      height:imageRect.height
    })


    imgRectRef.current = imageRef.current.getBoundingClientRect();
    imgContainerRef.current = containerRef.current.getBoundingClientRect();



    const scaleX = img.naturalWidth / imageRect.width
    const scaleY = img.naturalHeight /  imageRect.height


    setRatio({
      scaleX:scaleX,
      scaleY:scaleY
    })

    setBox({
      x:x,
      y:y,
      width: imageRect.width,
      height: imageRect.height,
    })


  };


  // -----------------------------
  // RESIZE HANDLER (bottom-right)
  // -----------------------------
  useEffect(() => {
    const handle = document.getElementById("resize-handle-bottom-right");
    if (!handle) return;

    let resizing = false;
    let startX = 0;
    let startY = 0;

    const onDown = (e) => {
      e.stopPropagation();
      resizing = true;
      startX = e.clientX;
      startY = e.clientY;
    };

    const onMove = (e) => {
      if (!resizing) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      setBox((prev) => {

        const coOrdinates = getCoOrdinates()
        const img = imgRectRef.current;

        const proposedWidth = prev.width + dx;
        const proposedHeight = prev.height + dy;

        const minWidth = img.width + Math.abs(coOrdinates.left);
        const minHeight = img.height + Math.abs(coOrdinates.top);

        const newWidth = Math.max(minWidth, proposedWidth);
        const newHeight = Math.max(minHeight, proposedHeight);
        /*
        // Apply ratio constraint
        if(constrainRatio){
          ({ width: newWidth, height: newHeight } = applyConstraint(newWidth, newHeight, constrainRatio));
        }*/

        return{
          ...prev,
          width: newWidth,
          height: newHeight,
        }
      });

      startX = e.clientX;
      startY = e.clientY;
    };

    const onUp = () => {
      resizing = false;
    };

    handle.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      handle.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [constrainRatio]);

  // -----------------------------
  // RESIZE HANDLER (bottom-left)
  // -----------------------------
  useEffect(() => {
    const handle = document.getElementById("resize-handle-bottom-left");
    if (!handle) return;

    let resizing = false;
    let startX = 0;
    let startY = 0;

    const onDown = (e) => {
      e.stopPropagation();
      resizing = true;
      startX = e.clientX;
      startY = e.clientY;
    };

    const onMove = (e) => {
      if (!resizing) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      setBox((prev) => {

        const coOrdinates = getCoOrdinates()
        const img = imgRectRef.current;

        const proposedWidth = prev.width - dx;
        const proposedHeight = prev.height + dy;

        const minWidth = img.width + Math.abs(coOrdinates.right);
        const minHeight = img.height + Math.abs(coOrdinates.top);

        const newWidth = Math.max(minWidth, proposedWidth);
        const newHeight = Math.max(minHeight, proposedHeight);

        const actualHeightChange = newHeight - prev.height;
        const actualWidthChange = newWidth - prev.width;


        return {
          ...prev,
          width: newWidth,
          height: newHeight,
          x: prev.x - actualWidthChange,
        };
      });

      startX = e.clientX;
      startY = e.clientY;
    };

    const onUp = () => {
      resizing = false;
    };

    handle.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      handle.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  // -----------------------------
  // RESIZE HANDLER (top-left)
  // -----------------------------

  //top edge moves
  //bottom edge stays fixed
  useEffect(() => {
    const handle = document.getElementById("resize-handle-top-left");
    if (!handle) return;

    let resizing = false;
    let startX = 0;
    let startY = 0;

    const onDown = (e) => {
      e.stopPropagation();
      resizing = true;
      startX = e.clientX;
      startY = e.clientY;
    };

    const onMove = (e) => {
      if (!resizing) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      setBox((prev) => {
        const coOrdinates = getCoOrdinates()
        const img = imgRectRef.current;

        const proposedWidth = prev.width - dx;
        const proposedHeight = prev.height - dy;

        //const newWidth = Math.max(img.width, prev.width - dx);
        //const newHeight = Math.max(img.height, prev.height - dy);

        const minWidth = img.width + Math.abs(coOrdinates.right);
        const minHeight = img.height + coOrdinates.bottom;


        const newWidth = Math.max(minWidth, proposedWidth);
        const newHeight = Math.max(minHeight, proposedHeight);

        const actualHeightChange = newHeight - prev.height;

        const actualWidthChange = newWidth - prev.width;


        return {
          ...prev,
          width: newWidth,
          height: newHeight,
          x: prev.x - actualWidthChange,
          y: prev.y - actualHeightChange,
        };
      });

      startX = e.clientX;
      startY = e.clientY;
    };

    const onUp = () => {
      resizing = false;
    };

    handle.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      handle.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  // -----------------------------
  // RESIZE HANDLER (top-right)
  // -----------------------------

  //top edge moves
  //bottom edge stays fixed

  useEffect(() => {
    const handle = document.getElementById("resize-handle-top-right");
    if (!handle) return;

    let resizing = false;
    let startX = 0;
    let startY = 0;

    const onDown = (e) => {
      e.stopPropagation();
      resizing = true;
      startX = e.clientX;
      startY = e.clientY;
    };

    const onMove = (e) => {
      if (!resizing) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      const minWidth = imageRef.current.getBoundingClientRect().width
      const minHeight = imageRef.current.getBoundingClientRect().height

      setBox((prev) => {

        const coOrdinates = getCoOrdinates()
        const img = imgRectRef.current;

        const proposedWidth = prev.width + dx;
        const proposedHeight = prev.height - dy;

        const minWidth = img.width + Math.abs(coOrdinates.left);
        const minHeight = img.height + coOrdinates.bottom;

        const newWidth = Math.max(minWidth, proposedWidth);
        const newHeight = Math.max(minHeight, proposedHeight);

        // derive Y from height (NOT dy)
        const actualHeightChange = newHeight - prev.height;

        return {
          ...prev,
          width: newWidth,
          height: newHeight,
          y: prev.y - actualHeightChange,
        };

      })

      startX = e.clientX;
      startY = e.clientY;
    };

    const onUp = () => {
      resizing = false;
    };

    handle.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      handle.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  // -----------------------------
  // RESIZE HANDLER (top)
  // -----------------------------


  useEffect(() => {
    const handle = document.getElementById("resize-handle-top");
    if (!handle) return;

    let resizing = false;
    let startX = 0;
    let startY = 0;

    const onDown = (e) => {
      e.stopPropagation();
      resizing = true;
      startX = e.clientX;
      startY = e.clientY;
    };

    const onMove = (e) => {
      if (!resizing) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      const minWidth = imageRef.current.getBoundingClientRect().width
      const minHeight = imageRef.current.getBoundingClientRect().height

      setBox((prev) => {

        const coOrdinates = getCoOrdinates()
        const img = imgRectRef.current;

        const proposedHeight = prev.height - dy;

        const minHeight = img.height + coOrdinates.bottom;

        const newHeight = Math.max(minHeight, proposedHeight);

        const actualHeightChange = newHeight - prev.height;

        return {
          ...prev,
          height: newHeight,
          y: prev.y - actualHeightChange,
        };

      })

      startX = e.clientX;
      startY = e.clientY;
    };

    const onUp = () => {
      resizing = false;
    };

    handle.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      handle.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  // -----------------------------
  // RESIZE HANDLER (bottom)
  // -----------------------------

  useEffect(() => {
    const handle = document.getElementById("resize-handle-bottom");
    if (!handle) return;

    let resizing = false;
    let startX = 0;
    let startY = 0;

    const onDown = (e) => {
      e.stopPropagation();
      resizing = true;
      startX = e.clientX;
      startY = e.clientY;
    };

    const onMove = (e) => {
      if (!resizing) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      const minWidth = imageRef.current.getBoundingClientRect().width
      const minHeight = imageRef.current.getBoundingClientRect().height

      setBox((prev) => {

        const coOrdinates = getCoOrdinates()
        const img = imgRectRef.current;

        const proposedHeight = prev.height + dy;

        const minHeight = img.height + Math.abs(coOrdinates.top);

        const newHeight = Math.max(minHeight, proposedHeight);

        const actualHeightChange = newHeight - prev.height;

        return {
          ...prev,
          height: newHeight,
        };

      })

      startX = e.clientX;
      startY = e.clientY;
    };

    const onUp = () => {
      resizing = false;
    };

    handle.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      handle.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  // -----------------------------
  // RESIZE HANDLER (left)
  // -----------------------------

  useEffect(() => {
    const handle = document.getElementById("resize-handle-left");
    if (!handle) return;

    let resizing = false;
    let startX = 0;
    let startY = 0;

    const onDown = (e) => {
      e.stopPropagation();
      resizing = true;
      startX = e.clientX;
      startY = e.clientY;
    };

    const onMove = (e) => {
      if (!resizing) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      const minWidth = imageRef.current.getBoundingClientRect().width
      const minHeight = imageRef.current.getBoundingClientRect().height

      setBox((prev) => {

        const coOrdinates = getCoOrdinates()
        const img = imgRectRef.current;

        const proposedWidth = prev.width - dx;

        const minWidth = img.width + Math.abs(coOrdinates.right);

        const newWidth = Math.max(minWidth, proposedWidth);

        const actualWidthChange = newWidth - prev.width;

        return {
          ...prev,
          width: newWidth,
          x: prev.x - actualWidthChange,
        };

      })

      startX = e.clientX;
      startY = e.clientY;
    };

    const onUp = () => {
      resizing = false;
    };

    handle.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      handle.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  // -----------------------------
  // RESIZE HANDLER (right)
  // -----------------------------

  useEffect(() => {
    const handle = document.getElementById("resize-handle-right");
    if (!handle) return;

    let resizing = false;
    let startX = 0;
    let startY = 0;

    const onDown = (e) => {
      e.stopPropagation();
      resizing = true;
      startX = e.clientX;
      startY = e.clientY;
    };

    const onMove = (e) => {
      if (!resizing) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      const minWidth = imageRef.current.getBoundingClientRect().width
      const minHeight = imageRef.current.getBoundingClientRect().height

      setBox((prev) => {

        const coOrdinates = getCoOrdinates()
        const img = imgRectRef.current;

        const proposedWidth = prev.width + dx;

        const minWidth = img.width + Math.abs(coOrdinates.left);

        const newWidth = Math.max(minWidth, proposedWidth);

        const actualWidthChange = newWidth - prev.width;

        return {
          ...prev,
          width: newWidth,
        };

      })

      startX = e.clientX;
      startY = e.clientY;
    };

    const onUp = () => {
      resizing = false;
    };

    handle.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      handle.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  // -----------------------------
  // EXPORT EXPAND METADATA
  // -----------------------------
  const getExpandData = () => {
    const data = {
      expandWidth: box.width,
      expandHeight: box.height,
      offsetX: box.x,
      offsetY: box.y,
      originalWidth: file.originalWidth,
      originalHeight: file.originalHeight,
    };

    return data;
  };

  const getCoOrdinates = () => {

    const imgRect = imageRef.current.getBoundingClientRect();
    const boxRect = boxRef.current.getBoundingClientRect();

    const left   = boxRect.left - imgRect.left;
    const top    = boxRect.top - imgRect.top;
    const right  = imgRect.right - boxRect.right;
    const bottom = boxRect.bottom - imgRect.bottom;


    return{
      left:left,
      top:top,
      right:right,
      bottom:bottom
    }
  }


  const submit = async () => {
    const coOrdinates = getCoOrdinates()

    const left = Math.abs(coOrdinates.left)
    const top = Math.abs(coOrdinates.top)
    const right = Math.abs(coOrdinates.right)
    const bottom = Math.abs(coOrdinates.bottom)

    const response = await fetch(`/api/stability/outpaint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          left:Math.round(left),
          right:Math.round(top),
          up:Math.round(top),
          down:Math.round(bottom),
          imageUrl: image.file_url,
          fileName: image.file_name,
          fileType: image.file_type,
          prompt:prompt,
          seed:seed??0
        }),
      })

      if (!response.ok) {
        showError(`Out painting error: ${response.status}`)
        return
      }

      const result = await response.json()

      if (response.ok) {

        const fileinfo = await storeFileInfo({
          user_id: user.id,
          file_url: result.url,
          file_type: 'image/jpeg',
          file_name: result.fileName,
          file_description: image.file_description ?? null
        })

        setFileUrl(result.url)

        setNewFile({
          created_at: fileinfo.created_at,
          file_type: 'image/jpeg',
          file_url: result.url,
          file_name: result.fileName,
          file_description: image.file_description??null,
          id: fileinfo.id,
          user_id: user.id
        })

      }

  }

  const createImage = async() => {
    const canvas = document.createElement('canvas');
    canvas.width = box.width * ratio.scaleX;
    canvas.height = box.height * ratio.scaleY;
    const coOrdinates = getCoOrdinates()
    const imgRect = imageRef.current.getBoundingClientRect();

    // Get the 2D rendering context
    const ctx = canvas.getContext('2d');

    // Draw a sample blue rectangle
    ctx.fillStyle = '#007BFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const x = Math.abs(coOrdinates.left) * ratio.scaleX
    const y = Math.abs(coOrdinates.top) * ratio.scaleX


    ctx.fillStyle = 'red';
    ctx.fillRect(x, y, imageRef.current.naturalWidth, imageRef.current.naturalHeight);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = image.file_url; // Set your image path

    // Crucial: Wait for the image to finish loading
    await img.decode(); // waits until fully loaded


    ctx.drawImage(
      img,
      x,
      y,
      img.originalWidth,
      img.originalHeight
    ); // Draws at x=0, y=0


    // Draw sample white text

    const dataURL = canvas.toDataURL('image/png');

 // Create a temporary link element
     const downloadLink = document.createElement('a');
     downloadLink.href = dataURL;
     downloadLink.download = 'fileName'.png;

     // Append to body, trigger click, and remove the element
     document.body.appendChild(downloadLink);
     downloadLink.click();
     document.body.removeChild(downloadLink);
  }

  const acceptFile = () =>{
    setItem(newFile)
    showSuccess('file uploaded')
    setDisplayEditItem(false)
  }

  const handleSetRatio = (r) => {
    setConstrainRatio(r);
    if (r) {
      setBox((prev) => {

        const img = imgRectRef.current;
        const containerRect = imgContainerRef.current;

        const x = img.left - containerRect.left;
        const y = img.top - containerRect.top;


        // Find the current center of the image
        const centerX = x + img.width / 2;
        const centerY = y + img.height / 2;



        // Grow dimensions to fit the ratio
        const { width, height } = applyConstraint(img.width, img.height, r);

        // Re-derive x/y so the center stays fixed
        return {
          ...prev,
          width,
          height,
          x: centerX - width / 2,
          y: centerY - height / 2,
        };
      });
    }
  };


  return (
    <>
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: "90%",
        overflow: "hidden",
      }}
    >

      {/* BACKGROUND BOX */}
      <div
        style={{
          position: "absolute",
          left: box.x,
          top: box.y,
          width: box.width,
          height: box.height,
          background: "rgba(54, 94, 157, 0.2)",
          cursor: "move",
          zIndex: 1,
        }}
      >
      </div>



      {/* ORIGINAL IMAGE */}

      <img
        className='unselectable'
        ref={imageRef}
        src={fileUrl}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) scale(${scale})`,
          zIndex: 1,
        }}
        onLoad={() => {
          getImageSize();
        }}
      />


      {/* EXPAND BOX */}
      <div
        ref={boxRef}
        style={{
          position: "absolute",
          left: box.x,
          top: box.y,
          width: box.width,
          height: box.height,
          border: "2px solid var(--md-sys-color-primary)",
          cursor: "move",
          zIndex: 2,
        }}
      >
        {/* RESIZE HANDLE */}
          <div
            id="resize-handle-top"
            style={{
              position: "absolute",
              left: '50%',
              transform: 'translateX(-50%)',
              top: -8,
              width: 40,
              height: 14,
              border: "2px solid var(--md-sys-color-primary)",
              background: "var(--md-sys-color-surface)",
              cursor: "ns-resize",
            }}
          />
          <div
            id="resize-handle-bottom"
            style={{
              position: "absolute",
              left: '50%',
              transform: 'translateX(-50%)',
              bottom: -8,
              width: 40,
              height: 14,
              border: "2px solid var(--md-sys-color-primary)",
              background: "var(--md-sys-color-surface)",
              cursor: "ns-resize",
            }}
          />
          <div
            id="resize-handle-left"
            style={{
              position: "absolute",
              left: -8,
              transform: 'translateY(-50%)',
              top: '50%',
              width: 14,
              height: 40,
              border: "2px solid var(--md-sys-color-primary)",
              background: "var(--md-sys-color-surface)",
              cursor: "ew-resize",
            }}
          />
          <div
            id="resize-handle-right"
            style={{
              position: "absolute",
              right: -8,
              transform: 'translateY(-50%)',
              top: '50%',
              width: 14,
              height: 40,
              border: "2px solid var(--md-sys-color-primary)",
              background: "var(--md-sys-color-surface)",
              cursor: "ew-resize",
            }}
          />
          <div
            id="resize-handle-bottom-right"
            style={{
              position: "absolute",
              right: -6,
              bottom: -6,
              width: 14,
              height: 14,
              border: "2px solid var(--md-sys-color-primary)",
              background: "var(--md-sys-color-surface)",
              cursor: "nwse-resize",
            }}
          />
          <div
              id="resize-handle-bottom-left"
              style={{
                position: "absolute",
                left: -6,
                bottom: -6,
                width: 14,
                height: 14,
                border: "2px solid var(--md-sys-color-primary)",
                background: "var(--md-sys-color-surface)",
                cursor: "nesw-resize",
              }}
            />
          <div
              id="resize-handle-top-left"
              style={{
                position: "absolute",
                left: -6,
                top: -6,
                width: 14,
                height: 14,
                border: "2px solid var(--md-sys-color-primary)",
                background: "var(--md-sys-color-surface)",
                cursor: "nwse-resize",
              }}
            />
          <div
              id="resize-handle-top-right"
              style={{
                position: "absolute",
                right: -6,
                top: -6,
                width: 14,
                height: 14,
                border: "2px solid var(--md-sys-color-primary)",
                background: "var(--md-sys-color-surface)",
                cursor: "nesw-resize",
              }}
            />
      </div>
    </div>
    <div  style={{
            position: "relative",
            width: "100%",
            height: "10%",
          }}>
      <div className='properties-container' style={{paddingLeft:'20px', paddingRight:'20px'}}>
        <div style={{alignItems: 'center', display:'flex', gap:'10px', width: '100%'}}>
          <input
            id="image-prompt"
            type='text'
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className={'form-input'}
            placeholder='Image Fill Prompt'
            style={{flex:4}}
          />
          <button
            style={{flex:2}}
            className='unselectable btn secondary'
            onClick={submit}>
            Create Image
          </button>
          <Square onClick={()=> handleSetRatio(1/1)} size={35} className={`cropped-image ${constrainRatio===1/1?'active':''}`} alt="crop ratio 1/1" />
          <RectangleVertical onClick={()=> handleSetRatio(4/5)} size={35}  className={`cropped-image ${constrainRatio===4/5?'active':''}`} alt="crop ratio 4/5" />
          <RectangleHorizontal onClick={()=> handleSetRatio(1.91/1)} size={35}  className={`cropped-image ${constrainRatio===1.91/1?'active':''}`}  alt="crop ratio 1.91/1" />
          <button
            style={{flex:.5}}
            className='unselectable btn secondary btn-sm'
            onClick={() => {
              handleSetRatio(null)
              getImageSize()
            }}>
            Unset
          </button>
        </div>
      </div>
    </div>
  </>
  );
}

/*
const CustomCropper = ({
  user,
  image,
  setItem,
  setDisplayEditItem
}) => {

  const containerRef = useRef(null);
  const boxRef = useRef(null);
  const [scale, setScale] = useState(.5);
  const imageRef = useRef(null);
  const [actualImageDimension, setActualImageDimension] = useState(null);
  const [displayedImageDimension, setDisplayedImageDimension] = useState(null);
  const [ratio, setRatio] = useState(null);
  const [box, setBox] = useState({
    x: 80,
    y: 80,
    width: 400,
    height: 400,
  });
  const imgRectRef = useRef(null);




  const getImageSize = () => {
    const img = imageRef.current;
    const container = containerRef.current

    const imageRect = imageRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    const x = imageRect.left - containerRect.left;
    const y = imageRect.top - containerRect.top;

    // Actual image dimensions

    setActualImageDimension({
      width:img.naturalWidth,
      height:img.naturalHeight
    })

    // Displayed dimensions
    console.log('Offset Width:', img.offsetWidth);
    console.log('Offset Height:', img.offsetHeight);

    // More precise displayed dimensions

    setDisplayedImageDimension({
      width:imageRect.width,
      height:imageRect.height
    })


    imgRectRef.current = imageRef.current.getBoundingClientRect();


    const scaleX = img.naturalWidth / imageRect.width
    const scaleY = img.naturalHeight /  imageRect.height


    setRatio({
      scaleX:scaleX,
      scaleY:scaleY
    })

    setBox({
      x:x,
      y:y,
      width: imageRect.width,
      height: imageRect.height,
    })


  };


  useEffect(()=>{
    getImageSize()
  },[image])



  useEffect(()=>{


    setBox((prev) => {
        return{
        x:prev.x,
        y:prev.y,
        width: displayedImageDimension.width,
        height: displayedImageDimension.height,
      }
    })

  },[displayedImageDimension])




  // -----------------------------
  // DRAG BOX
  // -----------------------------

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;

    let dragging = false;

    let offsetX = 0;
    let offsetY = 0;

    const onMouseDown = (e) => {
      dragging = true;

      const rect = el.getBoundingClientRect();

      // IMPORTANT: store click offset INSIDE the box
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
    };

    const onMouseMove = (e) => {
      if (!dragging) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();

      setBox((prev) => ({
        ...prev,
        x: e.clientX - containerRect.left - offsetX,
        y: e.clientY - containerRect.top - offsetY,
      }));
    };

    const onMouseUp = () => {
      dragging = false;
    };

    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  // -----------------------------
  // RESIZE HANDLER (bottom-right)
  // -----------------------------
  useEffect(() => {
    const handle = document.getElementById("resize-handle-bottom-right");
    if (!handle) return;

    let resizing = false;
    let startX = 0;
    let startY = 0;

    const onDown = (e) => {
      e.stopPropagation();
      resizing = true;
      startX = e.clientX;
      startY = e.clientY;
    };

    const onMove = (e) => {
      if (!resizing) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;


      setBox((prev) => {

        const img = imgRectRef.current;

        return{
          ...prev,
          width: Math.max(100, prev.width + dx),
          height: Math.max(100, prev.height + dy),
        }
      });

      startX = e.clientX;
      startY = e.clientY;
    };

    const onUp = () => {
      resizing = false;
    };

    handle.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      handle.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  // -----------------------------
  // RESIZE HANDLER (bottom-left)
  // -----------------------------
  useEffect(() => {
    const handle = document.getElementById("resize-handle-bottom-left");
    if (!handle) return;

    let resizing = false;
    let startX = 0;
    let startY = 0;

    const onDown = (e) => {
      e.stopPropagation();
      resizing = true;
      startX = e.clientX;
      startY = e.clientY;
    };

    const onMove = (e) => {
      if (!resizing) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      setBox((prev) => {

        return {
          ...prev,
          width: Math.max(100, prev.width - dx),
          height: Math.max(100, prev.height + dy),
          x: prev.x + dx,
        };
      });

      startX = e.clientX;
      startY = e.clientY;
    };

    const onUp = () => {
      resizing = false;
    };

    handle.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      handle.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  // -----------------------------
  // RESIZE HANDLER (top-left)
  // -----------------------------
  useEffect(() => {
    const handle = document.getElementById("resize-handle-top-left");
    if (!handle) return;

    let resizing = false;
    let startX = 0;
    let startY = 0;

    const onDown = (e) => {
      e.stopPropagation();
      resizing = true;
      startX = e.clientX;
      startY = e.clientY;
    };

    const onMove = (e) => {
      if (!resizing) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      setBox((prev) => {

        return {
          ...prev,
          width: Math.max(100, prev.width - dx),
          height: Math.max(100, prev.height - dy),
          x: prev.x + dx,
          y: prev.y + dy,
        };
      });

      startX = e.clientX;
      startY = e.clientY;
    };

    const onUp = () => {
      resizing = false;
    };

    handle.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      handle.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  // -----------------------------
  // RESIZE HANDLER (top-right)
  // -----------------------------
  useEffect(() => {
    const handle = document.getElementById("resize-handle-top-right");
    if (!handle) return;

    let resizing = false;
    let startX = 0;
    let startY = 0;

    const onDown = (e) => {
      e.stopPropagation();
      resizing = true;
      startX = e.clientX;
      startY = e.clientY;
    };

    const onMove = (e) => {
      if (!resizing) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      const minWidth = imageRef.current.getBoundingClientRect().width
      const minHeight = imageRef.current.getBoundingClientRect().height

      setBox((prev) => {

        return {
          ...prev,
          width: Math.max(100, prev.width + dx),
          height: Math.max(100, prev.height - dy),
          y: prev.y + dy,
        };
      });

      startX = e.clientX;
      startY = e.clientY;
    };

    const onUp = () => {
      resizing = false;
    };

    handle.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      handle.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  // -----------------------------
  // EXPORT EXPAND METADATA
  // -----------------------------
  const getExpandData = () => {
    const data = {
      expandWidth: box.width,
      expandHeight: box.height,
      offsetX: box.x,
      offsetY: box.y,
      originalWidth: file.originalWidth,
      originalHeight: file.originalHeight,
    };


    return data;
  };

  const getCoOrdinates = () => {

    const imgRect = imageRef.current.getBoundingClientRect();
    const boxRect = boxRef.current.getBoundingClientRect();

    const left   = boxRect.left - imgRect.left;
    const top    = boxRect.top - imgRect.top;
    const right  = imgRect.right - boxRect.right;
    const bottom = boxRect.bottom - imgRect.bottom;
  }

  const createImage = () => {

    const canvas = document.createElement('canvas');
    canvas.width = box.width * ratio.scaleX;
    canvas.height = box.height * ratio.scaleY;

    const coOrdinates = getCoOrdinates()


    const imgRect = imageRef.current.getBoundingClientRect();





    // Get the 2D rendering context
    const ctx = canvas.getContext('2d');

    // Draw a sample blue rectangle
    ctx.fillStyle = '#007BFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const x = Math.abs(coOrdinates.left) * ratio.scaleX
    const y = Math.abs(coOrdinates.top) * ratio.scaleX


    ctx.fillStyle = 'red';
    ctx.fillRect(x, y, imgRect.width, imgRect.height);

    // Draw sample white text

    const dataURL = canvas.toDataURL('image/png');

 // Create a temporary link element
     const downloadLink = document.createElement('a');
     downloadLink.href = dataURL;
     downloadLink.download = 'fileName'.png;

     // Append to body, trigger click, and remove the element
     document.body.appendChild(downloadLink);
     downloadLink.click();
     document.body.removeChild(downloadLink);
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >


      <img
        className='unselectable'
        ref={imageRef}
        src={image.file_url}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) scale(${scale})`,
          zIndex: 1,
        }}
        onLoad={() => {
          getImageSize();
        }}
      />


      <div
        ref={boxRef}
        style={{
          position: "absolute",
          left: box.x,
          top: box.y,
          width: box.width,
          height: box.height,
          border: "1px solid var(--md-sys-color-primary)",
          background: "rgba(242, 176, 245, 0.2)",
          cursor: "move",
          zIndex: 2,
        }}
      >

          <div
            id="resize-handle-bottom-right"
            style={{
              position: "absolute",
              right: -6,
              bottom: -6,
              width: 14,
              height: 14,
              border: "1px solid var(--md-sys-color-primary)",
              background: "var(--md-sys-color-surface)",
              cursor: "nwse-resize",
            }}
          />
          <div
              id="resize-handle-bottom-left"
              style={{
                position: "absolute",
                left: -6,
                bottom: -6,
                width: 14,
                height: 14,
                border: "1px solid var(--md-sys-color-primary)",
                background: "var(--md-sys-color-surface)",
                cursor: "nwse-resize",
              }}
            />
          <div
              id="resize-handle-top-left"
              style={{
                position: "absolute",
                left: -6,
                top: -6,
                width: 14,
                height: 14,
                border: "1px solid var(--md-sys-color-primary)",
                background: "var(--md-sys-color-surface)",
                cursor: "nwse-resize",
              }}
            />
          <div
              id="resize-handle-top-right"
              style={{
                position: "absolute",
                right: -6,
                top: -6,
                width: 14,
                height: 14,
                border: "1px solid var(--md-sys-color-primary)",
                background: "var(--md-sys-color-surface)",
                cursor: "nwse-resize",
              }}
            />
      </div>



      <button
        className='unselectable'
        onClick={getExpandData}
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 10,
          padding: 10,
        }}
      >
        Export Expand
      </button>
      <button
        className='unselectable'
        onClick={createImage}>
        Create Image
      </button>
    </div>
  );
}
*/


const NewCropper = ({
  user,
  image,
  setItem,
  setDisplayEditItem,
  newFile,
  setNewFile
}) => {
  const [fileUrl, setFileUrl] = useState(image.file_url);
  const cropperRef = useRef(null)
  const [ratio, setRatio] = useState(null)
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0)
  const [color, setColor] = useState('rgb(249 249 255)');
  const [showColourPicker, setShowColourPicker] = useState(false)
  const colorPickerRef = useRef(null);
  const [loader, setLoader] = useState(false)
  const lastAngleRef = useRef(0);
  const backgroundRef = useRef(null);
  const canvasRef = useRef(null);


  const cropImage = async() => {


    setLoader(true)

    const cropper = cropperRef.current?.cropper
    const croppedCanvas = cropper.getCroppedCanvas();

    const targetCanvas = canvasRef.current;
    const ctx = targetCanvas.getContext('2d');

    // Match target canvas dimensions to the cropped image
    targetCanvas.width = croppedCanvas.width;
    targetCanvas.height = croppedCanvas.height;


    ctx.fillStyle = color;
    ctx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);
    ctx.drawImage(croppedCanvas, 0, 0);


    const file = await new Promise((resolve) => {
      targetCanvas.toBlob(resolve, 'image/jpeg', 0.95);
    });

    const formData = new FormData()
      formData.append('file', file)
      formData.append('tag', '.jpg');

      try{
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        const result = await res.json()

        if (res.ok) {

          const fileData={
            ...image,
            file_url:result.url
          }

          const fileinfo = await storeFileInfo({
            user_id:user.id,
            file_url: fileData.file_url,
            file_type:fileData.file_type,
            file_name:fileData.file_name,
            file_description:fileData.file_description??null
          })

          setNewFile({
            created_at: fileinfo.created_at,
            file_type: fileData.file_type,
            file_url: fileData.file_url,
            file_name:fileData.file_name,
            file_description:fileData.file_description??null,
            id: fileinfo.id,
            user_id: user.id
          })

          setFileUrl(fileData.file_url)

        } else {
          showError(result.error)
        }
      }catch(error){
        console.log('file upload error', error)
      }

  setLoader(false)


    /*
    const image = await new Promise((resolve) => {
      targetCanvas.toBlob(resolve, 'image/jpeg', 0.95);
    });
    */

    /*
    const dataUrl = targetCanvas.toDataURL('image/png');

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'filename.png';
    link.style.display = 'none';

    // Append, programmatically click, and immediately remove the element
    document.body.appendChild(link);
    link.click();
    link.remove();
    */

    // Clear memory by revoking the object URL
    //URL.revokeObjectURL(blobUrl);


  }


  const onCrop = () => {


    const cropBoxElement = document.querySelector('.cropper-crop-box');

    if (cropBoxElement && backgroundRef?.current){
      const inlineTransform = cropBoxElement.style.transform;
      const inlineWidth = cropBoxElement.style.width;
      const inlineHeight = cropBoxElement.style.height;
      console.log("Inline Transform:", inlineTransform);
      // Outputs something like: "matrix(1, 0, 0, 1, 145, 52)" or "translateX(145px) translateY(52px)"
      //backgroundRef.current.style.cssText = cropBoxElement.style.cssText;


      backgroundRef.current.style.cssText += `; ${cropBoxElement.style.cssText}`;


      // Optional: Get the computed matrix if inline is empty
      const computedTransform = window.getComputedStyle(cropBoxElement).transform;
      console.log("Computed Transform (Matrix):", computedTransform);
    }




    //console.log(cropper.getData());

  }



  useEffect(() => {
  const cropper = cropperRef.current?.cropper;
    if (cropper) {
      cropper.setAspectRatio(ratio);
    }
  }, [ratio]);

  useEffect(() => {
  const cropper = cropperRef.current?.cropper;
    if (cropper) {
      cropper.scale(parseFloat(scale));
    }
  }, [scale]);

  useEffect(() => {
  const cropper = cropperRef.current?.cropper;
    if (cropper) {

      const newAngle = Number(rotation);

      const delta = newAngle - lastAngleRef.current;

      cropper.rotate(delta);

      lastAngleRef.current = newAngle;
    }
  }, [rotation]);

  const onReset = () => {
    const cropper = cropperRef.current.cropper;
    cropper.reset();
    //setZoom(1);
  };


  return (
          <>
            <div style={loader? {display:'block'}:{display:'none'}} className={'loader_screen'}>
                <div style={{transform:'translate(-50%, -50%)'}}  className="loader"></div>
            </div>
          <div style={{
            height: '600px',
            width: '100%',
          }}>
            <div
              style={{
                bottom: 0,
                left: 0,
                position: 'absolute',
                right: 0,
                top: 0,
                backgroundColor:color
              }}
              ref={backgroundRef}></div>
          <ReactCropper
            src={fileUrl}
          //  dragMode={'move'}
            viewMode={0} // IMPORTANT
            //restore={true}
            style={{ height: '100%', width: '100%' }}
            //zoom={zoom}
            rotation={rotation} // Pass rotation state
            aspectRatio={ratio}
          //  responsive={true}
            //background={true}
            autoCropArea={0.7}
            //minContainerWidth={0}
          //  minContainerHeight={0}
            guides={false}
            crop={onCrop}
            ref={cropperRef}
            ready={() => {
              setTimeout(() => {
                const cropper = cropperRef.current?.cropper;
                // Zoom out to create space around the image
                cropper.zoomTo(0.5);
              }, 50);
            }}

          />
          <div className="controls" style={{bottom: '10px', width: '700px'}}>
            <div style={{alignItems: 'center', display:'flex', marginLeft:'10px', gap:'10px'}}>
              {showColourPicker&&
                 <div
                   ref={colorPickerRef}
                   className='dropshadow'
                   style={{
                     position: 'absolute',
                     bottom: '50px',
                     background:'#ffffff',
                     borderRadius:'var(--input-border-radius)',
                     padding:'10px',
                     left: 'calc(100% - 250px)'
                   }}>
                   <ColorPicker
                   color={color}
                   onChange={color => setColor(color.hex)}
                   theme={{
                      boxShadow: 'none',
                      border: '0px solid transparent',
                      borderColor: 'white',
                    }}
                  />
                   <EyeDropperButton setColor={setColor}/>
                 </div>
               }
              <div style={{display:'flex', width:'200px', alignItems: 'center', gap:'5px'}}>
                <p className='label'> Scale</p>
                <Slider
                value={scale}
                min={0}
                max={2}
                step={0.005}
                defaultValue={1}
                aria-label="Default"
                valueLabelDisplay="auto"
                onChange={(e, scale) => setScale(scale)}
                />
              </div>
              <div style={{display:'flex', width:'200px', alignItems: 'center', gap:'15px'}}>
                <p className='label'> Rotate</p>
                <Slider
                value={rotation}
                min={-180}
                max={180}
                step={1}
                defaultValue={1}
                aria-label="Default"
                valueLabelDisplay="auto"
                onChange={(e, zoom) => setRotation(zoom)}
                />
              </div>
              <Square onClick={()=> setRatio(1/1)} size={35} className={`cropped-image ${ratio===1/1?'active':''}`} alt="crop ratio 1/1" />
              <RectangleVertical onClick={()=> setRatio(4/5)} size={35}  className={`cropped-image ${ratio===4/5?'active':''}`} alt="crop ratio 4/5" />
              <RectangleHorizontal onClick={()=> setRatio(1.91/1)} size={35}  className={`cropped-image ${ratio===1.91/1?'active':''}`}  alt="crop ratio 1.91/1" />
              <Palette onClick={()=> setShowColourPicker(prevState => !prevState)} size={35} className={`cropped-image ${showColourPicker?'active':''}`} alt="show colour picker" />
              <button
                style={{marginLeft:'10px'}}
                 onClick={onReset}
                 className="btn secondary btn-sm"
               >
                 Reset
               </button>
             <button
             style={{height:'40px', marginLeft:'10px'}}
                onClick={cropImage}
                className="btn primary"
              >
                Crop
              </button>
            </div>
          </div>
          <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
        </div>
      </>
  )
}
