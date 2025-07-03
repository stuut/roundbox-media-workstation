'use client';
import { useState, useEffect } from 'react';



export const Accordion = ({children, initState}) => {
  const [open, setOpen] = useState(initState==='open'?true:false)

  return(
    <>
    <img onClick={() => setOpen(prevState => !prevState)} src="/chevron-backward.svg" style={{
      width: '30px',
      position: 'absolute',
      top: '11px',
      right: '3px',
      transform:open? 'rotate(-90deg)':'rotate(0deg)'
    }}/>
    <div style={{
      height: open? 'auto' : 0,
      overflow: open? 'unset' : 'hidden',
      position:'relative'
    }}>
    {children}
    </div>
    </>
  )
}
