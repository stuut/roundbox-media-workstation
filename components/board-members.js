'use client';
import { useState, useEffect } from 'react';
import User from "@/components/user";
import { isInArray } from '@/lib/utils'
import { getBoardMembers } from '@/lib/supabase'
import { getAllUsers } from '@/lib/supabase'
import { deleteMembersFromBoard } from '@/lib/supabase'
import { insertBoardMembers } from '@/lib/supabase'
import { getAllUsersAssignedToWorkspace } from '@/lib/supabase'
import { showSuccess } from '@/lib/toast';
import { showError } from '@/lib/toast';
import { showInfo } from '@/lib/toast';
import { Accordion } from '@/components/accordion'
import { createClient } from '@/utils/supabase/client'
import { isUserInArray } from '@/lib/utils'

export default function BoardMembers({boardId, createdBy, boardMembers, workspaceId, realtime=true, accordion}) {
  const supabase = createClient()
  const  [selectedUsers, setSelectedUsers] = useState([]);
  const [users, setUsers] = useState([]);



const getBoardMembersData = async() => {

  try{
    const usersData = await getBoardMembers(boardId)
      if (usersData){
        setUsers(usersData)
      }

  }catch(error){
    showError(error)
  }

}


useEffect(() => {
  if (realtime){
    const channel = supabase
      .channel('board-members-update')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'board_members',
          filter: `board_id=eq.${boardId}`
        },
        (payload) => {

          console.log('payload', payload)

          if (payload.eventType === 'DELETE'){
            setUsers(prev => {
              return prev.filter((member)=> {
                return member.id !== payload.old.user_id
              })
            })
           }

          if (payload.eventType === 'INSERT') {
            getBoardMembersData()
          }
        }
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }

 }, [realtime]);



  useEffect(()=>{

    if (boardMembers){
      setUsers(boardMembers)
    }else{

      getBoardMembersData()
    }

  },[boardMembers])

  const selectUserFunction = (data) => {

    if (data === createdBy){
      showError('you cannot modify the creator of the board')
      return
    }

    if (isInArray(data, selectedUsers)){
      setSelectedUsers(prev => prev.filter(remove => remove !== data))
    }else{
      setSelectedUsers(selectedUsers => [...selectedUsers, data])
    }
  }

  const removeMembers = async() => {

    if (!realtime){
      if (selectedUsers){

        setUsers(prev => {
          return prev.filter((member)=> {
            return !selectedUsers.some((user)=> user === member.id)
          })
        })
      }
    }

     await deleteMembersFromBoard(boardId, selectedUsers)

     setSelectedUsers([])
  }

  const addMembers = async(newMembers) => {
      setUsers(prev => [...prev, ...newMembers])
  }

  return(
    <div style={{position:'relative', padding:'5px 25px 5px 25px'}} className="card">
      <p className="form-label" style={{display:'block'}}><strong>Board members</strong></p>
      <Accordion initState={accordion}>
      {users.map((user, index)=>{
        return(
          <div
            key={user.id}
            onClick={() => selectUserFunction(user.id)}
            className={`${'select-tab'} ${isInArray(user.id, selectedUsers)?'active': ''}`}>
              <User userInfo={user} active={isInArray(user.id, selectedUsers)}/>
          </div>
        )
      })}
      {selectedUsers.length>0&&
        <button className='btn danger' onClick={removeMembers}>Remove Members</button>
      }
      <AddBoardMember workspaceId={workspaceId} boardId={boardId} existingUsers={users} callback={addMembers} realtime={realtime}/>
      </Accordion>
  </div>
  )
}


const AddBoardMember = ({workspaceId, boardId, existingUsers, callback, realtime}) => {

    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [addMemberItem, setAddMemberItem] = useState(false)
    const [noUsers, setNoUsers] = useState(false)


  const getUsersData = async () => {
    try {

        let allUsers

        if (workspaceId){
          allUsers = await getAllUsersAssignedToWorkspace(workspaceId)
        }else{
          allUsers = await getAllUsers()
        }


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

      await insertBoardMembers(boardId, selectedUsers)

      if (!realtime){
          const newUsers = users.filter(user => selectedUsers.includes(user.id))

          callback(newBaseUsers)
      }
      setSelectedUsers([])
      setUsers([])
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
            No Members To Add
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
                style={{cursor:'pointer', display:'flex', alignItems:'center'}}
                className={`${'select-tab hover'} ${isInArray(user.id, selectedUsers)?'active': ''}`}
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
