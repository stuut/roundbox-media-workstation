"use client"

import { useState, createContext, useContext } from "react";
const UserContext = createContext(null)


export function UserProvider({children}) {
  const [user, setUser] = useState(null);

 return (
    <UserContext.Provider value={{user, setUser}}>
        {children}
    </UserContext.Provider>
  )

}

// ✅ Custom hook to use the context
export function useUserContext() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("UserContext must be used within a UserContext.Provider");
  }
  return context;
}
