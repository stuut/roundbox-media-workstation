'use client';
import { useState } from 'react';

export default function Chat() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');

  const handleSubmit = async () => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    setResponse(data.result || 'No response');
  };

  return (
    <div>
      <textarea
        rows={4}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Ask something..."
        className="form-input"
      />
      <button onClick={handleSubmit}>
        Submit
      </button>
      <pre className="mt-4 whitespace-pre-wrap">{response}</pre>
    </div>
  );
}
