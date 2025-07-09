'use client';
import { useState, useEffect } from 'react';
import { getTasksAssignedToUser } from "@/lib/supabase"
import { createClient } from '@/utils/supabase/client'
import { showSuccess } from '@/lib/toast';
import { showError } from '@/lib/toast';
import { showInfo } from '@/lib/toast';
import { checkDate } from '@/lib/utils'
import { isInArray } from '@/lib/utils'
import { generateSlug } from "@/lib/utils";
import { addTasksToBoard } from "@/lib/supabase"



export default function AddTaskToBoard({ boardId, userId, existingBoardTasks}) {
  const supabase = createClient()
  const [tasks, setTasks] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [addTask, setAddTask ] = useState(false)
  const [noTasks, setNoTasks] = useState(false)

  const getTaskData = async () => {
    try {
        const tasksData = await getTasksAssignedToUser(userId)

        console.log('tasksData', tasksData)


        if (tasksData){

          const filteredTasks = tasksData.filter((task)=>{
            return !existingBoardTasks.some((existingBoardTask)=>{
              return existingBoardTask.id === task.id
            })
          })

          console.log('filteredTasks', filteredTasks)

          if (filteredTasks.length===0){
            setNoTasks(true)
          }else{
            setNoTasks(false)
          }

          setTasks(filteredTasks);
        }
    } catch (error) {
      showError(error.message);
    }
  }

  useEffect(()=>{
    if (addTask){
      getTaskData()
    }

  },[addTask])

  const selectTasksFunction = (data) => {

    if (isInArray(data, selectedTasks)){
      setSelectedTasks(prev => {
        return(
          prev.filter(remove => {
            return remove !== data
          })
        )
      });
    }else{
      setSelectedTasks(prev => [...prev, data])
    }

  }

  const addTasksFunction = async () => {
    try{
        await addTasksToBoard(boardId, selectedTasks)
        setSelectedTasks([])
        setAddTask(false)
    }catch(error){
      showError(error)
    }



  }



  return(
    <div style={{position:'relative'}}>
      <button onClick={() => setAddTask(prev => !prev)} style={{marginLeft:'10px'}} className='btn primary'>Add Tasks To Board</button>
      {addTask&&
        <div className="new-element-board drop-shadow">
            {noTasks &&
              <div className="warning" style={{position:'relative'}}>
                <div onClick={() => setAddTask(false)} style={{position:'absolute', top:'2px', right:'2px'}}>
                  <img src='/close-error.svg' style={{width:'20px'}}/>
                </div>
                You have no available tasks to add to this board
              </div>
            }
            {tasks.map((task)=>{
              let date = true

              console.log('task.due_date', task.due_date)
              if (task.due_date){
                date = checkDate(task.due_date)
              }

              console.log(date)

              return(
                <div style={{padding: '10px 20px', cursor:'pointer'}} key={task.id} className={`${date?'':'overdue'} ${'task'} ${isInArray(task.id, selectedTasks)? 'selected': ''}`} onClick={() => selectTasksFunction(task.id)}>
                  <h3 style={{margin: 0}}>{task.title}</h3>
                  <p style={{fontSize:'.8em', margin: 0}}>{task.description}</p>
                </div>
              )
            })}
            {selectedTasks.length>0&&
              <button className="btn primary" onClick={addTasksFunction}>Add Tasks</button>
            }
        </div>
      }

    </div>
  )
}
