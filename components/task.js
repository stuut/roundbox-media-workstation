'use client';
import { useState, useEffect } from 'react';
import { getTask } from "@/lib/supabase";
import { ToastContainer, toast, Slide } from 'react-toastify';
import TaskCard from '@/components/task-card'
import { showSuccess } from '@/lib/toast';
import { showError } from '@/lib/toast';
import { showInfo } from '@/lib/toast';

export default function Task({taskId, userId}) {

  const [task, setTask] = useState(null)


  const getData = async () => {
    try {
        const taskData = await getTask(taskId)
        console.log('taskData', taskData)


        setTask(taskData)
    } catch (error) {
      showError(error.message);
    }
  }


    useEffect(()=>{
      if (taskId){
        getData(taskId)
      }

    },[taskId] )


    const flattenMembers = (members) => {
      return members.map((item) => ({
        ...item.users,         // All task fields
      }));
    }


  return(
    <div style={{padding:'25px'}}>
      <ToastContainer />
      {task&&
        <TaskCard
          key={task.id}
          id={task.id}
          title={task.title}
          description={task.description}
          dueDate={task.due_date}
          createdBy={task.created_by_user}
          status={task.status}
          taskMembers={task.task_members? flattenMembers(task.task_members):[]}
          boards={task.boards_assigned_to_task??[]}
          boardColumns={task.boardColumns??[]}
          workspaceId={task.boards_assigned_to_task[0]?.boards.workspace_id[0]?.workspace_id}
          size={'large'}
        />
      }
    </div>
  )
}
