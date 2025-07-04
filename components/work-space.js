'use client';

import { useState, useEffect, useRef } from 'react';
import { getWorkspaceWithMembersAndBoards } from "@/lib/supabase";
import CreateBoard from "@/components/create-board";
import WorkspaceMembers from "@/components/workspace-members";
import MyBoards from "@/components/my-boards";
import WorkspaceBoards from "@/components/workspace-boards";
import { boardFilterArray } from "@/lib/constants";
import { updateWorkspaceColumn } from "@/lib/supabase";
import { showSuccess } from '@/lib/toast';
import { showError } from '@/lib/toast';
import { showInfo } from '@/lib/toast';
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
          <WorkspaceTitle workspaceId={workspaceId} initValue={workspace.name}/>
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


const WorkspaceTitle = ({workspaceId, initValue}) => {
  const [inputValue, setInputValue] = useState(initValue)
  const [disabled, setDisabled] = useState(true)
  const inputRef = useRef(null);
  const spanRef = useRef(null);
  const [inputWidth, setInputWidth] = useState(1); // initial width

  useEffect(() => {
    if (initValue){
        setInputValue(initValue);
    }

  }, [initValue]);

  useEffect(() => {
  if (spanRef.current) {
    const spanWidth = spanRef.current.offsetWidth;
    setInputWidth(spanWidth + 30); // small padding for cursor
  }
}, [inputValue]);

//updateBoardColumn
  return(
    <div style={{display:'flex'}}>
      <input
        ref={inputRef}
        id={'workspace-title'}
        style={{marginBottom: '0px', marginTop:'0px', width: `${inputWidth}px`}}
        className='form-input workspace-name'
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        disabled={disabled}
        onBlur={async(e) => {
            const newValue = e.target.value;
            if (newValue !== initValue) {
              try{
                await updateWorkspaceColumn(workspaceId, 'name', newValue)
                showSuccess('workspace name updated')
              }catch(error){
                showError(error)
              }finally{
                setDisabled(true)
              }

            }
        }}
      />
      <span
        ref={spanRef}
        style={{
          position: 'absolute',
          visibility: 'hidden',
          whiteSpace: 'pre',
          font: 'inherit',
          fontSize: '1.3em',
          fontWeight: 'bold',
        }}
      >
        {inputValue}
      </span>
      <img style={{width:'20px', marginLeft:'10px'}} src='/edit.svg' onClick={() => setDisabled(prevState => !prevState)} />
  </div>
  )
}
