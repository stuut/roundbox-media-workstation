'use client';
import { useState, useEffect } from 'react';
import { getBoardsAssignedToUser } from "@/lib/supabase"
import { getBoardsCreatedByUser } from "@/lib/supabase"
import { deleteBoards } from "@/lib/supabase"
import Link from "next/link"
import { boardFilterOptions } from "@/lib/constants"
import { isInArray } from '@/lib/utils'
import { showSuccess } from '@/lib/toast';
import { showError } from '@/lib/toast';
import { showInfo } from '@/lib/toast';

export default function MyBoards({userId}) {
  const [boards, setBoards] = useState([]);
  const [success, setSuccess] = useState('');
  const [boardFilter, setBoardFilter] = useState(boardFilterOptions[0]);

  const [selectBoards, setSelectBoards] = useState(false);
  const [selectedBoards, setSelectedBoards] = useState([]);


useEffect(()=>{
  if (!selectBoards){
    setSelectedBoards([])
  }

},[selectBoards])



  const getData = async () => {
    try {
        const boardsData = await getBoardsAssignedToUser(userId)
        setBoards(boardsData);
    } catch (error) {
      showError(error.message);
    }
  }

  const getMyBoards = async () => {
    try {
        const boardsData = await getBoardsCreatedByUser(userId)
        if (boardsData){
          setBoards(boardsData);
        }

    } catch (error) {
      showError(error.message);
    }
  }

  useEffect(() => {
    if (userId){
      getData()
    }

}, [userId]);


const selectBoardsFunction = (data) => {

  if (isInArray(data, selectedBoards)){
    setSelectedBoards(prev => {
      return(
        prev.filter(remove => {
          return remove !== data
        })
      )
    });
  }else{
    setSelectedBoards(prev => [...prev, data])
  }

}

const deleteBoardsFunction = async () => {

  try{

     await deleteBoards(selectedBoards)
     setSelectedBoards([])

     setBoards(prev => {
       return prev.filter((board)=> {
         return !selectedBoards.some((selectedBoard)=> selectedBoard === board.id)
       })
     })


  }catch (error){
    console.log(error)
  }

}

  return (
    <div>
      <div style={{display:'flex', paddingLeft: '10px', alignItems: 'end'}}>
        <div>
          <p><strong>Board Filter</strong></p>
          <select id="board_filter" style={{minWidth:'200px'}} className="form-input select"
            onChange={(e) => {
              setSelectBoards(false)
              setSelectedBoards([])
              setBoardFilter(e.target.value)
              const newValue = e.target.value;

                  if (newValue === 'All'){
                    getData()
                  }else{
                    getMyBoards()
                  }

            }}
            value={boardFilter}>
              {boardFilterOptions.map(function(item, index){
                return(
                  <option key={index} value={item}>{item}</option>
                )
              })}
          </select>
        </div>
        <button style={{marginLeft:'10px', background:selectBoards?'var(--md-sys-color-primary)':'var(--md-sys-color-surface-container)', color:selectBoards?'#ffffff':'#000000' }} onClick={() => setSelectBoards(prev => !prev)} className={`${selectBoards?'primary':'secondary'} ${'btn'}`}>
          Select Boards
        </button>
        {selectedBoards.length >0 && boardFilter === 'Created by me' &&
          <button style={{marginLeft:'10px'}} onClick={deleteBoardsFunction} className='btn danger'>
            Delete Boards
          </button>
        }

    </div>
      <div className="col-3">
        {boards.map((board, index) => {
          return(
            <div key={board.id} className={`${'board'} ${isInArray(board.id, selectedBoards)? 'selected': ''}`} onClick={selectBoards? () => selectBoardsFunction(board.id): null}>
              {selectBoards?(
                  <h3>{board.name}</h3>
              ):(
                <Link href={`/board/${board.id}`}>
                  <h3>{board.name}</h3>
                </Link>
              )}
              <p>{board.description}</p>
            </div>
          )
        })
        }
      </div>
    </div>
  );
}
