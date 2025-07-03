'use client';
import { useState, useEffect } from 'react';
import Link from "next/link"
import User from "@/components/user";
import moment from "moment";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { taskStatusArray } from '@/lib/constants'
import { updateTaskColumn } from "@/lib/supabase";
import { isInArray } from '@/lib/utils'
import { useUserContext } from '@/context/user-context'
import { deleteMembersFromTask } from "@/lib/supabase"
import { getAllUsersAssignedToWorkspace } from "@/lib/supabase"
import { getAllUsers } from "@/lib/supabase"
import { ToastContainer, toast, Slide } from 'react-toastify';
import { insertTaskMembers } from "@/lib/supabase"
import { showSuccess } from '@/lib/toast';
import { showError } from '@/lib/toast';
import { showInfo } from '@/lib/toast';
import { checkDate } from '@/lib/utils'



export default function TaskCard({
  id,
  title,
  description,
  dueDate,
  createdBy,
  boards,
  status,
  taskMembers,
  boardColumns,
  workspaceId,
  size
 }) {
  const  [showMiniMenu, setShowMiniMenu] = useState(false)
  const  [editable, setEditable] = useState(false)
  const  [titleValue, setTitleValue] = useState(title)
  const  [titleEditable, setTitleEditable] = useState(false)
  const  [descriptionValue, setDescriptionValue] = useState(description)
  const  [descriptionEditable, setDescriptionEditable] = useState(false)
  const  [statusValue, setStatusValue] = useState(status)
  const  [selectedUsers, setSelectedUsers] = useState([]);
  const  [taskMembersArray, setTaskMembersArray] = useState(taskMembers);


  const date = checkDate(dueDate)



  const { user } = useUserContext();


    useEffect(()=>{
      if (status){
        setStatusValue(status)
      }

      if (title){
        setTitleValue(title)
      }

      if (description){
        setDescriptionValue(description)
      }

    },[status, title, description] )


    useEffect(()=>{

      if (!editable){
        setSelectedUsers([])
      }

    },[editable])


    const selectUserFunction = (data) => {

      if (data === createdBy.id){
        return
      }

      if (isInArray(data, selectedUsers)){
        const removed = selectedUsers.filter(remove => {
          return remove !== data
        });
        setSelectedUsers(removed);
      }else{
        setSelectedUsers(selectedUsers => [...selectedUsers, data])
      }
    }

    const removeMembers = async() => {
      if (selectedUsers){
        setTaskMembersArray(prev => {
          return prev.filter((member)=> {
            return !selectedUsers.some((user)=> user === member.user_id)
          })
        })
      }
       await deleteMembersFromTask(id, selectedUsers)
    }

    const addMembers = async (newMembers) => {
      setTaskMembersArray(prev => [...prev, ...newMembers])
    }


  return(
    <>
    <div className={`${date?'':'overdue'} ${'task'}`} style={{position:'relative'}}>
      <div style={{position:'absolute', right:'10px', top:'10px'}}>
        <img onClick={() => setShowMiniMenu(prev => !prev)} style={{maxWidth: '30px'}} src={'/more_vert.svg'}/>
        {showMiniMenu&&
          <div className='card'
            style={{
              position:'absolute',
              background:'var(--md-sys-color-surface)',
              transform: 'translateX(-100%)',
              top: '10px',
              left: '10px',
              minWidth:'150px'
            }}
          >
            <div style={{cursor:'pointer'}} onClick={() => {
              setEditable(prev => !prev)
              setShowMiniMenu(false)
            }
          }>{editable?'Restrict Fields':'Edit Fields'}</div>
          {size==='small'&&
            <Link href={`/task/${id}`}>View Task</Link>
          }

          </div>
        }

      </div>
      <div style={{display:'flex'}}>
        {/*}<img style={{width:'20px', marginRight:'5px'}} src='/edit.svg' onClick={() => setTitleEditable(prevState => !prevState)} />*/}

        <Link href={`/task/${id}`}>
          <input
            id={title}
            className='form-input task-text-input title'
            type="text"
            value={titleValue ||''}
            disabled={!titleEditable && !editable}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={(e) => {
              const newValue = e.target.value;
              if (newValue !== description) {
                updateTaskColumn(id, 'title', newValue);
              }
            }}
          />
        </Link>
      </div>
      <div style={{display:'flex'}}>
        {/*}<img style={{width:'20px', marginRight:'5px'}} src='/edit.svg' onClick={() => setDescriptionEditable(prevState => !prevState)} />*/}

        <textarea
          id={description}
          className='form-input task-text-input'
          type="text"
          value={descriptionValue || ''}
          disabled={!descriptionEditable && !editable}
          onChange={(e) => setDescriptionValue(e.target.value)}
          onBlur={(e) => {
            const newValue = e.target.value;
            if (newValue !== description) {
              updateTaskColumn(id, 'description', newValue);
            }
          }}
        />
      </div>
        <div style={{marginTop:'25px'}}>
          <p><strong>Due Date </strong></p>
          {!editable?(
            <div style={{display:'flex', alignItems:'center'}}>
              <img style={{maxWidth:'20px', marginRight:'5px'}} src='/calendar.svg'/>
              <p>{moment(dueDate).format("MMMM D, YYYY")}</p>
            </div>
          ):(
            <DatePicker
              selected={new Date(dueDate)}
              onChange={(date) => {
                  if (new Date(date).getTime() !== new Date(dueDate).getTime()) {
                       updateTaskColumn(id, 'due_date', new Date(date))
                    }
              }}
              showTimeSelect
              dateFormat="MMMM d, yyyy h:mm aa"
              className={'form-input'}
            />
          )}
        </div>
      <div style={{marginTop:'25px'}}>
        <p><strong> Status </strong></p>
        <select className="form-input select task-input"
          onChange={(e) => {
            setStatusValue(e.target.value)
            const newValue = e.target.value;
              if (newValue !==  status){
                updateTaskColumn(id, 'status', newValue)
              }
          }}
          disabled={!editable}
          value={statusValue || ''}>
          {taskStatusArray.map(function(statusArrayValue, index){
            return(
              <option key={index} value={statusArrayValue}>{statusArrayValue}</option>
            )
          })}
        </select>
      </div>

      <div style={{marginTop:'25px'}}>
        <p><strong> Created By </strong></p>
        <div className={`${'select-tab'}`}>
          <User userInfo={createdBy} active={null}/>
        </div>
      </div>
      <div style={{marginTop:'25px'}}>
        <p><strong> Boards Assigned to Task</strong></p>
        {boards.map((board, index)=>{
          return(
            <div key={board.board_id}>
              <div className={`${'select-tab'}`}>
                  <Link href={`/board/${board.board_id}?task-id=${id}`}>
                    <p>{board.boards.name}</p>
                  </Link>

              </div>
            </div>
          )
        })

        }
      </div>
      <div style={{marginTop:'25px'}}>
        <p><strong> Task Members </strong></p>
        {taskMembersArray.map((item, index)=>{
          return(
            <div
              key={item.user_id}
              onClick={() => {editable? selectUserFunction(item.user_id):null}}
              className={`${'select-tab'} ${isInArray(item.user_id, selectedUsers)?'active': ''}`}>
              {item.users&&
                <User userInfo={item.users} active={isInArray(item.user_id, selectedUsers)}/>
              }
            </div>
          )
        })}
        {selectedUsers.length>0&&
          <button className='btn danger' onClick={removeMembers}>Remove Members</button>
        }
        <AddTaskMember workspaceId={workspaceId} taskId={id} existingUsers={taskMembersArray} callback={addMembers}/>
      </div>

    </div>
  </>
  )
}

const AddTaskMember = ({workspaceId, taskId, existingUsers, callback}) => {

    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [addMemberItem, setAddMemberItem] = useState(false)
    const [noUsers, setNoUsers] = useState(false)


  const getUsersData = async () => {
    try {

          let users
        //const users = await getAllUsers()

        if (workspaceId){
          users = await getAllUsersAssignedToWorkspace(workspaceId)
        }else{
          users = await getAllUsers()
        }


        const checkedUsers = users.filter((user, index)=> {
          return !existingUsers.some((existingUser) => {
            return existingUser.user_id === user.id
          })
        })

        if (checkedUsers.length === 0){
          setNoUsers(true)
        }else{
          setNoUsers(false)
        }


      setUsers(checkedUsers);
    } catch (error) {
      showError(error.message);
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

  const setAddMemberItemFunction = () => {
    setAddMemberItem(prevState => {
      const newState = !prevState;
      if (newState){
        getUsersData()
      }
      return newState;
    })
  }



  const addMembersFunction = async () => {
    try{


      await insertTaskMembers(taskId, selectedUsers)

      const newBaseUsers = users
        .filter(user => selectedUsers.includes(user.id))
        .map(user => {
          const base = { ...existingUsers[0] };
          base.user_id = user.id;
          base.users = { ...base.users, ...user };
          return base;
        });



      callback(newBaseUsers)
      setSelectedUsers([])
        setUsers([])
      setAddMemberItem(false)
    }catch(error){
      showError(error)
    }

  }

  return(
    <>
    {addMemberItem? (
      <>
        {noUsers &&
          <div className="warning" style={{position:'relative'}}>
            <div onClick={() => setAddMemberItem(false)} style={{position:'absolute', top:'2px', right:'2px'}}>
              <img src='/close-error.svg' style={{width:'20px'}}/>
            </div>
            No Members To Add
          </div>
        }
        {users && !noUsers&&
          <p><strong>Add Members</strong></p>
        }
        {users.map((user, index)=>{
            return(
              <div
                key={index}
                onClick={() => selectUserFunction(user.id)}
                style={{cursor:'pointer'}}
                className={`${'select-tab hover'} ${isInArray(user.id, selectedUsers)?'active': ''}`}
              >
                <User userInfo={user} active={isInArray(user.id, selectedUsers)?true:false}/>
              </div>
            )
        })}
        {selectedUsers.length > 0 &&
          <button disabled={!selectedUsers.length>0} className='btn primary' onClick={addMembersFunction}>{selectedUsers.length>1?'Add Members':'Add Member'}</button>
        }
      </>
    ) : (
      <div style={{display:'flex', justifyContent: 'start'}}>
        <button className='btn primary' onClick={setAddMemberItemFunction}>Add Member</button>
      </div>
    )}
  </>
  )
}
