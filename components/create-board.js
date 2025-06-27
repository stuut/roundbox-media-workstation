'use client';

import { useState, useEffect } from 'react';
import { createBoardWithMembers } from '@/lib/supabase'
import { getAllUsersAssignedToWorkspace } from '@/lib/supabase'
import { getWorkspacesAssignedToUser } from '@/lib/supabase'
import { isInArray } from '@/lib/utils'
import User from '@/components/user'
import { BoardStatus } from '@/lib/constants'
import moment from "moment";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function CreateBoard({userId, workspaceId}) {
  const [title, setTitle] = useState('');
  const [selectedWorkspaces, setSelectedWorkspaces] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [description, setDescription] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([userId]);
  const [startDate, setStartDate] = useState(new Date());
  const [totalBudget, setTotalBudget] = useState('');
  const [endDate, setEndDate] = useState(new Date());
  const [boardStatus, setBoardStatus] = useState(BoardStatus[0]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('')
    setSuccess('');

    const boardData = {
      name: title,
      created_by:userId,
      description: description
    };

    try {
      const newWorkspace = await createBoardWithMembers(boardData, selectedUsers, workspaceId);
      setSuccess('Board created:', newWorkspace);
    } catch (error) {
      setError(error.message);
    }
  };

  const getUsersData = async () => {
    try {
        const workspacesUsers = await getAllUsersAssignedToWorkspace(workspaceId)
        setUsers(workspacesUsers);
    } catch (error) {
      setError(error.message);
    }
  }

  const getWorkspacesData = async () => {
    try {
        const usersWorkspaces = await getWorkspacesAssignedToUser(userId)
        setWorkspaces(usersWorkspaces);
    } catch (error) {
      setError(error.message);
    }
  }


  useEffect(() => {
      if (workspaceId){
        getUsersData()
        setSelectedWorkspaces([workspaceId])
      }

  }, [workspaceId]);


  useEffect(() => {

      if (userId && !workspaceId){
        getWorkspacesData()
      }

  }, [userId]);


  const selectWorkspaceFunction = (data) => {
    if (isInArray(data, selectedWorkspaces)){
      const removed = selectedWorkspaces.filter(remove => {
        return remove !== data
      });
      setSelectedWorkspaces(removed);
    }else{
      setSelectedWorkspaces(selectedWorkspaces => [...selectedWorkspaces, data])
    }
  }

  const selectUserFunction = (data) => {
    if (isInArray(data, selectedUsers)){
      const removed = selectedUsers.filter(remove => {
        return remove !== data
      });
      setSelectedUsers(removed);
    }else{
      setSelectedUsers(selectedUsers => [...selectedUsers, data])
    }
  }


  return (
    <div style={{maxWidth:'600px'}}>
      <div className="card">
        <h2>Create Board</h2>
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
            <p> Choose A Workspace </p>
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
          <p> Choose Users </p>
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
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {success && <p style={{ color: 'green' }}>{success}</p>}
        </form>
      </div>
    </div>
  );
}
