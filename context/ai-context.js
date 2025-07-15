"use client"

import { useState, createContext, useContext } from "react";
const AIContext = createContext(null)


export function AIProvider({children}) {
  const [displayAI, setDisplayAI] = useState(false);
  const [AIdata, setAIData] = useState(false);


 return (
    <AIContext.Provider value={{
      displayAI,
      setDisplayAI,
      AIdata,
      setAIData
    }}>
        {children}
    </AIContext.Provider>
  )

}

// ✅ Custom hook to use the context
export function useAIContext() {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error("useAIContext must be used within a AIProvider");
  }
  return context;
}
