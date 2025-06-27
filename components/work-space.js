'use client';

import { useState, useEffect } from 'react';
import { getWorkspaceWithMembersAndBoards } from "@/lib/supabase";
import CreateBoard from "@/components/create-board";
import WorkspaceMembers from "@/components/workspace-members";
import MyBoards from "@/components/my-boards";
import WorkspaceBoards from "@/components/workspace-boards";
import { boardFilterArray } from "@/lib/constants";

export default function Workspace({ workspaceId, userId }) {
  const [workspace, setWorkspace] = useState(null);
  const [error, setError] = useState(null);
  const [boardFilter, setBoardFilter] = useState(boardFilterArray[0]);

  const getData = async () => {
    try {
        const workspaceData = await getWorkspaceWithMembersAndBoards(workspaceId)
        setWorkspace(workspaceData[0])
        console.log('workspaceData[0]', workspaceData[0])
    } catch (error) {
      setError(error.message);
    }
  }


  useEffect(() => {

    if (workspaceId){
      getData()
    }

}, [workspaceId]);



  return (
    <>
      {workspace&&
        <>
        <div style={{padding:'15px'}}>
          <h2>{workspace.name}</h2>
        </div>
        <div className='workspace-layout'>
          <div>
            <div className='card'>
              <label className="form-label" style={{display:'block'}}><strong>Filter</strong></label>
              <select className="form-input" onChange={(e) => setBoardFilter(e.target.value)} value={boardFilter}>
                {boardFilterArray.map(function(filter, index){
                  return(
                    <option key={index} value={filter}>{filter}</option>
                  )
                })}
              </select>
            </div>
            <CreateBoard userId={userId} workspaceId={workspaceId}/>
              <WorkspaceMembers userId={userId} workspaceId={workspaceId} workspaceOwner={workspace.created_by}/>
          </div>
          <div>
            <h3>Boards</h3>
            {boardFilter === 'Boards I Am Assigned' &&
              <>
              <MyBoards userId={userId } workspaceId={workspaceId}/>
              </>
            }
            {boardFilter === 'All Workspace Boards' &&
              <>
                <WorkspaceBoards userId={userId} workspaceId={workspaceId} />
              </>
            }
          </div>
        </div>
      </>
      }
    </>
  );
}
