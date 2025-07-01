"use client"

import { useState, createContext, useContext } from "react";
const TaskContext = createContext(null)


export function TaskProvider({children}) {
  const [displayTask, setDisplayTask] = useState(false);

 return (
    <TaskContext.Provider value={{displayTask, setDisplayTask}}>
        {children}
    </TaskContext.Provider>
  )

}

// ✅ Custom hook to use the context
export function useTaskContext() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTaskContext must be used within a TaskProvider");
  }
  return context;
}
