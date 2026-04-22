'use client';
import { useEffect, useState } from 'react';

export default function EditImage({ initialPath }) {
  const [image, setImage] = useState(initialPath);

  const getFileName = (path) => path.split('/').pop(); // sample-image.jpg


  // connect to SSE for real-time updates
  useEffect(() => {
    const evtSource = new EventSource('/api/events');

    evtSource.onmessage = (event) => {

      const updatedFile = getFileName(event.data);
      const currentFile = getFileName(image);

    //console.log('event.data', event.data)
    //console.log('initialPath', initialPath)

    const updatedPath = event.data; // e.g. /temp-images/sample-image.jpg


    const currentPath = image.split('?')[0];

    //console.log('currentPath', currentPath)

    console.log('updatedPath', updatedPath);
    console.log('currentPath', currentPath);


    if (updatedFile === currentFile) {
        setImage(`${updatedPath}?t=${Date.now()}`);
      }


    //  var result = event.data.split('public');
    //  setImage(`${result[1]}?t=${Date.now()}`);
    };

    return () => evtSource.close();
  }, []);

  const handleEdit = async () => {

    const hasTimestamp = /\?t=\d+$/.test(image);

    let cleanUrl = image

    if (hasTimestamp){
      cleanUrl = image.replace(/\?t=\d+$/, "");
    }


    const res = await fetch('/api/edit-in-photoshop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image:cleanUrl }),
    });

    const data = await res.json();
    if (data.publicUrl) setImage(data.publicUrl);
  };

  return (
    <div>
      <img src={image} alt="editable" style={{ maxWidth: 400 }} />
      <br />
      <button onClick={handleEdit}>Edit in Photoshop</button>
    </div>
  );
}
