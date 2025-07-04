'use client';
import { useState, useEffect } from 'react';
import { getAllUsersAssignedToWorkspace } from '@/lib/supabase'
import { getAllUsers } from '@/lib/supabase'
import User from '@/components/user'
import { isInArray } from '@/lib/utils'
import { isUserInArray } from '@/lib/utils'
import { insertWorkspaceMembers } from '@/lib/supabase'
import { deleteMembersFromWorkspace } from '@/lib/supabase'
import { showSuccess } from '@/lib/toast';
import { showError } from '@/lib/toast';
import { showInfo } from '@/lib/toast';

export default function WorkspaceMembers({workspaceId, userId, workspaceOwner }) {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const getUsersData = async () => {
    try {
        const workspacesUsers = await getAllUsersAssignedToWorkspace(workspaceId)
        setUsers(workspacesUsers);
    } catch (error) {
      setError(error.message);
    }
  }

  useEffect(() => {
      if (workspaceId){
        getUsersData()
      }

  }, [workspaceId]);

  const selectUserFunction = (data) => {

    if (data === workspaceOwner){
      showError('you cannot modify the creator of the Workspace')
      return
    }

    if (isInArray(data, selectedUsers)){
        setSelectedUsers(prev => prev.filter(remove => remove !== data))
    }else{
      setSelectedUsers(selectedUsers => [...selectedUsers, data])
    }
  }

  const removeMembers = async () =>{
    try{
       //getUsersData()

       setUsers(prev => {
         return prev.filter((member)=>{
            return !selectedUsers.some((user)=> {
              return user === member.id
            })
         })
       })

       await deleteMembersFromWorkspace(workspaceId, selectedUsers)


       setSelectedUsers([])
    }catch (error){
      console.log(error)
    }
  }



  const addMembers = (newUsers) => {
    setUsers(preState => [...preState, ...newUsers]);
  }

  return (
    <div style={{maxWidth:'600px'}}>
      <div className="card">
        <h2>Workspace Members</h2>
        {users.map((user, index)=>{

            return(
              <div key={user.id} style={{display:'flex', alignItems:'center'}}>
                {/*}
                {(userId === workspaceOwner && user.id !== workspaceOwner) &&
                  <SelectMemberCheckBox user={user} callBackFunction={selectMembersFunction}/>
                }*/}
                <div
                  onClick={() => selectUserFunction(user.id)}
                  style={{cursor:'pointer'}}
                  className={`${'select-tab'} ${isInArray(user.id, selectedUsers)?'active': ''}`}
                >
                  <User userInfo={user} active={isInArray(user.id, selectedUsers)?true:false}/>
                </div>
              </div>
            )
          })
        }
        {selectedUsers.length>0&&
          <button className='btn danger' onClick={removeMembers}>Remove Members</button>
        }
        <AddWorkspaceMember workspaceId={workspaceId} userId={userId} existingUsers={users} callback={addMembers}/>

      </div>
    </div>
  );
}

const SelectMemberCheckBox = ({user, callBackFunction}) => {
  const [checkboxToggle, setCheckboxToggle] = useState(false);

  const checkboxfunction = (user) =>{
    setCheckboxToggle(prevState => !prevState);
    callBackFunction(user)
  }

  return(
    <input
      className="form-check-input"
      type="checkbox"
      onChange={(e) => checkboxfunction(user.id)}
      checked={checkboxToggle}
      style={{marginRight:'10px'}}
   />
  )
}


const AddWorkspaceMember = ({workspaceId, userId, existingUsers, callback}) => {

    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [addMemberItem, setAddMemberItem] = useState(false)
    const [noUsers, setNoUsers] = useState(false)


  const getUsersData = async () => {
    try {
        const allUsers = await getAllUsers()
        // filter out current user because only members of workspace has access
        const checkUsers = allUsers.filter((user)=>{
          return !existingUsers.some((existingUser)=>{
            return user.id === existingUser.id
          })
        })

        if (checkUsers.length === 0){
          setNoUsers(true)
        }else{
          setNoUsers(false)
        }

        setUsers(checkUsers);
    } catch (error) {
      showError(error.message);
    }
  }


  const selectUserFunction = (data) => {

    const isUserInArrayCheck = isUserInArray({user_id:data}, existingUsers)

    if (isInArray(data, selectedUsers)){
        setSelectedUsers(prev => prev.filter(remove => remove !== data))
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
      await insertWorkspaceMembers(workspaceId, selectedUsers)
      //filter new users
      const newUsers = users.filter(user => selectedUsers.includes(user.id))

      callback(newUsers)
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
            No Users To Add
          </div>
        }
        {users && !noUsers&&
          <p><strong>Select Users</strong></p>
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
      <div style={{display:'flex', justifyContent: 'start'}}>
        <button className='btn primary' onClick={setAddMemberItemFunction}>Add Member</button>
      </div>
    )}
  </>
  )
}
