"use client"

import { useState, createContext, useContext } from "react";
const EditItemContext = createContext(null)


export function EditItemProvider({children}) {
  const [displayEditItem, setDisplayEditItem] = useState(false);
  const [item, setItem] = useState(null);


 return (
    <EditItemContext.Provider value={{
      displayEditItem,
      setDisplayEditItem,
      item,
      setItem
    }}>
        {children}
    </EditItemContext.Provider>
  )

}

// ✅ Custom hook to use the context
export function useEditItemContext() {
  const context = useContext(EditItemContext);
  if (!context) {
    throw new Error("useTaskContext must be used within a EditItemProvider");
  }
  return context;
}
