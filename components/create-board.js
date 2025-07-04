'use client';

import { useState, useEffect } from 'react';
import { createBoard } from '@/lib/supabase'
import { getAllUsersAssignedToWorkspace } from '@/lib/supabase'
import { getAllUsers } from '@/lib/supabase'
import { Accordion } from '@/components/accordion'
import { getWorkspacesAssignedToUser } from '@/lib/supabase'
import { isInArray } from '@/lib/utils'
import User from '@/components/user'
import { BoardStatus } from '@/lib/constants'
import moment from "moment";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { showSuccess } from '@/lib/toast';
import { showError } from '@/lib/toast';
import { showInfo } from '@/lib/toast';

export default function CreateBoard({userId, workspaceId, accordionState}) {
  const [title, setTitle] = useState('');
  const [selectedWorkspaces, setSelectedWorkspaces] = useState(workspaceId?[workspaceId]:[]);
  const [workspaces, setWorkspaces] = useState([]);
  const [description, setDescription] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([userId]);


  const handleCreate = async (e) => {
    e.preventDefault();


    try {

      const boardData = {
        name: title,
        created_by:userId,
        description: description
      };

      if (selectedWorkspaces.length === 0){
        showError('Select At Least One Workspace')
        return
      }

      if (users.length === 0){
        showError('Select At Least One User')
        return
      }
      const newBoard = await createBoard(boardData, selectedUsers, selectedWorkspaces);
      showSuccess('Board created:', newBoard.name);
    } catch (error) {
      showError(error.message);
    }
  };

  const getUsersData = async () => {
    try {
      if (workspaceId){
        const workspacesUsers = await getAllUsersAssignedToWorkspace(workspaceId)
        setUsers(workspacesUsers);
      }else{
        const users = await getAllUsers()
        setUsers(users);
      }
    } catch (error) {
      showError(error.message);
    }
  }

  const getWorkspacesData = async () => {
    try {
        const usersWorkspaces = await getWorkspacesAssignedToUser(userId)
        setWorkspaces(usersWorkspaces);
    } catch (error) {
      showError(error.message);
    }
  }


  useEffect(() => {
        getUsersData()
  }, [workspaceId]);


  useEffect(() => {

      if (userId && !workspaceId){
        getWorkspacesData()
      }

  }, [userId]);


  const selectWorkspaceFunction = (data) => {
    if (isInArray(data, selectedWorkspaces)){

      setSelectedWorkspaces(prev => {
        return(
          prev.filter(remove => {
            return remove !== data
          })
        )
      });
    }else{
      setSelectedWorkspaces(selectedWorkspaces => [...selectedWorkspaces, data])
    }
  }

  const selectUserFunction = (data) => {
    if (isInArray(data, selectedUsers)){

      setSelectedUsers(prev => {
        return(
          prev.filter(remove => {
            return remove !== data
          })
        )
      });
    }else{
      setSelectedUsers(selectedUsers => [...selectedUsers, data])
    }
  }


  return (
    <div>
      <div style={{position:'relative', padding:'5px 25px 5px 25px'}} className="card">
        <h3>Create Board</h3>
        <Accordion initState={accordionState}>
          <form onSubmit={handleCreate}>
            <input
              className='form-input'
              type="text"
              placeholder="Q4 Social Media Ads"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <div>
              <label className="form-label"><strong>Description</strong></label>
              <textarea value={description} required onChange={(e) => setDescription(e.target.value)} className="form-input" id="taskDescription" rows="3"/>
            </div>
            {!workspaceId&&
              <>
              <p><strong>Choose A Workspace</strong> </p>
              {workspaces.map((workspace, index)=>{
                return(
                  <div
                    key={index}
                    onClick={() => selectWorkspaceFunction(workspace.id)}
                    style={{cursor:'pointer'}}
                    className={`${'select-tab'} ${isInArray(workspace.id, selectedWorkspaces)?'active': ''}`}
                  >
                    {workspace.name}
                  </div>
                )
              })
              }
            </>
            }

            <p><strong> Choose Users </strong></p>
              {users.map((user, index)=>{
                return(
                  <div
                    key={index}
                    onClick={() => selectUserFunction(user.id)}
                    style={{cursor:'pointer'}}
                    className={`${'select-tab'} ${isInArray(user.id, selectedUsers)?'active': ''}`}
                  >
                    <User userInfo={user} active={isInArray(user.id, selectedUsers)?true:false}/>
                  </div>
                )
              })
            }

            <button className="btn primary"  type="submit">Create</button>
          </form>
        </Accordion>
      </div>
    </div>
  );
}
