'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { showSuccess } from '@/lib/toast';
import { showError } from '@/lib/toast';
import { showInfo } from '@/lib/toast';
import { updateColumnValue } from "@/lib/supabase";
import { addNewColumnValue } from "@/lib/supabase";
import { checkColumnName } from "@/lib/supabase";
import { insertNewColumn } from "@/lib/supabase";
import { updateColumnValueDate } from "@/lib/supabase";
import { newColumnTypesArray } from '@/lib/constants'
import { dateFormatValues } from '@/lib/constants'
import moment from "moment";
import DatePicker from "react-datepicker";
import { daysOfWeek } from '@/lib/constants'
import { recurrenceFrequency } from '@/lib/constants'
export const NewCustomColumnTask = ({boardId, selectedBoards, userId, callBack}) => {
  const [newColumn, setNewColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState(newColumnTypesArray[0]);
  const [newCustomColumns, setNewCustomColumns] = []


  const handleColumnCreate = async (e) => {
    e.preventDefault();

    if (!newColumnType || !newColumnName){
      return
    }



    if (selectedBoards && selectedBoards.length >0 ){
      selectedBoards.forEach(async(selectedBoardId) => {
        const checkNewColumn = await checkColumnName(newColumnName, selectedBoardId)
        if (checkNewColumn.length>0){
          showError('Column name must be unique')
          return
        }

      })

    }


    if (selectedBoards && selectedBoards.length>0){

      const newColumn = {
        name : newColumnName,
        type : newColumnType,
        board_id : selectedBoards,
        created_by : userId
      };

      callBack(newColumn)
      setNewColumn(false)
    }else if (boardId){
      const newColumn = {
        name : newColumnName,
        type : newColumnType,
        board_id : boardId,
        created_by : userId
      };

      callBack(newColumn)
      setNewColumn(false)

    }


    /*

    try {

      if (selectedBoards && selectedBoards.length>0){

        selectedBoards.forEach(async(selectedBoardId) => {

          const newColumn = {
            name : newColumnName,
            type : newColumnType,
            board_id : selectedBoardId,
            created_by : userId
          };

            const newCustomColumn = await insertNewColumn(newColumn)
            //setColumnSuccess('New Column created');
            showSuccess('New Column created')
            setNewColumn(false)

        });



      }else if (boardId && !selectedBoards){

        const newColumn = {
          name : newColumnName,
          type : newColumnType,
          board_id : boardId,
          created_by : userId
        };

        const newCustomColumn = await insertNewColumn(newColumn)
        //setColumnSuccess('New Column created');
        showSuccess('New Column created')
        setNewColumn(false)
      }


    } catch (error) {
      //setColumnError(error.message);
      showError(error.message)
    }
    */


  };
  return(
    <div style={{position:'relative'}}>
      <button className='btn primary' onClick={() => setNewColumn(prevState => !prevState)}>New Column</button>
      {newColumn&&
        <div className="new-column drop-shadow">
            <p className="form-label" style={{display:'block'}}><strong>Column Name</strong></p>
            <input
              className='form-input'
              type="text"
              placeholder="Column name"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              required
            />
            <p className="form-label" style={{display:'block'}}><strong>Column Type</strong></p>
            <select className="form-input select" onChange={(e) => setNewColumnType(e.target.value)} value={newColumnType} required>
              {newColumnTypesArray.map(function(columnType, index){
                return(
                  <option key={index} value={columnType}>{columnType}</option>
                )
              })}
            </select>
            <button type="button" className="btn primary" onClick={handleColumnCreate}>Create</button>
            <button  type="button" style={{marginLeft:'10px'}} className="btn danger" onClick={() => setNewColumn(false)}>Cancel</button>
        </div>
      }
    </div>
  )
  }







export const DateItem = ({item}) => {
  const [date, setDate] = useState(new Date(item.value))
  const [save, setSave] = useState(false)
  const [dateFormat, setdateFormat] = useState(item.date_format?item.date_format:dateFormatValues[0])
  const [closeDateFormat, setCloseDateFormat] = useState(false)
  const [isRecurring, setIsRecurring] = useState(item.is_recurring);
  const [recurrence, setRecurrence] = useState(item.recurrence);
  const [recurrenceDays, setRecurrenceDays] = useState(item.recurrence_days);

  useEffect(()=>{
      if (recurrence === 'daily'){
        setdateFormat("h:mm aa")
      }
  },[recurrence])


  useEffect(()=>{
    if (isRecurring){
      if (recurrence === 'daily'){
        setdateFormat("h:mm aa")
      }
    }
  },[isRecurring])



  useEffect(()=>{
    if (item.value){
      setDate(new Date(item.value))
    }
  },[item.value])


  useEffect(()=>{
    if (dateFormat !== item.date_format){
      setSave(true)
    }
  },[dateFormat])

  useEffect(()=>{
  },[closeDateFormat])

  const saveDate = async () => {
    try{
      await updateColumnValueDate(
        {
          value: date?date:null,
          is_recurring:isRecurring?isRecurring:null,
          recurrence:recurrence?recurrence:null,
          recurrence_days:recurrenceDays?recurrenceDays:null,
          type:item.type,
          date_format:dateFormat,
        }, item.id)
      setSave(false)
      setCloseDateFormat(true)
      showSuccess('Date Updated')
    }catch (error){
      showError(error)
    }
  }

  const toggleDay = (day) => {
    setRecurrenceDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <div style={{marginLeft:'5px'}}>
      {(!isRecurring || recurrence === 'daily') &&
        <>
          <DatePicker
            selected={date}
            onChange={(date) => {
              setDate(date)
              setSave(true)
            }}
            showTimeSelect={dateFormat==="MMMM d, yyyy h:mm aa" || dateFormat==="h:mm aa"}
            dateFormat={dateFormat}
            className={'form-input'}
          />
          {!isRecurring&&
            <ChangeDateFormat defaultValue={dateFormat} callBack={setdateFormat} close={closeDateFormat}/>
          }

        </>
      }
      <div className="task-date-section" style={{marginTop:'25px'}}>
        {/* Due Date Input */}

        {/* Recurrence Toggle*/}
        <label style={{ marginTop: '1em', display: 'flex', alignItems: 'center' }}>
          <input
            style={{marginRight:'10px'}}
            className="form-check-input"
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => {
              setSave(true)
              setIsRecurring(e.target.checked)
              setCloseDateFormat(true)
            }}
          />
        <strong>This date repeats</strong>
        </label>


        {/* Recurrence Options */}
        {isRecurring && (
          <div style={{ marginTop: '0.5em' }}>
            <label style={{fontSize:'.8em'}}>
              Recurrence Frequency
              <select
                className="form-input select"
                value={recurrence}
                onChange={(e) => {
                  setSave(true)
                  setRecurrence(e.target.value)
                }}
              >
                {recurrenceFrequency.map((value)=>{
                  return <option key={value} value={value}>{value}</option>
                }) }

              </select>
            </label>

            {/* Weekly recurrence: choose days */}
            {recurrence === 'weekly' && (
              <div style={{ marginTop: '0.5em' }}>
                <p style={{fontSize:'.8em'}}>Select days of the week</p>
                {daysOfWeek.map((day) => (
                  <label key={day} style={{ marginRight: '1em', display: 'flex', alignItems: 'center'}}>
                    <input
                      style={{marginRight:'10px'}}
                      className="form-check-input"
                      type="checkbox"
                      checked={recurrenceDays.includes(day)}
                      onChange={() => {
                        setSave(true)
                        toggleDay(day)
                      }}
                    />
                    {day}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {save &&
        <button className='btn btn-sm secondary' onClick={saveDate}>Update</button>
      }
    </div>
  );
}


export const AddDateItem = ({data}) => {
  const [date, setDate] = useState(new Date())
  const [save, setSave] = useState(false)
  const [addDateItem, setAddDateItem] = useState(null)
  const [dateFormat, setdateFormat] = useState("yyyy-MM-dd")
  const [closeDateFormat, setCloseDateFormat] = useState(false)
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState('weekly');
  const [recurrenceDays, setRecurrenceDays] = useState([]);


  useEffect(()=>{
      if (recurrence === 'daily'){
        setdateFormat("h:mm aa")
      }
  },[recurrence])


  useEffect(()=>{
    if (isRecurring){
      if (recurrence === 'daily'){
        setdateFormat("h:mm aa")
      }
    }
  },[isRecurring])


  const toggleDay = (day) => {
    setRecurrenceDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };


  useEffect(()=>{
      setSave(true)
  },[dateFormat])


  const saveDate = async () => {

    try{
      console.log('saveDate', data)

      console.log('saveDate', data)


        await addNewColumnValue({
          task_id: data.task_id,
          column_id: data.column_id,
          board_id: data.board_id,
          value: date?date:null,
          is_recurring:isRecurring?isRecurring:null,
          recurrence:recurrence?recurrence:null,
          recurrence_days:recurrenceDays?recurrenceDays:null,
          type:data.type,
          date_format:dateFormat,
        });
        console.log('saveDate')
      setSave(false)
      setCloseDateFormat(true)
      setAddDateItem(null)
      showSuccess('Date Saved')
    }catch (error){
      showError(error)
    }
  }

  return(
    <>
        {addDateItem === data.id ? (
          <>
            {(!isRecurring || recurrence === 'daily') &&
              <>
                <DatePicker
                  selected={date}
                  onChange={(date) => {
                    setDate(date)
                    setSave(true)
                  }}
                  showTimeSelect={dateFormat==="MMMM d, yyyy h:mm aa" || dateFormat==="h:mm aa"}
                  dateFormat={dateFormat}
                  className={'form-input'}
                />
                {!isRecurring&&
                  <ChangeDateFormat defaultValue={dateFormat} callBack={setdateFormat} close={closeDateFormat}/>
                }
              </>
            }
            <div className="task-date-section" style={{marginTop:'25px'}}>
              {/* Due Date Input */}

              {/* Recurrence Toggle*/}
              <label style={{ marginTop: '1em', display: 'flex', alignItems: 'center' }}>
                <input
                  style={{marginRight:'10px'}}
                  className="form-check-input"
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => {
                    setIsRecurring(e.target.checked)
                    setCloseDateFormat(true)
                  }}
                />
                <strong>This date repeats</strong>
              </label>


              {/* Recurrence Options */}
              {isRecurring && (
                <div style={{ marginTop: '0.5em' }}>
                  <label style={{fontSize:'.8em'}}>
                    Recurrence Frequency
                    <select
                      className="form-input select"
                      value={recurrence}
                      onChange={(e) => setRecurrence(e.target.value)}
                    >
                      {recurrenceFrequency.map((value)=>{
                        return <option key={value} value={value}>{value}</option>
                      }) }

                    </select>
                  </label>

                  {/* Weekly recurrence: choose days */}
                  {recurrence === 'weekly' && (
                    <div style={{ marginTop: '0.5em' }}>
                      <p style={{fontSize:'.8em'}} >Select days of the week</p>
                      {daysOfWeek.map((day) => (
                        <label key={day} style={{ marginRight: '1em', display: 'flex', alignItems: 'center'}}>
                          <input
                            style={{marginRight:'10px'}}
                            className="form-check-input"
                            type="checkbox"
                            checked={recurrenceDays.includes(day)}
                            onChange={() => toggleDay(day)}
                          />
                          {day}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            {save &&
              <button className='btn btn-sm primary' onClick={saveDate}>Save</button>
             }
          </>
        ) : (
          <div style={{display:'flex', justifyContent: 'center'}}>
            <button className='btn primary' onClick={() => setAddDateItem(data.id)}>Add Date</button>
          </div>
        )}
    </>
  )
}

export const ChangeDateFormat = ({defaultValue, callBack, close}) => {
const [dateFormat, setdateFormat] = useState(defaultValue?defaultValue:dateFormatValues[0])
const [showFormat, setShowFormat] = useState(false)

useEffect(()=>{
  console.log('openState', close)
  if (close){
      setShowFormat(false)
  }
},[close])

useEffect(()=>{
  setdateFormat(defaultValue)
},[defaultValue])


  return(
    <>
    <p style={{fontSize:'.8em', cursor:'pointer', marginTop:'0px'}} onClick={() => setShowFormat(prev => !prev)}><strong>Change Date Format</strong></p>
    {showFormat&&
      <select
        style={{maxWidth:'150px', fontSize:'.8em'}}
        className="form-input select"
        value={dateFormat}
        onChange={(e) => {
          setdateFormat(e.target.value)
          callBack(e.target.value)
        }}
      >
        {dateFormatValues.map((value)=>{
          return <option key={value} value={value}>{value}</option>
        }) }

      </select>
    }

  </>
  )
}
