'use client'
import { useState, useEffect, useRef, memo, useMemo } from "react";


export const PostImporter = ({user}) => {
  const [jsonData, setJsonData] = useState(null);
  const [error, setError] = useState('');

  const handleFileUpload = (event) => {
  const file = event.target.files[0];

  // Safety check if the user cancels selection
  if (!file) return;

  // Optional: Restrict processing if the file isn't explicitly JSON
  if (file.type !== "application/json" && !file.name.endsWith('.json')) {
    setError("Please upload a valid .json file.");
    return;
  }

  const reader = new FileReader();

  // Triggered asynchronously once reading is finished
  reader.onload = (e) => {
    try {
      const parsedData = JSON.parse(e.target.result);
      setJsonData(parsedData);
      setError(''); // Reset any previous error status
    } catch (err) {
      setError('Failed to parse file. Ensure it is valid JSON.');
      setJsonData(null);
    }
  };

  // Read the file as raw text string
  reader.readAsText(file);
};

  return(
    <div>
      <h3>Upload and View JSON File</h3>

        {/* File input accepting only JSON files */}
        <input
          type="file"
          accept=".json,application/json"
          onChange={handleFileUpload}
        />

        {/* Error Messaging banner */}
        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}

        {/* Raw Output Display */}
        {jsonData && (
          <div style={{ marginTop: '20px' }}>
            <h4>Parsed JSON Data:</h4>
            <pre style={{ background: '#f4f4f4', padding: '15px', borderRadius: '5px' }}>
              {JSON.stringify(jsonData, null, 2)}
            </pre>
          </div>
        )}
    </div>
  )

}
