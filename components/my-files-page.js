'use client';
import { useState, useEffect } from 'react';
import { useFilesContext } from "@/context/files-context"
import MyFiles from "@/components/my-files"


export default function MyFilesPageComponent() {
  const { setShowFiles, setFilePicker } = useFilesContext();

  useEffect(() => {
      setShowFiles(true)
      setFilePicker(false)
  }, []);


  return(
    null
  )
}
