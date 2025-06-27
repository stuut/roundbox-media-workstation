'use client';

import { useState } from 'react';
import { createWorkspaceWithMember } from "@/lib/supabase"

export default function CreateWorkspace({userId}) {
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');


  const handleCreate = async (e) => {
    e.preventDefault();
    setError('')
    setSuccess('');

    const workspaceData = { name: title, created_by: userId };

    try {
      const newWorkspace = await createWorkspaceWithMember(workspaceData, userId);
      setSuccess('Workspace created:', newWorkspace);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div style={{maxWidth:'600px'}}>
      <div className="card">
        <h2>Create Workspace</h2>
        <form onSubmit={handleCreate}>
              <input
                className='form-input'
                type="text"
                placeholder="Workspace name"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
          <button className="btn primary"  type="submit">Create</button>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {success && <p style={{ color: 'green' }}>{success}</p>}
        </form>
      </div>
    </div>
  );
}
