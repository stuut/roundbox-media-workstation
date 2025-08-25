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
import TaskMembers from '@/components/task-members'
import { sendNotifications } from "@/lib/utils";


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
  const  [taskDueDate, setTaskDueDate] = useState(new Date(dueDate));
  const [overdue, setOverDue] = useState(checkDate(dueDate));




  let date = true
  if (dueDate){
    date = checkDate(dueDate)
  }


  useEffect(()=>{

    setOverDue(checkDate(taskDueDate))
  },[taskDueDate])



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
        showError('you cannot modify the creator of the workspace')
        return
      }

      if (isInArray(data, selectedUsers)){
        setSelectedUsers(prev => prev.filter(remove => remove !== data))
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
    <div className={`${overdue?'':'overdue'} ${'task'}`} style={{position:'relative'}}>
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
      {dueDate &&
        <div style={{marginTop:'25px'}}>
          <p><strong>Due Date </strong></p>
          {!editable?(
            <div style={{display:'flex', alignItems:'center'}}>
              <img style={{maxWidth:'20px', marginRight:'5px'}} src='/calendar.svg'/>
              <p>{moment(dueDate).format("MMMM D, YYYY")}</p>
            </div>
          ):(
            <DatePicker
              selected={taskDueDate}
              onChange={async(date) => {
                  setTaskDueDate(date)
                  if (new Date(date).getTime() !== new Date(dueDate).getTime()) {
                       await updateTaskColumn(id, 'due_date', new Date(date))
                       showSuccess('Due Date Updated')
                    }
              }}
              showTimeSelect
              dateFormat="MMMM d, yyyy h:mm aa"
              className={'form-input'}
            />
          )}
        </div>
      }
      <div style={{marginTop:'25px'}}>
        <p><strong> Status </strong></p>
        <select className="form-input select task-input"
          onChange={(e) => {
            setStatusValue(e.target.value)
            const newValue = e.target.value;
              if (newValue !==  status){
                updateTaskColumn(id, 'status', newValue)
                const userArray = taskMembers.map((user)=>{
                  return user.id
                })
                const message = `<span>The status of one of your tasks has bee updated to <strong>${newValue}</strong> - <a href="/task/${id}"><strong>View Task Here<strong></a></span>`
                 sendNotifications(userArray, message)

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



      <TaskMembers taskId={id} createdBy ={createdBy} taskMembers={taskMembers} workspaceId={workspaceId} realtime={false} accordion={'open'}/>
      </div>
    </div>
  </>
  )
}
