'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client'

const supabase = createClient()

export default function GoogleDrivePicker({callBackFunction}) {
  const [tokenClient, setTokenClient] = useState(null);
  const [accessToken, setAccessToken] = useState(null);

  const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

const SCOPES = 'https://www.googleapis.com/auth/drive'
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';




  function loadExternalScript(src, callback) {
    const script = document.createElement('script');
    script.src = src;
    script.onload = callback;
    document.body.appendChild(script);
  }


  useEffect(() => {

    if (typeof window === 'undefined') return; // 🛑 Avoid SSR errors


    loadExternalScript('https://accounts.google.com/gsi/client', () => {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse) => {
          setAccessToken(tokenResponse.access_token);
          launchPicker(tokenResponse.access_token); // ✅ Automatically open picker

        },
      });
      setTokenClient(client);
    });

    loadExternalScript('https://apis.google.com/js/api.js', () => {
      window.gapi.load('picker', { callback: () => {} });
    });
  }, []);


  const launchPicker = (token) => {
  const view = new window.google.picker.View(window.google.picker.ViewId.DOCS);
  const picker = new window.google.picker.PickerBuilder()
    .addView(view)
    .setOAuthToken(token)
    .setDeveloperKey(API_KEY)
    .setCallback(async (data) => {
      if (data.action === 'picked') {

        const file = data.docs[0]
        const fileId = file.id;

        // Ask user if they want to make the file public
        if (confirm('Make this file public?')) {
          try {
            await makeFilePublic(fileId, token);
            alert('File is now public!');
          } catch (e) {
            alert('Could not make file public: ' + e.message);
          }
        }

      //const publicUrl = file.id;


        callBackFunction(file)
        //alert('Public URL: ' + publicUrl);

      }
    })
    .build();

  picker.setVisible(true);
};

const openPicker = () => {
  if (!accessToken) {
    tokenClient.requestAccessToken();
  } else {
    launchPicker(accessToken);
  }
};

async function makeFilePublic(fileId, accessToken) {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      role: 'reader',
      type: 'anyone',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to make file public');
  }

  return response.json();
}


  return (
    <button onClick={openPicker} className='google-drive-button' disabled={!tokenClient}>
      <img style={{width:'150px', padding:'5px, 7px, 2px, 7px'}} src={'/google-drive-logo.png'}/>
    </button>
  );
}
