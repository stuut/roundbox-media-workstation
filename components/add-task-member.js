'use client';

import { useState, useEffect } from 'react';
import { showSuccess } from '@/lib/toast';
import { showError } from '@/lib/toast';
import { showInfo } from '@/lib/toast';



export const AddTaskMember = ({board, task, existingUsers}) => {

    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [addMemberItem, setAddMemberItem] = useState(false)
    const [noUsers, setNoUsers] = useState(false)


  const getUsersData = async () => {
    try {

        if (board){

        }
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
      console.log(error)
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
        <button className='btn primary' onClick={setAddMemberItemFunction}>Add Member</button>
      </div>
    )}
  </>
  )
}
