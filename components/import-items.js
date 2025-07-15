'use client';
import { useState, useEffect } from 'react';
import { useItemContext } from "@/context/item-context"
import { useUserContext } from "@/context/user-context"
import { getFiles } from "@/lib/supabase";
import { storeFileInfo } from "@/lib/supabase";
import { deleteFiles } from "@/lib/supabase";
import { showSuccess } from '@/lib/toast';
import { showError } from '@/lib/toast';
import { showInfo } from '@/lib/toast';
import { taskStatusArray } from '@/lib/constants'
import { Accordion } from '@/components/accordion'
import { getAllUsers } from '@/lib/supabase'
import { getAllUsersAssignedToWorkspace } from '@/lib/supabase'
import { getWorkspacesAssignedToUser } from '@/lib/supabase'
import { getBoardsAssignedToUser } from '@/lib/supabase'
import { isInArray } from '@/lib/utils'
import { NewCustomColumnTask } from '@/components/task-components'
import { insertNewColumn } from "@/lib/supabase";
import { daysOfWeek } from '@/lib/constants'
import { recurrenceFrequency } from '@/lib/constants'
import User from '@/components/user'
import { newColumnTypesArray } from '@/lib/constants'
import { checkColumnName } from "@/lib/supabase";
import { SelectCheckBox } from '@/components/task-components'
import { addNewColumnValue } from "@/lib/supabase";
import { createTask } from '@/lib/supabase'


export default function ImportItems() {
  const { user } = useUserContext();
  const { displayImportItems, setDisplayImportItems, displayImportItemsData, setDisplayImportItemsData } = useItemContext();
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedWorkspaces, setSelectedWorkspaces] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [boards, setBoards] = useState([]);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [description, setDescription] = useState('');
  const [selectedBoards, setSelectedBoards] = useState([]);
  const [status, setStatus] = useState(taskStatusArray[0]);
  const [customColumns, setCustomColumns] = useState([]);
  const [activeField, setActiveField] = useState('');
  const [importDataArray, setImportDataArray] = useState([]);
  const [clearColumnCheckBoxes, setClearColumnCheckBoxes] = useState(false);

const handleCreate = async () => {

  if (!title){
    showError('Title needed')
    return
  }

  if (selectedWorkspaces.length === 0){
    showError('Select At Least One Workspace')
    return
  }

  if (selectedBoards.length === 0){
    showError('Select At Least One Board')
    return
  }

  if (users.length === 0){
    showError('Select At Least One User')
    return
  }


  const customColumnsArray = []


  if (importDataArray.length > 0) {


    if (customColumns.length > 0){
      for (const customColumn of customColumns) {

          for (const board_id of customColumn.board_id) {

            const newColumn = {
              name: customColumn.name,
              type: customColumn.type,
              board_id: board_id,
              created_by: customColumn.created_by
            };

            const newColumnData = await insertNewColumn(newColumn);
            customColumnsArray.push(newColumnData)

          }
        }

    }



  for (const importData of importDataArray) {

      const taskData = {
        title : importData[title],
        created_by : user.id,
        description : importData[description],
        status : status
      };

      const newTask = await createTask(taskData, selectedUsers, selectedBoards, selectedWorkspaces)
      showSuccess('New Item created')

      const newTaskId = newTask.id

      for (const customColumn of customColumnsArray) {

        if (importData[customColumn.name]){
          await addNewColumnValue({
            task_id: newTaskId,
            column_id: customColumn.id,
            board_id: customColumn.board_id,
            value: importData[customColumn.name],
            type: customColumn.type,
          });
        }



      }


    }

  }

};


const newColumnCallBack = (newColumn) => {
  setCustomColumns(prev => [...prev, newColumn])
}




const removeCustomColumn = (index) => {
  setCustomColumns(prev => {
    return prev.filter((col, idx) => idx !== index)
  })
}



const getUsersData = async () => {


  try {
    const users = await getAllUsers()

    setUsers(users);


  } catch (error) {
    showError(error.message);
  }
}

const getWorkspacesData = async (user) => {
  try {
      const usersWorkspaces = await getWorkspacesAssignedToUser(user.id)
      setWorkspaces(usersWorkspaces);
  } catch (error) {
    showError(error.message);
  }
}

const getBoardsData = async (user) => {
  try {
      const usersBoards = await getBoardsAssignedToUser(user.id)
      setBoards(usersBoards);
  } catch (error) {
    showError(error.message);
  }
}



useEffect(()=>{
  if (user && displayImportItems){
    getUsersData()
    setSelectedUsers(prev => [...prev, user.id])
    getWorkspacesData(user)
    getBoardsData(user)
    /*
    setImportDataArray([])
    setCustomColumns([])
    setActiveField([])*/
    setClearColumnCheckBoxes(true)
  }


},[user, displayImportItems])




const selectWorkspaceFunction = (data) => {
  if (isInArray(data, selectedWorkspaces)){

    setSelectedWorkspaces(prev => {
      return(
        prev.filter(remove => {
          return remove !== data
        })
      )
    });
  }else{
    setSelectedWorkspaces(selectedWorkspaces => [...selectedWorkspaces, data])
  }
}

const selectBoardFunction = (data) => {
  if (isInArray(data, selectedBoards)){
    setSelectedBoards(prev => {
      return(
        prev.filter(remove => {
          return remove !== data
        })
      )
    });
  }else{
    setSelectedBoards(selectedWorkspaces => [...selectedWorkspaces, data])
  }
}


const selectUserFunction = (data) => {
  if (isInArray(data, selectedUsers)){
    setSelectedUsers(prev => {
      return(
        prev.filter(remove => {
          return remove !== data
        })
      )
    });
  }else{
    setSelectedUsers(selectedUsers => [...selectedUsers, data])
  }
}

const onDragStart = (e, item) => {
  e.dataTransfer.setData('item', JSON.stringify(item));
};

const onDrop = async (e, field) => {
    if (!e.dataTransfer.getData('item')) return;
    const item = JSON.parse(e.dataTransfer.getData('item'));


    if (field === 'title'){
      setTitle(item.toString())
    }

    if (field === 'description'){
      setDescription(item.toString())
    }

};

const onDragOver = (e, field) => {
  e.preventDefault();
  console.log('onDragOver', field)
  setActiveField(field)
};

const selectItemsFunction = (data) => {

  const alreadySelected = importDataArray.some((object)=>object.id === data.id)

  if (importDataArray.some((object)=>object.id === data.id)){
    setImportDataArray(prev => prev.filter((object)=>object.id !== data.id))
  }else{
    setImportDataArray(prev => [...prev, data])
  }



}

useEffect(()=>{

  console.log('importDataArray', importDataArray)

},[importDataArray])




  return (
    <>
      {displayImportItems &&
        <div className='overlay' onClick={(e) => {
          setDisplayImportItems(false)

        }}>
          <div className='center-absolute' style={{width:'100%', maxWidth:'1200px'}}>
            <div className="card" onClick={(e) => e.stopPropagation()}>
            IMPORT ITEMS
                <div style={{display:'flex'}}>
                  <div style={{'flex':1, maxHeight:'800px', overflowY:'scroll'}}>
                    {displayImportItemsData.map((item, index)=> {
                      const keys = Object.keys(item);
                        return (
                          <div key={item.id} style={{display:'flex', alignItems:'start'}}>
                            <SelectCheckBox style={{marginTop:'25px'}} id={item} callBackFunction={selectItemsFunction} clearCheckBoxes={clearColumnCheckBoxes}/>
                            <div key={index} style={{position:'relative', background:'#ffffff', padding:'10px', marginTop:'25px', borderRadius: 'var(--border-radius)', minHeight:'60px'}}>
                              <Accordion initState={'closed'}>
                              {keys.map((key, index)=>{
                                if (!Array.isArray(item[key])){
                                  return(
                                    <div key={index} style={{display:'flex', alignItems:'center'}}>
                                      <div className={`${'select-tab'}`} draggable onDragStart={(e) => onDragStart(e, key)} style={{cursor:'pointer'}}>{key}: </div>
                                      <div style={{padding:'5px'}}>{item[key]}</div>
                                    </div>
                                  )
                                }else{
                                  return(
                                    <div key={index} style={{display:'flex'}}>
                                      <div className={`${'select-tab'}`} draggable onDragStart={(e) => onDragStart(e, key)} style={{padding:'5px', cursor:'pointer'}}>{key}</div>
                                      <div style={{padding:'5px'}}>[<Loop data={item[key]}/>]</div>
                                    </div>
                                  )
                                }
                              })}
                              </Accordion>
                            </div>
                          </div>
                        )
                      })
                    }
                    {/*}<Loop data={displayImportItemsData} onDragStart={onDragStart}/>*/}
                  </div>
                  <div style={{'flex':1, padding:'10px', maxHeight:'800px', overflowY:'scroll'}}>

                      <div className={`${'drop-zone'} ${activeField==='title'?'active':''}`} onDrop={(e) => onDrop(e, 'title')} onDragOver={(e) => onDragOver(e, 'title')} style={{minHeight:'50px'}}>
                        <label className="form-label"><strong>Title</strong></label>
                        {title&&
                          <div className={`${'select-tab'}`} style={{position:'relative'}}>
                            <img style={{position:'absolute', top:'7px', right:'7px', maxWidth:'20px'}} onClick={() => setTitle('')} src={'/remove.svg'}/>
                            {title}
                          </div>
                        }
                    </div>
                      <div style={{marginTop:'25px'}}>
                        <div className={`${'drop-zone'} ${activeField==='description'?'active':''}`} onDrop={(e) => onDrop(e, 'description')} onDragOver={(e) => onDragOver(e, 'description')} style={{minHeight:'50px'}}>
                          <label className="form-label"><strong>Description</strong></label>
                          {description&&
                            <div className={`${'select-tab'}`} style={{position:'relative'}}>
                              <img style={{position:'absolute', top:'7px', right:'7px', maxWidth:'20px'}} onClick={() => setDescription('')} src={'/remove.svg'}/>
                              {description}
                            </div>
                          }
                        </div>
                      </div>

                        <div style={{marginTop:'25px'}}>
                          <p><strong>Choose A Workspace</strong> </p>
                          {workspaces.map((workspace, index)=>{
                            return(
                              <div
                                key={index}
                                onClick={() => selectWorkspaceFunction(workspace.id)}
                                style={{cursor:'pointer'}}
                                className={`${'select-tab'} ${isInArray(workspace.id, selectedWorkspaces)?'active': ''}`}
                              >
                                {workspace.name}
                              </div>
                            )
                          })
                          }
                      </div>


                        <div style={{marginTop:'25px'}}>
                          <p><strong>Choose A Board</strong> </p>
                          {boards.map((board, index)=>{
                            return(
                              <div
                                key={index}
                                onClick={() => selectBoardFunction(board.id)}
                                style={{cursor:'pointer'}}
                                className={`${'select-tab'} ${isInArray(board.id, selectedBoards)?'active': ''}`}
                              >
                                {board.name}
                              </div>
                            )
                          })
                          }
                        </div>

                      <div style={{marginTop:'25px'}}>
                        <p><strong>Assign Members</strong> </p>
                          {users.map((item, index)=>{
                            return(
                              <div
                                key={index}
                                onClick={() => selectUserFunction(item.id)}
                                style={{cursor:'pointer'}}
                                className={`${'select-tab'} ${isInArray(item.id, selectedUsers)?'active': ''}`}
                              >
                                <User userInfo={item} active={isInArray(item.id, selectedUsers)?true:false}/>
                              </div>
                            )
                          })
                        }
                      </div>

                      <div style={{marginTop:'25px'}}>
                        <p><strong>Custom Fields</strong> </p>
                        {customColumns.map((customColumn, index)=>{
                          return(
                            <div key={index} className={`${'select-tab'}`} style={{position:'relative'}}>
                              <img style={{position:'absolute', top:'7px', right:'7px', maxWidth:'20px'}} onClick={() => removeCustomColumn(index)} src={'/remove.svg'}/>
                              <p style={{marginBottom:0}}><strong>{customColumn.name}</strong></p>
                              <p style={{fontSize:'.8em', marginTop:0}}>{customColumn.type}</p>
                            </div>
                          )
                        })}
                      </div>

                          {selectedBoards.length>0&&
                            <>
                              <NewCustomColumnItemImport userId={user.id} selectedBoards={selectedBoards} callBack={newColumnCallBack}/>
                            </>
                          }

                      <button style={{display:'block'}} className="btn primary"  type="button" onClick={handleCreate}>Import Items</button>

                  </div>
                </div>

              </div>
          </div>
      </div>
      }
    </>
  )
}

export const Loop = ({data, onDragStart})=>{

  function generateRandomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

    return(
      <>
      {data.map((item, index)=> {
        const keys = Object.keys(item);
          return (
            <div key={generateRandomString(10)}>
              {keys.map((key, index)=>{
                if (!Array.isArray(item[key])){
                  return(
                    <div key={generateRandomString(10)} style={{display:'flex', alignItems:'center'}}>
                      <div className={`${'select-tab'}`} draggable onDragStart={(e) => onDragStart(e, key)} style={{cursor:'pointer'}}>{key}: </div>
                      <div style={{padding:'5px'}}>{item[key]}</div>
                    </div>
                  )
                }else{
                  return(
                    <div key={generateRandomString(10)} style={{display:'flex'}}>
                      <div className={`${'select-tab'}`} draggable onDragStart={(e) => onDragStart(e, key)} style={{padding:'5px', cursor:'pointer'}}>{key}</div>
                      <div style={{padding:'5px'}}>[<Loop data={item[key]}/>]</div>
                    </div>
                  )
                }
              })}
            </div>
          )
        })
      }
    </>
  )
}

export const NewCustomColumnItemImport = ({boardId, selectedBoards, userId, callBack}) => {
  const [newColumn, setNewColumn] = useState(false);
  const [newColumnField, setNewColumnField] = useState('');
  const [newColumnType, setNewColumnType] = useState(newColumnTypesArray[0]);
  const [newCustomColumns, setNewCustomColumns] = []
  const [activeCustomField, setActiveCustomField] = useState('');
  const [activeField, setActiveField] = useState('');

  const handleColumnCreate = async () => {

    console.log('newColumnField', newColumnField)
    console.log('newColumnField', newColumnField)


    if (!newColumnType || !newColumnField){
      return
    }



    if (selectedBoards && selectedBoards.length >0 ){
      selectedBoards.forEach(async(selectedBoardId) => {
        const checkNewColumn = await checkColumnName(newColumnField, selectedBoardId)
        if (checkNewColumn.length>0){
          showError('A board with this column name already exists')
          return false
        }
      })
    }

    console.log('newColumnField', newColumnField)

    if (selectedBoards && selectedBoards.length>0){

      const newColumn = {
        name : newColumnField,
        type : newColumnType,
        board_id : selectedBoards,
        created_by : userId
      };

      callBack(newColumn)
      //setNewColumn(false)
    }else if (boardId){
      const newColumn = {
        name : newColumnField,
        type : newColumnType,
        board_id : boardId,
        created_by : userId
      };

      callBack(newColumn)
      //setNewColumn(false)

    }

    setNewColumnField('')
  };


  const onDrop = async (e, field) => {
      if (!e.dataTransfer.getData('item')) return;
      const item = JSON.parse(e.dataTransfer.getData('item'));

      if (field === 'new column'){
        setNewColumnField(item.toString())
      }
  };

  const onDragOver = (e, field) => {
    e.preventDefault();
    console.log('onDragOver', field)
    setActiveField(field)
  };


  return(
    <div style={{position:'relative'}}>
      <button className='btn secondary btn-sm' onClick={() => setNewColumn(prevState => !prevState)}>New Column</button>
      {newColumn&&
        <div>
            <div className={`${'drop-zone'} ${activeField==='new column'?'active':''}`} onDrop={(e) => onDrop(e, 'new column')} onDragOver={(e) => onDragOver(e, 'new column')} style={{minHeight:'50px'}}>
              <label className="form-label"><strong>Column Name</strong></label>
              {newColumnField&&
                <div className={`${'select-tab'}`} style={{position:'relative'}}>
                  <img style={{position:'absolute', top:'7px', right:'7px', maxWidth:'20px'}} onClick={() => setNewColumnField('')} src={'/remove.svg'}/>
                  {newColumnField}
                </div>
              }
            </div>

            <p className="form-label" style={{display:'block'}}><strong>Column Type</strong></p>
            <select className="form-input select" onChange={(e) => setNewColumnType(e.target.value)} value={newColumnType} required>
              {newColumnTypesArray.map(function(columnType, index){
                return(
                  <option key={index} value={columnType}>{columnType}</option>
                )
              })}
            </select>
            <button type="button" className="btn primary btn-sm" onClick={handleColumnCreate}>Create</button>
            <button  type="button" style={{marginLeft:'10px'}} className="btn danger btn-sm" onClick={() => setNewColumn(false)}>Cancel</button>
        </div>
      }
    </div>
  )
  }
