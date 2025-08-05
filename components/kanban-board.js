'use client';

import { useState, useEffect } from 'react';
import { updateTaskColumn } from "@/lib/supabase";
import { taskStatusArray } from '@/lib/constants'
import { baseKaban } from '@/lib/constants'
import moment from "moment";
import { checkDate } from '@/lib/utils'
import { useSearchParams } from 'next/navigation'
import { insertNotification } from '@/lib/supabase'
import { sendNotifications } from "@/lib/utils";

export default function KanbanView({workspaceId, boardId, userId, tasks}) {
  const searchParams = useSearchParams()
  const taskFocus = searchParams.get('task-id')

  const [groupedItems, setGroupedItems] = useState({});
  const [activeColumn, setActiveColumn] = useState('');
  const [requestedTotalState, setRequestedTotalState] = useState(0);
  const [inProgressTotalState, setInProgressTotalState] = useState(0);
  const [inReviewTotalState, setInReviewTotalState] = useState(0);
  const [completedTotalState, setCompletedTotalState] = useState(0);

  const COLUMN_TITLES = taskStatusArray;

  const calculateTotals = (tasks) => {

    const totals = {
      Requested: 0,
      'In Progress': 0,
      'In Review': 0,
      Completed: 0,
    };

    tasks.forEach(({ status }) => {
      if (totals.hasOwnProperty(status)) {
        totals[status]++;
      }
    });

    setRequestedTotalState(totals.Requested);
    setInProgressTotalState(totals['In Progress']);
    setInReviewTotalState(totals['In Review']);
    setCompletedTotalState(totals.Completed);

  };

  const sortTasks = (tasks) => {

  const groupedItems = COLUMN_TITLES.reduce((acc, status) => {
    if (status === 'Unknown') {
      acc[status] = tasks.filter(
        item => !item.status || !COLUMN_TITLES.includes(item.status)
      );
    } else {

      acc[status] = tasks.filter(item => item.status === status);
    }
    return acc;
  }, {});


    setGroupedItems(groupedItems)

  }


  useEffect(() => {
    if (tasks){
      sortTasks(tasks)
      calculateTotals(tasks)
    }else{
      setGroupedItems(baseKaban)
    }

  }, [tasks]);

  const onDragStart = (e, item) => {
    e.dataTransfer.setData('item', JSON.stringify(item));
  };


  const onDrop = async (e, status) => {
      if (!e.dataTransfer.getData('item')) return;
      const item = JSON.parse(e.dataTransfer.getData('item'));


      //await updateTaskStatus(workspaceId, item.id, status)
      updateTaskColumn(item.id, 'status', status)


      const userArray = item.members.map((user)=>{
        return user.user_id
      })

      const message = `<span>The status of one of your tasks has bee updated to <strong>${status}</strong> - <a href="/task/${item.id}"><strong>View Task Here<strong></a></span>`
        sendNotifications(userArray, message)

  };

  const onDragOver = (e, status) => {
    e.preventDefault();
    console.log('onDragOver', status)
    setActiveColumn(status)
  };

  return(
    <>
    <div className="kanban-container">
      <div className="kanban">
      {Object.entries(groupedItems).map(([status, tasks]) => (
        <div key={status} className={`${"kanban-col"}`} onDrop={(e) => onDrop(e, status)} onDragOver={(e) => onDragOver(e, status)} style={{minHeight:'600px', padding:'0px 10px 0px 10px'}}>
          <div className="card" style={{height:'100%', padding:'15px'}}>
            <div style={{display:'flex', alignItems:'center'}}>
              <h3>{status}</h3>
              {status === 'Requested' &&
                <div className="kanban-count requested">
                  {requestedTotalState}
                </div>
              }
              {status ==='In Progress' &&
                <div className="kanban-count in-progress">
                  {inProgressTotalState}
                </div>
              }
              {status ==='In Review' &&
                <div className="kanban-count in-review">
                  {inReviewTotalState}
                </div>
              }
              {status ==='Completed' &&
                <div className="kanban-count completed">
                  {completedTotalState}
                </div>
              }
            </div>
            {tasks.map(task => (
              <Task taskFocus={taskFocus} key={task.id} task={task} onDragStart={onDragStart}/>
            ))}
          </div>
        </div>
      ))}
      </div>
    </div>
    </>
  )
}

export const Task = ({task, onDragStart, taskFocus}) => {
  const date = checkDate(task.due_date)
  return(
    <div
      className={`${date?'':'overdue'} ${'kanban-task'} ${taskFocus===task.id?'task-hilight': null}`}  style={{cursor:'pointer'}} draggable onDragStart={(e) => onDragStart(e, task)}>
      <h4><strong>{task.title}</strong></h4>
      {task.description&&
        <p className='task-description'>{task.description}</p>
      }
      {task.due_date&&
        <div style={{display:'flex', alignItems:'center'}}>
          <img style={{maxWidth:'20px', marginRight:'5px'}} src='/calendar.svg'/>
          <p>{moment(task.due_date).format("MMMM D, YYYY")}</p>
        </div>
      }

    </div>
  )

}
