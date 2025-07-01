'use client';
import { useState, useEffect } from 'react';
import { getTasksAssignedToUser } from "@/lib/supabase"
import Link from "next/link"
import TaskCard from "@/components/task-card"
import { checkDate } from '@/lib/utils'
export default function MyTasks({userId}) {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getData = async () => {
    try {
        const tasksData = await getTasksAssignedToUser(userId)
        setTasks(tasksData);
    } catch (error) {
      setError(error.message);
    }
  }
  

  useEffect(() => {
    if (userId){
      getData()
    }

}, [userId]);

  return (
    <div>
      {tasks.map((task, index) => {


        const date = checkDate(task.tasks.due_date)


          return(
            <div key={task.tasks.id} className={`${date?'':'overdue'} ${'task'}`}>
              <Link href={`/task/${task.tasks.id}`}>
                <h2>{task.tasks.title}</h2>
              </Link>
                <p>{task.tasks.description}</p>
                <p style={{marginTop:'25px'}}><strong> Boards Assigned to Task</strong></p>
                <div style={{display:'flex'}}>
                {task.tasks.boards_assigned_to_task.map((board, index) => {
                  return(
                    <div key={board.id}
                      style={{
                      marginRight:'5px'
                    }} className={`${'select-tab'} ${'select-tab-hover'}`}>
                        <Link href={`/board/${board.board_id}#${task.tasks.id}`}>
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
  );
}
