import { useState, useEffect, useRef, memo, useMemo } from "react";
import Switch from '@mui/material/Switch';
import { showSuccess } from '@/lib/toast';
import { showError } from '@/lib/toast';
import { showInfo } from '@/lib/toast';
import {
  Facebook,
  Instagram,
  ChevronDown,
  X
} from 'lucide-react';

export const Caption = ({
  caption,
  setCaption,
  customCaptions,
  setCustomCaptions,
  customCaptionsToggle,
  setCustomCaptionsToggle,
  selectedSocialPages,
  setIsInstagram,
  isInstagram,
  setInstagramCaptionError,
  instagramCaptionError

}) => {

  const [activeCaption, setActiveCaption] = useState(null)

  useEffect(() => {
    const isInstagram = selectedSocialPages.some(
      page => page.platform === 'instagram'
    );

    setIsInstagram(isInstagram);
  }, [selectedSocialPages]);

  const prevInvalidRef = useRef(false);


  const getCaptionToCheck = () =>{

    if (!customCaptionsToggle){
      return [caption]
    }else{

      return customCaptions
      .filter(custom => custom.platform === 'instagram')
      .map(custom => custom.caption);
    }
  }


  useEffect(() => {


     const captions = getCaptionToCheck()

      var captionLengthError = false

     for (const cap of captions) {

       if (cap .length > 2200){
         captionLengthError = true
       }
     }


    const isInvalid = isInstagram && captionLengthError;

    console.log('isInvalid', isInvalid )

    console.log('prevInvalidRef.current', prevInvalidRef.current )


    console.log('isInvalid && !prevInvalidRef.current', isInvalid && !prevInvalidRef.current )

    if (isInvalid) {

      setInstagramCaptionError(true)

    }else{
      setInstagramCaptionError(false)
    }

    if (isInvalid && !prevInvalidRef.current){
      showError('Caption is too long for instagram');
    }

    prevInvalidRef.current = isInvalid;

  }, [caption, customCaptions, isInstagram]);



  const customCaptionsToggleFunction = (e) => {
    setCustomCaptionsToggle(!customCaptionsToggle)
  }



const createCustomCaptions = () => {
  var newCustomCaptions

  if (customCaptions.length === 0){
    newCustomCaptions = selectedSocialPages.map((page)=>{
      return {
        caption:caption,
        ...page
      }
    })
  }else{
    // recompile
    newCustomCaptions = selectedSocialPages.map((page)=>{
      const findExisting = customCaptions.find((caption)=>caption.id === page.id)
      if (findExisting){
        return findExisting
      }else{
        return {
          caption:caption,
          ...page
        }
      }

    })


  }

  setCustomCaptions(newCustomCaptions)
}

const updateActiveCaption = (value) => {
  setActiveCaption({
    ...activeCaption,        // Copy existing properties
    caption: value    // Overwrite specific property
  });

const updateCaptions = customCaptions.map((customCaption)=>{
  if (customCaption.id === activeCaption.id){

    return {
      ...customCaption,
      caption: value
    }
  }else{
    return customCaption
  }
})


setCustomCaptions(updateCaptions)

}


useEffect(()=>{

  if (selectedSocialPages.length > 1){
    createCustomCaptions()
  }

},[selectedSocialPages])

useEffect(()=>{

if (customCaptionsToggle){

  if (!activeCaption){

    setActiveCaption(customCaptions[0])
  }
}


},[customCaptionsToggle])

return(
  <>
      <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
        <Switch
          onChange={customCaptionsToggleFunction}
          sx={{
            '& .MuiSwitch-switchBase.Mui-checked': {
              color: 'var(--md-sys-color-primary)', // Color of the thumb when checked
            },
            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
              backgroundColor: 'var(--md-sys-color-surface-tint)', // Color of the track when checked
            },
          }}
        checked={customCaptionsToggle}
      />
      <p style={{margin:0, fontSize:'.9em'}}>Custom Captions</p>
    </div>
    {customCaptionsToggle&&
      <div style={{display:'flex', alignItems:'center', gap:'5px'}}>
        {customCaptions.map((custom, index)=>{
          const isActive = custom.id === activeCaption?.id
          return(
            <button onClick={() => setActiveCaption(custom)} key={index} className={`btn-sm btn ${isActive?'primary':'secondary_caption'}`} style={{display:'flex', alignItems:'center', gap:'3px'}}>
              {custom.platform === 'facebook'&&
                <Facebook/>
              }
              {custom.platform === 'instagram'&&
                <Instagram/>
              }
              {custom.platform === 'One Signal'&&
                (isActive ?
                  <img src='/one-signal-icon-white.svg' style={{width:'20px', height:'20px'}}/>
                    :
                  <img src='/one-signal-icon.svg' style={{width:'20px', height:'20px'}}/>
                )
              }
              {custom.name}
            </button>
          )
        })

        }
      </div>
    }
    <p className='label'>Post Caption</p>
    {!customCaptionsToggle&&
      <textarea
        id='caption'
        style={{minHeight:200}}
        value={caption??''}
        onChange={(e) => setCaption(e.target.value)}
        className={`form-input ${isInstagram && instagramCaptionError? 'error':''}`}
      /*  maxLength={isInstagram? "2200" : "5000"}*/
        cols={8}
      />
    }
    {(activeCaption && customCaptionsToggle)&&
      <textarea
        id={activeCaption.id}
        style={{minHeight:200}}
        value={activeCaption.caption??''}
        onChange={(e) => updateActiveCaption(e.target.value)}
        className={`form-input ${isInstagram && instagramCaptionError && activeCaption.platform === 'instagram'? 'error':''}`}
      /*  maxLength={isInstagram? "2200" : "5000"}*/
        cols={8}
      />
    }
  </>
)
}
