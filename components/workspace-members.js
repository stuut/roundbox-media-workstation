'use client';
import { useState, useEffect } from 'react';
import { getAllUsersAssignedToWorkspace } from '@/lib/supabase'
import { getAllUsers } from '@/lib/supabase'
import User from '@/components/user'
import { isInArray } from '@/lib/utils'
import { isUserInArray } from '@/lib/utils'
import { insertWorkspaceMembers } from '@/lib/supabase'
import { deleteMembersFromWorkspace } from '@/lib/supabase'

export default function WorkspaceMembers({workspaceId, userId, workspaceOwner }) {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedWorkspaceMembers, setSelectedWorkspaceMembers] = useState([])

  const getUsersData = async () => {
    try {
        const workspacesUsers = await getAllUsersAssignedToWorkspace(workspaceId)
        console.log('workspacesUsers', workspacesUsers)
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
    if (isInArray(data, selectedUsers)){
      const removed = selectedUsers.filter(remove => {
        return remove !== data
      });
      setSelectedUsers(removed);
    }else{
      setSelectedUsers(selectedUsers => [...selectedUsers, data])
    }
  }

  const deleteMembersFromWorkspaceFunction = async () =>{
    try{
       await deleteMembersFromWorkspace(workspaceId, selectedWorkspaceMembers)
       //getUsersData()

       setUsers(prev => {
         const updatedUsers = prev.filter((user)=>{
           if (!isInArray(user.id, selectedWorkspaceMembers)){
             return user
           }
         })

         console.log('updatedUsers', updatedUsers)
         return updatedUsers
       })

       setSelectedWorkspaceMembers([])
    }catch (error){
      console.log(error)
    }
  }

  const selectMembersFunction = (userId) => {

    if (isInArray(userId, selectedWorkspaceMembers)){
      const removed = selectedWorkspaceMembers.filter(remove => {
        return remove !== userId
      });
      setSelectedWorkspaceMembers(removed);
    }else{
      setSelectedWorkspaceMembers(selectedWorkspaceMembers => [...selectedWorkspaceMembers, userId])
    }
  }

  const addMembersCallBack  = (newUsers) => {
    console.log('newUsers', newUsers)
    setUsers(preState => [...preState, ...newUsers]);
  }

  return (
    <div style={{maxWidth:'600px'}}>
      <div className="card">
        <h2>Workspace Members</h2>
        {users.map((user, index)=>{
          console.log('user.id', user.id)
          console.log('user', user)
            return(
              <div key={user.id} style={{display:'flex', alignItems:'center'}}>
                {(userId === workspaceOwner && user.id !== workspaceOwner) &&
                  <SelectMemberCheckBox user={user} callBackFunction={selectMembersFunction}/>
                }
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
        <AddWorkspaceMember workspaceId={workspaceId} userId={userId} existingUsers={users} callback={addMembersCallBack}/>
        {(selectedWorkspaceMembers.length > 0 && userId === workspaceOwner) &&
          <button className='btn danger' onClick={deleteMembersFromWorkspaceFunction}>Remove Members</button>
        }
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
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');


  const getUsersData = async () => {
    try {
        const allUsers = await getAllUsers()
        // filter out current user because only members of workspace has access
        const checkUsers = allUsers.filter((user, index)=>{

          if (!isUserInArray(user.id, existingUsers)){
            return user
          }

        })

        if (checkUsers.length === 0){
          setNoUsers(true)
        }else{
          setNoUsers(false)
        }

        setUsers(checkUsers);
    } catch (error) {
      setError(error.message);
    }
  }


  const selectUserFunction = (data) => {

    const isUserInArrayCheck = isUserInArray({user_id:data}, existingUsers)

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
      await insertWorkspaceMembers(workspaceId, selectedUsers)
      //filter new users
      const newUsers = users.filter((user)=>{
        if (isInArray(user.id, selectedUsers)){
          return user
        }
      })
      callback(newUsers)
      setAddMemberItem(false)
    }catch(error){
      console.log(error)
    }

  }

  return(
    <>
    {addMemberItem? (
      <>
        <p>Select Users</p>
        {noUsers &&
          <div className="warning" style={{position:'relative'}}>
            <div onClick={() => setAddMemberItem(false)} style={{position:'absolute', top:'2px', right:'2px'}}>
              <img src='/close-error.svg' style={{width:'20px'}}/>
            </div>
            No Users To Add
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
      <div style={{display:'flex', justifyContent: 'start'}}>
        <button className='btn primary' onClick={setAddMemberItemFunction}>Add Member</button>
      </div>
    )}
  </>
  )
}
