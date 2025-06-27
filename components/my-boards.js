'use client';
import { useState, useEffect } from 'react';
import { getBoardsAssignedToUser } from "@/lib/supabase"
import Link from "next/link"

export default function MyBoards({userId}) {
  const [boards, setBoards] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getData = async () => {
    try {
        const boardsData = await getBoardsAssignedToUser(userId)
        setBoards(boardsData);
    } catch (error) {
      setError(error.message);
    }
  }

  useEffect(() => {
    if (userId){
      getData()
    }

}, [userId]);

  return (
    <div style={{maxWidth:'600px'}}>
      {boards.map((board, index) => {
        return(
          <div key={index} key={index} className='workspace'>
            <Link href={`/board/${board.id}`}>
              <div key={index}>
                {board.name}
              </div>
            </Link>
          </div>
        )
      })
      }
    </div>
  );
}
