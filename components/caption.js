import { useState, useEffect, useRef, memo, useMemo } from "react";
import Switch from '@mui/material/Switch';
import { showSuccess } from '@/lib/toast';
import { showError } from '@/lib/toast';
import { showInfo } from '@/lib/toast';

export const Caption = ({
  caption,
  setCaption,
  customCaptions,
  setCustomCaptions,
  selectedSocialPages,
  setIsInstagram,
  isInstagram
}) => {

  const checkIfInstagram = () =>{

    const isInstagram = selectedSocialPages.some(page => page.platform === 'instagram');
    setIsInstagram(isInstagram)

    if (isInstagram && caption.length>2200){
      showError('Caption is too long for instagram')
    }
  }

  const customCaptionsToggle = (e) => {
    setCustomCaptions(!customCaptions)
  }


  useEffect(()=>{
    if (selectedSocialPages.length > 0 && caption?.length > 0){
      checkIfInstagram()
    }
  },[caption, selectedSocialPages])




return(
  <>
    <Switch
      onChange={customCaptionsToggle}
      sx={{
        '& .MuiSwitch-switchBase.Mui-checked': {
          color: 'var(--md-sys-color-primary)', // Color of the thumb when checked
        },
        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
          backgroundColor: 'var(--md-sys-color-surface-tint)', // Color of the track when checked
        },
      }}
    checked={customCaptions}
  />
    <p className='label'>Post Caption</p>
    <textarea
      id='caption'
      style={{minHeight:200}}
      value={caption??''}
      onChange={(e) => setCaption(e.target.value)}
      className={`form-input ${isInstagram && caption.length > 2200? 'error':''}`}
      maxLength={isInstagram? "2200" : "5000"}
      cols={8}
    />
  </>
)
}
