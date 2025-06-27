import { useState, useEffect, useRef, useCallback } from 'react';

import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid' // a plugin!
import listPlugin from '@fullcalendar/list';
import timeGridPlugin from '@fullcalendar/timegrid';   // Week/Day
import interactionPlugin from '@fullcalendar/interaction'; // Optional for click/drag

export default function CalendarView({tasks, boardId, workspaceId}) {
  const [events, setEvents] = useState([])


  useEffect(() => {

    if (tasks){
      const updatedArray = tasks
      .map(item => {
        // Create a new object to avoid modifying the original
        return {
          ...item, // Copy existing properties
          end: item.due_date, // Change the value of the 'color' key
          start: item.created_at
        };
      });

      setEvents(updatedArray)


    }else{
      setEvents([])
    }

  }, [tasks]);



  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
      }}
      views={{
        timeGridWeek: { buttonText: 'Week' },
        timeGridDay: { buttonText: 'Day' },
        listMonth: { buttonText: 'List' }
      }}
      events={events}
      eventClassNames={(arg) => {
        const status = arg.event.extendedProps.status || '';
        return [`${'calendar-task'} ${status.toLowerCase().replace(/\s+/g, '-')}`];
      }}

    />
  )
}
