"use client"

import { useState, createContext, useContext } from "react";
const FilesContext = createContext(null)


export function FilesProvider({children}) {
  const [showFiles, setShowFiles] = useState(false);
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePicker, setFilePicker] = useState(true)

 return (
    <FilesContext.Provider value={{
      showFiles,
      setShowFiles,
      files,
      setFiles,
      selectedFiles,
      setSelectedFiles,
      filePicker,
      setFilePicker
    }}>
        {children}
    </FilesContext.Provider>
  )

}

// ✅ Custom hook to use the context
export function useFilesContext() {
  const context = useContext(FilesContext);
  if (!context) {
    throw new Error("FilesContext must be used within a FilesContext.Provider");
  }
  return context;
}
