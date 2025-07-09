'use client';

import { useState } from 'react';
import { createWorkspaceWithMember } from "@/lib/supabase"
import { showSuccess } from '@/lib/toast';
import { showError } from '@/lib/toast';
import { showInfo } from '@/lib/toast';

export default function CreateWorkspace({userId}) {
  const [title, setTitle] = useState('');



  const handleCreate = async (e) => {
    e.preventDefault();


    const workspaceData = { name: title, created_by: userId };

    try {
      const newWorkspace = await createWorkspaceWithMember(workspaceData, userId);
       showSuccess('Workspace created:', newWorkspace);
    } catch (error) {
      showError(error.message);
    }
  };

  return (
    <div style={{maxWidth:'600px'}}>
      <div className="card">
        <h3>Create Workspace</h3>
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
        </form>
      </div>
    </div>
  );
}
