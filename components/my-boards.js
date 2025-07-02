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
    <div className="col-3">
      {boards.map((board, index) => {
        return(
          <div key={index} className='board'>
            <Link href={`/board/${board.id}`}>
              <div key={index}>
                <h3>{board.name}</h3>
                <p>{board.description}</p>
              </div>
            </Link>
          </div>
        )
      })
      }
    </div>
  );
}
