'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useEditItemContext } from "@/context/edit-item-context"
import { useUserContext } from "@/context/user-context"
import Cropper from 'react-easy-crop'
import Slider from '@mui/material/Slider';
import { storeFileInfo } from "@/lib/supabase";
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

export default function EditFile() {
  const { user } = useUserContext();
  const { displayEditItem, setDisplayEditItem, item, setItem, activeTool, setActiveTool} = useEditItemContext();

return(
  <>
    {displayEditItem&&
      <div className='overlay' onClick={(e) => setDisplayEditItem(false)}>
        <div className='center-absolute' style={{width:'100%', maxWidth:'1200px', height:'800px'}}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{margin:0, height:'100%'}}>
            <div style={{display:'flex'}}>
              <div style={{flex:1, zIndex: 1}}>
                <h4>MENU</h4>
                <p className={`edit_image_menu_item ${activeTool === "crop"? 'active':''}`} onClick={() => setActiveTool('crop')}> Crop </p>
                <p className={`edit_image_menu_item ${activeTool === "caption"? 'active':''}`}onClick={() => setActiveTool('caption')}> Caption </p>
              </div>
              <div style={{flex:4, position:'relative'}}>
                {activeTool === 'crop' &&
                <CropComponent user={user} image={item} setItem={setItem} setDisplayEditItem={setDisplayEditItem}/>
                }
                {activeTool === 'caption' &&

                <CaptionComponent user={user} image={item} setItem={setItem} setDisplayEditItem={setDisplayEditItem}/>

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
  setItem,
  setDisplayEditItem
}) => {
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

  const loadImage = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();

      img.crossOrigin = 'anonymous';

      // cache-bust to prevent reused non-CORS response
      img.src = src + (src.includes('?') ? '&' : '?') + 'cors=' + Date.now();

      img.onload = () => resolve(img);
      img.onerror = reject;
    });



    const getCroppedImg = async (imageSrc, croppedAreaPixels, canvas) => {
      const ctx = canvas.getContext('2d');

      const image = await loadImage(imageSrc);

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      // Draw the background (you can customize this to fit your needs)
      ctx.fillStyle = color; // Same as the background div
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        canvas.width,
        canvas.height
      );

      return new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.95);
      });
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

           handleFileFunction(fileData)
         } else {
           showError(result.error)
         }
       }catch(error){
         console.log('file upload error', error)
       }

      setLoader(false)
   }

   const handleFileFunction = async (data) => {

     try{
       const fileinfo = await storeFileInfo({
         user_id:user.id,
         file_url: data.file_url,
         file_type:data.file_type,
         file_name:data.file_name,
         file_description:data.file_description??null
       })

       const newFile={
         created_at: fileinfo.created_at,
         file_type: data.file_type,
         file_url: data.file_url,
         file_name:data.file_name,
         file_description:data.file_description??null,
         id: fileinfo.id,
         user_id: user.id
       }

       setItem(newFile)
       showSuccess('file uploaded')
       setDisplayEditItem(false)


     }catch (error){
       console.log(error)
       showError('Error saving file: ', error)
     }
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


  return(
    <div>
      <div style={loader? {display:'block'}:{display:'none'}} className={'loader_screen'}>
          <div style={{transform:'translate(-50%, -50%)'}}  className="loader"></div>
      </div>
      <div style={{height:'800px'}}>
        <div className="crop-container">
          <div className="reactEasyCrop_CropArea" ref={cropperRef} style={{
            width: `${cropAreaSize.width}px`,
            height: `${cropAreaSize.height}px`,
            backgroundColor: color,
          }}>
         </div>
          <Cropper
            image={image.file_url}
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
        <div className="controls">
          <div style={{alignItems: 'center', display:'flex', marginLeft:'10px', gap:'10px'}}>
            {showColourPicker&&
               <div style={{position:'relative', position: 'absolute', bottom: '20px', background:'#ffffff'}}>
                 <ColorPicker color={color} onChange={color => setColor(color.hex)} />
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

  return <button className='btn-primary btn' onClick={handlePickColor}>Pick Color</button>;
};

const CaptionComponent = ({
  user,
  image,
  setItem,
  setDisplayEditItem
}) => {
  const [fileDescription, setFileDescription] = useState(image?.file_description??'')

  const save = async() => {

  await updateFileDescriptionValue(fileDescription, image.id)

    const newFile = {...image, file_description: fileDescription}

    setItem(newFile)
    showSuccess('Image Caption Updated')
    setDisplayEditItem(false)
  }


  return(
    <div>
        <div style={{marginTop:'25px'}}>
          <img style={{maxWidth:'400px', borderRadius:'10px'}} src={image.file_url} />
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
