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
import { getColumnValues } from "@/lib/supabase";
import { useFilesContext } from "@/context/files-context"


import GoogleDrivePicker from "@/components/google-drive-picker";
import GridTable from "@/components/grid-table";

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
  const [addListItem, setAddListItem] = useState(null)




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
      generateColumns(board)
      boardRef.current = board;
      console.log('board data', board)
    }



  }, [board]);

  const generateColumns = (boardData) => {
    if (boardData){
      // Create headers from task fields
      let headers = Object.keys(boardData.tasks[0])
            // ✅ remove  users & column_values from supabase join
        .filter(key => key !== "column_values" && key !== "users") // exclude key
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
              width: 175
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
          width: 175,
          id: col.id,
        })),
      ];

      // Create row data
      const rowData = boardData.tasks.map((task) => {
        // Base row from core task fields
        const base = { ...task };

        // ✅ remove  users & column_values from supabase join

        delete base.users;
        delete base.column_values;

        base.status = {...{value:base.status}, ...{array:taskStatusArray}}

        // ✅ Replace created_by UUID with actual user object
        if (task.users) {
          base.created_by = task.users; // overwrite UUID with user object
        }

        // Add dynamic column values

        console.log('boardData', boardData)


        boardData.columns.forEach((col) => {
          const colVals = task.column_values.filter(val => val.column_id === col.id);

          if (colVals.length > 0) {
            base[col.name] = colVals.map((val) => ({
              ...val,
              custom_column: true
            }));
          } else {
            base[col.name] = [];
          }
        });

        return base;
      });

      headers = [{ field: "select", type: "checkbox", width: 50 }, ...headers]

      console.log('headers', headers)
      console.log('rowData', rowData)

      setColDefs(headers)
      setRowData(rowData)
    }

  }



  const getData = async () => {
    try {
        const boardData = await getBoardWithColumnsAndTasks(boardId)
        generateColumns(boardData[0])
        setBoard(boardData[0])
    } catch (error) {
      setError(error.message);
    }
  }


  useEffect(() => {

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
        console.log('payload board_tasks ', payload)
        if (payload.new.board_id === boardId) {
          console.log('New task added to board_tasks:', payload);
          getData()

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

 const addNewTask = async(taskId) => {

   try{
     const newTask = await getTask(taskId)

     console.log('newTask', newTask)
     setBoard(prev => ({
       ...prev,
       tasks: [...prev.tasks, newTask]
     }));

   }catch (error){
     console.log(error)
   }

 }

 const updateTask = async(data) => {

   try{
     //const newTask = await getTask(data.task_id)

     const newColumn = await getColumnValues(data.id)


     console.log('newColumn', newColumn)

      console.log('prev.tasks', board)

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

       console.log('updatedTasks', updatedTasks)

       return {
         ...prev,
         tasks: updatedTasks,
       };
     });

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

         console.log('payload tasks', payload)

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

         console.log('payload column_values', payload)


        if (payload.eventType === 'DELETE'){

          setBoard(prev => {
            const updatedTasks = prev.tasks.map(task => {
              const newColumnValues = task.column_values.filter(col => col.id !== payload.old.id);
              return {
                ...task.column_values,
                newColumnValues,
              };
            });

            return {
              ...prev,
              tasks: updatedTasks,
            };
          });

         }

         console.log('payload.new.type', payload.new.type)

         if (payload.new.board_id === boardId) {

           if (payload.eventType === 'INSERT') {

              if (payload.new.type === 'text' || payload.new.type === 'string' || payload.new.type === 'select' || payload.new.type === 'date' || payload.new.type === 'check box'){

                const enrichedColumnValue = enrichColumnValue(payload.new, boardRef.current.columns);

                setBoard(prev => {
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
                  console.log('INSERT NEW FILE', payload.new)

                  //getColumnvalues(payload.new.id)
                //const enrichedColumnValue = enrichColumnValue(payload.new, boardRef.current.columns);
                updateTask(payload.new)

              }

           }else if (payload.eventType === 'UPDATE'){

            console.log('UPDATE')


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

               console.log('updatedTasks', updatedTasks)
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

          console.log('payload columns', payload)

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
       board_id : boardId,
       created_by : userId
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


   }catch (error){
     console.log(error)
   }


 }

 const deleteColumnValuesFunction = async () =>{
   try{
      const deletedTasks = await deleteColumnValues(selectedColItems)


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

 const handleFileFunction = async (data, columnId, taskId, boardId) => {
   try{

     const fileinfo = await storeFileInfo({
       user_id:userId,
       data:data,
       public_url: data.publicUrl,
       image_id:data.id,
       path:data.path,
       full_path:data.fullPath,
       file_type:data.fileType
     })

     console.log('fileinfo', fileinfo)

     await addNewColumnValue({
          task_id: taskId,
          column_id: columnId,
          board_id: boardId,
          value: null,
          type:'file',
          file_id: fileinfo.id
        });

   }catch (error){
     console.log('Error updating task due date: ', error)
   }
 }


 const calculateWidth = () => {
   return colDefs.reduce((sum, col) => sum + col.width, 0);
 }


  return (
    <>
      {(board && colDefs && rowData)&&
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
                {boardView === 'Table' &&
                  <div className="card" style={{width: 'max-content'}}>
                    <div style={{width: calculateWidth() }}>
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
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: colDefs
                            .map((col, index) => (`${col.width}px`))
                            .join(' ')
                        }}
                        className='board-table'
                      >
                      {/* Header */}
                      {colDefs.map((col, index) => (
                        <div
                          key={index}
                          style={{ fontWeight: "bold", width: col.width }}
                          draggable
                          onDragStart={() => onDragStart(index)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => onDrop(index)}
                          className={index+1 === colDefs.length? 'board-table-cell board-header-cell last-header-cell' : 'board-table-cell board-header-cell'}
                        >
                          <div style={{display:'flex', alignItems:'center'}}>
                            {col.id&&
                              <SelectCheckBox id={col.id} callBackFunction={selectColumnsFunction}/>
                            }
                            {index>0&&
                                <p style={{marginLeft:'10px'}}>{col.field.replace('_', ' ')}</p>
                            }
                          </div>
                        </div>
                      ))}

                      {/* Rows */}
                      {rowData.map((row, rowIndex) => (
                            //row = task
                          colDefs.map((col, colIndex) => {
                            //console.log('is object', typeof row[col.field])
                            const isCustomColumn = col?.id
                            if (isCustomColumn){
                            }
                            return(
                              <div key={`cell-${rowIndex}-${colIndex}`} className={colIndex+1 === colDefs.length? 'board-table-cell last-header-cell' : 'board-table-cell'}>
                                {col.type === "checkbox" && !isCustomColumn &&
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={selectedTasks.includes(row.id)}
                                    onChange={() => selectTaskFunction(row.id)}
                                  />
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
                                {col.field === 'created_at' &&
                                  <p>{moment(row[col.field]).format("MMMM D, YYYY h:mm A")}</p>


                                }
                                {(col.field !== 'due_date' && col.field !== 'created_at' && col.type === "date") &&
                                  <>
                                  </>
                                }

                                {(col.field === 'due_date' && col.type === "date") &&
                                  <DatePicker
                                    //minDate={moment().toDate()}
                                    selected={row[col.field]?new Date(row[col.field]):''}
                                    onChange={(date) => {
                                        if (new Date(date).getTime() !== new Date(row[col.field]).getTime()) {
                                            console.log("update date value");
                                             updateTaskColumn(row.id, col.field, new Date(date))

                                          }
                                    }}
                                    showTimeSelect
                                    dateFormat="MMMM d, yyyy h:mm aa"
                                    className={'form-input'}
                                  />
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
                                {col.type === 'select' &&
                                  <>
                                  <select className="form-input"
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
                                {(col.field !== 'description' && col.type === "text") &&
                                  <div style={{display:'flex', flexDirection:'row', alignItems:'center'}}>
                                    <EditableTextCell
                                      initialValue={row[col.field]?.[0]?.value}
                                      col={col}
                                      row={row}
                                      board={board}
                                      isCustomColumn={isCustomColumn}
                                      updateTaskColumn={updateTaskColumn}
                                      updateColumnValue={updateColumnValue}
                                      addNewColumnValue={addNewColumnValue}
                                    />
                                  </div>
                                }


                                {col.type === "list" &&
                                  <>
                                    {row[col.field].length===0 && isCustomColumn &&
                                      <div>
                                        <AddListItem data={{task_id:row.id, column_id:col.id, board_id: board.id}} />
                                      </div>
                                    }
                                    {row[col.field]?.map((item, index)=>{
                                      if (col.field === 'task_members'){
                                        return(
                                          <div key={item.user_id} className={`${'select-tab'}`}>
                                            <User userInfo={item.users} active={null}/>
                                          </div>
                                        )
                                      }else{
                                        return(
                                            <div key={item.id} style={{display:'flex', alignItems:'center', flexDirection:'column'}}>
                                                <div style={{display:'flex', alignItems:'center', flexDirection:'row'}}>
                                                  <SelectCheckBox callBackFunction={selectedColItemsFunction} id={item.id}/>
                                                  < ListItem item={item} updateColumnValue={updateColumnValue}/>
                                                </div>
                                              <AddListItem data={item}/>
                                            </div>
                                        )
                                      }
                                    })}
                                  </>
                                }
                                {col.type === "file" && isCustomColumn &&
                                  <>
                                  {/*}  {console.log('file', row[col.field])}*/}
                                    {row[col.field].length>0 && isCustomColumn? (
                                      <div style={{display:'flex', alignItems:'center', flexDirection:'column'}}>
                                        {console.log('row[col.field].length', row[col.field].length)}
                                        {row[col.field]?.map((item, index)=>{
                                          return(
                                                <div  key={item.id}  style={{display:'flex', alignItems:'center', flexDirection:'row'}}>
                                                  <SelectCheckBox callBackFunction={selectedColItemsFunction} id={item.id}/>
                                                  <div className='table-image' style={{margin: '10px 0px 10px 10px'}}>
                                                    <img src={item.files.public_url} style={{width:'100%'}}/>
                                                  </div>
                                                </div>
                                          )
                                          })
                                        }
                                        <FilePicker
                                          callBackFunction={handleFileFunction}
                                          columnId={col.id}
                                          taskId={row.id}
                                          boardId={board.id}
                                        />
                                   </div>
                                    ):(
                                      <>
                                        <FilePicker
                                          callBackFunction={handleFileFunction}
                                          columnId={col.id}
                                          taskId={row.id}
                                          boardId={board.id}
                                      />
                                     </>
                                    )}
                                </>
                                }
                                {col.type === "date" && isCustomColumn &&
                                  <>
                                    {row[col.field].length>0 && isCustomColumn?(
                                      <>
                                        Existing Date
                                     </>
                                    ):(
                                      <>
                                        New Date
                                     </>
                                    )}
                                  </>

                                }

                                {/*}

                                {col.type === "checkbox"&&
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={selectedTasks.includes(row.id)}
                                    onChange={() => selectTaskFunction(row.id)}
                                  />
                                }

                                {col.type === 'select' &&
                                  <>
                                  <select className="form-input"
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
                                              task_id: row[col.field].task_id,
                                              column_id: row[col.field].column_id,
                                              board_id: row[col.field].board_id,
                                              value: newValue,
                                            });
                                          }
                                        }else{
                                          // default column
                                          updateTaskColumn(row.id, col.field, newValue)
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
                                {col.field === 'created_by' &&
                                  <div className={`${'select-tab'}`}>
                                    <User userInfo={row[col.field]} active={null}/>
                                  </div>
                                }

                                {((col.field === 'description' && col.type === "string") || col.type === "text") &&
                                  <>
                                  <textarea
                                    className='table-cell-input'
                                    type="text"
                                    defaultValue={
                                      row[col.field] !== null?
                                      getType(row[col.field]) === 'string'? row[col.field]: row[col.field].value
                                      :''
                                    }
                                    disabled={col.field==='id'}
                                    onBlur={(e) => {
                                      const newValue = e.target.value;
                                      if (newValue !== row[col.field].value) {
                                        if (isCustomColumn){
                                          //custom column because it has an id
                                          if (row[col.field]){
                                              //updateTaskColumn(row.id, col.field, new Date(date))
                                              console.log('updateColumnValue')
                                              updateColumnValue(newValue, row[col.field].id);

                                          }else{
                                            // insert new task column
                                            console.log('insert new column')
                                            addNewColumnValue({
                                              task_id: row[col.field].task_id,
                                              column_id: row[col.field].column_id,
                                              board_id: row[col.field].board_id,
                                              value: newValue,
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
                                {col.type === "list" &&
                                  <>
                                    <TaskList listData={row[col.field]} col={col} row={row}/>
                                  </>
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
                                              if (!col.id){
                                                // default column
                                                if (col.field === 'due_date'){
                                                  updateTaskDueDate(row.id, new Date(date))
                                                }
                                              }else{
                                                //custom column
                                                if (row[col.field]){
                                                    //updateTaskColumn(row.id, col.field, new Date(date))
                                                }else{
                                                  // insert new task column

                                                }

                                              }
                                          }
                                    }}
                                    showTimeSelect
                                    dateFormat="MMMM d, yyyy h:mm aa"
                                    className={'form-input'}
                                  />


                                }
                                */}

                            </div>
                            )

                          })
                        )
                      )}
                    </div>
                  </div>
                </div>

                }
          </div>
          <div>
          </div>
        </div>

      </>
      }

    </>
  );
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

const FilePicker = ({callBackFunction, columnId, taskId, boardId}) => {
  const { showFiles, setShowFiles, selectedFiles } = useFilesContext();
  const { user } = useUserContext();
  const supabase = createClient()
  const [show, setShow] = useState(false);
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState()
  const [googleImageUrl, setGoogleImageUrl] = useState()


  const uploadFile = async (event) => {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Math.random()}.${fileExt}`;
      const fileType = file.type;
      //const filePath = `public/${Math.random()}.${fileExt}`;

      try{
        const fileData = await uploadFilesPublic(filePath, file)
        fileData.fileType = fileType

        callBackFunction(fileData, columnId, taskId, boardId)
        //setImageUrl(fileData.publicUrl)


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


  useEffect(() => {
  if (!showFiles && selectedFiles.length > 0) {
    console.log("Files selected:", selectedFiles);

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


    // Handle the selected files here
  }
  }, [showFiles, selectedFiles]);

  return(
    <>
      {imageUrl&&
        <>
          <div className='table-image' style={{margin: '10px 0px'}}>
            <img src={imageUrl}/>
          </div>
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
            {/*}<GoogleDrivePicker callBackFunction={storeGoogleDriveFile}/>*/}
            <button className="btn secondary" onClick={() => setShowFiles(prevState => !prevState)}>My Files</button>

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




const AddListItem = ({data}) => {
  const [addListItem, setAddListItem] = useState(null)
  return(
    <>
    {addListItem === data.id ? (
      <>
      <textarea
        className='form-input'
        type="text"
        autoFocus
        onBlur={(e) => {
          const newValue = e.target.value;
          if (newValue) {
            addNewColumnValue({
              task_id: data.task_id,
              column_id: data.column_id,
              board_id: data.board_id,
              value: newValue,
              type:'text'
            });
          }
          setAddListItem(null);
        }}
      />
      </>
    ) : (
      <button className='btn primary' onClick={() => setAddListItem(data.id)}>Add value</button>
    )}
</>
  )
}

const ListItem = ({item, updateColumnValue}) => {
  const [inputValue, setInputValue] = useState(item.value || '');

  useEffect(() => {
    setInputValue(item.value || '');
  }, [item.value]);

  return (
    <textarea
      style={{marginLeft:'5px'}}
      className='form-input'
      type="text"
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

const AddListItem = ({data}) => {
  const [addListItem, setAddListItem] = useState(null)
  return(
    <>
    {addListItem === data.id ? (
      <>
      <input
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
              type:'text'
            });
          }
          setAddListItem(null);
        }}
      />
      </>
    ) : (
      <div style={{display:'flex', justifyContent: 'center'}}>
        <button className='btn primary' onClick={() => setAddListItem(data.id)}>Add value</button>
      </div>
    )}
</>
  )
}

const ListItem = ({item, updateColumnValue}) => {
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
