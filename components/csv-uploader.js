import React, { useState } from 'react';
import Papa from 'papaparse';

function CsvUploader() {
  const [csvData, setCsvData] = useState([]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true, // if your CSV has headers
      skipEmptyLines: true,
      complete: (results) => {
        setCsvData(results.data);
        console.log(results.data);
      },
      error: (err) => {
        console.error("Error parsing CSV:", err);
      }
    });
  };

  return (
    <div>
      <input type="file" accept=".csv" onChange={handleFileChange} />
      <h3>CSV Preview:</h3>
      <pre>{JSON.stringify(csvData, null, 2)}</pre>
    </div>
  );
}

export default CsvUploader;
