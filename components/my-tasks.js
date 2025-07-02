'use client';
import { useState, useEffect } from 'react';
import { getTasksAssignedToUser } from "@/lib/supabase"
import Link from "next/link"
import TaskCard from "@/components/task-card"
import { checkDate } from '@/lib/utils'
import moment from "moment";
import { generateSlug } from "@/lib/utils";


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
    <div className="col-3">
      {tasks.map((task, index) => {
        const date = checkDate(task.tasks.due_date)
          return(
            <div key={task.tasks.id} className={`${date?'':'overdue'} ${'task'}`}>
              <div className={`${generateSlug(task.tasks.status)} ${'status-bar'}`}>{task.tasks.status}</div>
              <Link href={`/task/${task.tasks.id}`}>
                <h3>{task.tasks.title}</h3>
              </Link>
                <p>{task.tasks.description}</p>
                <div style={{display:'flex', alignItems:'center'}} className='task-date'>
                  <img style={{maxWidth:'20px', marginRight:'5px'}} src='/calendar.svg'/>
                  <p>{moment(task.tasks.due_date).format("MMMM D, YYYY")}</p>
                </div>
                <p style={{marginTop:'25px'}}><strong> Boards Assigned to Task</strong></p>
                <div style={{display:'flex'}}>
                {task.tasks.boards_assigned_to_task.map((board, index) => {
                  return(
                    <div key={board.board_id}
                      style={{
                      marginRight:'5px'
                    }} className={`${'select-tab'} ${'select-tab-hover'}`}>
                        <Link href={`/board/${board.board_id}?task-id=${task.tasks.id}`}>
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
