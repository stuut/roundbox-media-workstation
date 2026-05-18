// app/providers.tsx
"use client"

import { ThemeProvider, CssBaseline } from "@mui/material"
import MUItheme from "@/lib/MUItheme"



export default function MUIProvider({ children }) {
  return (
    <ThemeProvider theme={MUItheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}
