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
  const [filesDisplay, setFilesDisplay] = useState('My Files')


  const getData = async (userId) => {
    try {
      const myFiles = await getFiles(userId);
      console.log('myFiles', myFiles)
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
        <div className='overlay' onClick={(e) => setShowFiles(false)}>
          <div className='center-absolute' style={{width:'100%', maxWidth:'900px'}}>
            <div className="card" onClick={(e) => e.stopPropagation()}>
              <div style={{display:'flex'}}>
                <div style={{flex:1, flexDirection:'column', display:'flex'}}>
                  <button onClick={() => setFilesDisplay('My Files')} className="btn primary">My files</button>
                  <button onClick={() => setFilesDisplay('Gemini')} className="btn primary">Gemini</button>
                </div>
                <div style={{flex:3}}>
                  {filesDisplay ==='My Files'&&
                    <div style={{display:'flex', flexDirection:'row',  flexWrap: 'wrap'}}>
                      {files.map((file, index)=>{
                        return (
                          <div key={file.id} style={{width:'18%', margin:'1%'}}>
                            <div className={`${'table-image'} ${isObjectInArray(file, selectedFiles)?'active':''}`}>
                              <img onClick={() => selectFileFunction(file) } src={file.file_url}/>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  }

                    <button className='btn primary' onClick={(e) => setShowFiles(false)} disabled={selectedFiles.length===0}>Choose Files</button>
                </div>


                </div>
              </div>
          </div>
      </div>
      }
    </>
  )
}
