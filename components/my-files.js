'use client';
import { useState, useEffect } from 'react';
import { useFilesContext } from "@/context/files-context"
import { useUserContext } from "@/context/user-context"
import { isObjectInArray } from '@/lib/utils'
import { getFiles } from "@/lib/supabase";


export default function MyFiles({}) {
  const { user } = useUserContext();
  const { showFiles, setShowFiles, files, setFiles, selectedFiles, setSelectedFiles } = useFilesContext();
  const [userId, setUserId] = useState(null)

  const getData = async (userId) => {
    try {
      const myFiles = await getFiles(userId); // ← fix here
      setFiles(myFiles);
    } catch (error) {
      console.log('error getting files', error);
    }
  };

  useEffect(() => {
    if (user){
      //setUserId(user.id)
      getData(user.id)
    }

}, [user]);


const selectFileFunction = (data) => {
  console.log('data', data)

  if (isObjectInArray(data, selectedFiles)){
    const removed = selectedFiles.filter(remove => {
      return remove.id !== data.id
    });
    setSelectedFiles(removed);
  }else{
    setSelectedFiles(selectedFiles => [...selectedFiles, data])
  }

}

  return (
    <>
      {showFiles&&
        <div className='overlay'
          onClick={(e) => setShowFiles(false)}>
          <div className='center' style={{width:'100%', maxWidth:'900px'}}>
            <div
              className="card"
              onClick={(e) => e.stopPropagation()} // stop the event here
            >
              <h3>My Files</h3>
              <div style={{display:'flex', flexDirection:'row',  flexWrap: 'wrap'}}>
                {files.map((file, index)=>{
                  return (
                    <div key={file.id} style={{width:'18%', margin:'1%'}}>
                      <div className={`${'table-image'} ${isObjectInArray(file, selectedFiles)?'active':''}`}>
                        <img onClick={() => selectFileFunction(file) } src={file.public_url}/>
                      </div>
                    </div>
                  )
                })}
              </div>
              <button className='btn primary' onClick={(e) => setShowFiles(false)} disabled={selectedFiles.length===0}>Choose Files</button>
            </div>
          </div>
        </div>
      }
    </>
  )
}
