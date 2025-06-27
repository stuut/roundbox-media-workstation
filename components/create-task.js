'use client';
import { useState, useEffect } from 'react';
import { getAllUsersAssignedToWorkspace } from '@/lib/supabase'
import { createTask } from '@/lib/supabase'
import { isInArray } from '@/lib/utils'
import User from '@/components/user'
import moment from "moment";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { taskStatusArray } from '@/lib/constants'

export default function CreateTask({userId, boardId, workspaceId}) {

  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([userId]);
  const [selectedWorkspaces, setSelectedWorkspaces] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [description, setDescription] = useState('');
  const [selectedBoards, setSelectedBoards] = useState(boardId?[boardId]:[]);
  const [status, setStatus] = useState(taskStatusArray[0]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('')
    setSuccess('');

    try {
      const taskData = {
        title : title,
        created_by : userId,
        description : description,
        due_date : dueDate,
        status : status
      };

      const newTask = await createTask(taskData, boardId, workspaceId, selectedUsers)
      setSuccess('Task created:', newTask);
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

  useEffect(() => {
      if (workspaceId){
        getUsersData()
      }

  }, [workspaceId]);


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
        <h2>Create Task</h2>
        <form onSubmit={handleCreate}>
          <input
            id="taskName"
            className='form-input'
            type="text"
            placeholder="Task name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <div>
            <label className="form-label" style={{display:'block'}}><strong>Due Date</strong></label>
            <DatePicker
              minDate={moment().toDate()}
              selected={dueDate}
              onChange={(date) => setDueDate(date)}
              showTimeSelect
              dateFormat="MMMM d, yyyy h:mm aa"
              className={'form-input'}
            />
          </div>
          <label className="form-label"><strong>Description</strong></label>
          <textarea
            id="taskDescription"  
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="form-input" id="taskDescription" rows="3"
          />
          <label className="form-label"><strong>Choose Members</strong></label>
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
