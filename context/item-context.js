"use client"

import { useState, createContext, useContext } from "react";
const ItemContext = createContext(null)


export function ItemProvider({children}) {
  const [displayItem, setDisplayItem] = useState(false);
  const [displayImportItems, setDisplayImportItems] = useState(false);
  const [displayImportItemsData, setDisplayImportItemsData] = useState(false);


 return (
    <ItemContext.Provider value={{
      displayItem,
      setDisplayItem,
      displayImportItems,
      setDisplayImportItems,
      displayImportItemsData,
      setDisplayImportItemsData
    }}>
        {children}
    </ItemContext.Provider>
  )

}

// ✅ Custom hook to use the context
export function useItemContext() {
  const context = useContext(ItemContext);
  if (!context) {
    throw new Error("useTaskContext must be used within a ItemProvider");
  }
  return context;
}
