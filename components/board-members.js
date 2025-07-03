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

export default function BoardMembers({boardId, createdBy, boardMembers, workspaceId, realtime=true}) {
  const supabase = createClient()
  const  [selectedUsers, setSelectedUsers] = useState([]);
  const  [boardMembersArray, setBoardMembersArray] = useState(boardMembers? boardMembers:[]);



const getBoardMembersData = async() => {

  try{
    const usersData = await getBoardMembers(boardId)
      if (usersData){
        setBoardMembersArray(usersData)
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
            setBoardMembersArray(prev => {
              return prev.filter((member)=> {
                return member.user_id !== payload.old.user_id
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
      setBoardMembersArray(boardMembers)
    }else{
      console.log('getBoardMembersDatas')
      getBoardMembersData()
    }

  },[boardMembers])

  const selectUserFunction = (data) => {

    if (data === createdBy){
      showError('you cannot modify the creator of the board')
      return
    }

    if (isInArray(data, selectedUsers)){
      const removed = selectedUsers.filter(remove => {
        return remove !== data
      });
      setSelectedUsers(removed);
    }else{
      setSelectedUsers(selectedUsers => [...selectedUsers, data])
    }
  }

  const removeMembers = async() => {

    if (!realtime){
      if (selectedUsers){
        setBoardMembersArray(prev => {
          return prev.filter((member)=> {
            return !selectedUsers.some((user)=> user === member.user_id)
          })
        })
      }
    }

     await deleteMembersFromBoard(boardId, selectedUsers)
  }

  const addMembers = async(newMembers) => {
      setBoardMembersArray(prev => [...prev, ...newMembers])
  }

  return(
    <div style={{position:'relative', padding:'5px 25px 5px 25px'}} className="card">
      <p className="form-label" style={{display:'block'}}><strong>Board members</strong></p>
      <Accordion initState={'closed'}>
      {boardMembersArray.map((item, index)=>{
        return(
          <div
            key={item.user_id}
            onClick={() => selectUserFunction(item.user_id)}
            className={`${'select-tab'} ${isInArray(item.user_id, selectedUsers)?'active': ''}`}>
            {item.users&&
              <User userInfo={item.users} active={isInArray(item.user_id, selectedUsers)}/>
            }
          </div>
        )
      })}
      {selectedUsers.length>0&&
        <button className='btn danger' onClick={removeMembers}>Remove Members</button>
      }
      <AddBoardMember workspaceId={workspaceId} boardId={boardId} existingUsers={boardMembersArray} callback={addMembers} realtime={realtime}/>
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

        let users

        if (workspaceId){
          users = await getAllUsersAssignedToWorkspace(workspaceId)
        }else{
          users = await getAllUsers()
        }



        const checkedUsers = users.filter((user, index)=> {
          return !existingUsers.some((existingUser) => {
            return existingUser.user_id === user.id
          })
        })

        if (checkedUsers.length === 0){
          setNoUsers(true)
        }else{
          setNoUsers(false)
        }


      setUsers(checkedUsers);
    } catch (error) {
      showError(error.message);
    }
  }

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
          const newBaseUsers = users
            .filter(user => selectedUsers.includes(user.id))
            .map(user => {
              const base = { ...existingUsers[0] };
              base.user_id = user.id;
              base.users = { ...base.users, ...user };
              return base;
            });

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
          <p><strong>Add Members</strong></p>
        }
        {users.map((user, index)=>{
            return(
              <div
                key={index}
                onClick={() => selectUserFunction(user.id)}
                style={{cursor:'pointer'}}
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
