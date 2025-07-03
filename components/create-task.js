'use client';
import { useState, useEffect } from 'react';
import { getAllUsers } from '@/lib/supabase'
import { getAllUsersAssignedToWorkspace } from '@/lib/supabase'
import { getWorkspacesAssignedToUser } from '@/lib/supabase'
import { getBoardsAssignedToUser } from '@/lib/supabase'
import { Accordion } from '@/components/accordion'
import { createTask } from '@/lib/supabase'
import { insertNotification } from '@/lib/supabase'
import { isInArray } from '@/lib/utils'
import User from '@/components/user'
import moment from "moment";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { taskStatusArray } from '@/lib/constants'
import { showSuccess } from '@/lib/toast';
import { showError } from '@/lib/toast';
import { showInfo } from '@/lib/toast';

export default function CreateTask({userId, boardId, workspaceId}) {

  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([userId]);
  const [selectedWorkspaces, setSelectedWorkspaces] = useState(workspaceId?[workspaceId]:[]);
  const [workspaces, setWorkspaces] = useState([]);
  const [boards, setBoards] = useState([]);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [description, setDescription] = useState('');
  const [selectedBoards, setSelectedBoards] = useState(boardId?[boardId]:[]);
  const [status, setStatus] = useState(taskStatusArray[0]);

  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      const taskData = {
        title : title,
        created_by : userId,
        description : description,
        due_date : dueDate,
        status : status
      };


      if (selectedWorkspaces.length === 0){
        showError('Select At Least One Workspace')
        return
      }

      if (selectedBoards.length === 0){
        showError('Select At Least One Board')
        return
      }

      if (users.length === 0){
        showError('Select At Least One User')
        return
      }

      const newTask = await createTask(taskData, selectedUsers, selectedBoards, selectedWorkspaces)

      const newTaskId = newTask.id

      const message = `<span>A new task has been created for you: <a href="/task/${newTaskId}">View Task Here</a></span>`

        selectedUsers.forEach(async(userId) => {
          await insertNotification(userId, message)
        });

      showSuccess('Task created:', newTask);
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

  const getBoardsData = async () => {
    try {
        const usersBoards = await getBoardsAssignedToUser(userId)
        setBoards(usersBoards);
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

      if (userId && !boardId){
        getBoardsData()
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

  const selectBoardFunction = (data) => {
    if (isInArray(data, selectedBoards)){
      setSelectedBoards(prev => {
        return(
          prev.filter(remove => {
            return remove !== data
          })
        )
      });
    }else{
      setSelectedBoards(selectedWorkspaces => [...selectedWorkspaces, data])
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
        <p className="form-label" style={{display:'block'}}><strong>Create Task</strong></p>
        <Accordion initState={'closed'}>
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
            <div>
              <label className="form-label"><strong>Description</strong></label>
              <textarea
                id="taskDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-input" id="taskDescription" rows="3"
              />
            </div>
            {!workspaceId&&
              <div style={{marginTop:'25px'}}>
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
            </div>
            }
            {!boardId&&
              <div style={{marginTop:'25px'}}>
                <p><strong>Choose A Board</strong> </p>
                {boards.map((board, index)=>{
                  return(
                    <div
                      key={index}
                      onClick={() => selectBoardFunction(board.id)}
                      style={{cursor:'pointer'}}
                      className={`${'select-tab'} ${isInArray(board.id, selectedBoards)?'active': ''}`}
                    >
                      {board.name}
                    </div>
                  )
                })
                }
              </div>
            }
            <div style={{marginTop:'25px'}}>
              <p><strong>Assign Members</strong> </p>
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
            </div>
            <button style={{display:'block'}} className="btn primary"  type="submit">Create</button>
          </form>
        </Accordion>
      </div>
    </div>
  );

}
