'use client';
import { useState, useEffect } from 'react';
import { getWorkspacesAssignedToUser } from "@/lib/supabase"
import Link from "next/link"

export default function MyWorkspaces({userId}) {
  const [workspaces, setWorkspaces] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getData = async () => {
    try {
        const workspacesData = await getWorkspacesAssignedToUser(userId)
        setWorkspaces(workspacesData);
    } catch (error) {
      setError(error.message);
    }
  }

  useEffect(() => {
    if (userId){
      getData()
    }

}, [userId]);

  return (
    <div className="col-3">
      {workspaces.map((workspace, index) => {
        return(
          <div key={index} className='workspace'>
            <Link href={`/workspace/${workspace.id}`}>
              <div key={index}>
                <h3>{workspace.name}</h3>
              </div>
            </Link>
          </div>
        )
      })
      }
    </div>
  );
}
