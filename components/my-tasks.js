'use client';
import { useState, useEffect } from 'react';
import { getTasksAssignedToUser } from "@/lib/supabase"
import { getTaskWithUserIdTaskId } from "@/lib/supabase"
import { getTasksCreatedByUser } from "@/lib/supabase"
import { taskFilterOptions } from "@/lib/constants"
import Link from "next/link"
import TaskCard from "@/components/task-card"
import { checkDate } from '@/lib/utils'
import moment from "moment";
import { generateSlug } from "@/lib/utils";
import { createClient } from '@/utils/supabase/client'
import { showSuccess } from '@/lib/toast';
import { showError } from '@/lib/toast';
import { showInfo } from '@/lib/toast';
import { isInArray } from '@/lib/utils'
import { deleteTasks } from "@/lib/supabase";

export default function MyTasks({userId}) {
  const supabase = createClient()
  const [tasks, setTasks] = useState([]);
  const [taskFilter, setTaskFilter] = useState(taskFilterOptions[0]);
  const [taskStatusFilter, setTaskStatusFilter] = useState('All');
  const [selectTasks, setSelectTasks] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState([]);


  const taskStatusArray = [
  'All',
  'Requested',
  'In Progress',
  'In Review',
  'Completed',
  ]


  useEffect(()=>{
    if (!selectTasks){
      setSelectedTasks([])
    }

  },[selectTasks])


  const getData = async () => {
    try {
        const tasksData = await getTasksAssignedToUser(userId)
        if (tasksData){
          setTasks(tasksData);
        }
    } catch (error) {
      showError(error.message);
    }
  }

  const getMyTasks = async () => {
    try {
        const tasksData = await getTasksCreatedByUser(userId)
        if (tasksData){
          setTasks(tasksData);
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


  useEffect(() => {
    const channel = supabase
      .channel('tasks-insert')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks',
        },
        async(payload) => {

          const taskId = payload.new.id
          const newTask = await getTaskWithUserIdTaskId(userId, taskId )
          if (newTask){
            setTasks(prev => [newTask, ...prev])
          }
          // You could also call a callback or update state here
        }
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(channel);
    };
   }, []);

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

   const deleteTasksFunction = async () => {

     try{

        await deleteTasks(selectedTasks)
        setSelectedTasks([])

        setTasks(prev => {
          return prev.filter((task)=> {
            return !selectedTasks.some((selectedTask)=> selectedTask === task.id)
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
          <p><strong>Task Filter</strong></p>
          <select id="task_filter" style={{minWidth:'200px'}} className="form-input select"
            onChange={(e) => {
              setSelectTasks(false)
              setSelectedTasks([])
              setTaskFilter(e.target.value)
              const newValue = e.target.value;

                  if (newValue === 'All'){
                    getData()
                  }else{
                    getMyTasks()
                  }

            }}
            value={taskFilter}>
              {taskFilterOptions.map(function(item, index){
                return(
                  <option key={index} value={item}>{item}</option>
                )
              })}
          </select>
        </div>
        <div style={{marginLeft:'10px'}}>
          <p><strong>Task Status Filter</strong></p>
          <select id="task_status_filter"style={{maxWidth:'250px'}} className="form-input select"
            onChange={(e) => {
              setSelectTasks(false)
              setSelectedTasks([])
              setTaskStatusFilter(e.target.value)
            }}
            value={taskStatusFilter}>
              {taskStatusArray.map(function(item, index){
                return(
                  <option key={index} value={item}>{item}</option>
                )
              })}
          </select>
        </div>
          <button style={{marginLeft:'10px', background:selectTasks?'var(--md-sys-color-primary)':'var(--md-sys-color-surface-container)', color:selectTasks?'#ffffff':'#000000' }} onClick={() => setSelectTasks(prev => !prev)} className={`${selectTasks?'primary':'secondary'} ${'btn'}`}>
            Select Tasks
          </button>
        {selectedTasks.length >0 && taskFilter === 'Created by me' &&
          <button style={{marginLeft:'10px'}} onClick={deleteTasksFunction} className='btn danger'>
            Delete Tasks
          </button>
        }
      </div>
    <div className="col-3">
      {tasks
        .filter((task)=>{
          if (taskStatusFilter === 'All'){
            return task
          }else{
            return task.status === taskStatusFilter
          }

        })
        .map((task, index) => {
        let date = true
        if (task.due_date){
          date = checkDate(task.due_date)
        }
          return(
            <div key={task.id} className={`${date?'':'overdue'} ${'task'} ${isInArray(task.id, selectedTasks)? 'selected': ''}`} onClick={selectTasks? () => selectTasksFunction(task.id): null}>
              <div style={{marginTop:'15px'}} className={`${generateSlug(task.status)} ${'status-bar'}`}>{task.status}</div>
              {selectTasks?(
                  <h3>{task.title}</h3>
              ):(
                <Link href={`/task/${task.id}`}>
                  <h3>{task.title}</h3>
                </Link>
              )}

                <p>{task.description}</p>
                {task.due_date &&
                <div style={{display:'flex', alignItems:'center'}} className='task-date'>
                  {isInArray(task.id, selectedTasks)?(
                    <img style={{maxWidth:'20px', marginRight:'5px'}} src='/calendar-white.svg'/>
                  ):(
                    <img style={{maxWidth:'20px', marginRight:'5px'}} src='/calendar.svg'/>
                  )}
                    <p>{moment(task.due_date).format("MMMM D, YYYY")}</p>
                </div>
                }
                <p style={{marginTop:'25px'}}><strong> Boards Assigned to Task</strong></p>
                <div style={{display:'flex', flexDirection:'column'}}>
                {task.boards_assigned_to_task.map((board, index) => {
                  return(
                    <div key={board.board_id}
                      style={{
                      marginRight:'5px'
                    }} className={`${'select-tab'} ${'select-tab-hover'}`}>
                        <Link href={`/board/${board.board_id}?task-id=${task.id}`}>
                          <p style={{margin:'0px'}}>{board.boards.name}</p>
                        </Link>

                    </div>
                  )
                 })
                }
              </div>
            </div>
          )
        })
      }
    </div>
  </div>
  );
}
