'use client';
import { useState, useEffect } from 'react';
import { getWorkspacesAssignedToUser } from "@/lib/supabase"
import { getWorkspacesCreatedByUser } from "@/lib/supabase"
import { deleteWorkspaces } from "@/lib/supabase"
import Link from "next/link"
import { workspaceFilterOptions } from "@/lib/constants"
import { isInArray } from '@/lib/utils'
import { showSuccess } from '@/lib/toast';
import { showError } from '@/lib/toast';
import { showInfo } from '@/lib/toast';


export default function MyWorkspaces({userId}) {
  const [workspaces, setWorkspaces] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [workspaceFilter, setWorkspaceFilter] = useState(workspaceFilterOptions[0]);
  const [selectWorkspaces, setSelectWorkspaces] = useState(false);
  const [selectedWorkspaces, setSelectedWorkspaces] = useState([]);

  const getData = async () => {
    try {
        const workspacesData = await getWorkspacesAssignedToUser(userId)
        setWorkspaces(workspacesData);
    } catch (error) {
      setError(error.message);
    }
  }


  const getMyWorkspaces = async () => {
    try {
        const workspacesData = await getWorkspacesCreatedByUser(userId)
        if (workspacesData){
          setWorkspaces(workspacesData);
        }

    } catch (error) {
      showError(error.message);
    }
  }




  useEffect(() => {
    if (userId){
      getData()
    }

  }, [userId]);




const selectWorkspacesFunction = (data) => {

  console.log('selectWorkspacesFunction')

  if (isInArray(data, selectedWorkspaces)){
    setSelectedWorkspaces(prev => {
      return(
        prev.filter(remove => {
          return remove !== data
        })
      )
    });
  }else{
    setSelectedWorkspaces(prev => [...prev, data])
  }

}

const deleteWorkspacesFunction = async () => {

  try{

     await deleteWorkspaces(selectedWorkspaces)
     setSelectedWorkspaces([])

     setWorkspaces(prev => {
       return prev.filter((workspace)=> {
         return !selectedWorkspaces.some((selectedWorkspace)=> selectedWorkspace === workspace.id)
       })
     })


  }catch (error){
    console.log(error)
  }

}

  return (
    <div>
      <div style={{display:'flex', paddingLeft: '10px', alignItems: 'end'}}>
          <div>
            <p><strong>Workspace Filter</strong></p>
            <select id="workspace_filter" style={{minWidth:'200px'}} className="form-input select"
              onChange={(e) => {
                setSelectWorkspaces(false)
                setSelectedWorkspaces([])
                setWorkspaceFilter(e.target.value)
                const newValue = e.target.value;

                    if (newValue === 'All'){
                      getData()
                    }else{
                      getMyWorkspaces()
                    }

              }}
              value={workspaceFilter}>
                {workspaceFilterOptions.map(function(item, index){
                  return(
                    <option key={index} value={item}>{item}</option>
                  )
                })}
            </select>
          </div>
        <button style={{marginLeft:'10px', background:selectWorkspaces?'var(--md-sys-color-primary)':'var(--md-sys-color-surface-container)', color:selectWorkspaces?'#ffffff':'#000000' }} onClick={() => setSelectWorkspaces(prev => !prev)} className={`${selectWorkspaces?'primary':'secondary'} ${'btn'}`}>
          Select Workspaces
        </button>
        {selectedWorkspaces.length >0 && workspaceFilter === 'Created by me' &&
          <button style={{marginLeft:'10px'}} onClick={deleteWorkspacesFunction} className='btn danger'>
            Delete Boards
          </button>
        }

    </div>
      <div className="col-3">
        {workspaces.map((workspace, index) => {
          return(
            <div key={workspace.id} className={`${'workspace'} ${isInArray(workspace.id, selectedWorkspaces)? 'selected': ''}`} onClick={selectWorkspaces? () => selectWorkspacesFunction(workspace.id): null}>
              {selectWorkspaces?(
                  <h3>{workspace.name}</h3>
              ):(
                <Link href={`/workspace/${workspace.id}`}>
                  <h3>{workspace.name}</h3>
                </Link>
              )}
            </div>
          )
        })
        }
      </div>
    </div>
  );
}
