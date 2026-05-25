import { useState, useEffect, useRef, memo, useMemo } from "react";
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';


export const Summary = ({text, defaultPlatform}) => {

  const [summary, setSummary]= useState(null)
  const [platform, setPlatform]= useState(defaultPlatform)
  const [tone, setTone]= useState('professional')
  const [loader, setLoader] = useState(false)


  const platforms = [ 'facebook', 'twitter', 'linkedin', 'instagram', 'threads']
  const tones = ['professional', 'casual', 'witty', 'inspirational', 'urgent']

  const isDev = process.env.NODE_ENV === 'development';

  const handlePlatormChange = (event) => {
    setPlatform(event.target.value)
  }

  const handleToneChange = (event) => {
    setTone(event.target.value)
  }


  const summarise = async() => {
    setLoader(true)

        try {
          //const text = postData._def.extendedProps.caption

          let endpoint = '/api/chat-gpt/summarise'

          if (isDev){
            endpoint = '/api/gemma/summarise'
          }

          const response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                caption : text,
                platform : platform,
                tone:tone
              }),
          });

          const data = await response.json();

          console.log('rewritten', data.rewritten)

          //const formattedText = data.rewritten.replace(/\. ?/g, '.\n');

          //console.log('formattedText', formattedText)

          setSummary(data.rewritten);

        } catch(error) {
          // Consider implementing your own error handling logic here
          setLoader(false)
          return showError(error.message);
        }
        finally {
          setLoader(false)
        }

  }

return(
  <div className='properties-container' style={{position:'relative'}}>
    <div style={loader? {display:'block'}:{display:'none'}} className={'loader_screen'}>
        <div style={{transform:'translate(-50%, -50%)'}}  className="loader"></div>
    </div>
    <strong>Summarise Caption</strong>
    <div style={{display:'flex', gap:'10px'}}>
        <div style={{flex:1}}>
            <p className="label">Platform</p>
            <select
              className="form-input select"
              id="platform"
              value={platform}
              label="Platform"
              onChange={handlePlatormChange}
            >
              {platforms.map((platform, index)=>{
                return(
                    <option key={index} value={platform}>{platform}</option>
                  )
                })
              }
            </select>
          </div>
          <div style={{flex:1}}>
          <p className="label">Tone</p>
            <select
              className="form-input select"
              id="tone"
              value={tone}
              label="Tone"
              onChange={handleToneChange}
            >
              {tones.map((tone, index)=>{
                return(
                    <option key={index} value={tone}>{tone}</option>
                  )
                })
              }
            </select>
          </div>
      </div>

    <button disabled={!platform && !tone} className="btn secondary btn-sm" onClick={summarise}>Summarise</button>

    {summary &&
      <textarea
        style={{minHeight:200}}
        onChange={(e) => setSummary(e.target.value)}
        value={summary}
        className={'form-input'}
        cols={8}
      />
    }
  </div>
)
}
