'use client';

import { useState, useEffect, useRef } from 'react';
import { getBoardWithWorkspace } from "@/lib/supabase";
import { getBoardWithColumnsAndTasks } from "@/lib/supabase";
import { insertNewColumn } from "@/lib/supabase";
import { updateColumnValue } from "@/lib/supabase";
import { addNewColumnValue } from "@/lib/supabase";
import { getTask } from "@/lib/supabase";
import { deleteTasks } from "@/lib/supabase";
import { deleteColumnValues } from "@/lib/supabase";
import { updateTaskDueDate } from "@/lib/supabase";
import { updateTaskColumn } from "@/lib/supabase";
import { deleteCustomColumns } from "@/lib/supabase";
import { uploadFilesPublic } from "@/lib/supabase";
import { storeFileInfo } from "@/lib/supabase";

import GoogleDrivePicker from "@/components/google-drive-picker";

import { makeFolderPublic } from "@/lib/supabase";
import { boardViewOptions } from "@/lib/constants";
import CreateTask from "@/components/create-task";
import User from "@/components/user";
import { createClient } from '@/utils/supabase/client'
import { isInArray } from '@/lib/utils'
import { enrichColumnValue } from '@/lib/utils'
import { formatToPostgresUTC } from '@/lib/utils'
import { useCallback } from 'react';
import debounce from 'lodash.debounce';
import moment from "moment";
import DatePicker from "react-datepicker";
import { taskStatusArray } from '@/lib/constants'
import { boardTableHeaders } from '@/lib/constants'
import { newColumnTypesArray } from '@/lib/constants'
import "react-datepicker/dist/react-datepicker.css";
import { useUserContext } from '@/context/user-context'

export default function Board({ boardId, userId }) {
  const supabase = createClient()

  const [boardView, setBoardView] = useState(boardViewOptions[0]);
  const [board, setBoard] = useState(null);
  const [newColumn, setNewColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState(newColumnTypesArray[0]);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [tableHeaders, setTableHeaders] = useState(boardTableHeaders);
  const [columnError, setColumnError] = useState(null);
  const [columnSuccess, setColumnSuccess] = useState('');
  const boardRef = useRef(board);
  const [selectedColItems, setSelectedColItems] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [colDefs, setColDefs] = useState([])
  const [rowData, setRowData] = useState([])
  const [dragIndex, setDragIndex] = useState(null);
  const [selectedRows, setSelectedRows] = useState([])

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
  };

 function getType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';

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
    console.log('board', board)
    boardRef.current = board;

    if (board){
      // Create headers from task fields
      let headers = Object.keys(board.tasks[0])
        .filter(key => key !== "column_values") // exclude key
        .map((key, index) => ({
          field: key,
          index,
          type: getType(board.tasks[0][key]),
        }));

      // Add dynamic columns from board.columns
      headers = [
        ...headers,
        ...board.columns.map((col, index) => ({
          field: col.name,
          index: headers.length + index,
          type: col.type,
          id: col.id,
        })),
      ];

      // Create row data
      const rowData = board.tasks.map((task) => {
        // Base row from core task fields
        const base = { ...task };
        delete base.column_values;
        // Add dynamic column values
        board.columns.forEach((col) => {
          const colVal = task.column_values.find((cv) => cv.column_id === col.id);

          if (colVal) {
            if (colVal.type === "file") {
              if (colVal.files) {
                base[col.name] = colVal.files;
              } else {
                base[col.name] = null;
              }
            } else {
              if (colVal.value !== undefined && colVal.value !== null) {
                base[col.name] = colVal.value;
              } else {
                base[col.name] = null;
              }
            }
          } else {
            base[col.name] = null;
          }
        });

        return base;
      });

      const colDefs = [
        ...Object.keys(board.tasks[0]).map((key) => ({
          field: key,
          type: key.type,
        })),
        ...board.columns.map((col) => ({
          field: col.name,
          type: col.type,
        })),
      ];


      headers = [{ field: "select", type: "checkbox" }, ...headers]

            console.log('owData ', colDefs )
            console.log('owData ', rowData )
            console.log('headers ', headers )
      setColDefs(headers)
      setRowData(rowData)
    }





  }, [board]);





  const getData = async () => {
    try {
        const boardData = await getBoardWithColumnsAndTasks(boardId)
        console.log(boardData[0])
        setBoard(boardData[0])
    } catch (error) {
      setError(error.message);
    }
  }


  useEffect(() => {

    //getColumns()

    if (boardId){
      getData()
    }

}, [boardId]);


useEffect(() => {
  const channel = supabase
    .channel('board-inserts')
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'board_tasks',
      },
      (payload) => {
        console.log('payload', payload)
        if (payload.new.board_id === boardId) {
          console.log('New task added to board_tasks:', payload);
          //getData()

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

 const updateNewTask = async(taskId) => {

   try{
     const newTask = await getTask(taskId)
     setBoard(prev => ({
       ...prev,
       tasks: [...prev.tasks, newTask]
     }));

   }catch (error){
     console.log(error)
   }

 }


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
         //const update = columns.find(c => c.id === rawValue.column_id);
         if (payload.eventType === 'UPDATE'){
           console.log('UPDATE')




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




           /*

           const updatedTasks = boardRef.current.tasks.map(task => {
             if (task.id === payload.new.id){
               return { ...task, ...payload.new }
             }
             return task
           })

           setBoard(prev => ({
             ...prev,
             tasks: updatedTasks,
           }));
           */
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
            updateNewTask(payload.new.id)

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
                column_values: newColumnValues,
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

             const enrichedColumnValue = enrichColumnValue(payload.new, boardRef.current.columns);

              const updatedTasks = boardRef.current.tasks.map(task => {
                if (task.id === payload.new.task_id) {
                  return {
                    ...task,
                    column_values: [...task.column_values, enrichedColumnValue],
                  };
                }
                return task;
              });

              setBoard(prev => ({
                ...prev,
                tasks: updatedTasks,
              }));

           }else if (payload.eventType === 'UPDATE'){

             const updatedTasks = boardRef.current.tasks.map(task => {
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

             setBoard(prev => ({
               ...prev,
               tasks: updatedTasks,
             }));

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

          console.log('payload', payload)

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
              const enrichedValue = enrichColumnValue(payload.new, boardRef.current.columns);
              setBoard(prev => ({
                ...prev,
                columns: [...prev.columns, enrichedValue]
              }));


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



 const handleColumnCreate = async (e) => {
   e.preventDefault();
   setColumnError('')
   setColumnSuccess('');

   if (!newColumnType){
     return
   }

   try {
     const newColumn = {
       name : newColumnName,
       type : newColumnType,
       position: tableHeaders.length+1,
       board_id : boardId
     };

     const newTask = await insertNewColumn(newColumn)
     setColumnSuccess('New Column created');
   } catch (error) {
     setColumnError(error.message);
   }
 };


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

 const deleteTasksFunction = async () =>{
   try{
      const deletedTasks = await deleteTasks(selectedTasks)
      setSelectedTasks([])
      /*
      let newBoard = board
      newBoard.tasks = board.tasks.filter((task) => {
        return !selectedTasks.includes(task.id);
      });

      setBoard(newBoard)
      */

   }catch (error){
     console.log(error)
   }


 }

 const deleteColumnValuesFunction = async () =>{
   try{
      const deletedTasks = await deleteColumnValues(selectedColItems)

      /*
      let newBoard = board
      newBoard.tasks = board.tasks.filter((task) => {
        return !selectedTasks.includes(task.id);
      });

      setBoard(newBoard)
      */

   }catch (error){
     console.log(error)
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

 const deleteColumnsFunction = async () =>{
   try{

     const deletedColumns = await deleteCustomColumns(selectedColumns)
     setSelectedColumns([])

      /*
      let newBoard = board
      newBoard.tasks = board.tasks.filter((task) => {
        return !selectedTasks.includes(task.id);
      });

      setBoard(newBoard)
      */

   }catch (error){
     console.log(error)
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

  return (
    <>
      {board&&
        <>
        <div style={{padding:'15px'}}>
          <h2>{board.name}</h2>

        </div>
        <div className='board-layout'>
          <div>
            <div className='card'>
              <label className="form-label" style={{display:'block'}}><strong>View Filter</strong></label>
              <select className="form-input select" onChange={(e) => setBoardView(e.target.value)} value={boardView}>
                {boardViewOptions.map(function(filter, index){
                  return(
                    <option key={index} value={filter}>{filter}</option>
                  )
                })}
              </select>
            </div>
            <CreateTask userId={userId}  boardId={ boardId}  workspaceId={board.workspace_boards[0].workspace_id}/>
          </div>
          <div style={{overflowX:'auto'}}>
            {board&&
              <>
                {boardView === 'Table' &&
                  <div className='card' style={{width: 'max-content'}}>
                    <div style={{display:'flex'}}>
                      <div style={{position:'relative'}}>
                        <button className='btn primary' onClick={() => setNewColumn(prevState => !prevState)}>New Column</button>
                        {newColumn&&
                          <div className="new-column">
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
                              {newColumnTypesArray.map(function(filter, index){
                                return(
                                  <option key={index} value={filter}>{filter}</option>
                                )
                              })}
                            </select>
                            <button className="btn primary"  type="submit">Create</button>
                            {columnError && <p style={{ color: 'red' }}>{columnError}</p>}
                            {columnSuccess && <p style={{ color: 'green' }}>{columnSuccess}</p>}
                          </form>
                          </div>
                        }
                      </div>
                      {selectedTasks.length > 0&&
                        <button style={{marginLeft:'10px'}} className='btn danger' onClick={deleteTasksFunction}>Delete Tasks</button>
                      }
                      {selectedColItems.length > 0&&
                        <button style={{marginLeft:'10px'}} className='btn danger' onClick={deleteColumnValuesFunction}>Delete Column Items</button>
                      }
                      {selectedColumns.length > 0&&
                        <button style={{marginLeft:'10px'}} className='btn danger' onClick={deleteColumnsFunction}>Delete Columns</button>
                      }
                    </div>


                    <div className='table'>
                      <div style={{ display: 'flex', flexDirection: 'column'}}>
                        {/* Header Row */}
                        <div className="table-row" style={{ fontWeight: 'bold' }}>
                          {tableHeaders.map((value, index) => {
                            return <div className='table-cell' key={index}>{value.title}</div>
                          })}
                          {board.columns.map((col, index) => {
                            return <div className='table-cell' key={index}><SelectCheckBox id={col.id} callBackFunction={selectColumnsFunction}/><span style={{marginLeft:'10px'}}>{col.name}</span></div>
                          })}
                        </div>

                        {/* Data Rows */}
                        {board.tasks.map((task, index) => {
                          return <TaskRow index={index} task={task} board={board} key={index} selectedFunction={selectTaskFunction} selectedColItemsFunction={selectedColItemsFunction}/>
                        })}
                      </div>
                    </div>
                  </div>
                }
              </>
            }
          </div>
          <div>
          </div>
        </div>
        <div className="card">
          <div style={{display:'flex'}}>
            <div style={{position:'relative'}}>
              <button className='btn primary' onClick={() => setNewColumn(prevState => !prevState)}>New Column</button>
              {newColumn&&
                <div className="new-column">
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
                    {newColumnTypesArray.map(function(filter, index){
                      return(
                        <option key={index} value={filter}>{filter}</option>
                      )
                    })}
                  </select>
                  <button className="btn primary"  type="submit">Create</button>
                  {columnError && <p style={{ color: 'red' }}>{columnError}</p>}
                  {columnSuccess && <p style={{ color: 'green' }}>{columnSuccess}</p>}
                </form>
                </div>
              }
            </div>
            {selectedTasks.length > 0&&
              <button style={{marginLeft:'10px'}} className='btn danger' onClick={deleteTasksFunction}>Delete Tasks</button>
            }
            {selectedColItems.length > 0&&
              <button style={{marginLeft:'10px'}} className='btn danger' onClick={deleteColumnValuesFunction}>Delete Column Items</button>
            }
            {selectedColumns.length > 0&&
              <button style={{marginLeft:'10px'}} className='btn danger' onClick={deleteColumnsFunction}>Delete Columns</button>
            }
          </div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${colDefs.length}, 1fr)`, gap: "8px" }}>
          {/* Header */}
          {colDefs.map((col, index) => (
            <div
              key={col.field}
              style={{ fontWeight: "bold", borderBottom: "2px solid #ccc", width:index===1?'70px': '' }}
              draggable
              onDragStart={() => onDragStart(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(index)}
            >
              {col.field.replace('_', ' ')}
            </div>
          ))}

          {/* Rows */}
          {rowData.map((row, rowIndex) => (
              //console.log('row', row),
              colDefs.map((col) => {
                console.log('col', col)
                //console.log('row[col.field]', row[col.field])
                return(
                  <div key={`${rowIndex}-${col.field}`} style={{ padding: "4px 0", borderBottom: "1px solid #eee" }}>
                    {col.type === "checkbox"&&
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={selectedTasks.includes(row.id)}
                        onChange={() => selectTaskFunction(row.id)}
                      />
                    }
                    {col.type === "string"&&
                      <input
                        className='table-cell-input'
                        type="text"
                        defaultValue={row[col.field] || ''}
                        onBlur={(e) => {
                          const newValue = e.target.value;
                          if (newValue !== row[col.field]) {
                            if (row[col.field]){
                              updateTaskColumn(row.id, col.field, newValue)
                            }else{
                              //insert new value
                            }
                          }
                        }}
                        disabled={col.field==='id'}
                      />
                    }
                    {col.type === "date"&&

                      <DatePicker
                        //minDate={moment().toDate()}
                        selected={row[col.field]?new Date(row[col.field]):''}
                        onChange={(date) => {
                            console.log('date', new Date(date).getTime())
                            console.log('row[col.field]', new Date(row[col.field]).getTime())

                            if (new Date(date).getTime() !== new Date(row[col.field]).getTime()) {
                                console.log("update date value");
                                if (col.field === 'due_date'){
                                  updateTaskDueDate(row.id, new Date(date))
                                }else{
                                  if (row[col.field]){
                                    updateTaskColumn(row.id, col.field, new Date(date))
                                  }else{
                                      //insert new value
                                  }



                                }

                              }

                        }}
                        showTimeSelect
                        dateFormat="MMMM d, yyyy h:mm aa"
                        className={'form-input'}
                      />

                    }


                </div>
                )

              })
            )
          )}
        </div>
      </div>

      </>
      }
    </>
  );
}

const TaskRow = ({task, board, selectedFunction, selectedColItemsFunction}) => {
const { user } = useUserContext();
const [checkboxToggle, setCheckboxToggle] = useState(false);
const [dueDate, setDueDate] = useState(task.due_date ? new Date(task.due_date) : null);
const [addListItem, setAddListItem] = useState(false);

const checkboxfunction = (taskId) =>{
  setCheckboxToggle(prevState => !prevState);
  selectedFunction(taskId)
}



const handleValueChange = useCallback(
  debounce(async (taskId, columnId, newValue) => {
    const { error } = await supabase
      .from('column_values')
      .upsert({ task_id: taskId, column_id: columnId, value: newValue });

    if (error) console.error(error);
  }, 500),
  []
);


const setDueDateFunction = async (date) => {
  setDueDate(date)
  //const { data } = await supabase.from('tasks').select('due_date').eq('id', task.id);
  try{
    await updateTaskDueDate(task.id, new Date(date))
  }catch (error){
    console.log('Error updating task due date: ', error)
  }
}

const handleCustomColumnValueChange = async (data) => {
  try{
    await insertNewColumnValues(data)
  }catch (error){
    console.log('Error updating task due date: ', error)
  }
}

const handleFileFunction = async (data, columnId) => {
  try{

    console.log('data', data)
    const fileinfo = await storeFileInfo({
      user_id:user.id,
      data:data,
      public_url: data.publicUrl,
      image_id:data.id,
      path:data.path,
      full_path:data.fullPath
    })

    console.log('fileinfo', fileinfo)

    await addNewColumnValue({
         task_id: task.id,
         column_id: columnId,
         board_id: board.id,
         value: null,
         type:'file',
         file_id: fileinfo.id
       });

  }catch (error){
    console.log('Error updating task due date: ', error)
  }
}

const dateCallbackFunction = async (date) => {
  try{
    await addNewColumnValue({
         task_id: task.id,
         column_id: columnId,
         board_id: board.id,
         type:'date',
         value: url,
       });
  }catch (error){
    console.log('Error updating task due date: ', error)
  }
}



  return(
    <div className="table-row">
     <div className='table-cell' style={{ flex: 1 }}>
       <input
         className="form-check-input"
         type="checkbox"
         onChange={(e) => checkboxfunction(task.id)}
         checked={checkboxToggle}
      />
     </div>
     <div className='table-cell' style={{ flex: 1 }}>{task.id}</div>
     <div className='table-cell' style={{ flex: 1 }}>
       <input
         className='table-cell-input'
         type="text"
         defaultValue={task.title || ''}
         onBlur={(e) => {
           const newValue = e.target.value;
           if (newValue !== task.title) {
             updateTaskColumn(task.id, 'title', newValue)
           }
         }}
       />
     </div>
     <div className='table-cell' style={{ flex: 1 }}>
       <select className="form-input"
         onChange={(e) => {
           //setTaskStatus(e.target.value)
           const newValue = e.target.value;
           if (newValue !== task.status ) {
             updateTaskColumn(task.id, 'status', newValue)
           }
         }}
         defaultValue={task.status || ''}>
         {taskStatusArray.map(function(status, index){
           return(
             <option key={index} value={status}>{status}</option>
           )
         })}
       </select>

     </div>
     <div className='table-cell' style={{ flex: 1 }}>
       <DatePicker
         minDate={moment().toDate()}
         selected={dueDate}
         onChange={(date) => setDueDateFunction(date)}
         showTimeSelect
         dateFormat="MMMM d, yyyy h:mm aa"
         className={'form-input'}
       />
   </div>
     <div className='table-cell' style={{ flex: 1 }}>
       <textarea
         className='table-cell-input'
         defaultValue={task.description || ''}
         onBlur={(e) => {
           const newValue = e.target.value;
           if (newValue !== task.title) {
             updateTaskColumn(task.id, 'description', newValue)
           }
         }}
       />
     </div>
     <div className='table-cell' style={{ flex: 1 }}>
       {Array.isArray(task.task_members) &&
         <>
           {task.task_members.map((member, index) => {
           return(
             <div key={member.user_id} className={`${'select-tab'}`}>
               <User userInfo={member.users} active={null}/>
           </div>
           )
         })}
       </>
       }
     </div>
     {board.columns.map((col) => {

       const matchingValues = task.column_values.filter(val => val.column_id === col.id);
       if (col.type === 'list') {
         return (
           <div key={col.id} className="table-cell" style={{ flex: 1, flexDirection: 'column' }}>
             {matchingValues.map((item, idx) => (
               <div  key={item.id} style={{display:'flex', alignItems:'center'}}>
               <SelectCheckBox callBackFunction={selectedColItemsFunction} id={item.id}/>
               <input
                 style={{marginLeft:'5px'}}
                 className='form-input'
                 type="text"
                 defaultValue={item.value || ''}
                 onBlur={(e) => {
                   const newValue = e.target.value;
                   if (newValue !== item.value) {
                     updateColumnValue(newValue, item.id);
                   }
                 }}
               />
             </div>
             ))}
             {addListItem === col.id ? (
               <input
                 className='form-input'
                 type="text"
                 autoFocus
                 onBlur={(e) => {
                   const newValue = e.target.value;
                   if (newValue) {
                     addNewColumnValue({
                       task_id: task.id,
                       column_id: col.id,
                       board_id: board.id,
                       value: newValue,
                     });
                   }
                   setAddListItem(null);
                 }}
               />
             ) : (
               <button className='btn primary' onClick={() => setAddListItem(col.id)}>Add value</button>
             )}
           </div>
         );
       } else if (col.type === 'text')  {
         const matchingValue = matchingValues[0];
         return (
           <div key={col.id} className="table-cell" style={{ flex: 1 }}>
             {matchingValue&&
               <SelectCheckBox callBackFunction={selectedColItemsFunction} id={matchingValue.id}/>
             }
             <input
               className='table-cell-input'
               type="text"
               defaultValue={matchingValue?.value || ''}
               onBlur={(e) => {
                 const newValue = e.target.value;
                 if (newValue !== matchingValue?.value) {
                   if (matchingValue) {
                     updateColumnValue(newValue, matchingValue.id);
                   } else {
                     addNewColumnValue({
                       task_id: task.id,
                       column_id: col.id,
                       board_id: board.id,
                       value: newValue,
                     });
                   }
                 }
               }}
             />
           </div>
         );
       } else if (col.type === 'file') {
         const matchingValue = matchingValues[0];
         return(
           <div key={col.id} className="table-cell" style={{ flex: 1, flexDirection:'column' }}>
             {matchingValue && matchingValue?.value!==''?(
               <div style={{display:'flex', flexDirection:'row'}}>
                 <SelectCheckBox callBackFunction={selectedColItemsFunction} id={matchingValue.id}/>
                <img src={matchingValue?.value }/>
              </div>
             ):(
               <>
               <FilePicker url={matchingValue?.value} callBackFunction={handleFileFunction} columnId={col.id}/>
              </>
             )}


           </div>
         )
       }else if (col.type === 'date'){
         const matchingValue = matchingValues[0];
         return(
           <div key={col.id} className="table-cell" style={{ flex: 1, flexDirection:'column' }}>
             {matchingValue&&
               <SelectCheckBox callBackFunction={selectedColItemsFunction} id={matchingValue.id}/>
             }
             <DateCell
               matchingValue={matchingValue}
               board_id={board.id}
               column_id={col.id}
               task_id={task.id}
               callBackFunction={matchingValue?updateColumnValue:addNewColumnValue}
               />
           </div>
         )
       }
     })}
   </div>
  )
}

const SelectCheckBox = ({id, callBackFunction}) => {
  const [checkboxToggle, setCheckboxToggle] = useState(false);

  const checkboxfunction = (id) =>{
    setCheckboxToggle(prevState => !prevState);
    callBackFunction(id)
  }

  return(
    <input
      className="form-check-input"
      type="checkbox"
      onChange={(e) => checkboxfunction(id)}
      checked={checkboxToggle}
   />
  )
}

const FilePicker = ({url, callBackFunction, columnId}) => {
  const { user } = useUserContext();
  const supabase = createClient()
  const [show, setShow] = useState(false);
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState(url)
  const [googleImageUrl, setGoogleImageUrl] = useState(url)


  async function downloadImage(path) {
    try {
      const { data, error } = await supabase.storage.from('files').getPublicUrl(path)
      if (error) {
        throw error
      }

      setImageUrl(url)
    } catch (error) {
      console.log('Error downloading image: ', error)
    }
  }


  useEffect(() => {


    if (url) downloadImage(url)
  }, [url, supabase])


  const uploadFile = async (event) => {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Math.random()}.${fileExt}`;
      //const filePath = `public/${Math.random()}.${fileExt}`;

      try{
        const fileData = await uploadFilesPublic(filePath, file)

        callBackFunction(fileData, columnId)
        setImageUrl(fileData.publicUrl)


      }catch(error){
        console.log('file upload error', error)
      }




      //imageUrl(filePath)
      //onUpload(filePath)
    } catch (error) {
      console.log(error)
      alert('Error uploading image!')
    } finally {
      setUploading(false)
    }


  }

  const storeGoogleDriveFile = (file) => {
    console.log('fileId', file)
  //  callBackFunction(fileId, columnId)
    setGoogleImageUrl(file.embedUrl)
  }

  return(
    <>
      {imageUrl&&
        <>
          <img src={imageUrl}/>
        </>
      }
      {googleImageUrl&&
      <iframe
        src={googleImageUrl}
        width="640"
        height="480"
        allow="autoplay"
      />
    }
      <button className='btn primary' onClick={() => setShow(prevState => !prevState)}>{imageUrl? 'Replace File' : 'Add File'}</button>

      {show&&
        <>
          <div style={{width:'100%'}}>
            <input
              style={{marginBottom:'10px'}}
              type="file"
              id="single"
              accept="image/*"
              onChange={uploadFile}
              disabled={uploading}
            />
            <GoogleDrivePicker callBackFunction={storeGoogleDriveFile}/>

          </div>

        </>

      }
    </>

  )
}


const DateCell = (matchingValue, board_id, column_id, task_id, callBackFunction) => {
  const [date, setDate] = useState(matchingValue.value ? new Date(matchingValue.value) : null);

  const setDateFunction = (date) => {
    setDate(date)

    if (matchingValue.value){
      //update
    }else{
      //new value
    }
  }

  return(
    <DatePicker
      minDate={moment().toDate()}
      selected={date}
      onChange={(date) => setDateFunction(date)}
      showTimeSelect
      dateFormat="MMMM d, yyyy h:mm aa"
      className={'form-input'}
    />

  )
}
