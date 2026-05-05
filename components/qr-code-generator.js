"use client"
import React, {useState, useEffect, useCallback, useRef, memo} from 'react';
var QRCode = require('qrcode')


export default function Qrcode(){

  const [text, setText] = useState('')
  const generateQR = async () => {
    try {
      var opts = {
        type: 'image/png',
        quality: 1,
        width:2000,
        height:2000
      }

      const image = await QRCode.toDataURL(text, opts)

      var final_image = image.replace('data:image/jpeg;base64,', '')
      var a = document.createElement("a"); //Create <a>
        a.href = image; //Image Base64 Goes here
        a.download = text + ".png"; //File name Here
        a.click(); //Downloaded file

    } catch (err) {
      console.error(err)
    }
  }

  return (
    <>
          <div style={{
                margin: '0 auto',
                padding: '25px',
                minWidth: '600px'
            }}>
            <div style={{maxWidth:'1500px', margin:'0 auto'}}>
            <h2><strong>Create QR Code</strong></h2>
            <input
              className={'form-input'}
              type="text"
              name="text"
              placeholder="Text or Url"
              value={text}
              onChange={(e) => setText(e.target.value)}
              />
              <button
              className={'btn primary'}
              style={{marginTop:'25px'}}
              disabled={!text? true:false}
              onClick={() => generateQR()}><strong>Create QR Code</strong></button>
            </div>
          </div>




    </>
  )
}
