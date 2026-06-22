import { useState, useEffect, useRef, memo, useMemo } from "react";
import {
  X,
  EllipsisVertical,
} from 'lucide-react';

export const ThreeDotMenu = ({styles, children}) => {

  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  return(
    <div ref={dropdownRef} style={{position:'relative'}}>
      <EllipsisVertical onClick={() => setOpen(prev => !prev)}/>
        {open &&
          <div style={{
            position:'absolute',
            marginTop: '5px',
            zIndex: '100',
            backgroundColor: '#ffffff',
            borderRadius:'var(--input-border-radius)',
            padding:'10px',
            right: '100%'
          }} className='dropshadow'>
            <div onClick={()=>{setOpen(false)}}>
              {children}
            </div>
          </div>
        }
    </div>
  )

}
