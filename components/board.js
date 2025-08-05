'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getBoardWithWorkspace } from "@/lib/supabase";
import { getBoardWithColumnsAndTasks } from "@/lib/supabase";
import { insertNewColumn } from "@/lib/supabase";
import { insertNotification } from "@/lib/supabase";
import { removeTasksFromBoard } from "@/lib/supabase";
import { updateColumnValue } from "@/lib/supabase";
import { updateColumnName } from "@/lib/supabase";
import { updateBoardFieldName} from "@/lib/supabase";
import { addNewColumnValue } from "@/lib/supabase";
import { getTasksForBoard } from "@/lib/supabase";
import { addNewBoardFieldValue } from "@/lib/supabase";
import { updateBoardFieldValue } from "@/lib/supabase";
import { getTask } from "@/lib/supabase";
import { deleteTasks } from "@/lib/supabase";
import { deleteColumnValues } from "@/lib/supabase";
import { updateTaskDueDate } from "@/lib/supabase";
import { updateTaskColumn } from "@/lib/supabase";
import { updateBoardColumn } from "@/lib/supabase";
import { deleteCustomColumns } from "@/lib/supabase";
import { uploadFilesPublic } from "@/lib/supabase";
import { storeFileInfo } from "@/lib/supabase";
import { getColumnValues } from "@/lib/supabase";
import { queryColumnValues } from "@/lib/supabase";
import { deleteMembersFromTask } from "@/lib/supabase"
import { getAllUsersAssignedToWorkspace } from "@/lib/supabase";
import { useFilesContext } from "@/context/files-context"
import { useAIContext } from "@/context/ai-context"
import { insertTaskMembers } from "@/lib/supabase"
import { getUserBoardUpdate } from "@/lib/supabase"
import GoogleDrivePicker from "@/components/google-drive-picker";
import GridTable from "@/components/grid-table";
import KanbanView from "@/components/kanban-board";
import CalendarView from "@/components/calendar-board";
import { makeFolderPublic } from "@/lib/supabase";
import { boardViewOptions } from "@/lib/constants";
import CreateTask from "@/components/create-task";
import User from "@/components/user";
import { createClient } from '@/utils/supabase/client'
import { isInArray } from '@/lib/utils'
import { enrichColumnValue } from '@/lib/utils'
import { filterDuplicates } from '@/lib/utils'
import { isUserInArrayBoardTable } from '@/lib/utils'
import { isObjectInArray } from '@/lib/utils'
import { checkDate } from '@/lib/utils'
import { formatToPostgresUTC } from '@/lib/utils'
import { groupMembersByTaskId } from '@/lib/utils'
import { isValidURL } from '@/lib/utils'
import { sanitizeWord } from '@/lib/utils'
import debounce from 'lodash.debounce';
import moment from "moment";
import DatePicker from "react-datepicker";
import { taskStatusArray } from '@/lib/constants'
import { boardTableHeaders } from '@/lib/constants'
import { baseHeaders } from '@/lib/constants'
import { newColumnTypesArray } from '@/lib/constants'
import { newBoardValuesArray } from '@/lib/constants'
import "react-datepicker/dist/react-datepicker.css";
import { useUserContext } from '@/context/user-context'
import { useSearchParams } from 'next/navigation'
import { getBoardWithColumnsAndTasksStatusFilter } from "@/lib/supabase";
import { getBoardWithColumnsAndTasksMemberFilter } from "@/lib/supabase";
import { deleteBoardField } from "@/lib/supabase";
import { insertNewBoardField } from "@/lib/supabase";
import { checkColumnName } from "@/lib/supabase";
import { checkBoardFieldName } from "@/lib/supabase";
import { evaluate } from 'mathjs';
import { aggregateColumnValues } from '@/lib/utils'
import { displayFormulaFunction } from '@/lib/utils'
import { sanitizeFormulaFunction } from '@/lib/utils'
import { sanitizeColumnIdFormulaFunction } from "@/lib/utils";
import DropdownBuilder from '@/components/dropdown-builder';
import { showSuccess } from '@/lib/toast';
import { showError } from '@/lib/toast';
import { showInfo } from '@/lib/toast';
import AddTaskToBoard from '@/components/add-task-to-board';
import BoardMembers from '@/components/board-members';
import { FilterToggle } from '@/components/filter-toggle';
import { sendNotifications } from "@/lib/utils";
import { handleFileDownload }  from "@/lib/utils";
import { DateItem } from '@/components/task-components';
import { AddDateItem } from '@/components/task-components';
import { ListItemData } from '@/components/task-components';
import { AddListItemData } from '@/components/task-components';
import { AddTextItem } from '@/components/task-components';
import { TextItem } from '@/components/task-components';
import { convertFormulaFunctionToIds } from '@/lib/utils'



export default function Board({ boardId, userId }) {
  //dashboard?board-type=Table
  //dashboard?board-type=Kanban
  //dashboard?board-type=Calendar
  const { setDisplayAI, setAIData } = useAIContext();


  const searchParams = useSearchParams()
  const boardType = searchParams.get('board-type')
  const taskFocus = searchParams.get('task-id')
  const supabase = createClient()
  const [boardView, setBoardView] = useState(boardType?boardType:boardViewOptions[0]);
  const [board, setBoard] = useState(null);

  const [selectedTasks, setSelectedTasks] = useState([]);
  const [tableHeaders, setTableHeaders] = useState(boardTableHeaders);
  const boardRef = useRef(board);
  const [selectedColItems, setSelectedColItems] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [colDefs, setColDefs] = useState([])
  const [rowData, setRowData] = useState([])
  const [dragIndex, setDragIndex] = useState(null);
  const [selectedRows, setSelectedRows] = useState([])
  const [addListItem, setAddListItem] = useState(null)
  const [selectedTaskMembers, setSelectedTaskMembers] = useState([])
  const COL_ORDER_STORAGE_KEY = "columnOrder";
  const COL_VISIBLE_STORAGE_KEY = "columnVisible";

  const pendingTaskMembers = useRef([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [allTasksMembers, setAllTasksMembers] = useState([]);
  const [selectMembersFilter, setSelectMembersFilter] = useState([]);
  const [clearCheckBoxes, setClearCheckBoxes] = useState(false);
  const [clearColumnCheckBoxes, setClearColumnCheckBoxes] = useState(false);
  const [dateFilter, setDateFilter] = useState('due_date');
  const [dateFilterDirection, setDateFilterDirection] = useState('');

//desc


  const reorderSavedColumns = (defaultHeaders) => {
    const savedOrder = localStorage.getItem(COL_ORDER_STORAGE_KEY+boardId);
      if (savedOrder) {
        const order = JSON.parse(savedOrder);
        console.log('order', order)
        // 1. Restore saved columns
        const ordered = order
          .map((field) => defaultHeaders.find((h) => h.field === field))
          .filter(Boolean);

        // 2. Find any new columns not in saved order
        const missing = defaultHeaders.filter(
          (col) => !order.includes(col.field)
        );

        // 3. Combine saved + new columns
        return  [...ordered, ...missing];
      } else {
        return defaultHeaders; // Fallback to default
      }
  }

  const checkColumnsVisibility = (defaultHeaders) => {
    const savedVisibility = localStorage.getItem(COL_VISIBLE_STORAGE_KEY+boardId);
      if (savedVisibility) {
        const headerVisibility = JSON.parse(savedVisibility);

        const newHeaders = defaultHeaders.map((header) =>{
          if (headerVisibility.some((hv) => hv.field === header.field)){
            const newObject = {...header}
            const visibleValue = headerVisibility.find((hv)=> hv.field === header.field)
            if (visibleValue){
              newObject.visible = visibleValue.visible
            }

            return newObject
          }else{
            return header
          }

        })

        return newHeaders

      }else{
        return defaultHeaders
      }

  }



  const onDragStart = (index) => {
    setDragIndex(index);
  };

  const onDrop = (index) => {
    if (dragIndex === null || dragIndex === index) return;

    const newCols = [...colDefs];
    const [moved] = newCols.splice(dragIndex, 1);
    newCols.splice(index, 0, moved);
    setColDefs(newCols);
    setDragIndex(null);

    localStorage.setItem(
      COL_ORDER_STORAGE_KEY+boardId,
      JSON.stringify(newCols.map((col) => col.field))
    );
  };

 function getType(value) {

  if (value === null) return 'null';
  if (Array.isArray(value)) return 'list';

  // Check if string is a valid ISO date
  if (typeof value === 'string') {
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
    if (isoDateRegex.test(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) return 'date';
    }
    return 'string';
  }

  if (value instanceof Date) return 'date';

  return typeof value;
}


  useEffect(() => {
    if (board){
      if (board.tasks){
        generateUsers(board)
      }

      generateColumns(board)
      boardRef.current = board;
      console.log('board data', board)
    }
  }, [board]);





const generateUsers = (board) => {
  const membersArray =[]
  board.tasks.forEach((task) => {
    task.members?.forEach((member) => {
        if (!isUserInArrayBoardTable(member.user_id, membersArray)){
              membersArray.push(member)
            }
      })
  });
  setAllTasksMembers(membersArray)
}


  const generateColumns = (boardData) => {
    if (boardData && boardData.tasks.length>0){
      // Create headers from task fields
      let headers = Object.keys(boardData.tasks[0])
            // ✅ remove  users & column_values from supabase join
        .filter(key => key !== "column_values" && key !== "users" && key !== "created_by_user" && key !== "created_by_user" && key !== "is_recurring" && key !== "recurrence_days" && key !== "boards_assigned_to_task") // exclude key
        .map((key, index) => {
          let type
          if(key === 'description'){
            type = 'text'
          }else if (key === 'status'){
            type = 'select'
          }else if (key === 'created_by'){
            type = 'object'
          }else{
            type = getType(boardData.tasks[0][key])
          }
          return(
            {
              field: key,
              index,
              type: type,
              width: 200,
              visible:true
            }
          )

        }
    );



      // Add dynamic columns from board.columns
      headers = [
        ...headers,
        ...boardData.columns.map((col, index) => ({
          field: col.name,
          index: headers.length + index,
          type: col.type,
          width: 200,
          id: col.id,
          visible:true,
          column_select_options: col.column_select_options
        })),
      ];

      // Create row data
      const rowData = boardData.tasks.map((task) => {
        // Base row from core task fields
        const base = { ...task };

        // ✅ remove  users & column_values from supabase join

        delete base.users;
        delete base.created_by_user;
        delete base.column_values;

        base.status = {...{value:base.status}, ...{array:taskStatusArray}}

        // ✅ Replace created_by UUID with actual user object
        if (task.created_by_user) {
          base.created_by = task.created_by_user; // overwrite UUID with user object
        }
        // Add dynamic column values
        boardData.columns.forEach((col) => {
          const colVals = task.column_values.filter(val => val.column_id === col.id);

          if (colVals.length > 0) {
            base[col.name] = colVals.map((val) => ({
              ...val,
              custom_column: true,
              visible:true,
            }));
          } else {
            base[col.name] = [];
          }
        });

        return base;
      });


      headers = [{ field: "select-task", type: "checkbox", width: 50, visible:true }, ...headers]

      const reorderedColumns = reorderSavedColumns(headers)

      const visibleColumns = checkColumnsVisibility(reorderedColumns)


      setColDefs(visibleColumns)
      setRowData(rowData)

    }else{
      let headers = [{ field: "select-task", type: "checkbox", width: 50, visible:true }, ...baseHeaders]
      const reorderedColumns = reorderSavedColumns(headers)
      const visibleColumns = checkColumnsVisibility(reorderedColumns)

      setColDefs(visibleColumns)
      setRowData([])
    }

  }


  const getData = async () => {
    try {
       //const taskData = await getTasksForBoard(boardId)
        const boardData = await getBoardWithColumnsAndTasks(boardId)
        //generateColumns(boardData[0])

        setBoard(boardData[0])
    } catch (error) {
      showError(error.message);
    }
  }


  useEffect(() => {

    if (boardId){
      getData()
    }

}, [boardId]);

const addMemberToTask = async (task_id, user_id) => {
  try {
    const newMember = await getUserBoardUpdate(user_id);

    const newMemberObject = {
      users: {
        full_name: newMember.full_name,
        avatar_url: newMember.avatar_url
      },
      user_id: newMember.id
    };

    setBoard(prev => {
      const updatedTasks = prev.tasks.map(task => {
        const isAlreadyMember = task.members.some(
          member => member.user_id === user_id
        );

        if (task.id === task_id && !isAlreadyMember) {
          return {
            ...task,
            members: [...task.members, newMemberObject]
          };
        }

        return task;
      });

      return {
        ...prev,
        tasks: updatedTasks
      };
    });

  } catch (error) {
    showError('Error adding member to task:', error);
  }
};



const addNewTask = async(taskId) => {
  try{
    const newTask = await getTask(taskId)

    if (!board.tasks.some((task)=>task.id === taskId)){
      setBoard(prev => ({
        ...prev,
        tasks: [...prev.tasks, newTask]
      }));

    }

  }catch (error){
    showError(error)
  }
}

const updateTask = async(task_id) => {
  try{
    const newTask = await getTask(task_id)
  }catch (error){
    showError(error)
  }
}

const updateTaskColumnValues = async(data) => {
  try{
    const newColumn = await getColumnValues(data.id)

    setBoard(prev => {
      const updatedTasks = prev.tasks.map(task => {
        if (task.id === data.task_id) {
          return {
            ...task,
            column_values:[...task.column_values, newColumn],
          };
        }
          return task;

      });

      return {
        ...prev,
        tasks: updatedTasks,
      };
    });

  }catch (error){
    showError(error)
  }

}
//board-field-values-update
useEffect(() => {
  const channel = supabase
    .channel('board-field-values-update')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'board_field_values',

      },
      (payload) => {
        console.log('board_field_values payload', payload)


           if (payload.eventType === 'UPDATE'){

            setBoard(prev => {


              const updatedBoardFields = prev.board_fields.map(boardField => {
                if (boardField.id === payload.new.board_field_id) {
                  const newFieldValues = boardField.board_field_values.map(fieldValue => {
                    if (fieldValue.id === payload.new.id){
                      return { ...fieldValue, value: payload.new.value }
                    }
                    return fieldValue
                  })

                  return {
                     ...boardField,
                     board_field_values: newFieldValues,
                 };
                }
                return boardField;
              });
              return {
                ...prev,
                board_fields: updatedBoardFields,
              };

            });

          }else if (payload.eventType === 'INSERT'){

            if (payload.new.type === 'text' ||
              payload.new.type === 'string' ||
              payload.new.type === 'select' ||
              payload.new.type === 'date' ||
              payload.new.type === 'list' ||
              payload.new.type === 'number' ||
              payload.new.type === 'checkbox' ||
              payload.new.type === 'formula'){

              setBoard(prev => {


                    const updatedBoardFields = prev.board_fields.map(boardField => {
                      if (boardField.id === payload.new.board_field_id) {
                        return {
                          ...boardField,
                          board_field_values: [...boardField.board_field_values, payload.new]
                        }
                      }
                      return boardField;
                    });


                    return {
                      ...prev,
                      board_fields: updatedBoardFields,
                    };

              });

            }
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
//board-fields-inserts
useEffect(() => {
  const channel = supabase
    .channel('board-fields-inserts')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'board_fields',
        /*filter: `board_id=eq.${boardId}`*/
      },
      (payload) => {

        console.log('board_fields payload', payload)
        if (payload.eventType === 'DELETE'){
          setBoard(prev => {
            const updatedBoardFields = prev.board_fields.filter(board_field => {
                  return board_field.id !== payload.old.id
            });
            return {
              ...prev,
              board_fields: updatedBoardFields,
            };
          });
         }

           if (payload.new.board_id === boardId) {

              if (payload.eventType === 'INSERT'){
                setBoard(prev => {
                  const combined = { ...payload.new,
                    board_field_values:[]
                  }

                  return{
                    ...prev,
                    board_fields: [...prev.board_fields, combined]
                  }
                });
              }
        }
      }
    )
    .subscribe();

  // Cleanup on unmount
  return () => {
    supabase.removeChannel(channel);
  };
 }, []);


useEffect(() => {
  const channel = supabase
    .channel('task-members')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'task_members',
      },
      (payload) => {
        console.log('task-members payload', payload)

        if (payload.eventType === 'UPDATE'){

        }else if (payload.eventType === 'DELETE'){

          const userId = payload.old.user_id
          const taskId = payload.old.task_id
          setBoard(prev => {
            const updatedTasks = prev.tasks.map(task => {
              if (task.id === taskId){
                const updatedMembers = task.task_members.filter(member => member.user_id !== userId);
                return {
                  ...task,
                  task_members: updatedMembers,
                };
              }
              return task
            });

            return {
              ...prev,
              tasks: updatedTasks,
            };

          });

        }else if (payload.eventType === 'INSERT'){

          const { task_id, user_id } = payload.new;

          const taskExists = boardRef.current.tasks.find(task => task.id === task_id);
          if (taskExists) {
            addMemberToTask(task_id, user_id);
          } else {
          //  console.log('push to pending', pendingTaskMembers.current)
          //  pendingTaskMembers.current.push({ task_id, user_id });
          }

        }

      }
    )
    .subscribe();

  // Cleanup on unmount
  return () => {
    supabase.removeChannel(channel);
  };
 }, []);


 useEffect(() => {
   const channel = supabase
     .channel('board-updates')
     .on(
       'postgres_changes',
       {
         event: 'UPDATE',
         schema: 'public',
         table: 'boards',
         filter: `id=eq.${boardId}`
       },
       (payload) => {
         console.log('boards payload', payload)

         setBoard(prev => {

           if (prev.name !== payload.new.name){
             return {
               ...prev,
               name: payload.new.name,
             };
           }else{
             return {
               ...prev,
               description: payload.new.description,
             };
           }

         });

       }
     )
     .subscribe();

   // Cleanup on unmount
   return () => {
     supabase.removeChannel(channel);
   };
  }, []);


useEffect(() => {
  const channel = supabase
    .channel('board-inserts')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'board_tasks',
      },
      (payload) => {
        console.log('board_tasks payload', payload)

        if (payload.eventType === 'DELETE'){
          setBoard(prev => {
            const updatedTasks = prev.tasks.filter((task)=> {
              return task.id !== payload.old.task_id
            })

            return {
              ...prev,
              tasks: updatedTasks
            };

          })
        }else if (payload.eventType === 'INSERT'){
          addNewTask(payload.new.task_id)
        }
      }
    )
    .subscribe();

  // Cleanup on unmount
  return () => {
    supabase.removeChannel(channel);
  };
 }, []);


 useEffect(() => {
   const channel = supabase
     .channel('new-tasks')
     .on(
       'postgres_changes',
       {
         event: '*',
         schema: 'public',
         table: 'tasks',
       },
       (payload) => {
         console.log('new-tasks payload', payload)

         //const update = columns.find(c => c.id === rawValue.column_id);
         if (payload.eventType === 'UPDATE'){

           setBoard(prev => {
             const updatedTasks = prev.tasks.map(task => {
               if (task.id === payload.new.id){
                 return { ...task, ...payload.new }
               }
               return task
             });

             return {
               ...prev,
               tasks: updatedTasks,
             };
           });

         }else if (payload.eventType === 'DELETE'){

                 setBoard(prev => {
                   const updatedTasks = prev.tasks.filter(task => {
                         return task.id !== payload.old.id
                   });

                   return {
                     ...prev,
                     tasks: updatedTasks,
                   };
                 });

         }else if (payload.eventType === 'INSERT'){
           const enrichedValue = enrichColumnValue(payload.new, boardRef.current.columns);
            addNewTask(payload.new.id)
         }

       }
     )
     .subscribe();

   // Cleanup on unmount
   return () => {
     supabase.removeChannel(channel);
   };
  }, []);



 useEffect(() => {
   const channel = supabase
     .channel('column-value-inserts')
     .on(
       'postgres_changes',
       {
         event: '*',
         schema: 'public',
         table: 'column_values',
       },
       (payload) => {

         if (payload.eventType === 'DELETE'){

           setBoard(prev => {
             const updatedTasks = prev.tasks.map(task => {
               const newColumnValues = task.column_values.filter(col => col.id !== payload.old.id);
               return {
                 ...task,
                 column_values:newColumnValues,
               };
             });

             return {
               ...prev,
               tasks: updatedTasks,
             };
           });
          }

          if (payload.new.board_id === boardId) {

           if (payload.eventType === 'INSERT') {

              if (payload.new.type === 'text' ||
                payload.new.type === 'string' ||
                payload.new.type === 'select' ||
                payload.new.type === 'date' ||
                payload.new.type === 'list' ||
                payload.new.type === 'tags' ||
                payload.new.type === 'number' ||
                payload.new.type === 'checkbox' ||
                payload.new.type === 'checkbox list' ||
                payload.new.type === 'dropdown' ||
                payload.new.type === 'url' ||
                payload.new.type === 'data' ||
                payload.new.type === 'formula'){


                setBoard(prev => {


                  const enrichedColumnValue = enrichColumnValue(payload.new, prev.columns);


                  const updatedTasks = prev.tasks.map(task => {
                    if (task.id === payload.new.task_id) {
                      return {
                        ...task,
                        column_values: [...task.column_values, enrichedColumnValue],
                      };
                    }
                    return task;
                  });

                  return {
                    ...prev,
                    tasks: updatedTasks,
                  };
                });

              }else if (payload.new.type === 'file'){

                  //getColumnvalues(payload.new.id)
                //const enrichedColumnValue = enrichColumnValue(payload.new, boardRef.current.columns);
                updateTaskColumnValues(payload.new)

              }

           }else if (payload.eventType === 'UPDATE'){

             setBoard(prev => {
               const updatedTasks = prev.tasks.map(task => {
                 if (task.id === payload.new.task_id) {
                   const newColumnValues = task.column_values.map(col => {
                     if (col.id === payload.new.id){
                       return { ...col, value: payload.new.value }
                     }
                     return col
                   })

                   return {
                      ...task,
                      column_values: newColumnValues,
                  };
                 }
                 return task;
               });

               return {
                 ...prev,
                 tasks: updatedTasks,
               };
             });


           }

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


  useEffect(() => {
    const channel = supabase
      .channel('custom-columns')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'columns',
        },
        (payload) => {

          console.log('columns payload', payload)


          if (payload.eventType === 'DELETE'){

              setBoard(prev => {
                const updatedColumns = prev.columns.filter(column => {
                      return column.id !== payload.old.id
                });

                return {
                  ...prev,
                  columns: updatedColumns,
                };
              });

           }

          if (payload.new.board_id === boardId) {

            if (payload.eventType === 'INSERT') {


              if (payload.new.type === "dropdown"){
                getData()
              }else{

                setBoard(prev => {
                  return{
                    ...prev,
                    columns: [...prev.columns, payload.new]
                  }
                });

              }


            }else if (payload.eventType === 'UPDATE'){


            }

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


useEffect(() => {

    if(selectMembersFilter.length>0){
        getFilteredTaskMembers(selectMembersFilter)
    }else{
      getData()
    }

}, [selectMembersFilter]);


const getFilteredTaskMembers = async () => {

  try{
    const memberFilterData = await getBoardWithColumnsAndTasksMemberFilter(boardId, selectMembersFilter)

    setBoard(memberFilterData)

  }catch(error){
    showError(error)
  }
}


 const selectMembersFilterFunction = (data) => {

   setClearCheckBoxes(false)

   if (isInArray(data, selectMembersFilter)){
     const removed = selectMembersFilter.filter(remove => {
       return remove !== data
     });
     setSelectMembersFilter(removed);
   }else{
     setSelectMembersFilter(selectMembersFilter => [...selectMembersFilter, data])
   }

 }


 const selectTaskFunction = (data) => {

   if (isInArray(data, selectedTasks)){
     const removed = selectedTasks.filter(remove => {
       return remove !== data
     });
     setSelectedTasks(removed);
   }else{
     setSelectedTasks(selectedTasks => [...selectedTasks, data])
   }

 }


 const deleteMembersFromTaskFunction = async () =>{
   try{
     const grouped = groupMembersByTaskId(selectedTaskMembers)

     grouped.forEach(async function(task, index) {

      const deletedMembers = await deleteMembersFromTask(task.taskId, task.userIds)

    });

     setSelectedTaskMembers([])
   }catch (error){
     showError(error)
   }
 }


 const deleteColumnsFunction = async () =>{
   try{
     const deletedColumns = await deleteCustomColumns(selectedColumns)
     setSelectedColumns([])
     setClearColumnCheckBoxes(true)
   }catch (error){
     showError(error)
   }
 }

 const deleteTasksFunction = async () =>{
   try{
     await removeTasksFromBoard(boardId, selectedTasks)

      setSelectedTasks([])


   }catch (error){
     showError(error)
   }


 }

 const deleteColumnValuesFunction = async () =>{
   try{
      const deletedColumnValues= await deleteColumnValues(selectedColItems)

   }catch (error){
     showError(error)
   }


 }

 const selectedColItemsFunction = (data) =>{
   if (isInArray(data, selectedColItems)){
     const removed = selectedColItems.filter(remove => {
       return remove !== data
     });
     setSelectedColItems(removed);
   }else{
     setSelectedColItems(selectedColItems => [...selectedColItems, data])
   }
 }


 const selectColumnsFunction = (data) => {

   if (isInArray(data, selectedColumns)){
     const removed = selectedColumns.filter(remove => {
       return remove !== data
     });
     setSelectedColumns(removed);
   }else{
     setSelectedColumns(selectedColumns => [...selectedColumns, data])
   }

 }

 const selectMembersFunction = (user, taskId) => {

    const isUserInArray = selectedTaskMembers.some((taskMember)=>{
      return taskMember.userId === user.user_id

    })

   if (isUserInArray){

     const removed = selectedTaskMembers.filter(remove => {
       return remove.userId !== user.user_id
     });

     setSelectedTaskMembers(removed);
   }else{
     setSelectedTaskMembers(selectedTaskMembers => [...selectedTaskMembers, {userId:user.user_id, taskId:taskId}])
   }
 }



 const handleCheckboxChange = (data) => {

   if (isInArray(data, selectedRows)){
     const removed = selectedRows.filter(remove => {
       return remove !== data
     });
     setSelectedRows(removed);
   }else{
     setSelectedRows(selectedRows => [...selectedRows, data])
   }

 }

 const handleFileFunction = async (data, columnId, taskId, boardId) => {
   try{

     const fileinfo = await storeFileInfo({
       user_id:userId,
       file_url: data.file_url,
       file_type:data.file_type
     })


     await addNewColumnValue({
          task_id: taskId,
          column_id: columnId,
          board_id: boardId,
          value: null,
          type:'file',
          file_id: fileinfo.id
        });

   }catch (error){
     showError('Error updating task due date: ', error)
   }
 }


 const calculateWidth = () => {
   return colDefs.reduce((sum, col) => {
     if (col.visible) {
       return sum + (Number(col.width) || 0);
     }
     return sum;
   }, 0);
 };
 const statusFilterArray = ['All', ...taskStatusArray]


 const resizeColumnsCallback = (width, col, index) => {


setColDefs(prevItems => {
      const updatedItems = [...prevItems]; // step 1
      updatedItems[index] = {
        ...updatedItems[index],           // step 2
        width: width                    // step 3
      };
      return updatedItems;               // step 4
});

 }

 const dateFilterFunction = (direction, columnValue) => {
   setDateFilter(columnValue)
   setDateFilterDirection(direction)
 }

 const analyzeFunction = () => {





   const items = rowData
    .filter((item) => selectedTasks.includes(item.id))
    .map((item) => {
      const newItem = {};

      const keys = Object.keys(item);
      for (const key of keys) {


        if (Array.isArray(item[key]) && selectedColumns.includes(item[key][0]?.column_id)) {
            newItem[key] = item[key][0]?.value;
        }
        if (key === 'title') {
            newItem[key] = item[key]
        }
      }
      return newItem;

    });

      console.log('items', items)

   setDisplayAI(true)
   setAIData(items)
 }


  return (
    <>
      {(board && colDefs && rowData)&&
        <>
        <div style={{padding:'15px'}}>
          <BoardTitle boardId={boardId} initValue={board.name}/>
        </div>
        <div className='board-layout-float'>
          <div>
            <div style={{display:'flex', alignItems:'center'}}>
              <div style={{
                background: 'var(--md-sys-color-error)',
                width:'10px',
                height:'10px'
              }}></div>
              <p style={{marginLeft:'5px'}}>Over Due</p>
            </div>
            <div className='card'>
              <p className="form-label" style={{display:'block'}}><strong>View Filter</strong></p>
              <select className="form-input select"
                onChange={(e) => {
                setBoardView(e.target.value)
                const url = new URL(window.location.href);
                url.searchParams.set('board-type', e.target.value);
                window.history.replaceState({}, '', url);

                }}
                value={boardView}>
                {boardViewOptions.map(function(filter, index){
                  return(
                    <option key={index} value={filter}>{filter}</option>
                  )
                })}
              </select>
            </div>
              <div className='card'>
                <BoardDescription boardId={boardId} initValue={board.description}/>
              </div>

              <div className='card'>
                <p className="form-label" style={{display:'block'}}><strong>Item Filters</strong></p>
                <p style={{fontSize:'.8em', margin:'15px 0px 5px 0px'}}>Item Status</p>
                <select className="form-input select"
                  onChange={async(e) => {
                  setStatusFilter(e.target.value)
                  if (e.target.value !== 'All'){
                    const boardData = await getBoardWithColumnsAndTasksStatusFilter(boardId, e.target.value)
                    setBoard(boardData)
                  }else{
                    const boardData = await getBoardWithColumnsAndTasks(boardId)
                    setBoard(boardData[0])
                  }
                  //const memberTasks = await getBoardWithColumnsAndTasksMemberFilter(boardId, [userId])
                  }}
                  value={statusFilter}>
                  {statusFilterArray.map(function(filter, index){
                    return(
                      <option key={index} value={filter}>{filter}</option>
                    )
                  })}
                </select>
                  {allTasksMembers.length>0&&
                    <p style={{fontSize:'.8em', margin:'15px 0px 5px 0px'}}>Select Members</p>
                  }
                  {allTasksMembers.map(function(member, index){
                    return(
                      <div key={member.user_id} style={{display:'flex', alignItems:'center', marginTop:'5px'}}>
                        <SelectCheckBox id={member.user_id} clearCheckBoxes={clearCheckBoxes} callBackFunction={selectMembersFilterFunction}/>
                        {member.users.full_name &&
                          <div style={{marginLeft:'5px', marginTop: '.25em'}}>
                            {member.users.full_name}
                          </div>
                        }
                      </div>
                    )
                  })}
                  {selectMembersFilter.length>0&&
                    <button onClick={() => {
                      setSelectMembersFilter([])
                      setClearCheckBoxes(true)
                    }}
                    className='btn secondary btn-sm' >Clear</button>
                  }
              </div>

            <div className='card'>
              <NewBoardValueComponent boardId={boardId} userId={userId}/>
              <CustomBoardFields board={board}/>
            </div>
            <CreateTask userId={userId}  boardId={ boardId}  workspaceId={board.workspace_boards[0]?.workspace_id} titleSize={"small"}/>
            <BoardMembers boardId={ boardId} createdBy={board.created_by} boardMembers={null} workspaceId={board.workspace_boards[0]?.workspace_id} realtime={true} accordion={'closed'}/>
        </div>
          <div style={{overflow:'scroll'}}>
                {boardView === 'Table' &&
                  <>
                  <div style={{display:'flex', position: 'sticky', left: 0, zIndex:1, alignItems:'center'}}>
                    <ColumnVisibility styles={{marginRight:'10px'}} columnsData={colDefs} callback={setColDefs} boardId={boardId}/>
                    {rowData.length>0&&
                      <>
                        <NewCustomColumn boardId={boardId} userId={userId} colDefs={colDefs}/>
                      </>
                    }
                    <AddTaskToBoard boardId={boardId} userId={userId} existingBoardTasks={board.tasks}/>

                    {selectedTasks.length > 0&&
                      <button style={{marginLeft:'10px'}} className='btn danger' onClick={deleteTasksFunction}>Remove Items</button>
                    }
                    {selectedColItems.length > 0&&
                      <button style={{marginLeft:'10px'}} className='btn danger' onClick={deleteColumnValuesFunction}>Delete Column Items</button>
                    }
                    {selectedColumns.length > 0&&
                      <button style={{marginLeft:'10px'}} className='btn danger' onClick={deleteColumnsFunction}>Delete Columns</button>
                    }
                    {selectedTaskMembers.length > 0&&
                      <button style={{marginLeft:'10px'}} className='btn danger' onClick={deleteMembersFromTaskFunction}>Remove Members</button>
                    }
                    {(selectedTasks.length > 1 && selectedColumns.length > 0 )&&
                      <button style={{marginLeft:'10px'}} className='btn secondary' onClick={analyzeFunction}>Analyze</button>
                    }
                  </div>
                  <div className="card" style={{width: 'max-content', paddingTop:'25px'}}>
                    <div style={{width: calculateWidth() }}>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: colDefs
                            .map((col, index) => {
                              if (col.visible){
                                return (`${col.width}px`)
                              }
                            })
                            .join(' ')
                        }}
                        className='board-table'
                      >
                      {/* Header */}
                      {colDefs.map((col, index) => {
                        const isCustomColumn = col?.id
                        console.log('col', col)
                        if (col.visible){
                          return(
                            <div
                              key={index}
                              style={{ fontWeight: "bold", width: col.width }}
                              className={`${index+1 === colDefs.length? 'board-table-cell board-header-cell last-header-cell' : 'board-table-cell board-header-cell'} ${rowData.length===0?'no-rows':''}`}
                            >
                              <div
                                style={{height:'100%'}}
                                draggable
                                onDragStart={() => onDragStart(index)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => onDrop(index)}
                              >
                                  {index>0&&
                                    <ResizableColumns col={col} index={index} callback={resizeColumnsCallback}>
                                      <div style={{display:'flex', alignItems:'center'}} className='board-table-cell-inner'>
                                        {col.id &&
                                          <SelectCheckBox id={col.id} callBackFunction={selectColumnsFunction} clearCheckBoxes={clearColumnCheckBoxes}/>
                                        }
                                        {col.id?(
                                          <>
                                            <ColumnName col={col} boardId={boardId}/>

                                          </>
                                        ):(
                                          <>
                                            <p style={{marginLeft:'10px'}}>{col.field.replaceAll('_', ' ')}</p>
                                          </>
                                        )}
                                        {col.type === 'date' &&
                                          <div style={{width:'40px', marginLeft: 'auto'}}>
                                            <FilterToggle
                                              dateFilterDirection={dateFilterDirection}
                                              dateFilter={dateFilter}
                                              columnValue={col.field}
                                              callback={dateFilterFunction}
                                            />
                                          </div>
                                        }

                                      </div>
                                    </ResizableColumns>
                                  }
                              </div>
                            </div>
                          )
                        }else{
                          return null
                        }
                      })}

                      {/* Rows */}
                      {rowData
                        .sort((a, b) => {
                          if (dateFilterDirection === 'asc'){
                            return new Date(a[dateFilter]) - new Date(b[dateFilter])
                          }else{
                            return new Date(b[dateFilter]) - new Date(a[dateFilter])
                          }
                        })
                        .map((row, rowIndex) => {

                          let date = true
                          if (row.due_date){
                            date = checkDate(row.due_date)
                          }

                        return(
                            //row = task
                          colDefs.map((col, colIndex) => {
                            const isCustomColumn = col?.id
                            if (col.visible){
                              return(
                                  <div id={row?.id} key={`cell-${rowIndex}-${colIndex}`}
                                    className={`${taskFocus===row?.id?'task-hilight': null} ${colIndex} ${colIndex+1 === colDefs.length? 'board-table-cell last-header-cell' : 'board-table-cell'} ${rowIndex+1 === rowData.length?'last-row':''} ${date?'':'overdue'} ${colIndex===0?'first-cell':''} ${colIndex+1===colDefs.length?'last-cell':''}`}
                                    >
                                    <div className='board-table-cell-inner'>
                                      {col.field === "select-task"&&
                                        <>
                                          <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={selectedTasks.includes(row.id)}
                                            onChange={() => selectTaskFunction(row.id)}
                                          />
                                        </>
                                      }

                                      {col.field === "id"&&
                                        <>
                                          {row[col.field]}
                                        </>
                                      }
                                      {col.field === 'created_by' &&
                                        <div className={`${'select-tab'}`}>
                                          <User userInfo={row[col.field]} active={null}/>
                                        </div>
                                      }
                                      {(col.field === 'description' && col.type === "text") &&
                                        <>
                                          <textarea
                                            id={col.id}
                                            className='form-input'
                                            type="text"
                                            defaultValue={row[col.field]}
                                            disabled={col.field==='id'}
                                            onBlur={(e) => {
                                              const newValue = e.target.value;
                                              if (newValue !== row[col.field]) {
                                                updateTaskColumn(row.id, col.field, newValue);
                                              }
                                            }}
                                          />
                                        </>
                                      }
                                      {(col.field === 'created_at' && col.type === "date") &&
                                        <p>{moment(row[col.field]).format("MMMM D, YYYY h:mm A")}</p>
                                      }

                                      {(col.field === 'members') &&
                                        <>
                                          {row[col.field]?.map((item, index)=>{

                                            return(
                                              <div key={item.user_id} style={{display:'flex', alignItems:'center'}}>
                                                {item.user_id !== row.created_by.id &&
                                                  <SelectMemberCheckBox user={item} taskId={row.id} callBackFunction={selectMembersFunction}/>
                                                }
                                                <div className={`${'select-tab'}`}>
                                                  {item.users&&
                                                  <User userInfo={item.users} active={null}/>
                                                }
                                                </div>
                                              </div>
                                            )
                                          })}
                                          <AddTaskMember board={board} task={row} existingUsers={row[col.field]} selectedTaskMembers={selectedTaskMembers}/>
                                        </>
                                      }

                                      {(col.field === 'due_date' && col.type === "date") &&
                                        <DatePicker
                                          //minDate={moment().toDate()}
                                          selected={row[col.field]?new Date(row[col.field]):''}
                                          onChange={(date) => {
                                              if (new Date(date).getTime() !== new Date(row[col.field]).getTime()) {
                                                   updateTaskColumn(row.id, col.field, new Date(date))

                                                }
                                          }}
                                          showTimeSelect
                                          dateFormat="MMMM d, yyyy h:mm aa"
                                          className={'form-input'}
                                        />
                                      }
                                      {(!isCustomColumn && col.field === 'recurrence' && row.is_recurring && row.recurrence_days !== null) &&
                                        <>
                                          {row[col.field]}
                                          {row.recurrence_days.map((value, index)=>{
                                            return <div key={value}>{value}</div>
                                          })}
                                        </>
                                      }
                                      {(!isCustomColumn && col.field === 'recurrence_days' && row.is_recurring && row[col.field] !== null) &&
                                        <>
                                          {row.recurrence}
                                          {row[col.field].map((value, index)=>{
                                            return <div key={value}>{value}</div>
                                          })}
                                        </>
                                      }
                                      {col.field !== "id" && col.type === "string" &&
                                        <>
                                        <input
                                          id={col.id}
                                          className='table-cell-input'
                                          type="text"
                                          defaultValue={!isCustomColumn?row[col.field]:row[col.field].value?row[col.field].value:''}
                                          disabled={col.field==='id'}
                                          onBlur={(e) => {
                                            const newValue = e.target.value;
                                            if (newValue !== row[col.field]) {
                                              if (isCustomColumn){
                                                //custom column
                                                if (row[col.field]?.value){
                                                    //updateTaskColumn(row.id, col.field, new Date(date))
                                                updateColumnValue(newValue, row[col.field].id);
                                                }else{
                                                  // insert new task column
                                                  addNewColumnValue({
                                                    task_id: row.id,
                                                    column_id: col.id,
                                                    board_id: board.id,
                                                    value: newValue,
                                                    type:'string'
                                                  });
                                                }
                                              }else{
                                                // default column
                                                updateTaskColumn(row.id, col.field, newValue)
                                              }
                                            }
                                          }}
                                        />
                                      </>
                                      }

                                      {col.type === 'select'&& col.field === "status" &&
                                        <>
                                        <select className="form-input select"
                                          onChange={(e) => {
                                            //setTaskStatus(e.target.value)
                                            const newValue = e.target.value;
                                              if (isCustomColumn){
                                                if (row[col.field?.value]){
                                                    //updateTaskColumn(row.id, col.field, new Date(date))
                                                  updateColumnValue(newValue, row[col.field].id);

                                                }else{
                                                  // insert new task column
                                                  addNewColumnValue({
                                                    task_id: row.id,
                                                    column_id: col.id,
                                                    board_id: board.id,
                                                    value: newValue,
                                                    type:'select'
                                                  });
                                                }
                                              }else{
                                                // default column
                                                updateTaskColumn(row.id, col.field, newValue)
                                                const userArray = row.members.map((user)=>{
                                                  return user.user_id
                                                })
                                                const message = `<span>The status of one of your tasks has bee updated to <strong>${newValue}</strong> - <a href="/task/${row.id}"><strong>View Task Here<strong></a></span>`
                                                  sendNotifications(userArray, message)
                                              }
                                          }}
                                          defaultValue={row[col.field]?.value || ''}>
                                          {row[col.field]?.array.map(function(status, index){
                                            return(
                                              <option key={index} value={status}>{status}</option>
                                            )
                                          })}
                                        </select>
                                      </>
                                      }
                                      {(isCustomColumn && col.field !== 'description' && col.type === "text") &&
                                        <>
                                          {row[col.field]?.map((item, index)=> {
                                            return(
                                                <div key={item.id} style={{display:'flex', alignItems:'center', flexDirection:'column'}}>
                                                    <div style={{display:'flex', alignItems:'center', flexDirection:'row'}}>
                                                      <SelectCheckBox callBackFunction={selectedColItemsFunction} id={item.id}/>
                                                      <TextItem item={item}/>
                                                    </div>
                                                </div>
                                            )
                                          })}
                                          <AddTextItem data={{task_id:row.id, column_id:col.id, board_id: board.id, type:col.type}} />
                                        </>
                                      }
                                      {isCustomColumn && col.type === "url" &&
                                        <>
                                          <div style={{display:'flex', alignItems:'center', flexDirection:'row'}}>
                                              {/*}<SelectCheckBox callBackFunction={selectedColItemsFunction} id={item.id}/>*/}
                                              <ColumnUrl item={row[col.field][0]} data={{task_id:row.id, column_id:col.id, board_id: board.id, type:col.type}}/>
                                          </div>
                                        </>
                                      }
                                      {isCustomColumn && col.type === "number" &&
                                        <>
                                          {row[col.field]?.map((item, index)=>{
                                            return(
                                                <div key={item.id} style={{display:'flex', alignItems:'center', flexDirection:'column'}}>
                                                    <div style={{display:'flex', alignItems:'center', flexDirection:'row'}}>
                                                      <SelectCheckBox callBackFunction={selectedColItemsFunction} id={item.id}/>
                                                      <ListItemNumber item={item} />
                                                    </div>
                                                </div>
                                            )
                                          })}
                                          <AddListItemNumber data={{task_id:row.id, column_id:col.id, board_id: board.id, type:col.type}}/>
                                        </>
                                      }
                                      {isCustomColumn && col.type === "data" &&
                                        <>
                                          {row[col.field]?.map((item, index)=>{
                                            return(
                                                <div key={item.id} style={{display:'flex', alignItems:'center', flexDirection:'column'}}>
                                                    <div style={{display:'flex', alignItems:'center', flexDirection:'row'}}>
                                                      <SelectCheckBox callBackFunction={selectedColItemsFunction} id={item.id}/>
                                                      <ListItemData item={item} />
                                                    </div>
                                                </div>
                                            )
                                          })}
                                          <AddListItemData data={{task_id:row.id, column_id:col.id, board_id: board.id, type:col.type}}/>
                                        </>
                                      }

                                      {(isCustomColumn && col.type === "dropdown") &&
                                        <>
                                          {row[col.field]?.map((item, index)=> {
                                            return(
                                                    <div key={item.id} style={{display:'flex', alignItems:'center', flexDirection:'row', marginTop:'15px'}}>
                                                      <SelectCheckBox callBackFunction={selectedColItemsFunction} id={item.id}/>
                                                      <Dropdown item={item}/>
                                                    </div>
                                            )
                                          })}
                                          <AddDropdown data={{task_id:row.id, column_id:col.id, board_id: board.id, type:col.type}}/>
                                        </>
                                      }

                                      {(isCustomColumn && col.type === "tags") &&
                                        <>
                                          {row[col.field]?.map((item, index)=> {
                                            return(
                                                <div key={item.id} style={{display:'flex', alignItems:'center', flexDirection:'column'}}>
                                                    <div style={{display:'flex', alignItems:'center', flexDirection:'row'}}>
                                                      <SelectCheckBox callBackFunction={selectedColItemsFunction} id={item.id}/>
                                                      <ListItemSuggest item={item}/>
                                                    </div>
                                                </div>
                                            )
                                          })}
                                          <AddListItemSuggest data={{task_id:row.id, column_id:col.id, board_id: board.id, type:col.type}}/>
                                        </>
                                      }

                                      {(isCustomColumn && col.type === "list") &&
                                        <>
                                          {row[col.field]?.map((item, index)=> {
                                            return(
                                                <div key={item.id} style={{display:'flex', alignItems:'center', flexDirection:'column'}}>
                                                    <div style={{display:'flex', alignItems:'center', flexDirection:'row'}}>
                                                      <SelectCheckBox callBackFunction={selectedColItemsFunction} id={item.id}/>
                                                      <ListItemSuggest item={item}/>
                                                    </div>
                                                </div>
                                            )
                                          })}
                                          <AddListItemSuggest data={{task_id:row.id, column_id:col.id, board_id: board.id, type:col.type}}/>
                                        </>
                                      }

                                      {isCustomColumn && col.type === "file" &&
                                        <>

                                          {row[col.field].length>0 && isCustomColumn? (
                                            <div style={{display:'flex', alignItems:'center', flexDirection:'column'}}>
                                              {row[col.field]?.map((item, index)=>{
                                                console.log('item', item)
                                                return(
                                                      <div  key={item.id}  style={{display:'flex', alignItems:'center', flexDirection:'row'}}>
                                                        <SelectCheckBox callBackFunction={selectedColItemsFunction} id={item.id}/>
                                                        <div className='table-file' style={{margin: '10px 0px 10px 10px', position:'relative'}}>
                                                          {(item.files.file_type === 'image/jpeg' || item.files.file_type === 'image/png') &&
                                                            <>
                                                              <img className="table-image" src={item.files.file_url} style={{width:'100%'}}/>
                                                              <div  className="table-file-options transition" style={{cursor:'pointer'}}>
                                                                <img className="download-file" onClick={() => handleFileDownload(item.files.file_url, item.files.file_name)} src="/download.svg"/>
                                                              </div>
                                                            </>
                                                          }
                                                          {item.files.file_type === 'application/pdf'&&
                                                            <>
                                                              <img src={'/pdf-icon.png'} style={{width:'100%'}}/>

                                                              <div className="table-file-options transition" style={{cursor:'pointer'}}>
                                                                <img className="download-file" onClick={() => handleFileDownload(item.files.file_url, item.files.file_name)} src="/download.svg"/>
                                                              </div>
                                                            </>
                                                          }
                                                          <p style={{fontSize:'.8em', marginTop:'0px'}}>{item.files.file_name}</p>
                                                        </div>
                                                      </div>
                                                )
                                                })
                                              }
                                              <FilePicker

                                                columnId={col.id}
                                                taskId={row.id}
                                                boardId={board.id}
                                              />
                                         </div>
                                          ):(
                                            <>
                                              <FilePicker
                                                columnId={col.id}
                                                taskId={row.id}
                                                boardId={board.id}
                                            />
                                           </>
                                          )}
                                      </>
                                      }

                                      {isCustomColumn && col.type === "checkbox" &&
                                        <>
                                          <div style={{display:'flex', alignItems:'center', flexDirection:'row', justifyContent: 'center'}}>
                                            {/*}<SelectCheckBox callBackFunction={selectedColItemsFunction} id={item.id}/>*/}
                                            <SingleColumnCheckBox item={row[col.field][0]} data={{task_id:row.id, column_id:col.id, board_id: board.id, type:col.type}}/>
                                          </div>
                                        </>
                                      }
                                      {isCustomColumn && col.type === "checkbox list" &&
                                        <>
                                          {row[col.field]?.map((item, index)=>{
                                            return(
                                                    <div key={item.id} style={{display:'flex', alignItems:'center', flexDirection:'row'}}>
                                                      <SelectCheckBox callBackFunction={selectedColItemsFunction} id={item.id}/>
                                                      <ColumnCheckBox item={item} />
                                                    </div>

                                            )
                                          })}
                                        <div style={{display:'flex', justifyContent: 'center'}}>
                                          <AddColumnCheckBox value={row[col.field]} data={{task_id:row.id, column_id:col.id, board_id: board.id, type:col.type}}/>
                                        </div>
                                        </>
                                      }

                                      {isCustomColumn && col.type === "date" && col.field !== 'due_date' &&
                                        <>
                                          {row[col.field]?.map((item, index)=>{
                                            return(
                                                <div key={item.id} style={{display:'flex', alignItems:'center', flexDirection:'column'}}>
                                                    <div style={{display:'flex', alignItems:'top', flexDirection:'row'}}>
                                                      <SelectCheckBox style={{marginTop:'22px'}} callBackFunction={selectedColItemsFunction} id={item.id}/>
                                                      <div>
                                                        <DateItem item={item} />
                                                      </div>

                                                    </div>
                                                </div>
                                            )
                                          })}
                                          <AddDateItem data={{task_id:row.id, column_id:col.id, board_id: board.id, type:col.type}}/>

                                        </>
                                      }
                                      {isCustomColumn && col.type === "formula" &&
                                        <>
                                          {row[col.field]?.map((item, index)=> {
                                            return(
                                                <div key={item.id} style={{display:'flex', alignItems:'center', flexDirection:'column'}} className='column-item'>
                                                    <div style={{display:'flex', alignItems:'center', flexDirection:'row', width:'100%'}}>
                                                      <SelectCheckBox callBackFunction={selectedColItemsFunction} id={item.id}/>
                                                      <FormulaBuilder item={item} rowData={row} boardData={board.board_fields} data={{task_id:row.id, column_id:col.id, board_id: board.id, type:col.type}}/>
                                                    </div>
                                                </div>
                                            )
                                          })}
                                          <FormulaBuilder item={null} rowData={row} boardData={board.board_fields} data={{task_id:row.id, column_id:col.id, board_id: board.id, type:col.type}}/>
                                        </>
                                      }
                                    </div>
                                  </div>
                              )
                            }

                          })

                        )
                        }
                      )}
                    </div>
                  </div>
                </div>
                  </>
                }
                {boardView === 'Kanban' &&
                  <KanbanView tasks={board.tasks} userId={userId} boardId={ boardId}  workspaceId={board.workspace_boards[0].workspace_id}/>
                }
                {boardView === 'Calendar' &&
                  <CalendarView tasks={board.tasks} userId={userId} boardId={ boardId}  workspaceId={board.workspace_boards[0].workspace_id}/>
                }
          </div>
          <div className="clear_fix">
          </div>
        </div>

      </>
      }

    </>
  );
}

const ColumnName = ({col, boardId}) => {
  const [inputValue, setInputValue] = useState(col.field?col.field.replace('_', ' '):'')
  const [disabled, setDisabled] = useState(true)


  useEffect(() => {
    setInputValue(col.field?col.field.replace('_', ' '):'');
  }, [col]);


  return(
    <div style={{display:'flex'}}>
      <input
        id={col.field}
        style={{margin:'0px 0px 0px 5px'}}
        className='form-input column-name'
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        disabled={disabled}
        onBlur={async(e) => {
            const newValue = e.target.value;
            if (newValue !== col.field.replace('_', ' ')) {

              const checkNewColumn = await checkColumnName(newValue, boardId)

              if (checkNewColumn.length>0){
                showError('Column name must be unique')
                return
              }

              await updateColumnName(newValue, col.id)
              showSuccess('Column name updated')
              setDisabled(true)


            }
        }}
      />
      <img style={{width:'20px', marginLeft: 'auto'}} src='/edit.svg' onClick={() => setDisabled(prevState => !prevState)} />
  </div>

  )
}

const SelectMemberCheckBox = ({user, taskId, callBackFunction}) => {
  const [checkboxToggle, setCheckboxToggle] = useState(false);

  const checkboxfunction = (user) =>{
    setCheckboxToggle(prevState => !prevState);
    callBackFunction(user, taskId)
  }

  return(
    <input
      className="form-check-input"
      type="checkbox"
      onChange={(e) => checkboxfunction(user)}
      checked={checkboxToggle}
      style={{marginRight:'10px'}}
   />
  )
}

const SelectCheckBox = ({style, id, callBackFunction, clearCheckBoxes}) => {
  const [checkboxToggle, setCheckboxToggle] = useState(false);

  const checkboxfunction = (id) =>{
    setCheckboxToggle(prevState => !prevState);
    callBackFunction(id)
  }

  useEffect(() => {

    if (clearCheckBoxes){
      setCheckboxToggle(false)
    }
  }, [clearCheckBoxes]);


  return(
    <input
      style={style}
      id={id}
      className="form-check-input"
      type="checkbox"
      onChange={(e) => checkboxfunction(id)}
      checked={checkboxToggle}
   />
  )
}

const AddColumnCheckBox = ({data}) => {
  const [addColumnCheckBox, setColumnCheckBox] = useState(null)
  const [checkboxToggle, setCheckboxToggle] = useState(false);
  const [checkboxLabel, setCheckboxLabel] = useState('');



  const handleCheckboxCreate = async (e) => {
    e.preventDefault();


    try {
          await addNewColumnValue({
            task_id: data.task_id,
            column_id: data.column_id,
            board_id: data.board_id,
            value: checkboxToggle,
            type:data.type,
            label: checkboxLabel
          });

          showSuccess('New Checkbox created')
          setColumnCheckBox(null)

    } catch (error) {
      //setColumnError(error.message);
      showError(error.message)
    }

  }


  return(
    <>
      {addColumnCheckBox === data.id?(
        <>
          <form onSubmit={handleCheckboxCreate}>
            <div style={{display:'flex', alignItems:'center'}}>
            <input
              className="form-check-input"
              type="checkbox"
              onChange={(e) => setCheckboxToggle(prev => !prev)}
              checked={checkboxToggle}
            />
            <input
              style={{marginLeft:'5px'}}
              className="form-input"
              type="text"
              onChange={(e) => setCheckboxLabel(e.target.value)}
              value={checkboxLabel}
              placeholder='Checkbox label'
              required
              />
             </div>
             <div style={{display:'flex', justifyContent: 'center'}}>
               <button className="btn primary"  type="submit">Create</button>
             </div>
         </form>
        </>

      ):(
        <div style={{display:'flex', justifyContent: 'center'}}>
          <button className='btn primary' onClick={() => setColumnCheckBox(data.id)}>Add Item</button>
        </div>
      )}

   </>
  )
}

const ColumnUrl = ({item, data}) => {

  const [value, setValue] = useState(item?.value? item?.value : '');



  useEffect(() => {
    if (item?.value){
          setValue(item?.value)
    }
  }, [item]);



  return(
    <div style={{display:'flex', justifyContent: 'center'}}>
        <input
            style={{marginTop:'0px'}}
            id={item?.id?item.id:'checkbox'}
            className="form-input"
            type="url"
            onChange={(e) => setValue(e.target.value)}
            value={value}
            onBlur={(e) => {
              const newValue = e.target.value;
              const isUrlValid = isValidURL(newValue)

              if (!isUrlValid){
                showError('Input is not a valid Url')
                return
              }

              if (!item) {
                addNewColumnValue({
                  task_id: data.task_id,
                  column_id: data.column_id,
                  board_id: data.board_id,
                  value: newValue,
                  type:data.type
                });
              }else{
                updateColumnValue(newValue, item.id);
              }

            }}
         />
   </div>
  )
}


const SingleColumnCheckBox = ({item, data}) => {

  const [checkboxToggle, setCheckboxToggle] = useState(false);

  const checkboxfunction = () =>{
    setCheckboxToggle(prevState => {

      const newState = !prevState;
      const stringValue = newState.toString(); // or String(newState)
      // Save stringValue somewhere
        // update value

          if (item){
            updateColumnValue(stringValue, item.id);
          }else{

             addNewColumnValue({
              task_id: data.task_id,
              column_id: data.column_id,
              board_id: data.board_id,
              value: stringValue,
              type:data.type
            });
          }


      return newState;
    });

  }


  useEffect(() => {
    if (item?.value){

        const bool = item.value === 'true'
        setCheckboxToggle(bool)

    }
  }, [item]);



  return(
    <div style={{display:'flex', justifyContent: 'center'}}>
      <div className='checkbox-list-item' style={{margin: '10px 0px 0px 0px', display:'flex', alignItems:'center'}}>
        <input
            style={{marginTop:'0px'}}
            id={item?.id?item.id:'checkbox'}
            className="form-check-input"
            type="checkbox"
            onChange={checkboxfunction}
            checked={checkboxToggle}
         />
     </div>
   </div>
  )
}

const ColumnCheckBox = ({item}) => {

  const [checkboxToggle, setCheckboxToggle] = useState(false);

  const checkboxfunction = () =>{
    setCheckboxToggle(prevState => {

      const newState = !prevState;
      const stringValue = newState.toString(); // or String(newState)
      // Save stringValue somewhere
        // update value
        if (item){
          updateColumnValue(stringValue, item.id);
        }

      return newState;
    });

  }


  useEffect(() => {
    if (item?.value){

        const bool = item.value === 'true'
        setCheckboxToggle(bool)

    }
  }, [item]);



  return(
    <div className='checkbox-list-item' style={{display:'flex', alignItems:'center', }}>
      <input
          style={{marginTop:'0px'}}
          id={item?.id?item.id:'checkbox'}
          className="form-check-input"
          type="checkbox"
          onChange={checkboxfunction}
          checked={checkboxToggle}
       />
       {item?.label&&
         <p style={{marginLeft:'5px'}}>{item.label}</p>
        }
   </div>
  )
}

const FilePicker = ({columnId, taskId, boardId}) => {
  const { showFiles, setShowFiles, selectedFiles, setSelectedFiles, setFilePicker } = useFilesContext();
  const { user } = useUserContext();
  const supabase = createClient()
  const [show, setShow] = useState(false);
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState()
  const [googleImageUrl, setGoogleImageUrl] = useState()



  const storeGoogleDriveFile = (file) => {
  //  callBackFunction(fileId, columnId)
    setGoogleImageUrl(file.embedUrl)
  }


  useEffect(() => {
  if (!showFiles && show &&  selectedFiles.length > 0) {

      selectedFiles.forEach((element) => {

      return addNewColumnValue({
             task_id: taskId,
             column_id: columnId,
             board_id: boardId,
             value: null,
             type:'file',
             file_id: element.id
           });
      });

  }

  }, [showFiles, selectedFiles]);

  return(
    <>
        <>
          <div style={{width:'100%', display:'flex', justifyContent:'center'}}>
            {/*}<GoogleDrivePicker callBackFunction={storeGoogleDriveFile}/>*/}
            <button className="btn secondary sml" onClick={() => {
              setSelectedFiles([])
              setFilePicker(true)
              setShowFiles(prevState => !prevState)
              setShow(prevState => !prevState)
            }}>Add Files</button>
          </div>
        </>
    </>

  )
}


const Dropdown = ({item}) => {
  const [dropdownValue, setDropdownValue] = useState(item.value? item.value : 'choose')

  return(
    <div style={{marginLeft:'5px', width:'100%'}} className='dropdown-container'>
      {item.label&&
        <p style={{fontSize:'.8em'}} className='dropdown-label'>{item.label}</p>
      }
      <select className="form-input select"
        onChange={(e) => {
          //setTaskStatus(e.target.value)
          setDropdownValue(e.target.value)
          const newValue = e.target.value;

            if (newValue !== '' && newValue !== item.value){
              updateColumnValue(newValue, item.id);
            }
        }}
        value={dropdownValue}>
      {!item.value &&
        <option value={''}>choose</option>
      }
      {item.column_select_options&&
        <>
          {item.column_select_options.map(function(item, index){
            return(
              <option key={index} value={item.value}>{item.value}</option>
            )
          })}
        </>
      }
      </select>
    </div>
  )
}

const AddDropdown = ({data}) => {
  const [addDropdownItem, setAddDropdownItem] = useState(null)
  const [dropDownList, setDropDownList] = useState([]);
  const [dropdownLabel, setDropdownLabel] = useState('');

  const dropdownBuilderCallback = (data) => {
    setDropDownList(data)
  }

  const handleDropdownCreate = async (e) => {
        e.preventDefault();

        if (dropDownList.length < 2){
          showError('At least 2 dropdown options are required')
          return
        }

        try {

          await addNewColumnValue({
            task_id: data.task_id,
            column_id: data.column_id,
            board_id: data.board_id,
            value:'',
            label:dropdownLabel,
            type:data.type
          }, dropDownList)

          showSuccess('Dropdown created')

          addDropdownItem(null)

        } catch (error) {
          //setColumnError(error.message);
          showError(error.message)
        }
  }



  return(
    <>
    {addDropdownItem === data.id ? (
      <>
        <form onSubmit={handleDropdownCreate}>
          <input
            id={data.id}
            className="form-input"
            type="text"
            onChange={(e) =>  setDropdownLabel(e.target.value)}
            value={dropdownLabel}
            placeholder='Label'
            required
          />
          <DropdownBuilder callback={dropdownBuilderCallback}/>
          <button className="btn primary"  type="submit">Create</button>
        </form>
      </>
    ) : (
      <div style={{display:'flex', justifyContent: 'center'}}>
        <button className='btn primary' onClick={() => setAddDropdownItem(data.id)}>Add Item</button>
      </div>
    )}
</>
  )
}

const AddListItemSuggest = ({data}) => {
  const [addListItem, setAddListItem] = useState(null)
  const [results, setResults] = useState([]);
  const [inputValue, setInputValue] = useState(data.value || '');

  const delay = 300

  const handleSearch = useCallback(async (query) => {

    if (data.board_id, data.type){
      const searchData = await queryColumnValues(query, data.board_id, data.type);
      const filteredData = filterDuplicates(searchData, 'value')
      setResults(filteredData);
    }

  }, [data.board_id, data.type]);

  useEffect(() => {
    setInputValue(data.value || '');
  }, [data.value]);

  return(
    <>
    {addListItem === data.id ? (
      <>
        <div>
          <input
            style={{marginLeft:'5px'}}
            className='form-input'
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              const handler = setTimeout(() => {
                if (e.target.value.trim() !== '') {
                  handleSearch(e.target.value.trim())
                }
              }, delay);
              }
            }
            onBlur={(e) => {
              const newValue = e.target.value;

              if (newValue !== '') {
                addNewColumnValue({
                  task_id: data.task_id,
                  column_id: data.column_id,
                  board_id: data.board_id,
                  value: newValue,
                  type:'tags'
                });
                setAddListItem(null);
                setInputValue([])
                setResults([]);
              }

            }}
          />
          {results.length > 0 &&
            <ul className='auto-suggest'>
              {results.map((item) => (
                <li style={{cursor:'pointer'}} key={item.id}
                  onClick={() => {
                    setInputValue(item.value)

                    addNewColumnValue({
                      task_id: data.task_id,
                      column_id: data.column_id,
                      board_id: data.board_id,
                      value: item.value,
                      type:'tags'
                    });
                    setResults([]);
                    setAddListItem(null);
                    setInputValue([])

                  }}
                >{item.value}</li>
              ))}
            </ul>
          }
        </div>
      </>
    ) : (
      <div style={{display:'flex', justifyContent: 'center'}}>
        <button className='btn primary' onClick={() => setAddListItem(data.id)}>Add Item</button>
      </div>
    )}
</>
  )
}

const ListItemSuggest = ({item}) => {

  const [inputValue, setInputValue] = useState(item.value || '');
  const [debouncedValue, setDebouncedValue] = useState('');
  const [results, setResults] = useState([]);
  const [edit, setEdit] = useState(false);
  const delay = 300


  const handleSearch = useCallback(async (query) => {

    if (item.board_id, item.type){
      const searchData = await queryColumnValues(query, item.board_id, item.type);
      const filteredData = filterDuplicates(searchData, 'value')
      setResults(filteredData);
    }

  }, [item.board_id, item.type]);



  useEffect(() => {
    setInputValue(item.value || '');
  }, [item.value]);

  return (
      <div>
        {/*}<DebouncedInputUpdate onDebounce={handleSearch} delay={300} value={inputValue} data={item}/>*/}
        <input
          style={{marginLeft:'5px'}}
          className='form-input list-item'
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
              const handler = setTimeout(() => {
                if (e.target.value.trim() !== '') {
                  handleSearch(e.target.value.trim())
                }
              }, delay);
            }
          }
          onBlur={(e) => {
            const newValue = e.target.value;
            if (newValue !== item.value) {
              updateColumnValue(newValue, item.id);
              setInputValue([])
              setResults([]);
            }
          }}
        />
        {results.length > 0 &&
          <ul className='auto-suggest'>
            {results.map((item) => (
              <li style={{cursor:'pointer'}} key={item.id}
                onClick={() => {
                  setInputValue(item.value)
                  updateColumnValue(item.value, item.id);
                  setResults([]);
                  setInputValue([])
                }
              }
              >{item.value}</li>
            ))}
          </ul>
        }
    </div>
  );
}

const EditableTextCell = ({ initialValue, col, row, isCustomColumn, board, updateTaskColumn, updateColumnValue, addNewColumnValue }) => {
  const [inputValue, setInputValue] = useState(initialValue || '');

  useEffect(() => {
    setInputValue(initialValue || '');
  }, [initialValue]);



  return (
    <textarea
      id={col.id}
      style={{ marginLeft: '10px' }}
      className="table-cell-input"
      type="text"
      value={inputValue}
      disabled={col.field === 'id'}
      onChange={(e) => setInputValue(e.target.value)}
      onBlur={(e) => {
        const newValue = e.target.value;
        if (newValue !== initialValue) {
          if (isCustomColumn) {
            if (initialValue) {
              updateColumnValue(newValue, row[col.field][0]?.id);
            } else {
              addNewColumnValue({
                task_id: row.id,
                column_id: col.id,
                board_id: board.id,
                value: newValue,
                type: 'text'
              });
            }
          } else {
            updateTaskColumn(row.id, col.field, newValue);
          }
        }
      }}
    />
  );
}

const DebouncedInput = ({ onDebounce, delay = 300, value, data, setAddListItem }) => {
  const [inputValue, setInputValue] = useState(value);
  const [debouncedValue, setDebouncedValue] = useState('');

  useEffect(() => {
    if (value){
      setInputValue(value)
    }
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(inputValue); // Update debounced value
    }, delay);

    return () => clearTimeout(handler); // Clear timeout if value changes
  }, [inputValue, delay]);

  // Trigger fetch when debounced value changes
  useEffect(() => {
    if (debouncedValue.trim() !== '') {
      onDebounce(debouncedValue);
    }
  }, [debouncedValue, onDebounce]);

  return (
    <>
      <input
        type="text"
        className='form-input'
        placeholder="Search..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={(e) => {

          const newValue = e.target.value
          /*
          if (newValue !== '') {

            addNewColumnValue({
              task_id: data.task_id,
              column_id: data.column_id,
              board_id: data.board_id,
              value: newValue,
              type:'list'
            });
            setAddListItem(null);
          }*/

        }}
        style={{ padding: '8px', width: '100%', fontSize: '16px' }}
      />
    </>
  );
}

const AutoSuggestSearch = ({data, type = 'list', defaultValue = '', setAddListItem}) => {

  const [results, setResults] = useState([]);
  const [value, setValue] = useState(defaultValue);
  const handleSearch = useCallback(async (query) => {

    if (data.board_id, type){
      const searchData = await queryColumnValues(query, data.board_id, type);
      setResults(searchData);
    }

  }, [data.board_id, type]);

  return (
    <div>
      <DebouncedInput onDebounce={handleSearch} delay={300} value={value} data={data} setAddListItem={setAddListItem}/>
      <ul className='auto-suggest'>
        {results.map((item) => (
          <li key={item.id} onClick={() => setValue(item.value)}>{item.value}</li>
        ))}
      </ul>
    </div>
  );
}

const AddListItemNumber = ({data}) => {
  const [addListItem, setAddListItem] = useState(null)
  return(
    <>
    {addListItem === data.id ? (
      <>
      <input
        id={data.task_id}
        className='form-input'
        type="number"
        autoFocus
        onBlur={(e) => {
          const newValue = e.target.value;
          if (newValue) {
            addNewColumnValue({
              task_id: data.task_id,
              column_id: data.column_id,
              board_id: data.board_id,
              value: newValue,
              type:data.type
            });
          }
          setAddListItem(null);
        }}
      />
      </>
    ) : (
      <div style={{display:'flex', justifyContent: 'center'}}>
        <button className='btn secondary btn-sm' onClick={() => setAddListItem(data.id)}>Add Number</button>
      </div>
    )}
  </>
  )
}

const ListItemNumber = ({item}) => {
  const [inputValue, setInputValue] = useState(item.value || '');

  useEffect(() => {
    setInputValue(item.value || '');
  }, [item.value]);

  return (
    <input
      style={{marginLeft:'5px'}}
      className='form-input'
      type="number"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onBlur={(e) => {
        const newValue = e.target.value;
        if (newValue !== item.value) {
          updateColumnValue(newValue, item.id);
        }
      }}
    />
  );
}

const AddTaskMember = ({board, task, existingUsers, selectedTaskMembers}) => {

    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [addMemberItem, setAddMemberItem] = useState(false)
    const [noUsers, setNoUsers] = useState(false)


  const getUsersData = async () => {
    try {

       //const users = await getAllUsers()


        const workspacesUsers = await getAllUsersAssignedToWorkspace(board.workspace_boards[0].workspace_id)

        const checkWorkspaceUsers = workspacesUsers.filter((user, index)=>{
          if (!isUserInArrayBoardTable(user.id, existingUsers)){
            return user
          }
        })

        if (checkWorkspaceUsers.length === 0){
          setNoUsers(true)
        }else{
          setNoUsers(false)
        }


        setUsers(checkWorkspaceUsers);
    } catch (error) {
      showError(error.message);
    }
  }


  const selectUserFunction = (data) => {

    const isUserInArrayCheck = isUserInArrayBoardTable({user_id:data}, existingUsers)

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
      await insertTaskMembers(task.id, selectedUsers)
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
            No Workspace Members To Add
          </div>
        }
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
        })}
        {selectedUsers.length > 0 &&
          <button disabled={!selectedUsers.length>0} className='btn primary' onClick={addMembersFunction}>{selectedUsers.length>1?'Add Members':'Add Member'}</button>
        }
      </>
    ) : (
      <div style={{display:'flex', justifyContent: 'center'}}>
        {selectedTaskMembers.length==0&&
          <button className='btn secondary btn-sm' onClick={setAddMemberItemFunction}>Add Member</button>
        }
      </div>
    )}
  </>
  )
}



const FormulaBuilder = ({item, rowData, boardData, data}) => {
  const [addFormula, setAddFormula] = useState(false)
  const [displayFormula, setDisplayFormula] = useState('');
  const [columnValues, setColumnValues] = useState([]);
  const [availableColumns, setAvailableColumns] = useState([]);
  const [availableTableFields, setAvailableTableFields] = useState([]);
  const [formula, setFormula] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const formulaWithIdRef = useRef('');



  const calculated = () => {
    const columnValuesTemp = [];
    const availableColumnsTemp = [];
    const availableTableFieldsTemp = []
    for (const key in rowData) {
      if (rowData.hasOwnProperty(key)) {
        if (Array.isArray(rowData[key])) {
          const array = rowData[key];
          if (array.length > 0) {
            array.forEach((arr) => {
              if (arr.type === 'number') {
                const dynamicKey = arr.columns.name;
                const keyValue = arr.value;
                const newObject = {
                  displayName: dynamicKey,
                  safeName: sanitizeWord(dynamicKey),
                  value: keyValue,
                  id:arr.id
                };

                columnValuesTemp.push(newObject);

                if (!availableColumnsTemp.some(obj => obj.displayName === newObject.displayName)) {
                  availableColumnsTemp.push(newObject);
                }
              }
            });
          }
        }
      }
    }

    if (boardData && boardData.length > 0) {
      boardData.forEach((item) => {
        if (item.type === 'number') {
          const displayName = item.name;
          const value = item.board_field_values[0]?.value;
          const newObject = {
            displayName: displayName,
            safeName: sanitizeWord(displayName),
            value: value,
            id:item.id
          };

          columnValuesTemp.push(newObject);

          if (!availableTableFieldsTemp.some(obj => obj.displayName === newObject.displayName)) {
            availableTableFieldsTemp.push(newObject);
          }
        }
      });
    }

    setAvailableTableFields(availableTableFieldsTemp)
    setColumnValues(columnValuesTemp);
    setAvailableColumns(availableColumnsTemp);

  };

useEffect(() => {
  if (boardData && rowData){
    calculated()
  }

}, [boardData, rowData]);


useEffect(() => {

  if (item && columnValues.length>0){
    //setAddFormula(true)
    const value = item.value;

    const displayFormula = displayFormulaFunction(value, columnValues)


    setFormula(displayFormula)
    const sanitisedFormula = sanitizeColumnIdFormulaFunction(value, columnValues)
    const scope = aggregateColumnValues(columnValues, 'sum'); // or 'avg', 'max', etc.
    const evalResult = evaluate(sanitisedFormula, scope);
    setResult(evalResult)
  }

}, [item, columnValues]);


  const functions = ['max', 'min'];

  const handleEvaluate = () => {
    try {
      //const sanitisedFormula = sanitizeFormulaFunction(formula, columnValues)
      const sanitisedFormula = sanitizeColumnIdFormulaFunction(formulaWithIdRef.current, columnValues)
      const scope = aggregateColumnValues(columnValues, 'sum'); // or 'avg', 'max', etc.
      const evalResult = evaluate(sanitisedFormula, scope);
      setResult(evalResult);
      setError(null);
    } catch (err) {
      setError(err.message);
      setResult(null);
    }
  };

  const insertText = (text) => {

    if (typeof text === "object"){
      setFormula((prev) => prev + text.displayName);
      formulaWithIdRef.current = formulaWithIdRef.current + text.id;
    }else{
      setFormula((prev) => prev + text);
      formulaWithIdRef.current = formulaWithIdRef.current + text;
    }

  };

  const saveFormula = async () => {
    if (item){
      await updateColumnValue(formulaWithIdRef.current, item.id)
    }else{
      await addNewColumnValue({
        task_id: data.task_id,
        column_id: data.column_id,
        board_id: data.board_id,
        value: formulaWithIdRef.current,
        type:data.type
      });
    }
    setAddFormula(false)
  }

  const addFormulaFunction = () => {
    setAddFormula(prevState => {
      const newState = !prevState;
      if (newState){
        //calculateData()
      }
      return newState;
    })
  }

  return (
    <>
      {addFormula? (
        <div style={{padding:'10px'}}>
          <div>
            <div>
              {availableColumns.map((col, index) => (
                <button className="btn primary btn-sm" style={{margin:'2px'}} key={index} onClick={() => insertText(col)} >
                  {col.displayName}
                </button>
              ))}
            </div>
            <div>
              {availableTableFields.map((col, index) => (
                <button className="btn primary btn-sm" style={{margin:'2px'}} key={index} onClick={() => insertText(col)} >
                  {col.displayName}
                </button>
              ))}
            </div>
            <div>
              {functions.map(fn => (
                <button className="btn secondary btn-sm" style={{margin:'2px'}} key={fn} onClick={() => insertText(`${fn}(`)}>
                  {fn}
                </button>
              ))}
            </div>
            <div>
              {['+', '-', '*', '/', '(', ')', ',', '>', '<', '==', '!='].map(op => (
                <button className="btn secondary btn-sm" style={{margin:'2px'}} key={op} onClick={() => insertText(` ${op} `)}>
                  {op}
                </button>
              ))}
            </div>
          </div>
          <button className="btn secondary btn-sm"onClick={handleEvaluate}>
            Evaluate Formula
          </button>
          <textarea
            style={{width: '100%', marginTop:'10px'}}
            className='form-input'
            value={formula}
            onChange={(e) => {
              setFormula(e.target.value)
              formulaWithIdRef.current = e.target.value

              //setDisplayFormula(e.target.value)
            }}
            rows={3}
            placeholder="Build your formula here..."
          />
          <div>
            {result !== null && <p>{result}</p>}
            {error && <p>Error: {error}</p>}
          </div>
          {formula&&
            <button className="btn primary"onClick={saveFormula}>
              {item?'Update':'Save Formula'}
            </button>
          }
          <button style={{marginLeft:'10px'}}  className="btn secondary"onClick={() => setAddFormula(false)}>
            Close
          </button>
        </div>
      ) : (
        <>
          {item?(
            <div className="formula" style={{display:'flex'}}>
              <div style={{margin: '0px 10px 0px 0px'}}>{result}</div>
              <img style={{width:'20px', marginLeft: 'auto'}} src='/edit.svg' onClick={addFormulaFunction} />
            </div>
            ):(
              <div style={{display:'flex', justifyContent: 'center'}}>
                <button className='btn secondary btn-sm' onClick={addFormulaFunction}>Add Formula</button>
              </div>
            )
          }
        </>
      )}
    </>
  );
};

const NewCustomColumn = ({boardId, userId, colDefs}) => {
  const [newColumn, setNewColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState(newColumnTypesArray[0]);


  const handleColumnCreate = async (e) => {
    e.preventDefault();

    if (!newColumnType || !newColumnName){
      return
    }

    const checkNewColumn = await checkColumnName(newColumnName, boardId)


    if (checkNewColumn.length>0){
      showError('Column name must be unique')
      return
    }

    try {

      const newColumn = {
        name : newColumnName,
        type : newColumnType,
        position: colDefs.length+1,
        board_id : boardId,
        created_by : userId
      };

      const newCustomColumn = await insertNewColumn(newColumn)
      //setColumnSuccess('New Column created');
      showSuccess('New Column created')
      setNewColumn(false)
    } catch (error) {
      //setColumnError(error.message);
      showError(error.message)
    }
  };



  return(
    <div style={{position:'relative'}}>
      <button className={`${'btn'} ${newColumn?'primary':'secondary'}`} onClick={() => setNewColumn(prevState => !prevState)}>New Column</button>
      {newColumn&&
        <div className="new-column drop-shadow">
            <form onSubmit={handleColumnCreate}>
            <label className="form-label" style={{display:'block'}}><strong>Column Name</strong></label>
            <input
              className='form-input'
              type="text"
              placeholder="Column name"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              required
            />
            <label className="form-label" style={{display:'block'}}><strong>Column Type</strong></label>
            <select className="form-input select" onChange={(e) => setNewColumnType(e.target.value)} value={newColumnType} required>
              {newColumnTypesArray.map(function(columnType, index){
                return(
                  <option key={index} value={columnType}>{columnType}</option>
                )
              })}
            </select>
            <button className="btn primary"  type="submit">Create</button>
            <button style={{marginLeft:'10px'}} className="btn danger" onClick={() => setNewColumn(false)}>Cancel</button>
          </form>
        </div>
      }
    </div>
  )
}



const NewBoardValueComponent = ({boardId, userId}) => {
  const [newBoardValue, setNewBoardValue] = useState(false);
  const [newBoardValueName, setNewBoardValueName] = useState('');
  const [newBoardValueType, setBoardValueType] = useState(newBoardValuesArray[0]);

  const handleBoardValueCreate = async (e) => {
    e.preventDefault();
    //setColumnError('')
    //setColumnSuccess('');

    if (!newBoardValueName || !newBoardValueType){
      return
    }

    // check unique name


    const checkNewBoardField = await checkBoardFieldName(newBoardValueName, boardId)

    if (checkNewBoardField.length>0){
      showError('Board field name must be unique')
      return
    }


    try {
      const newField = {
        name : newBoardValueName,
        type : newBoardValueType,
        board_id : boardId,
        created_by : userId
      }

      const newFieldData = await insertNewBoardField(newField)
      //setColumnSuccess('New Column created');
      showSuccess('New Field created')
      setNewBoardValue(false)
    } catch (error) {
      //setColumnError(error.message);
      showError(error.message)
    }
  };

  return(
    <>
      <label className="form-label" style={{display:'block'}}><strong>Board Custom Fields</strong></label>
      <button className='btn primary btn-sm' onClick={() => setNewBoardValue(prevState => !prevState)}>New Field</button>
      {newBoardValue&&
        <div className="new-column drop-shadow">
          <form onSubmit={handleBoardValueCreate}>
          <label className="form-label" style={{display:'block'}}><strong>Value Name</strong></label>
          <input
            className='form-input'
            type="text"
            placeholder="Column name"
            value={newBoardValueName}
            onChange={(e) => setNewBoardValueName(e.target.value)}
            required
          />
          <label className="form-label" style={{display:'block'}}><strong>Value Type</strong></label>
          <select className="form-input select" onChange={(e) => setBoardValueType(e.target.value)} value={newBoardValueType} required>
            {newBoardValuesArray.map(function(value, index){
              return(
                <option key={index} value={value}>{value}</option>
              )
            })}
          </select>
          <button className="btn primary btn-sm"  type="submit">Create</button>
          <button style={{marginLeft:'10px'}} className="btn danger btn-sm" onClick={() => setNewBoardValue(false)}>Cancel</button>
        </form>
        </div>
      }
    </>
  )
}

const CustomBoardFields = ({board}) => {
  const [selectedBoardFields, setSelectedBoardFields] = useState([]);


  const selectedCustomBoardFieldsFunction = (data) => {

    if (isInArray(data, selectedBoardFields)){

      setSelectedBoardFields(prev => {
        const removed = prev.filter(remove => {
          return remove !== data
        });
        return removed
      });

    }else{
      setSelectedBoardFields(prev => [...prev, data])
    }

  }

  const removeBoardFields = async () => {
    try {
      await deleteBoardField(selectedBoardFields)
      showSuccess("Fields Removed")
    }catch (error){
      showError(`Error removing field ${error}`)
    }
    setSelectedBoardFields([])
  }
    return(
      <>
        {board.board_fields.map((item, index)=>{
          return(
            <div key={item.id} style={{marginTop:'20px'}}>
              <BoardFieldName item={item} boardId={board.id}/>
              <div style={{display:'flex', alignItems:'center', flexDirection:'row'}}>
                <SelectCheckBox callBackFunction={selectedCustomBoardFieldsFunction} id={item.id}/>
                {item.type === 'number' &&
                  <>
                    <ListItemNumberBoard item={item}/>
                  </>
                }
                {item.type === 'formula' &&
                   <>
                    <FormulaBuilderBoardFields item={item} boardData={board}/>
                   </>
                 }
              </div>
            </div>
          )
        })
      }
      {selectedBoardFields.length>0&&
        <>
        <button onClick={removeBoardFields}className="btn danger">Remove</button>
        </>
      }
    </>
  )

}

const BoardFieldName = ({item, boardId}) => {
  const [inputValue, setInputValue] = useState(item.name)
  const [disabled, setDisabled] = useState(true)


  useEffect(() => {
    setInputValue(item.name);
  }, [item]);


  return(
    <div style={{display:'flex'}}>
      <input
        id={item.id}
        style={{marginLeft:'5px', marginBottom: '0px', marginTop:'0px'}}
        className='form-input column-name board-field'
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        disabled={disabled}
        onBlur={async(e) => {
            const newValue = e.target.value;
            if (newValue !== item.name) {

              const checkNewBoardField = await checkBoardFieldName(newValue, boardId)

              if (checkNewBoardField.length>0){
                showError('Board field name must be unique')
                return
              }

              await updateBoardFieldName(newValue, item.id)
              showSuccess('Column name updated')
              setDisabled(true)


            }
        }}
      />
      <img style={{width:'20px', marginLeft: 'auto'}} src='/edit.svg' onClick={() => setDisabled(prevState => !prevState)} />
  </div>

  )
}

const FormulaBuilderBoardFields = ({item, boardData}) => {
  const [addFormula, setAddFormula] = useState(false)
  const [displayFormula, setDisplayFormula] = useState('');
  const [columnValues, setColumnValues] = useState([]);
  const [availableColumns, setAvailableColumns] = useState([]);
  const [availableTableFields, setAvailableTableFields] = useState([]);
  const [formula, setFormula] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const formulaWithIdRef = useRef('');
  const functions = ['max', 'min'];

  const calculate = () => {
    const columnValuesTemp = [];
    const availableColumnsTemp = [];
    const availableTableFieldsTemp = []
    boardData.tasks.forEach((task) => {

      task.column_values.forEach((taskColumn) => {

            if (taskColumn.type === 'number'){
                const displayName = taskColumn.columns.name;
                const value = taskColumn.value;
                const newObject = {
                  displayName: displayName,
                  safeName: sanitizeWord(displayName),
                  value: value,
                  id:taskColumn.column_id
                };

                columnValuesTemp.push(newObject);

                if (!availableTableFieldsTemp.some(obj => obj.displayName === newObject.displayName)) {
                  availableTableFieldsTemp.push(newObject);
                }
            }

        })

    })

    if (boardData && boardData.board_fields.length > 0) {
      boardData.board_fields.forEach((item) => {
        if (item.type === 'number') {
          const displayName = item.name;
          const value = item.board_field_values[0]?.value;
          const newObject = {
            displayName: displayName,
            safeName: sanitizeWord(displayName),
            value: value,
            id:item.id
          };

          columnValuesTemp.push(newObject);

          if (!availableTableFieldsTemp.some(obj => obj.displayName === newObject.displayName)) {
            availableTableFieldsTemp.push(newObject);
          }
        }
      });
    }

    setAvailableTableFields(availableTableFieldsTemp)
    setColumnValues(columnValuesTemp);
    setAvailableColumns(availableColumnsTemp);

  };

useEffect(() => {
  if (boardData){
    calculate()
  }

}, [boardData]);


useEffect(() => {

  if (item && columnValues.length>0){
    //setAddFormula(true)
    if (item.board_field_values[0]?.value){

      //store value
        const value = item.board_field_values[0]?.value;

        console.log('value', value)



      //get visual version
        const displayFormula = displayFormulaFunction(value, columnValues)

        setFormula(displayFormula)


        const sanitisedFormula = sanitizeColumnIdFormulaFunction(value, columnValues)
        const scope = aggregateColumnValues(columnValues, 'sum'); // or 'avg', 'max', etc.
        const evalResult = evaluate(sanitisedFormula, scope);
        setResult(evalResult)
    }
  }

}, [item, columnValues]);


  const handleEvaluate = () => {
    try {

      console.log('formula', formula)
      console.log('formulaWithIdRef.current', formulaWithIdRef.current)


      const sanitisedFormula = sanitizeColumnIdFormulaFunction(formulaWithIdRef.current, columnValues)

      console.log('sanitisedFormula', sanitisedFormula)
      console.log('formula', formula)
      console.log('columnValues', columnValues)

      //const sanitisedFormula = sanitizeColumnIdFormulaFunction(formulaWithIdRef.current, columnValues)
      const scope = aggregateColumnValues(columnValues, 'sum'); // or 'avg', 'max', etc.
      const evalResult = evaluate(sanitisedFormula, scope);
      setResult(evalResult);
      setError(null);
    } catch (err) {
      setError(err.message);
      setResult(null);
    }
  };

  const insertText = (text) => {

    console.log('insertText', text)

    if (typeof text === "object"){
      setFormula((prev) => prev + text.displayName);


      formulaWithIdRef.current = formulaWithIdRef.current + text.id;
    }else{
      setFormula((prev) => prev + text);
      formulaWithIdRef.current = formulaWithIdRef.current + text;
    }

    console.log('formulaWithIdRef.current', formulaWithIdRef.current)

  };

  const saveFormula = async () => {
    if (item.board_field_values[0]?.value){

     try{
       await updateBoardFieldValue(formulaWithIdRef.current, item.board_field_values[0]?.id);
       showSuccess('Formula Updated')
     }catch(error){
       showError(error)
     }

    }else{
      try{
        await addNewBoardFieldValue({
          board_field_id: item.id,
          value:formulaWithIdRef.current,
          type:item.type
        })
        showSuccess('New formula saved')

      }catch(error){
        showError(error)
      }

    }
    setAddFormula(false)
  }

  const addFormulaFunction = () => {
    setAddFormula(prevState => {
      const newState = !prevState;
      if (newState){
        //calculateData()
      }
      return newState;
    })
  }

  return (
    <>
      {addFormula? (
        <div style={{padding:'10px'}}>
          <div>
            <div>
              {availableColumns.map((col, index) => (
                <button className="btn primary btn-sm" style={{margin:'2px'}} key={index} onClick={() => insertText(col)} >
                  {col.displayName}
                </button>
              ))}
            </div>
            <div>
              {availableTableFields.map((col, index) => (
                <button className="btn primary btn-sm" style={{margin:'2px'}} key={index} onClick={() => insertText(col)} >
                  {col.displayName}
                </button>
              ))}
            </div>
            <div>
              {functions.map(fn => (
                <button className="btn secondary btn-sm" style={{margin:'2px'}} key={fn} onClick={() => insertText(`${fn}(`)}>
                  {fn}
                </button>
              ))}
            </div>
            <div>
              {['+', '-', '*', '/', '(', ')', ',', '>', '<', '==', '!='].map(op => (
                <button className="btn secondary btn-sm" style={{margin:'2px'}} key={op} onClick={() => insertText(` ${op} `)}>
                  {op}
                </button>
              ))}
            </div>
          </div>
          <button className="btn secondary btn-sm"onClick={handleEvaluate}>
            Evaluate Formula
          </button>
          <textarea
            style={{width: '100%', marginTop:'10px'}}
            className='form-input'
            value={formula}
            onChange={(e) => {

              setFormula(e.target.value)

              const idFormula = convertFormulaFunctionToIds(e.target.value, columnValues)

              formulaWithIdRef.current = idFormula

              //setDisplayFormula(e.target.value)
            }}
            rows={3}
            placeholder="Build your formula here..."
          />
          <div>
            {result !== null && <p>{result}</p>}
            {error && <p>Error: {error}</p>}
          </div>
          {formula&&
            <button className="btn primary"onClick={saveFormula}>
              {item.board_field_values[0]?.value?'Update':'Save Formula'}
            </button>
          }
          <button style={{marginLeft:'10px'}}  className="btn secondary"onClick={() => setAddFormula(false)}>
            Close
          </button>
        </div>
      ) : (
        <>
          {item.board_field_values !== null && item.board_field_values[0]?.value?(
            <div className="formula" style={{display:'flex'}}>
              <div style={{margin: '0px 10px 0px 0px'}}>{result}</div>
              <img style={{width:'20px', marginLeft: 'auto'}} src='/edit.svg' onClick={addFormulaFunction} />
            </div>
            ):(
              <div style={{display:'flex', justifyContent: 'center', marginLeft:'5px'}}>
                <button className='btn primary btn-sm' onClick={addFormulaFunction}>Add Formula</button>
              </div>
            )
          }
        </>
      )}
    </>
  );
};

const ListItemNumberBoard = ({item}) => {
  const [inputValue, setInputValue] =
  useState(item.board_field_values.length>0?item.board_field_values[0]?.value : '');

  useEffect(() => {
    setInputValue(item.board_field_values.length>0?item.board_field_values[0]?.value : '');
  }, [item]);

  const initialValue = item.board_field_values.length? true:false

  return (
    <div>
    <input
      style={{margin:'0px 0px 0px 5px'}}
      className='form-input'
      type="number"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onBlur={(e) => {
        const newValue = e.target.value;
        if (newValue !== item.board_field_values[0]?.value) {
          if(initialValue){

            updateBoardFieldValue(newValue, item.board_field_values[0]?.id);
          }else{

            addNewBoardFieldValue({
              board_field_id: item.id,
              value:newValue,
              type:item.type
            })

          }
        }
      }}
    />
  </div>
  );
}

const ResizableColumns = ({children, col, index, callback}) => {
const [size, setSize] = useState({ width: col.width?col.width:175});
const isResizing = useRef({ left: false, right: false });
const sizeRef = useRef({ width: col.width?col.width:175});
const isDraggingRef = useRef(false);
const offsetRef = useRef(0);

useEffect(() => {
  setSize({width:col.width });
  sizeRef.current={width:col.width}
}, [col.width]);


const handleMouseDown = (side, e) => {
  e.preventDefault();
  isResizing.current[side] = true;

  const startX = e.clientX;
  const startWidth = size.width;
  const startLeft = size.left;

  const handleMouseMove = (event) => {
    const deltaX = event.clientX - startX;
    const width = Math.max(50, startWidth + deltaX)

    callback(width, col, index)

  };

  const handleMouseUp = () => {
    isResizing.current = { left: false, right: false };
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);

};

  return(
    <div
    style={{
      width: size.width,
      position:'relative',
      textAlign:'center',
      height: '100%',
    }}>
      {children}
      <div onMouseDown={(e) => handleMouseDown("right", e)}
      style={{
        position:'absolute',
        top:'0px',
        right:'-5px',
        width:'10px',
        height: '100%',
        cursor:'col-resize',
      }}
      className="no-drag column-drag">
      </div>
    </div>
  )
}

const DropDown = ({items, data, value})=>{

  const [dropdownValue, setDropdownValue] = useState(value[0]?.value? value[0]?.value : 'choose')

  useEffect(() => {
    setDropdownValue(value[0]?.value? value[0]?.value : 'choose');
  }, [value[0]?.value]);

  const existingValue = value[0]?.value? true:false
  return(
    <div>
      <select className="form-input select"
        onChange={(e) => {
          //setTaskStatus(e.target.value)
          setDropdownValue(e.target.value)
          const newValue = e.target.value;

            if (newValue !== ''){
              if (value.length > 0){
                  //updateTaskColumn(row.id, col.field, new Date(date))
                updateColumnValue(newValue, value[0].id);
              }else{
                // insert new task column

                addNewColumnValue({
                  task_id: data.task_id,
                  column_id: data.column_id,
                  board_id: data.board_id,
                  value: newValue,
                  type:data.type
                });
              }
            }
        }}
        value={dropdownValue}>
        {!existingValue &&
          <option value={''}>choose</option>
        }
        {items&&
          <>
            {items.map(function(item, index){
              return(
                <option key={index} value={item.value}>{item.value}</option>
              )
            })}
          </>
        }
      </select>
    </div>
  )
}

const BoardTitle = ({boardId, initValue}) => {
  const [inputValue, setInputValue] = useState(initValue)
  const [disabled, setDisabled] = useState(true)
  const inputRef = useRef(null);
  const spanRef = useRef(null);
  const [inputWidth, setInputWidth] = useState(1); // initial width

  useEffect(() => {
    if (initValue){
        setInputValue(initValue);
    }

  }, [initValue]);

  useEffect(() => {
  if (spanRef.current) {
    const spanWidth = spanRef.current.offsetWidth;
    setInputWidth(spanWidth + 30); // small padding for cursor
  }
}, [inputValue]);

//updateBoardColumn
  return(
    <div style={{display:'flex'}}>
      <input
        ref={inputRef}
        id={'board-title'}
        style={{marginBottom: '0px', marginTop:'0px', width: `${inputWidth}px`}}
        className='form-input board-name'
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        disabled={disabled}
        onBlur={async(e) => {
            const newValue = e.target.value;
            if (newValue !== initValue) {
              try{
                await updateBoardColumn(boardId, 'name', newValue)
                showSuccess('Board name updated')
              }catch(error){
                showError(error)
              }finally{
                setDisabled(true)
              }

            }
        }}
      />
      <span
        ref={spanRef}
        style={{
          position: 'absolute',
          visibility: 'hidden',
          whiteSpace: 'pre',
          font: 'inherit',
          fontSize: '1.3em',
          fontWeight: 'bold',
        }}
      >
        {inputValue}
      </span>
      <img style={{width:'20px', marginLeft:'10px'}} src='/edit.svg' onClick={() => setDisabled(prevState => !prevState)} />
  </div>
  )
}

const BoardDescription = ({boardId, initValue}) => {
  const [inputValue, setInputValue] = useState(initValue)
  const [disabled, setDisabled] = useState(true)

  useEffect(() => {
    if (initValue){
        setInputValue(initValue);
    }
  }, [initValue]);

//updateBoardColumn
  return(
    <>
      <div style={{display:'flex', marginBottom:'10px'}}>
        <label className="form-label" style={{display:'block'}}><strong>Description</strong></label>
        <img style={{width:'20px', marginLeft:'10px'}} src='/edit.svg' onClick={() => setDisabled(prevState => !prevState)} />
     </div>
        <textarea
          id={'board-description'}
          style={{marginBottom: '0px', marginTop:'0px', width:'100%'}}
          className='form-input board-description'
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={disabled}
          onBlur={async(e) => {
              const newValue = e.target.value;
              if (newValue !== initValue) {

                try {
                  await updateBoardColumn(boardId, 'description', newValue)
                  showSuccess('Board description updated')
                }catch (error){
                  showError(error)
                }finally{
                  setDisabled(true)
                }

              }
          }}
        />
      </>
  )
}

const ColumnVisibility = ({styles, columnsData, callback, boardId}) => {
  const [open, setOpen] = useState(false)
  const [columns, setColumns] = useState(columnsData)
  const COL_VISIBLE_STORAGE_KEY = "columnVisible";


  useEffect(()=>{
    setColumns(columnsData)
  },[columnsData])


  const toggleColumn = (checked, col) => {
    const updatedCols = columns.map((column)=>{
      if (column.field === col.field){
        const newColumnObject = {...column}
        newColumnObject.visible = checked
        return newColumnObject
      }else{
        return column
      }
    })

    setColumns(updatedCols)
    callback(updatedCols)

    localStorage.setItem(
      COL_VISIBLE_STORAGE_KEY+boardId,
      JSON.stringify(updatedCols.map((col) => {
        return {field:col.field, visible:col.visible}
      })
    ));

  };


  return(
    <div style={styles}>
      <div style={{position:'relative'}}>
        <div>
          <button className={`${'btn'} ${open?'primary':'secondary'}`} onClick={() => setOpen(prev => !prev)}> Column Visibility</button>
        </div>
        {open&&
          <div className="new-column drop-shadow">
          {columns.map((col, index)=>{
            if (col.field!=='select-task'){
              return(
                <label key={index} style={{ marginRight: '1em', display: 'flex', alignItems: 'center'}}>
                  <input
                    style={{marginRight:'10px'}}
                    className="form-check-input"
                    type="checkbox"
                    checked={col.visible}
                    onChange={(e) => toggleColumn(e.target.checked, col)}
                  />
                  {col.field.replaceAll('_', ' ')}
                </label>
              )
            }else{
              return null
            }


          })}
        </div>
        }
      </div>
    </div>
  )
}
